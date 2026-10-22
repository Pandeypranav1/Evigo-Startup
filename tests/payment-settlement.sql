\set ON_ERROR_STOP on
\ir fixtures/payment-schema.sql
\ir ../supabase/migrations/20261001000000_notifications_realtime_access.sql
\ir ../supabase/migrations/20261002000000_payment_gateway_orchestration.sql
\ir ../supabase/migrations/20261022162907_payment_reliability.sql
DO $$
DECLARE
  customer uuid := gen_random_uuid(); provider_user uuid := gen_random_uuid(); provider uuid := gen_random_uuid();
  booking uuid := gen_random_uuid(); combo uuid := gen_random_uuid(); payment uuid := gen_random_uuid();
  gateway uuid; failed_payment uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.profiles VALUES(customer), (provider_user);
  INSERT INTO public.providers VALUES(provider, provider_user);
  INSERT INTO public.bookings(id,client_id,provider_uuid,customer_name,service_type) VALUES(booking,customer,provider,'Synthetic customer','Transport');
  IF (SELECT count(*) FROM public.notifications WHERE user_id = provider_user AND booking_id = booking) <> 1 THEN RAISE EXCEPTION 'Provider request notification missing'; END IF;
  SELECT id INTO gateway FROM public.payment_gateways WHERE code = 'razorpay';
  INSERT INTO public.payments(id,user_id,booking_id,amount,gateway,selected_gateway,gateway_order_id)
    VALUES(payment,customer,booking,125,'razorpay','razorpay','order_test');
  INSERT INTO public.payment_attempts(payment_id,gateway_id,attempt_number,status,gateway_order_id)
    VALUES(payment,gateway,1,'pending','order_test');
  PERFORM public.finalize_payment(payment,'pay_test','razorpay',true);
  PERFORM public.finalize_payment(payment,'pay_test','razorpay',true);
  PERFORM public.finalize_payment(payment,NULL,'razorpay',false,'late failure');
  IF (SELECT status FROM public.payments WHERE id=payment) <> 'success' THEN RAISE EXCEPTION 'Successful payment regressed'; END IF;
  IF (SELECT payment_status FROM public.bookings WHERE id=booking) <> 'paid' THEN RAISE EXCEPTION 'Booking not paid'; END IF;
  IF (SELECT count(*) FROM public.notifications WHERE user_id=customer) <> 1 THEN RAISE EXCEPTION 'Duplicate settlement notification'; END IF;
  IF (SELECT transaction_count FROM public.payment_gateway_usage WHERE gateway_id=gateway) <> 1 THEN RAISE EXCEPTION 'Duplicate gateway usage'; END IF;
  IF (SELECT status FROM public.payment_attempts WHERE payment_id=payment) <> 'captured' THEN RAISE EXCEPTION 'Attempt not captured'; END IF;

  INSERT INTO public.combo_bookings(id) VALUES(combo);
  INSERT INTO public.payments(id,user_id,combo_booking_id,amount,gateway,selected_gateway,gateway_order_id)
    VALUES(failed_payment,customer,combo,50,'razorpay','razorpay','order_combo');
  PERFORM public.finalize_payment(failed_payment,NULL,'razorpay',false,'declined');
  PERFORM public.finalize_payment(failed_payment,NULL,'razorpay',false,'duplicate');
  PERFORM public.finalize_payment(failed_payment,'pay_combo','razorpay',true);
  IF (SELECT payment_status FROM public.combo_bookings WHERE id=combo) <> 'paid' THEN RAISE EXCEPTION 'Combo not paid'; END IF;
  -- Combo IDs must not be inserted into the bookings-only notification FK.
  IF (SELECT count(*) FROM public.notifications WHERE user_id=customer AND booking_id IS NULL) <> 2 THEN RAISE EXCEPTION 'Combo notification missing'; END IF;
  IF has_function_privilege('authenticated','public.finalize_payment(uuid,text,text,boolean,text)','execute') THEN RAISE EXCEPTION 'Client may settle payments'; END IF;
END $$;
-- A notification failure must roll back payment and booking state.
ALTER TABLE public.notifications ADD CONSTRAINT reject_test_notification CHECK (title <> 'Payment successful') NOT VALID;
DO $$
DECLARE payment uuid := gen_random_uuid(); customer uuid; booking uuid := gen_random_uuid();
BEGIN
  SELECT id INTO customer FROM public.profiles LIMIT 1;
  INSERT INTO public.bookings(id) VALUES(booking);
  INSERT INTO public.payments(id,user_id,booking_id,amount,gateway) VALUES(payment,customer,booking,25,'razorpay');
  BEGIN
    PERFORM public.finalize_payment(payment,'pay_rollback','razorpay',true);
    RAISE EXCEPTION 'Expected notification rejection';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF (SELECT status FROM public.payments WHERE id=payment) <> 'created' OR
     (SELECT payment_status FROM public.bookings WHERE id=booking) <> 'unpaid' THEN
    RAISE EXCEPTION 'Settlement was not atomic';
  END IF;
END $$;
