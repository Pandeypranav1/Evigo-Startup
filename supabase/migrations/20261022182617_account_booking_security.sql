-- Non-payment security boundary. No existing rows are deleted or reclassified.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO service_role;

-- Direct clients read permitted records; mutations go through authenticated APIs.
DO $$ DECLARE t text; columns text; BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','providers','bookings','services','combo_bookings','combo_booking_items','combo_packs','combo_pack_items','notifications','users','page_visits','contact_messages'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM PUBLIC, anon, authenticated', t);
      -- Table REVOKE does not remove historical column grants.
      SELECT string_agg(quote_ident(attname), ',') INTO columns FROM pg_attribute
        WHERE attrelid = to_regclass('public.' || t) AND attnum > 0 AND NOT attisdropped;
      EXECUTE format('REVOKE INSERT (%s), UPDATE (%s), REFERENCES (%s) ON public.%I FROM PUBLIC, anon, authenticated', columns, columns, columns, t);
      IF t IN ('providers','users','page_visits','contact_messages') THEN
        EXECUTE format('REVOKE SELECT (%s) ON public.%I FROM PUBLIC, anon, authenticated', columns, t);
      END IF;
    END IF;
  END LOOP;
END $$;

CREATE POLICY audit_profile_owner_guard ON public.profiles AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (id = (SELECT auth.uid()));
CREATE POLICY audit_profile_owner_read ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));
GRANT SELECT ON public.profiles TO authenticated;

CREATE POLICY audit_provider_eligible_guard ON public.providers AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (user_id = (SELECT auth.uid()) OR (registration_status = 'approved' AND is_verified AND is_bookable));
CREATE POLICY audit_provider_read ON public.providers FOR SELECT TO anon, authenticated
  USING (user_id = (SELECT auth.uid()) OR (registration_status = 'approved' AND is_verified AND is_bookable));
-- Public search has an explicit field list; owners use the authenticated server API.
REVOKE SELECT ON public.providers FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, registration_status, business_name, owner_name, category, city, phone,
  experience_years, service_areas, description, price_range, rating, image_url, is_verified, is_bookable)
  ON public.providers TO anon, authenticated;

CREATE POLICY audit_booking_owner_guard ON public.bookings AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (client_id = (SELECT auth.uid()));
CREATE POLICY audit_booking_owner_read ON public.bookings FOR SELECT TO authenticated
  USING (client_id = (SELECT auth.uid()));
GRANT SELECT ON public.bookings TO authenticated;
-- Provider booking reads are authorized server-side by exact provider ownership.
CREATE POLICY audit_combo_owner_guard ON public.combo_bookings AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY audit_combo_item_guard ON public.combo_booking_items AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.combo_bookings b WHERE b.id = combo_booking_id AND b.user_id = (SELECT auth.uid())));

-- Prevent direct private-table access even when an older permissive policy exists.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['users','page_visits','contact_messages'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('CREATE POLICY audit_private_guard ON public.%I AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', t);
    END IF;
  END LOOP;
END $$;

CREATE POLICY audit_notification_owner_guard ON public.notifications AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY audit_pack_active_guard ON public.combo_packs AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (is_active);
CREATE POLICY audit_pack_item_active_guard ON public.combo_pack_items AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.combo_packs p WHERE p.id = combo_pack_id AND p.is_active));

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS request_key text;
CREATE UNIQUE INDEX booking_active_request_key ON public.bookings(client_id, request_key)
  WHERE request_key IS NOT NULL AND status IN ('pending', 'confirmed');
CREATE INDEX IF NOT EXISTS booking_provider_created_idx ON public.bookings(provider_uuid, created_at DESC);

-- Serialize duplicate registrations without deleting or merging legacy duplicates.
CREATE OR REPLACE FUNCTION private.guard_provider_registration() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$ BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('provider-registration', 0));
  IF EXISTS (SELECT 1 FROM public.providers p WHERE p.user_id = NEW.user_id OR
    lower(p.email) = lower(NEW.email) OR right(regexp_replace(p.phone, '\D', '', 'g'),10) = right(regexp_replace(NEW.phone, '\D', '', 'g'),10)) THEN
    RAISE EXCEPTION 'Provider registration already exists' USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_provider_registration BEFORE INSERT ON public.providers
  FOR EACH ROW EXECUTE FUNCTION private.guard_provider_registration();

-- Approval is a server-side prerequisite even during concurrent registration updates.
CREATE OR REPLACE FUNCTION private.guard_booking_eligibility() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$ BEGIN
  PERFORM 1 FROM public.providers WHERE id = NEW.provider_uuid
    AND registration_status = 'approved' AND is_verified AND is_bookable FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Provider unavailable' USING ERRCODE = '23514'; END IF;
  IF NEW.service_id IS NOT NULL THEN
    PERFORM 1 FROM public.services WHERE id = NEW.service_id AND provider_id = NEW.provider_uuid AND is_available FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Service unavailable' USING ERRCODE = '23514'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER guard_booking_eligibility BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION private.guard_booking_eligibility();

CREATE TABLE private.request_limits (
  key_hash text PRIMARY KEY, window_start timestamptz NOT NULL, hits integer NOT NULL
);
ALTER TABLE private.request_limits ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON private.request_limits TO service_role;
CREATE OR REPLACE FUNCTION public.consume_request_limit(p_key text, p_limit integer, p_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE count_now integer;
BEGIN
  IF p_limit < 1 OR p_seconds < 1 THEN RAISE EXCEPTION 'Invalid limit'; END IF;
  INSERT INTO private.request_limits AS limits VALUES(p_key, now(), 1)
  ON CONFLICT(key_hash) DO UPDATE SET
    hits = CASE WHEN limits.window_start + make_interval(secs => p_seconds) <= now() THEN 1 ELSE limits.hits + 1 END,
    window_start = CASE WHEN limits.window_start + make_interval(secs => p_seconds) <= now() THEN now() ELSE limits.window_start END
  RETURNING hits INTO count_now;
  RETURN count_now <= p_limit;
END $$;
REVOKE ALL ON FUNCTION public.consume_request_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_request_limit(text, integer, integer) TO service_role;

-- Audit only status transitions, never entire profiles or contact details.
CREATE TABLE private.provider_reviews (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, provider_id uuid NOT NULL,
  previous_status text, next_status text, changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.provider_reviews ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION private.audit_provider_review() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$ BEGIN
  IF OLD.registration_status IS DISTINCT FROM NEW.registration_status THEN
    INSERT INTO private.provider_reviews(provider_id,previous_status,next_status)
      VALUES(NEW.id,OLD.registration_status,NEW.registration_status);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER audit_provider_review AFTER UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION private.audit_provider_review();
REVOKE ALL ON FUNCTION private.audit_provider_review() FROM PUBLIC, anon, authenticated;
CREATE POLICY audit_service_eligible_guard ON public.services AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (is_available AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id
    AND p.registration_status = 'approved' AND p.is_verified AND p.is_bookable));

-- Preserve requested quantities on new requests; legacy quantities remain unknown.
ALTER TABLE public.combo_booking_items ADD COLUMN IF NOT EXISTS quantity integer CHECK (quantity >= 1);

-- Combo requests: all components must be real and eligible; parent/items commit together.
CREATE OR REPLACE FUNCTION public.create_combo_request(p_user uuid, p_pack uuid, p_details jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE pack public.combo_packs%ROWTYPE; booking public.combo_bookings%ROWTYPE;
  item record; total numeric; item_count integer; position integer := 0; owner_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text || p_pack::text || (p_details->>'start_date'), 0));
  SELECT * INTO STRICT pack FROM public.combo_packs WHERE id=p_pack AND is_active FOR SHARE;
  SELECT * INTO booking FROM public.combo_bookings WHERE user_id=p_user AND combo_pack_id=p_pack
    AND start_date=(p_details->>'start_date')::date AND status NOT IN ('cancelled','rejected','completed') ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN
    IF booking.end_date IS DISTINCT FROM (p_details->>'end_date')::date
      OR booking.guest_count IS DISTINCT FROM (p_details->>'guest_count')::integer
      OR booking.pickup_location IS DISTINCT FROM p_details->>'pickup_location'
      OR booking.drop_location IS DISTINCT FROM p_details->>'drop_location'
      OR booking.customer_name IS DISTINCT FROM p_details->>'customer_name'
      OR booking.customer_phone IS DISTINCT FROM p_details->>'customer_phone'
      OR booking.customer_email IS DISTINCT FROM p_details->>'customer_email'
      OR booking.special_requests IS DISTINCT FROM p_details->>'special_requests' THEN
      RAISE EXCEPTION 'Active combo request has different details' USING ERRCODE = '23505';
    END IF;
    RETURN to_jsonb(booking);
  END IF;
  SELECT count(*) INTO item_count FROM public.combo_pack_items WHERE combo_pack_id=p_pack;
  IF item_count=0 THEN RAISE EXCEPTION 'Package has no assigned services'; END IF;
  total := greatest(0, pack.base_price - pack.discount);
  INSERT INTO public.combo_bookings(user_id,combo_pack_id,combo_name,total_amount,booking_date,start_date,end_date,
    guest_count,pickup_location,drop_location,customer_name,customer_phone,customer_email,special_requests,status)
  VALUES(p_user,pack.id,pack.name,total,CURRENT_DATE,(p_details->>'start_date')::date,(p_details->>'end_date')::date,
    (p_details->>'guest_count')::integer,p_details->>'pickup_location',p_details->>'drop_location',p_details->>'customer_name',
    p_details->>'customer_phone',p_details->>'customer_email',p_details->>'special_requests','pending') RETURNING * INTO booking;
  FOR item IN SELECT * FROM public.combo_pack_items WHERE combo_pack_id=p_pack ORDER BY id FOR SHARE LOOP
    SELECT user_id INTO owner_id FROM public.providers WHERE id=item.provider_id AND registration_status='approved'
      AND is_verified AND is_bookable FOR SHARE;
    IF NOT FOUND OR owner_id IS NULL THEN RAISE EXCEPTION 'Package provider unavailable'; END IF;
    PERFORM 1 FROM public.services WHERE id=item.service_id AND provider_id=item.provider_id AND is_available FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Package service unavailable'; END IF;
    position := position + 1;
    INSERT INTO public.combo_booking_items(combo_booking_id,service_type,service_id,provider_id,provider_name,
      provider_booking_status,service_status,quantity,price_snapshot)
    SELECT booking.id,item.service_type,item.service_id,item.provider_id,business_name,'pending','pending',item.quantity,
      CASE WHEN position=item_count THEN total - trunc(total/item_count,2)*(item_count-1) ELSE trunc(total/item_count,2) END
      FROM public.providers WHERE id=item.provider_id;
  END LOOP;
  INSERT INTO public.notifications(user_id,title,message,type,is_read)
    SELECT DISTINCT p.user_id,'New combo request','A customer requested ' || pack.name || '. Review it in your dashboard.','booking_new',false
    FROM public.combo_pack_items i JOIN public.providers p ON p.id=i.provider_id WHERE i.combo_pack_id=p_pack;
  RETURN to_jsonb(booking);
END $$;
REVOKE ALL ON FUNCTION public.create_combo_request(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_combo_request(uuid,uuid,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.transition_combo_request(p_user uuid,p_booking uuid,p_item uuid,p_action text,p_reason text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE booking public.combo_bookings%ROWTYPE; item public.combo_booking_items%ROWTYPE; next_status text; parent_id uuid;
BEGIN
  IF p_item IS NOT NULL THEN SELECT combo_booking_id INTO STRICT parent_id FROM public.combo_booking_items WHERE id=p_item;
  ELSE parent_id:=p_booking; END IF;
  SELECT * INTO STRICT booking FROM public.combo_bookings WHERE id=parent_id FOR UPDATE;
  IF booking.status IN ('cancelled','rejected','completed') THEN RAISE EXCEPTION 'Booking is no longer editable'; END IF;
  IF p_action='cancel' THEN
    IF booking.user_id IS DISTINCT FROM p_user THEN RAISE EXCEPTION 'Not authorized'; END IF;
    UPDATE public.combo_booking_items SET provider_booking_status='cancelled',service_status='cancelled' WHERE combo_booking_id=booking.id AND provider_booking_status<>'completed';
    UPDATE public.combo_bookings SET status='cancelled',cancelled_at=now() WHERE id=booking.id;
    INSERT INTO public.notifications(user_id,title,message,type,is_read)
      SELECT DISTINCT p.user_id,'Combo request cancelled','The customer cancelled ' || booking.combo_name,'booking_cancelled',false
      FROM public.combo_booking_items i JOIN public.providers p ON p.id=i.provider_id WHERE i.combo_booking_id=booking.id;
    RETURN 'cancelled';
  END IF;
  SELECT * INTO STRICT item FROM public.combo_booking_items WHERE id=p_item;
  PERFORM 1 FROM public.providers WHERE id=item.provider_id AND user_id=p_user
    AND (p_action='complete' OR (registration_status='approved' AND is_verified AND is_bookable)) FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized'; END IF;
  next_status:=CASE p_action WHEN 'accept' THEN 'confirmed' WHEN 'confirm' THEN 'confirmed' WHEN 'reject' THEN 'rejected' WHEN 'complete' THEN 'completed' ELSE NULL END;
  IF next_status IS NULL OR (next_status='completed' AND item.provider_booking_status<>'confirmed') OR
    (next_status<>'completed' AND item.provider_booking_status<>'pending') THEN RAISE EXCEPTION 'Invalid status transition'; END IF;
  IF next_status='rejected' AND COALESCE(trim(p_reason),'')='' THEN RAISE EXCEPTION 'Reason required'; END IF;
  UPDATE public.combo_booking_items SET provider_booking_status=next_status,provider_response_at=now(),
    service_status=CASE WHEN next_status='completed' THEN 'completed' ELSE service_status END,
    rejection_reason=CASE WHEN next_status='rejected' THEN p_reason ELSE rejection_reason END WHERE id=item.id;
  SELECT CASE WHEN bool_and(provider_booking_status='completed') THEN 'completed'
    WHEN bool_and(provider_booking_status='rejected') THEN 'rejected'
    WHEN bool_or(provider_booking_status='rejected') THEN 'action_required'
    WHEN bool_and(provider_booking_status IN ('confirmed','completed')) THEN 'confirmed'
    WHEN bool_or(provider_booking_status IN ('confirmed','completed')) THEN 'partially_confirmed' ELSE 'pending' END
    INTO next_status FROM public.combo_booking_items WHERE combo_booking_id=booking.id;
  UPDATE public.combo_bookings SET status=next_status,completed_at=CASE WHEN next_status='completed' THEN now() ELSE completed_at END WHERE id=booking.id;
  IF booking.user_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id,title,message,type,is_read) VALUES(booking.user_id,'Combo service updated',
      booking.combo_name || ': ' || item.service_type || ' — ' || p_action,
      CASE p_action WHEN 'reject' THEN 'booking_rejected' WHEN 'complete' THEN 'booking_completed' ELSE 'booking_confirmed' END,false);
  END IF;
  RETURN next_status;
END $$;
REVOKE ALL ON FUNCTION public.transition_combo_request(uuid,uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.transition_combo_request(uuid,uuid,uuid,text,text) TO service_role;

-- The old combo SELECT policies recurse through parent/items and depend on private
-- provider columns. Customer direct reads use owner IDs; provider reads use the API.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='combo_bookings' AND policyname='Users can view own combo bookings') THEN
    ALTER POLICY "Users can view own combo bookings" ON public.combo_bookings USING (user_id = (SELECT auth.uid()));
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='combo_booking_items' AND policyname='Users and assigned providers can view combo booking items') THEN
    ALTER POLICY "Users and assigned providers can view combo booking items" ON public.combo_booking_items USING
      (EXISTS (SELECT 1 FROM public.combo_bookings b WHERE b.id=combo_booking_id AND b.user_id=(SELECT auth.uid())));
  END IF;
END $$;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS reviewed_by uuid, ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE private.provider_reviews ADD COLUMN actor_id uuid;
CREATE OR REPLACE FUNCTION private.audit_provider_review() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$ BEGIN
  IF OLD.registration_status IS DISTINCT FROM NEW.registration_status THEN
    INSERT INTO private.provider_reviews(provider_id,previous_status,next_status,actor_id)
      VALUES(NEW.id,OLD.registration_status,NEW.registration_status,NEW.reviewed_by);
  END IF;
  RETURN NEW;
END $$;
