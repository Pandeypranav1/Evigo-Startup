-- Tighten public read access so only approved, verified, bookable
-- providers (and their services) are visible through the anon/authenticated
-- Data API roles. Administrative and owner-scoped access continues to use
-- the service-role client, which bypasses RLS.

DROP POLICY IF EXISTS "Anyone can view providers" ON public.providers;
CREATE POLICY "Anyone can view providers"
  ON public.providers
  FOR SELECT
  TO public
  USING (
    registration_status = 'approved'
    AND is_verified IS TRUE
    AND is_bookable IS TRUE
  );

DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
CREATE POLICY "Anyone can view services"
  ON public.services
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.providers p
      WHERE p.id = services.provider_id
        AND p.registration_status = 'approved'
        AND p.is_verified IS TRUE
        AND p.is_bookable IS TRUE
    )
  );

-- "Evigo" is an unused legacy table that previously allowed inserts from
-- any anonymous or authenticated caller. No application code references it.
REVOKE INSERT, UPDATE, DELETE, SELECT ON public."Evigo" FROM anon, authenticated;
