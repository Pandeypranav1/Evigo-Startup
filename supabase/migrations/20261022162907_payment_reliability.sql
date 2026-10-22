-- Reconcile the original orchestration schema with the server's attempt model.
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway text;
UPDATE public.payments SET gateway = selected_gateway WHERE gateway IS NULL;
ALTER TABLE public.payment_attempts
  ADD COLUMN IF NOT EXISTS gateway text,
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS gateway_payment_id text;
ALTER TABLE public.payment_attempts DROP CONSTRAINT IF EXISTS payment_attempts_status_check;
ALTER TABLE public.payment_attempts ADD CONSTRAINT payment_attempts_status_check CHECK (status IN (
  'created', 'pending', 'authorized', 'captured', 'failed', 'cancelled',
  'started', 'order_created', 'processing', 'success', 'timeout'
));

-- Row locking makes browser callbacks and webhook retries one transaction.
-- Invoker security: only the server service role may execute this function.
CREATE OR REPLACE FUNCTION public.finalize_payment(
  p_payment_id uuid, p_gateway_payment_id text, p_gateway text,
  p_success boolean, p_reason text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  payment public.payments%ROWTYPE;
  gateway_id uuid;
BEGIN
  SELECT * INTO STRICT payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF COALESCE(payment.gateway, payment.selected_gateway) IS DISTINCT FROM p_gateway THEN
    RAISE EXCEPTION 'Payment gateway mismatch';
  END IF;
  IF payment.status IN ('success', 'captured', 'refund_pending', 'refunded', 'partially_refunded') THEN RETURN; END IF;
  IF NOT p_success AND payment.status = 'failed' THEN RETURN; END IF;
  IF p_success AND COALESCE(p_gateway_payment_id, '') = '' THEN RAISE EXCEPTION 'Payment ID required'; END IF;

  UPDATE public.payments SET
    status = CASE WHEN p_success THEN 'success' ELSE 'failed' END,
    gateway_payment_id = CASE WHEN p_success THEN p_gateway_payment_id ELSE gateway_payment_id END,
    paid_at = CASE WHEN p_success THEN now() ELSE paid_at END,
    failed_at = CASE WHEN p_success THEN NULL ELSE now() END,
    failure_reason = CASE WHEN p_success THEN NULL ELSE p_reason END
  WHERE id = payment.id;

  UPDATE public.payment_attempts SET
    status = CASE WHEN p_success THEN 'captured' ELSE 'failed' END,
    gateway_payment_id = CASE WHEN p_success THEN p_gateway_payment_id ELSE gateway_payment_id END,
    error_message = CASE WHEN p_success THEN NULL ELSE p_reason END,
    completed_at = now()
  WHERE id = (SELECT id FROM public.payment_attempts
    WHERE payment_id = payment.id AND gateway_order_id = payment.gateway_order_id
    ORDER BY attempt_number DESC LIMIT 1);

  IF p_success THEN
    UPDATE public.bookings SET payment_status = 'paid' WHERE id = payment.booking_id;
    UPDATE public.combo_bookings SET payment_status = 'paid' WHERE id = payment.combo_booking_id;
  END IF;

  SELECT id INTO gateway_id FROM public.payment_gateways WHERE code = p_gateway;
  IF gateway_id IS NOT NULL THEN
    PERFORM public.get_or_create_gateway_usage(gateway_id);
    PERFORM public.update_gateway_usage(gateway_id, payment.amount, p_success);
  END IF;

  IF payment.user_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, booking_id, title, message, type, is_read)
    VALUES (payment.user_id, payment.booking_id,
      CASE WHEN p_success THEN 'Payment successful' ELSE 'Payment unsuccessful' END,
      CASE WHEN p_success THEN 'Your payment of ₹' || payment.amount || ' was received.'
        ELSE 'Your payment was not completed. Please check your booking before retrying.' END,
      CASE WHEN p_success THEN 'booking_confirmed' ELSE 'booking_rejected' END, false);
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_payment(uuid, text, text, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_payment(uuid, text, text, boolean, text) TO service_role;

-- A request and its provider notification must commit together.
CREATE SCHEMA IF NOT EXISTS private;
CREATE OR REPLACE FUNCTION private.notify_provider_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE owner_id uuid;
BEGIN
  SELECT user_id INTO owner_id FROM public.providers WHERE id = NEW.provider_uuid;
  IF owner_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, booking_id, title, message, type, is_read)
    VALUES (owner_id, NEW.id, 'New booking request',
      COALESCE(NEW.customer_name, 'A customer') || ' requested ' || COALESCE(NEW.service_type, 'a service') ||
      CASE WHEN NEW.pickup_location IS NOT NULL THEN E'\nPickup: ' || NEW.pickup_location ELSE '' END ||
      CASE WHEN NEW.drop_location IS NOT NULL THEN E'\nDrop: ' || NEW.drop_location ELSE '' END,
      'booking_new', false);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.notify_provider_booking() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS notify_provider_booking ON public.bookings;
CREATE TRIGGER notify_provider_booking AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION private.notify_provider_booking();
