-- Phase 7: notification dedupe + delivery log + contact form hardening

-- 1. Dedupe key on in-app notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS dedupe_key text;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_dedupe_key
  ON public.notifications (user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

-- 2. Notification delivery log (email + in-app channel outcomes, retry support)
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  booking_id uuid NULL REFERENCES public.bookings(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('in_app', 'email')),
  event_type text NOT NULL,
  recipient text NULL,
  subject text NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text NULL,
  dedupe_key text NULL,
  payload jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS notification_deliveries_channel_dedupe_key
  ON public.notification_deliveries (channel, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS notification_deliveries_status_created_idx
  ON public.notification_deliveries (status, created_at DESC);

ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (which bypasses RLS) can read/write.

-- 3. Contact form hardening columns
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS ip_hash text NULL,
  ADD COLUMN IF NOT EXISTS user_agent text NULL,
  ADD COLUMN IF NOT EXISTS submitted_by uuid NULL;

CREATE INDEX IF NOT EXISTS contact_messages_email_created_idx
  ON public.contact_messages (lower(email), created_at DESC);

CREATE INDEX IF NOT EXISTS contact_messages_ip_hash_created_idx
  ON public.contact_messages (ip_hash, created_at DESC) WHERE ip_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS contact_messages_status_created_idx
  ON public.contact_messages (status, created_at DESC);
