-- Synthetic prerequisite schema. Use only in an empty disposable database.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role BYPASSRLS; END IF;
END $$;
ALTER ROLE service_role BYPASSRLS;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.uid', true),'')::uuid $$;
GRANT USAGE ON SCHEMA auth TO anon,authenticated;
CREATE TABLE profiles(id uuid PRIMARY KEY,email text,role text,full_name text,phone text,city text,avatar_url text);
CREATE TABLE providers(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,email text,phone text,registration_status text,
  is_verified boolean,is_bookable boolean,business_name text,owner_name text,category text,city text,
  experience_years integer,service_areas text[],description text,price_range text,rating numeric,image_url text,admin_note text);
CREATE TABLE services(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),provider_id uuid REFERENCES providers,is_available boolean);
CREATE TABLE bookings(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),client_id uuid,provider_uuid uuid REFERENCES providers,
  service_id uuid REFERENCES services,status text,event_date date,created_at timestamptz DEFAULT now());
CREATE TABLE notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,booking_id uuid REFERENCES bookings,
  title text,message text,type text,is_read boolean);
CREATE TABLE users(id uuid,phone text);
CREATE TABLE page_visits(id uuid);
CREATE TABLE contact_messages(id uuid,name text);

-- ============================================================
-- Evigo Platform — Combo Packs Service Migration
-- Tables: combo_packs, combo_pack_items, combo_bookings, combo_booking_items
-- ============================================================

-- Auto-update updated_at trigger function if not already present
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────
-- 1. COMBO PACKS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.combo_packs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT,
  category     TEXT NOT NULL CHECK (category IN (
    'Travel + Stay',
    'Trip Combo',
    'Event Combo',
    'Airport/Railway + Stay',
    'Tourism Package',
    'Custom Combo'
  )),
  image_url    TEXT,
  base_price   NUMERIC NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  discount     NUMERIC NOT NULL DEFAULT 0 CHECK (discount >= 0),
  final_price  NUMERIC NOT NULL DEFAULT 0 CHECK (final_price >= 0),
  city         TEXT NOT NULL DEFAULT 'Jamui, Bihar',
  duration     TEXT NOT NULL DEFAULT '1 Day',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_combo_packs_category  ON public.combo_packs (category);
CREATE INDEX IF NOT EXISTS idx_combo_packs_is_active ON public.combo_packs (is_active);
CREATE INDEX IF NOT EXISTS idx_combo_packs_slug      ON public.combo_packs (slug);

DROP TRIGGER IF EXISTS set_combo_packs_updated_at ON public.combo_packs;
CREATE TRIGGER set_combo_packs_updated_at
  BEFORE UPDATE ON public.combo_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- 2. COMBO PACK ITEMS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.combo_pack_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_pack_id  UUID NOT NULL REFERENCES public.combo_packs(id) ON DELETE CASCADE,
  service_type   TEXT NOT NULL,
  service_id     UUID REFERENCES public.services(id) ON DELETE SET NULL,
  provider_id    UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  quantity       INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  is_required    BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_combo_pack_items_pack_id ON public.combo_pack_items (combo_pack_id);
CREATE INDEX IF NOT EXISTS idx_combo_pack_items_prov_id ON public.combo_pack_items (provider_id);

-- ─────────────────────────────────────────────────────────────
-- 3. COMBO BOOKINGS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.combo_bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  combo_pack_id     UUID REFERENCES public.combo_packs(id) ON DELETE SET NULL,
  combo_name        TEXT,
  total_amount      NUMERIC NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  booking_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  start_date        DATE,
  end_date          DATE,
  guest_count       INTEGER DEFAULT 1 CHECK (guest_count >= 1),
  pickup_location   TEXT,
  drop_location     TEXT,
  customer_name     TEXT NOT NULL,
  customer_phone    TEXT NOT NULL,
  customer_email    TEXT,
  special_requests  TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'partially_confirmed',
    'confirmed',
    'rejected',
    'action_required',
    'completed',
    'cancelled'
  )),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at      TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_combo_bookings_user_id    ON public.combo_bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_combo_bookings_pack_id    ON public.combo_bookings (combo_pack_id);
CREATE INDEX IF NOT EXISTS idx_combo_bookings_status     ON public.combo_bookings (status);
CREATE INDEX IF NOT EXISTS idx_combo_bookings_created_at ON public.combo_bookings (created_at DESC);

DROP TRIGGER IF EXISTS set_combo_bookings_updated_at ON public.combo_bookings;
CREATE TRIGGER set_combo_bookings_updated_at
  BEFORE UPDATE ON public.combo_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- 4. COMBO BOOKING ITEMS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.combo_booking_items (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_booking_id         UUID NOT NULL REFERENCES public.combo_bookings(id) ON DELETE CASCADE,
  service_type             TEXT NOT NULL,
  service_id               UUID REFERENCES public.services(id) ON DELETE SET NULL,
  provider_id              UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  provider_name            TEXT,
  provider_booking_status  TEXT NOT NULL DEFAULT 'pending' CHECK (provider_booking_status IN (
    'pending',
    'confirmed',
    'rejected',
    'cancelled',
    'completed'
  )),
  service_status           TEXT NOT NULL DEFAULT 'pending' CHECK (service_status IN (
    'pending',
    'in_progress',
    'completed',
    'cancelled'
  )),
  price_snapshot           NUMERIC NOT NULL DEFAULT 0 CHECK (price_snapshot >= 0),
  rejection_reason         TEXT,
  provider_response_at     TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_combo_booking_items_booking_id ON public.combo_booking_items (combo_booking_id);
CREATE INDEX IF NOT EXISTS idx_combo_booking_items_prov_id    ON public.combo_booking_items (provider_id);
CREATE INDEX IF NOT EXISTS idx_combo_booking_items_status     ON public.combo_booking_items (provider_booking_status);

DROP TRIGGER IF EXISTS set_combo_booking_items_updated_at ON public.combo_booking_items;
CREATE TRIGGER set_combo_booking_items_updated_at
  BEFORE UPDATE ON public.combo_booking_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- 5. ENABLE ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
CREATE POLICY legacy_profiles_open ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY legacy_providers_open ON providers FOR ALL TO anon,authenticated USING (true) WITH CHECK (true);
CREATE POLICY legacy_bookings_open ON bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY legacy_combo_open ON combo_bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.combo_packs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_pack_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_booking_items ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 6. RLS POLICIES
-- ─────────────────────────────────────────────────────────────

-- Combo Packs: Public read active, full access for authenticated/service_role
DROP POLICY IF EXISTS "Public can view active combo packs" ON public.combo_packs;
CREATE POLICY "Public can view active combo packs"
  ON public.combo_packs FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Combo Pack Items: Public read
DROP POLICY IF EXISTS "Public can view combo pack items" ON public.combo_pack_items;
CREATE POLICY "Public can view combo pack items"
  ON public.combo_pack_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- Combo Bookings: Users can view own bookings; providers can view bookings containing their items
DROP POLICY IF EXISTS "Users can view own combo bookings" ON public.combo_bookings;
CREATE POLICY "Users can view own combo bookings"
  ON public.combo_bookings FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM public.combo_booking_items cbi
      JOIN public.providers p ON p.id = cbi.provider_id
      WHERE cbi.combo_booking_id = combo_bookings.id
        AND p.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create own combo bookings" ON public.combo_bookings;
CREATE POLICY "Users can create own combo bookings"
  ON public.combo_bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can cancel own combo bookings" ON public.combo_bookings;
CREATE POLICY "Users can cancel own combo bookings"
  ON public.combo_bookings FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Combo Booking Items: Users can view their booking items; providers can view only assigned items
DROP POLICY IF EXISTS "Users and assigned providers can view combo booking items" ON public.combo_booking_items;
CREATE POLICY "Users and assigned providers can view combo booking items"
  ON public.combo_booking_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.combo_bookings cb
      WHERE cb.id = combo_booking_items.combo_booking_id
        AND cb.user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = combo_booking_items.provider_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

-- Providers can update only their assigned combo booking items
DROP POLICY IF EXISTS "Providers can update assigned combo booking items" ON public.combo_booking_items;
CREATE POLICY "Providers can update assigned combo booking items"
  ON public.combo_booking_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = combo_booking_items.provider_id
        AND p.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = combo_booking_items.provider_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

-- Grant permissions
GRANT SELECT ON public.combo_packs TO anon, authenticated;
GRANT SELECT ON public.combo_pack_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.combo_bookings TO authenticated;
GRANT SELECT, UPDATE ON public.combo_booking_items TO authenticated;


-- Legacy grants must not survive the security migration.
GRANT UPDATE (role) ON profiles TO authenticated;
GRANT SELECT (email) ON providers TO PUBLIC;
GRANT UPDATE (is_verified) ON providers TO authenticated;

CREATE POLICY legacy_services_open ON services FOR SELECT TO anon,authenticated USING (true);
CREATE POLICY legacy_notifications_open ON notifications FOR SELECT TO anon,authenticated USING (true);
