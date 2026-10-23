-- Synthetic prerequisite tables for the payment migrations; use a disposable database.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role BYPASSRLS; END IF;
END $$;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
CREATE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TABLE public.profiles (id uuid PRIMARY KEY);
CREATE TABLE public.providers (id uuid PRIMARY KEY, user_id uuid REFERENCES public.profiles);
CREATE TABLE public.bookings (id uuid PRIMARY KEY, client_id uuid, provider_uuid uuid REFERENCES public.providers,
  customer_name text, service_type text, pickup_location text, drop_location text, payment_status text DEFAULT 'unpaid');
CREATE TABLE public.combo_bookings (id uuid PRIMARY KEY, payment_status text DEFAULT 'unpaid');
CREATE TABLE public.notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES public.profiles,
  booking_id uuid REFERENCES public.bookings, title text, message text, type text, is_read boolean DEFAULT false);
CREATE PUBLICATION supabase_realtime;
