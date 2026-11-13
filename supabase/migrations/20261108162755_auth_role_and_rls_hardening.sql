CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  account_role text;
BEGIN
  account_role := CASE
    WHEN new.raw_user_meta_data->>'account_role' IN ('client', 'provider')
      THEN new.raw_user_meta_data->>'account_role'
    ELSE 'client'
  END;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    account_role
  );

  RETURN new;
END;
$function$;

REVOKE UPDATE ON public.profiles FROM PUBLIC, anon, authenticated;

REVOKE SELECT ON public.providers FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id,
  registration_status,
  business_name,
  owner_name,
  category,
  city,
  phone,
  experience_years,
  service_areas,
  description,
  price_range,
  rating,
  image_url,
  is_verified,
  is_bookable
) ON public.providers TO anon, authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.bookings FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "Allow booking creation" ON public.bookings;

REVOKE INSERT, UPDATE, DELETE ON public.combo_bookings FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.combo_booking_items FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "Users can create own combo bookings" ON public.combo_bookings;
DROP POLICY IF EXISTS "Users can cancel own combo bookings" ON public.combo_bookings;
DROP POLICY IF EXISTS "Providers can update assigned combo booking items" ON public.combo_booking_items;