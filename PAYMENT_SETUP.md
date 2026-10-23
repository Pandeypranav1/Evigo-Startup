# Razorpay and dashboard notifications

## Deploy together

Apply `supabase/migrations/20261022162907_payment_reliability.sql` before deploying this application version. It reconciles payment-attempt columns/statuses, adds the server-only `finalize_payment` RPC, and creates provider notifications in the booking transaction. The earlier notification migration must also be applied so authenticated users can read their own notifications through Supabase Realtime.

The original payment migration's combo-booking foreign key typo is corrected for installations that have not applied it. Existing installations only need the new migration. These migrations assume the existing profiles, providers, bookings, combo_bookings and notifications tables. Use the versioned migrations, rather than the older `APPLY_PAYMENT_MIGRATION.sql` snapshot.

## Server configuration

Configure these variables through your deployment's secret settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `PAYMENT_ENV=sandbox` for Razorpay test mode
- `RAZORPAY_KEY_ID_SANDBOX`
- `RAZORPAY_KEY_SECRET_SANDBOX`
- `RAZORPAY_WEBHOOK_SECRET_SANDBOX`

For live payments, set `PAYMENT_ENV=production` and configure `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Do not prefix secrets with `NEXT_PUBLIC_`. The server returns the matching public checkout key.

In the Razorpay dashboard:

1. Enable automatic capture. Authorized payments stay pending until capture.
2. Add `https://<your-app-domain>/api/payments/webhooks/razorpay` as the webhook URL.
3. Set the matching webhook secret and subscribe to `payment.captured`, `order.paid`, and `payment.failed`.
4. Keep Razorpay active in the app's payment gateway settings. Disable Cashfree if it is not configured; its checkout is a separate integration.

Bookings require a stored positive price before payment can start. Provider requests require `bookings.provider_uuid` to reference the provider record, and `providers.user_id` to reference the provider's authenticated account. The provider sees requests at `/provider/dashboard`; payment notifications go to the customer. New requests refresh the provider dashboard through Supabase Realtime, with polling recovery for missed notifications.

## Acceptance checks

With two signed-in sessions (customer and provider), submit a request and check the provider's notification bell and booking list without reloading. Read the notification and verify it stays read after reconnecting. Complete a Razorpay test payment, verify the booking becomes paid, and resend the webhook: settlement and its notification should occur once. A declined attempt must not overwrite a later successful payment.

Automated checks:

```sh
node --experimental-strip-types --test tests/*.test.mjs
npx tsc --noEmit
```

`tests/payment-settlement.sql` runs the payment migrations and transaction assertions against an **empty disposable PostgreSQL database**. Its fixture creates synthetic roles/tables and is not a production setup script. Run with a database administrator using `psql -X -v ON_ERROR_STOP=1 -d <disposable-database> -f tests/payment-settlement.sql`.

Local SQL and SDK tests do not verify live Razorpay capture or Supabase WebSocket delivery. Those require the configured acceptance checks above.
