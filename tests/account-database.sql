\set ON_ERROR_STOP on
\ir fixtures/account-schema.sql
\ir ../supabase/migrations/20261022182617_account_booking_security.sql
INSERT INTO profiles VALUES ('10000000-0000-0000-0000-000000000001','owner@example.test','client',NULL,NULL,NULL,NULL),
 ('10000000-0000-0000-0000-000000000002','other@example.test','provider',NULL,NULL,NULL,NULL);
INSERT INTO providers(id,user_id,email,phone,registration_status,is_verified,is_bookable,business_name) VALUES
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','provider@example.test','+919000000001','approved',true,true,'Synthetic provider'),
 ('20000000-0000-0000-0000-000000000002',NULL,'pending@example.test','+919000000002','pending',false,false,'Synthetic pending');
INSERT INTO services VALUES('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',true);
INSERT INTO bookings(id,client_id,provider_uuid,service_id,status,request_key) VALUES
 ('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','pending','duplicate-test');
INSERT INTO notifications(user_id,title,message,type,is_read) VALUES
 ('10000000-0000-0000-0000-000000000001','Own','Synthetic','booking_new',false),
 ('10000000-0000-0000-0000-000000000002','Other','Synthetic','booking_new',false);
SET ROLE authenticated;
SET test.uid='10000000-0000-0000-0000-000000000001';
DO $$ BEGIN
  IF (SELECT count(*) FROM notifications)<>1 THEN RAISE EXCEPTION 'Notification privacy failed'; END IF;
  IF (SELECT count(*) FROM services)<>1 THEN RAISE EXCEPTION 'Eligible service not readable'; END IF;
  IF (SELECT count(*) FROM profiles)<>1 THEN RAISE EXCEPTION 'Private profile leaked'; END IF;
  IF (SELECT count(*) FROM providers WHERE registration_status='pending')<>0 THEN RAISE EXCEPTION 'Unapproved provider leaked'; END IF;
  IF (SELECT count(*) FROM bookings)<>1 THEN RAISE EXCEPTION 'Own booking not readable'; END IF;
  BEGIN UPDATE profiles SET role='provider'; RAISE EXCEPTION 'Role write allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN UPDATE providers SET is_verified=true; RAISE EXCEPTION 'Self approval allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN SELECT email FROM providers LIMIT 1; RAISE EXCEPTION 'Private provider email readable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN UPDATE bookings SET status='confirmed'; RAISE EXCEPTION 'Direct acceptance allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  IF has_function_privilege('authenticated','public.create_combo_request(uuid,uuid,jsonb)','execute') THEN RAISE EXCEPTION 'RPC exposed to clients'; END IF;
END $$;
SET test.uid='10000000-0000-0000-0000-000000000002';
DO $$ BEGIN IF (SELECT count(*) FROM bookings)<>0 THEN RAISE EXCEPTION 'Other customer booking leaked'; END IF; END $$;
RESET ROLE;
DO $$ BEGIN
  BEGIN INSERT INTO bookings(client_id,provider_uuid,status,request_key) VALUES('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','pending','duplicate-test');
    RAISE EXCEPTION 'Duplicate request allowed'; EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN INSERT INTO bookings(provider_uuid,status) VALUES('20000000-0000-0000-0000-000000000002','pending');
    RAISE EXCEPTION 'Unapproved booking allowed'; EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN INSERT INTO providers(email,phone) VALUES('provider@example.test','other');
    RAISE EXCEPTION 'Duplicate registration allowed'; EXCEPTION WHEN unique_violation THEN NULL; END;
  IF NOT public.consume_request_limit('synthetic-key',1,60) OR public.consume_request_limit('synthetic-key',1,60) THEN RAISE EXCEPTION 'Rate limit broken'; END IF;
END $$;
INSERT INTO combo_packs(id,name,slug,category,base_price,discount,final_price) VALUES
 ('50000000-0000-0000-0000-000000000001','Synthetic package','synthetic-package','Trip Combo',100,10,90);
INSERT INTO combo_pack_items(combo_pack_id,service_type,service_id,provider_id,quantity) VALUES
 ('50000000-0000-0000-0000-000000000001','Transport','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',2);
SET ROLE service_role;
DO $$ DECLARE details jsonb := '{"start_date":"2026-12-10","end_date":"2026-12-11","guest_count":1,"customer_name":"Synthetic","customer_phone":"9000000001"}';
  created jsonb; duplicate jsonb; item uuid; status text; changed_details jsonb;
BEGIN
  created := public.create_combo_request('10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',details);
  duplicate := public.create_combo_request('10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',details);
  IF created->>'id'<>duplicate->>'id' OR (SELECT count(*) FROM combo_booking_items)<>1 THEN RAISE EXCEPTION 'Duplicate combo created'; END IF;
  FOR changed_details IN SELECT value FROM jsonb_array_elements('[{"end_date":"2026-12-12"},{"guest_count":2},{"pickup_location":"Different pickup"}]'::jsonb) LOOP
    BEGIN
      PERFORM public.create_combo_request('10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',details || changed_details);
      RAISE EXCEPTION 'Changed request silently accepted';
    EXCEPTION WHEN unique_violation THEN NULL; END;
  END LOOP;
  IF (SELECT count(*) FROM combo_bookings)<>1 THEN RAISE EXCEPTION 'Conflicting request inserted'; END IF;
  IF (created->>'total_amount')::numeric <> 90 THEN RAISE EXCEPTION 'Stored price changed'; END IF;
  IF (SELECT quantity FROM combo_booking_items LIMIT 1)<>2 THEN RAISE EXCEPTION 'Component quantity lost'; END IF;
  SELECT id INTO item FROM combo_booking_items LIMIT 1;
  BEGIN PERFORM public.transition_combo_request('10000000-0000-0000-0000-000000000001',NULL,item,'confirm'); RAISE EXCEPTION 'Wrong owner accepted';
    EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Not authorized' THEN RAISE; END IF; END;
  status := public.transition_combo_request('10000000-0000-0000-0000-000000000002',NULL,item,'confirm');
  IF status<>'confirmed' THEN RAISE EXCEPTION 'Parent not confirmed'; END IF;
  status := public.transition_combo_request('10000000-0000-0000-0000-000000000001',(created->>'id')::uuid,NULL,'cancel');
  IF status<>'cancelled' OR (SELECT provider_booking_status FROM combo_booking_items WHERE id=item)<>'cancelled' THEN RAISE EXCEPTION 'Cancellation not atomic'; END IF;
  UPDATE services SET is_available=false;
  BEGIN PERFORM public.create_combo_request('10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',details);
    RAISE EXCEPTION 'Unavailable component accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Package service unavailable' THEN RAISE; END IF; END;
  IF (SELECT count(*) FROM combo_bookings)<>1 THEN RAISE EXCEPTION 'Partial combo persisted'; END IF;
END $$;

-- A partially rejected package must remain cancellable by its customer.
UPDATE services SET is_available=true;
INSERT INTO combo_pack_items(combo_pack_id,service_type,service_id,provider_id,quantity) VALUES
 ('50000000-0000-0000-0000-000000000001','Transport','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',1);
DO $$ DECLARE created jsonb; item uuid; status text;
BEGIN
  created := public.create_combo_request('10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',
    '{"start_date":"2099-12-12","guest_count":1,"customer_name":"Synthetic","customer_phone":"9000000001"}'::jsonb);
  SELECT id INTO item FROM combo_booking_items WHERE combo_booking_id=(created->>'id')::uuid LIMIT 1;
  status := public.transition_combo_request('10000000-0000-0000-0000-000000000002',NULL,item,'reject','Unavailable');
  IF status<>'action_required' THEN RAISE EXCEPTION 'Mixed rejection status incorrect'; END IF;
  status := public.transition_combo_request('10000000-0000-0000-0000-000000000001',(created->>'id')::uuid,NULL,'cancel');
  IF status<>'cancelled' OR EXISTS (SELECT FROM combo_booking_items WHERE combo_booking_id=(created->>'id')::uuid AND provider_booking_status<>'cancelled')
    THEN RAISE EXCEPTION 'Action-required cancellation not atomic'; END IF;
END $$;

-- Completed work survives cancellation, and unavailable owners can finish accepted work.
DO $$ DECLARE created jsonb; item uuid; pending_item uuid; status text;
BEGIN
  created := public.create_combo_request('10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',
    '{"start_date":"2099-12-13","guest_count":1,"customer_name":"Synthetic","customer_phone":"9000000001"}'::jsonb);
  SELECT id INTO item FROM combo_booking_items WHERE combo_booking_id=(created->>'id')::uuid LIMIT 1;
  SELECT id INTO pending_item FROM combo_booking_items WHERE combo_booking_id=(created->>'id')::uuid AND id<>item LIMIT 1;
  PERFORM public.transition_combo_request('10000000-0000-0000-0000-000000000002',NULL,item,'confirm');
  UPDATE providers SET is_bookable=false WHERE id='20000000-0000-0000-0000-000000000001';
  BEGIN PERFORM public.transition_combo_request('10000000-0000-0000-0000-000000000002',NULL,pending_item,'confirm');
    RAISE EXCEPTION 'Unavailable owner accepted work';
    EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Not authorized' THEN RAISE; END IF; END;
  status := public.transition_combo_request('10000000-0000-0000-0000-000000000002',NULL,item,'complete');
  IF status<>'partially_confirmed' THEN RAISE EXCEPTION 'Completed progress lost'; END IF;
  status := public.transition_combo_request('10000000-0000-0000-0000-000000000001',(created->>'id')::uuid,NULL,'cancel');
  IF status<>'cancelled' OR (SELECT provider_booking_status<>'completed' OR service_status<>'completed' FROM combo_booking_items WHERE id=item)
    OR (SELECT provider_booking_status<>'cancelled' OR service_status<>'cancelled' FROM combo_booking_items WHERE id=pending_item)
    THEN RAISE EXCEPTION 'Cancellation lost completed work'; END IF;
END $$;

RESET ROLE;
