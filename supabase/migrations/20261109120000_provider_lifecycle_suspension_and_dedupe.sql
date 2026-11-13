-- Provider lifecycle hardening:
-- 1. Allow the 'suspended' registration_status so admins can suspend and
--    reinstate approved providers. Suspended providers keep is_bookable = false
--    and are excluded from public search and booking creation.
-- 2. Enforce one provider application per account (user_id) and one
--    registration per email at the database level, complementing the
--    application-level duplicate checks in /api/providers/register.

ALTER TABLE public.providers
  DROP CONSTRAINT IF EXISTS providers_registration_status_check;

ALTER TABLE public.providers
  ADD CONSTRAINT providers_registration_status_check
  CHECK (registration_status = ANY (ARRAY['pending', 'approved', 'rejected', 'suspended']));

CREATE UNIQUE INDEX IF NOT EXISTS providers_user_id_key
  ON public.providers (user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS providers_email_key
  ON public.providers (lower(email))
  WHERE email IS NOT NULL;
