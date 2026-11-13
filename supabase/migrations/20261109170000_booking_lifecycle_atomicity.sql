BEGIN;

CREATE SCHEMA IF NOT EXISTS evigo_private;
REVOKE ALL ON SCHEMA evigo_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA evigo_private TO service_role;

UPDATE public.bookings
SET status = 'pending'
WHERE status IS NULL;

ALTER TABLE public.bookings
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_lifecycle_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_lifecycle_status_check
  CHECK (status IN ('pending', 'confirmed', 'accepted', 'rejected', 'cancelled', 'completed'));

CREATE INDEX IF NOT EXISTS bookings_client_history_idx
  ON public.bookings (client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS bookings_provider_history_idx
  ON public.bookings (provider_uuid, created_at DESC);

CREATE OR REPLACE FUNCTION evigo_private.enforce_booking_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  provider_user_id uuid;
  provider_status text;
  provider_verified boolean;
  provider_bookable boolean;
  service_provider_id uuid;
  service_available boolean;
  client_role text;
  booking_date date;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.client_id IS NULL THEN
      RAISE EXCEPTION 'A signed-in customer is required to create a booking'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.provider_uuid IS NULL THEN
      RAISE EXCEPTION 'A provider listing is required to create a booking'
        USING ERRCODE = '23514';
    END IF;

    booking_date := COALESCE(NEW.event_date, NEW.travel_date);
    IF booking_date IS NULL OR NULLIF(btrim(NEW.service_type), '') IS NULL THEN
      RAISE EXCEPTION 'A service and booking date are required'
        USING ERRCODE = '23514';
    END IF;
    IF NEW.service_id IS NULL THEN
      RAISE EXCEPTION 'An available service is required to create a booking'
        USING ERRCODE = '23514';
    END IF;

    SELECT role
    INTO client_role
    FROM public.profiles
    WHERE id = NEW.client_id
    FOR SHARE;

    IF NOT FOUND OR client_role IS DISTINCT FROM 'client' THEN
      RAISE EXCEPTION 'Only customer accounts can create bookings'
        USING ERRCODE = '23514';
    END IF;

    SELECT user_id, registration_status, is_verified, is_bookable
    INTO provider_user_id, provider_status, provider_verified, provider_bookable
    FROM public.providers
    WHERE id = NEW.provider_uuid
    FOR SHARE;

    IF NOT FOUND
      OR provider_status IS DISTINCT FROM 'approved'
      OR provider_verified IS DISTINCT FROM TRUE
      OR provider_bookable IS DISTINCT FROM TRUE
    THEN
      RAISE EXCEPTION 'This provider is not accepting bookings'
        USING ERRCODE = '23514';
    END IF;

    IF provider_user_id = NEW.client_id THEN
      RAISE EXCEPTION 'A provider cannot book their own listing'
        USING ERRCODE = '23514';
    END IF;

    IF NEW.service_id IS NOT NULL THEN
      SELECT provider_id, is_available
      INTO service_provider_id, service_available
      FROM public.services
      WHERE id = NEW.service_id
      FOR SHARE;

      IF NOT FOUND
        OR service_provider_id IS DISTINCT FROM NEW.provider_uuid
        OR service_available IS DISTINCT FROM TRUE
      THEN
        RAISE EXCEPTION 'This service is unavailable'
          USING ERRCODE = '23514';
      END IF;
    END IF;

    IF NEW.status IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'New bookings must start in pending status'
        USING ERRCODE = '23514';
    END IF;

    PERFORM pg_advisory_xact_lock(
      hashtext(NEW.client_id::text),
      hashtext(
        NEW.provider_uuid::text || ':' ||
        NEW.service_type || ':' ||
        NEW.service_id::text || ':' ||
        booking_date::text || ':' ||
        COALESCE(NEW.event_time, NEW.pickup_time, '')
      )
    );

    IF EXISTS (
      SELECT 1
      FROM public.bookings AS existing
      WHERE existing.client_id = NEW.client_id
        AND existing.provider_uuid = NEW.provider_uuid
        AND existing.service_type = NEW.service_type
        AND (existing.service_id IS NULL OR existing.service_id = NEW.service_id)
        AND COALESCE(existing.event_date, existing.travel_date) = booking_date
        AND COALESCE(
          NULLIF(btrim(existing.event_time), ''),
          NULLIF(btrim(existing.pickup_time), '')
        ) IS NOT DISTINCT FROM COALESCE(
          NULLIF(btrim(NEW.event_time), ''),
          NULLIF(btrim(NEW.pickup_time), '')
        )
        AND existing.status IN ('pending', 'confirmed', 'accepted')
    ) THEN
      RAISE EXCEPTION 'An active booking already exists for this request'
        USING ERRCODE = '23505',
              CONSTRAINT = 'bookings_active_request_unique';
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
    AND NOT (
      (OLD.status = 'pending' AND NEW.status IN ('confirmed', 'accepted', 'rejected', 'cancelled'))
      OR (OLD.status IN ('confirmed', 'accepted') AND NEW.status IN ('completed', 'cancelled'))
    )
  THEN
    RAISE EXCEPTION 'Invalid booking status transition: % to %', OLD.status, NEW.status
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION evigo_private.enforce_booking_lifecycle() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION evigo_private.enforce_booking_lifecycle() TO service_role;

DROP TRIGGER IF EXISTS bookings_validate_insert ON public.bookings;
CREATE TRIGGER bookings_validate_insert
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION evigo_private.enforce_booking_lifecycle();

DROP TRIGGER IF EXISTS bookings_validate_status_update ON public.bookings;
CREATE TRIGGER bookings_validate_status_update
  BEFORE UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION evigo_private.enforce_booking_lifecycle();

COMMIT;