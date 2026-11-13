REVOKE REFERENCES, TRIGGER, TRUNCATE
ON TABLE public.profiles, public.providers, public.bookings, public.combo_bookings, public.combo_booking_items
FROM PUBLIC, anon, authenticated;

REVOKE SELECT ON TABLE public.profiles, public.bookings, public.combo_bookings, public.combo_booking_items
FROM anon;