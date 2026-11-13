# Evigo database architecture audit

Audit scope: repository source, schema files, migrations, and read-only checks of the connected Supabase project. No database records were changed. The auth/RLS hardening migrations listed below were applied; a SQL file in this repository is evidence of intended schema, not proof that the hosted database has that schema.

## Architecture found

### MongoDB

MongoDB is present as a legacy/incomplete integration, not an active persistence path found in the application:

- [`src/lib/mongodb.ts`](src/lib/mongodb.ts) exports a cached `connectDB()` connection to `MONGODB_URI`, database `evigo`.
- [`src/models/User.ts`](src/models/User.ts), [`src/models/Provider.ts`](src/models/Provider.ts), and [`src/models/Booking.ts`](src/models/Booking.ts) define Mongoose models for users, providers, and bookings.
- No application route or other source imports `connectDB` or these models. No MongoDB reads or writes were found in the application. The defined models therefore do not establish that MongoDB currently stores production records.

### Supabase

Supabase is the active application database and identity platform:

- Browser and cookie-backed server clients use the Supabase publishable key in [`src/lib/client.ts`](src/lib/client.ts) and [`src/lib/server.ts`](src/lib/server.ts). Email OTP verification is in [`src/app/api/auth/send-otp/route.ts`](src/app/api/auth/send-otp/route.ts) and [`src/app/api/auth/verify-otp/route.ts`](src/app/api/auth/verify-otp/route.ts); authenticated identity comes from Supabase Auth.
- [`src/lib/supabase.ts`](src/lib/supabase.ts) is marked `server-only` and creates the service-role client. Server routes use it for privileged database operations.
- Main application data paths:
  - Profiles: `public.profiles` (auth UUID, email, role, profile fields), read/written by [`src/app/api/profile/route.ts`](src/app/api/profile/route.ts), avatar handling, OTP verification, and provider/booking flows.
  - Providers and services: `public.providers` and `public.services`, used by provider registration/listing, availability, service, and booking routes.
  - Bookings: `public.bookings`, used by [`src/app/api/bookings/route.ts`](src/app/api/bookings/route.ts), transport, and payment integrations.
  - Combo catalog and bookings: `combo_packs`, `combo_pack_items`, `combo_bookings`, and `combo_booking_items`, defined in [`supabase/migrations/20261001010000_combo_packs_service.sql`](supabase/migrations/20261001010000_combo_packs_service.sql) and used by combo-pack routes.
  - Notifications: `public.notifications`, queried by [`src/app/api/notifications/route.ts`](src/app/api/notifications/route.ts) and written by [`src/lib/notifications.ts`](src/lib/notifications.ts); realtime subscriptions are in the dashboard and notification component.
  - Analytics: `public.page_visits` and legacy `public.users`, used by [`src/app/api/track-visit/route.ts`](src/app/api/track-visit/route.ts) and [`src/app/api/analytics/route.ts`](src/app/api/analytics/route.ts).
  - Contact submissions: `public.contact_messages`, inserted by [`src/app/api/contact/route.ts`](src/app/api/contact/route.ts).
  - Avatars: Supabase Storage bucket `avatars`, handled in [`src/app/api/profile/avatar/route.ts`](src/app/api/profile/avatar/route.ts).
- RPC usage is confined to payment code: `select_best_gateway` and `update_gateway_usage` in `src/lib/payment/router.ts` and `src/lib/payment/service.ts`. This audit did not change payment code. The checked SQL defines `update_gateway_usage`; a definition for `select_best_gateway` was not found.

### Other requested entities

| Entity | Current source found |
|---|---|
| Users / identity | Supabase Auth owns sign-in identity; `profiles` is the active app profile path. A separate legacy `public.users` table/API also exists. Mongo `User` is an unused model. |
| Customer profiles | `public.profiles`; booking rows also snapshot customer contact fields. |
| Provider profiles | `public.providers`; service listings are separate `public.services` rows. Mongo `Provider` is unused. |
| Bookings | Supabase `bookings` and the separate combo booking tables. Mongo `Booking` is unused. |
| Services | Supabase `services`. |
| Hotels | No hotel database table or hotel persistence route was found. Nearby hotel lookup is a Google Places route currently disabled; destination/hotel content appears in frontend data/assets. |
| Tourism data | No tourism database table or persistence route was found; tourism content is frontend/static data and external map/assistant integrations. |
| Jobs | No jobs table, model, or database route was found. |
| Notifications | Supabase `notifications`. |

## Sources of truth and consistency

- Mongo model definitions duplicate the names of Supabase entities but are not used by application routes; there is no active Mongo/Supabase dual-write path evidenced in the repository.
- Supabase Auth, `profiles`, and legacy `users` overlap as user representations. `supabase-schema.sql` defines `public.users` with phone as its unique key, while OTP/profile flows use Auth UUIDs and `public.profiles`. `/api/users/upsert` is not called elsewhere in this repository and is not synchronized by the OTP handler. Treat `profiles`/Auth as the active source for login and profile identity; the intended ongoing role of `public.users` needs confirmation.
- Regular bookings and combo bookings are distinct Supabase models, not synchronized counterparts. Combo creation inserts a parent and child items in separate requests and attempts a compensating parent delete on child failure. If that rollback fails, an incomplete parent can remain. No cross-database booking consistency issue was found because Mongo has no active booking write path.

## Constraints, indexes, and schema coverage

- The checked SQL explicitly constrains `users.phone` uniqueness and role, `page_visits.device_type`, combo categories/statuses/quantities/amounts, and defines combo foreign keys and several query indexes.
- The checked repo schema does not define the core `profiles`, `providers`, `services`, `bookings`, `notifications`, or `contact_messages` table DDL. As a result, their live constraints, indexes, and RLS cannot be confirmed from this repository alone.
- The available schema artifacts are split: `supabase-schema.sql`, combo migrations, and payment migration/apply SQL cover different parts and are not a complete canonical schema. Verify deployed DDL before proposing constraints or indexes.

## Confirmed issues and actions

1. **Unauthenticated privileged user API (fixed in this pass).** [`src/app/api/users/upsert/route.ts`](src/app/api/users/upsert/route.ts) used the service-role client for GET and POST without authenticating a caller. GET exposed a user row by phone; POST accepted caller-supplied role and profile fields. It is not called by current repository code.
2. **Unauthenticated analytics access (fixed in this pass).** [`src/app/api/analytics/route.ts`](src/app/api/analytics/route.ts) uses the service-role client for an endpoint described as admin-only but did not check admin authorization. Its query errors were also ignored, allowing failed database reads to look like empty/zero results.
3. **Admin API authorization gaps (fixed).** A shared server-side admin guard now protects analytics and the payment-admin route families. These changes add authorization only; payment gateway implementation/configuration and payment database logic were not changed.
4. **Payment migration appears invalid (not changed, approval required).** [`supabase/migrations/20261002000000_payment_gateway_orchestration.sql`](supabase/migrations/20261002000000_payment_gateway_orchestration.sql) contains a double comma in the `payments` definition and references singular `public.combo_booking`; the application and combo migration use `combo_bookings`. This payment migration was not changed or applied.
5. **OTP profile and role handling (fixed).** [`src/app/api/auth/verify-otp/route.ts`](src/app/api/auth/verify-otp/route.ts) now reports profile lookup/creation errors, preserves an existing profile role, and does not authorize from editable metadata. New-account roles are restricted to `client` or `provider` in the profile trigger. [`src/app/api/auth/send-otp/route.ts`](src/app/api/auth/send-otp/route.ts) passes the selected role only as initial signup metadata.
6. **Live profile/provider/booking permissions (fixed).** Live RLS and grants showed that users could update their profile role, public provider reads included private columns, and public booking inserts were allowed. The applied migrations remove direct profile/provider writes, limit provider listing reads to public columns, and route booking/combo-booking writes through authorized server APIs while retaining RLS and authenticated reads.
7. **Public execution of privileged functions (fixed).** Live advisors confirmed `handle_new_user()` and `rls_auto_enable()` were callable as `anon`/`authenticated`. Execute rights were revoked while preserving the Auth trigger invocation. Subsequent privilege checks confirmed the public roles can no longer execute either function.
8. **Combo parent/child insertion is not transactional (remaining).** The combo route compensates for child insert failure with a parent delete, but rollback failure leaves incomplete data. Atomic RPC/transaction work would require schema changes and is not included.
9. **Remaining Supabase advisor findings.** The connected project still reports mutable search paths on five unrelated functions and disabled leaked-password protection. The payment gateway functions were left unchanged; enable leaked-password protection in Supabase Auth settings after owner review.

## Secret exposure check

The service-role key is read only in the `server-only` module `src/lib/supabase.ts` and is not referenced through a `NEXT_PUBLIC_` variable. Browser/server-session code uses the publishable key, which is intended to be public. No secret values were read. Repository evidence does not establish whether deployed environment secrets have been exposed elsewhere.

## Implementation boundary

The authentication pass adds strict OTP/profile role handling, client session synchronization, server-side admin/ownership guards, and least-privilege RLS/table/function grants. Three reviewed migrations were applied to the connected Supabase project; no records were deleted, no tables were dropped, and RLS was not disabled. Payment implementation/configuration and payment-related database logic were left untouched. Items marked not changed remain outside the implemented scope.

## Validation

- `npm run test:provider`: all 12 auth/provider workflow tests passed.
- `npx tsc --noEmit` passed; targeted ESLint passed for the changed auth/provider files.
- HTTP smoke checks: `/login/client` returned `200`; unauthenticated profile and admin payment-gateway requests returned `401`.
- Live SQL read-back confirmed no anon/authenticated write grants on profiles, providers, bookings, or combo booking tables; public provider reads remain column-limited; privileged functions are not executable by anon/authenticated roles.
- Supabase security advisors no longer flag public execution of the two privileged functions. Remaining advisor findings are listed above.
- Real email delivery/OTP, authenticated client/provider access, provider-to-provider denial with live identities, admin success, and expired-session tests were not run because no test accounts/inbox/session fixtures are available.
