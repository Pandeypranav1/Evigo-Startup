# Evigo nonpayment readiness handoff

Audit date: 2026-10-22. Baseline: `5dcc5a5162bd916dfa683baaf17a21b739fb534d`.

## Release status

Implemented security and reliability repairs are ready for staging validation. **This checkout is not certified for production.** Local unit/API tests, synthetic PostgreSQL permission/transaction tests, and compilation do not verify Supabase Auth, Realtime, Storage, email delivery, provider inventory, or real bookings. No production data was changed and no deployment was performed.

Payment gateway code, payment migrations, gateway configuration and credentials are excluded. Do not use a bulk migration or environment replacement procedure that would change them.

## Architecture and behavior

- Supabase Auth is the active identity provider. Authentication is passwordless email OTP; there is no password-based login/reset workflow to repair. Firebase dependencies and MongoDB models remain in the repository, but active APIs do not import them. No accounts or database records were migrated.
- Supabase PostgreSQL stores profiles, provider applications, services, bookings, combos, notifications, contact messages and page visits. Supabase Storage stores avatars. Actual deployed schemas, storage policies, grants and auth triggers still require an account-owner audit.
- New bookings and combo requests require sign-in. This intentionally replaces anonymous booking creation. Existing guest rows remain unchanged; they are not automatically attached to an account by an email match.
- Existing profile roles are preserved on OTP login. Login tabs cannot switch an existing account's role. Missing-profile recovery creates a client profile. Existing customer-to-provider conversion needs an explicit supported business process; do not update roles from browser fields.
- Administrators are authorized through trusted Auth `app_metadata.role=admin` or a verified account email on the server-only `ADMIN_PROVIDER_EMAILS` allowlist. The nonpayment endpoints ignore client identity headers and public allowlists. The payment-shared legacy admin helper is unchanged.
- Ordinary bookings start `pending`; the assigned eligible provider can confirm/reject, and the owner can complete a confirmed booking even when no longer accepting new work. Owned booking history stays accessible. Customers can cancel their own pending/confirmed requests. Compare-and-set prevents lost updates. No capacity calendar or date-specific live inventory is implied.
- Combo request creation, component rows and creation notifications commit together. Component providers must exist, be approved/bookable, and own the available services. Parent/item changes use a transaction. Cancellation preserves completed component work and cancels the remaining components; completed plus pending components remain partially confirmed. This replaces the previous cancellation behavior that erased completed component statuses. New component rows preserve the package quantity; historical rows retain an unknown quantity. Administrators can choose real provider/service assignments in the creation form, save inactive drafts, then activate eligible packs. Existing draft component editing is not yet supported by that form. Admin package creation remains a two-step write; a failed component insert attempts to delete only its new inactive draft, and a cleanup failure reports how to remove the draft before retrying.
- Email remains best effort after persistence, per the existing contract. There is no durable email outbox/retry worker. A saved request is not evidence of delivered email. Ordinary status notifications still have a best-effort gap if the process fails after the booking update.
- Static hotels are informational and unverified. Fabricated phone/price/rating fields and precise tourism pins were removed. Hotel reservations and local jobs are not implemented. Existing city-centroid/transport registries still need source verification and alias cleanup before being relied on for precise navigation.

## Required nonpayment configuration

Set variables using private local environment files or Vercel's environment settings. Do not commit actual values. Public values are embedded at build time: rebuild after changing them.

| Variable | Exposure | Purpose / requirement |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Project API URL; required for authenticated flows and the current full build |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Supabase publishable client key, protected by RLS; required |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Authorized server mutations; never put in a public variable |
| `ADMIN_PROVIDER_EMAILS` | Server only | Optional verified-email admin allowlist; trusted app metadata can be used instead |
| `BREVO_API_KEY` | Server only | Optional transactional booking email integration |
| `BREVO_SENDER_EMAIL` | Server only | Verified sender address; email is skipped if absent |
| `BREVO_SENDER_NAME` | Server configuration | Optional sender label |
| `ANTHROPIC_API_KEY` | Server only | Optional AI completion integration; authenticated database-backed fallback remains available |
| `MAPBOX_ACCESS_TOKEN` | Server only | Existing optional routing integration; account/quotas require verification |
| `GOOGLE_MAPS_API_KEY` | Server only | Existing optional routing integration; nearby-hotels API remains disabled |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Public, legacy | Referenced by the unused old NearbyHotels component. Do not add it for the current flow |
| `MONGODB_URI` | Server only, legacy | Not needed by active Supabase flows; do not provision/migrate a second database |
| `NEXT_PUBLIC_ADMIN_PROVIDER_EMAILS` | Public, legacy | Not trusted by the repaired nonpayment API guard; shared legacy helper left unchanged |

Payment environment variables are intentionally omitted from this setup procedure and must be preserved unchanged.

### Supabase staging checklist

1. Use a nonproduction project with synthetic accounts. Inventory actual `profiles`, `providers`, `services`, `bookings`, combo tables, `notifications`, `contact_messages`, and `page_visits` before applying this migration. The checked-in base schema is incomplete and is not a reliable production bootstrap.
2. Inspect existing Auth profile-creation triggers. Confirm first-time provider signup creates the intended saved provider role, and existing users retain their roles. If an existing trigger always creates clients, resolve that policy deliberately; do not overwrite everyone during login.
3. Configure email OTP delivery/templates, Site URL, and allowed redirect URLs for the exact staging host. Verify expired/invalid OTP behavior and session refresh/logout in two browser sessions.
4. Review avatar bucket access: uploads/deletes occur through the authenticated server API. Avatars are intentionally public images, not private documents. Restrict allowed MIME types and size to PNG/JPEG/WebP, 5 MB; audit direct Storage mutation policies separately. Binary content decoding is not implemented by this patch.
5. Confirm the existing notifications Realtime publication and own-user SELECT policy on staging. Subscribe as two different users; a customer must not receive another customer's/provider's notifications. Check reconnect and dashboard refresh. Existing notification migrations are not reapplied by this audit.
6. Grant admin membership only through privileged Supabase account management. Verify anonymous, ordinary customer, provider and administrator requests independently.
7. Configure Brevo verified sender/account and send only to controlled test inboxes. Provider acceptance does not prove inbox delivery. Confirm Anthropic model availability, budgets and provider routing quotas in their respective accounts.
8. The shared request counter relies on a trusted Vercel-overwritten forwarding header. On another host, configure a trusted proxy; missing headers share the `unknown` bucket. Schedule private counter cleanup according to retention policy after observing load. The current migration does not install a cleanup job.

## Migration and rollback

New file: `supabase/migrations/20261022182617_account_booking_security.sql`.

Changes: own-record/private RLS guards; revocation of direct client mutations including legacy column grants; restricted public provider columns; duplicate registration guard; active booking request key/index; booking provider/service eligibility guard; shared rate counters; provider review actor/timestamp audit; service-role-only transactional combo RPCs. No existing rows are deleted/reclassified, and no payment table, column or function is changed.

**Risks:** locks while indexes/grants/triggers are installed; incompatibility with undocumented live columns/policies; external clients relying on now-forbidden direct writes; existing guest booking history no longer claimed by email; missing live Realtime/storage configuration. The booking eligibility trigger requires an approved provider and available service for new requests. The new application code depends on the new request-key column/RPCs. Coordinate deployment; do not ship only the application.

Apply only after a backup, schema/grant review, and approval of the actual target. The following are operator instructions, not commands executed against a remote project in this task. Configure the PostgreSQL service `evigo-staging` privately (for example in a mode-0600 `~/.pg_service.conf` plus `.pgpass`); do not paste credentials into shell history.

```bash
# From the repository, with a disposable STAGING project selected:
PGSERVICE=evigo-staging pg_dump --schema-only --no-owner --file=/secure/evigo-staging-before-audit.sql
PGSERVICE=evigo-staging psql -X -v ON_ERROR_STOP=1 --single-transaction \
  -f supabase/migrations/20261022182617_account_booking_security.sql
```

Do not run unrestricted `supabase db push`: it could apply unrelated pending payment migrations. If using Supabase CLI history, link and independently confirm the same staging project, inspect migration history, and **only after successful SQL application** record this exact version using:

```bash
npx supabase migration repair 20261022182617 --status applied --linked
```

Do not run `tests/account-database.sql` on that shared staging project: its fixture is for an empty disposable database only.

Rollback before commit is automatic when the transaction fails. After a successful deployment, prefer a forward repair and keep new security guards enabled. Preserve new request keys/audit records. Restore the previous application only after checking its compatibility with the stronger grants and booking constraints; a blind app rollback can break writes or reintroduce API vulnerabilities. If policy rollback is genuinely required, prepare a reviewed migration restoring the exact predeployment grants/policies from the protected schema backup, with affected writes paused. Do not disable RLS or grant public access as a rollback. There is intentionally no destructive automatic down migration.

## Reproduce checks locally

Verified toolchain: Node 24.21.0, npm 11.19.0, PostgreSQL 18.6; Next.js 16.4.2.

```bash
npm ci
npm run lint
npx tsc --noEmit
node --experimental-strip-types --test tests/provider-workflow.test.mjs tests/account-booking-security.test.mjs
npm audit --omit=dev
# For compilation only when no real public Supabase configuration is available:
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=public-build-fixture npm run build
```

The fixture build must not be deployed: its configuration cannot authenticate users. `npm audit` currently fails with ten high-severity findings in Firebase/shadcn dependency chains; there are zero critical findings. No major-version downgrade was applied automatically. Both payment SDK dependency trees were retained byte-for-byte at package-entry level.

SQL permission/transaction tests, **only on a fresh disposable local cluster/database**:

```bash
createdb evigo_account_regression
psql -X -v ON_ERROR_STOP=1 -d evigo_account_regression -f tests/account-database.sql
```

The fixture creates/adjusts synthetic roles, including a BYPASSRLS service role. Never run it on a production/shared database. In this sandbox the postgres OS user cannot traverse the workspace; the test runner expanded the two `\ir` includes to a temporary SQL file and piped it into local `psql` instead.

## Commit, push and Vercel

No commit, push or deployment was performed for this audit. Review all files before staging, especially if another contributor has since changed the workspace.

```bash
git switch coderabbit/razorpay-realtime-dashboard-notifications/6c2d01e8
git diff --check
git status --short
git add AGENTS.md README.md PRODUCTION_READINESS.md .github/workflows/webpack.yml \
  eslint.config.mjs package.json package-lock.json src tests \
  supabase/migrations/20261022182617_account_booking_security.sql
git commit -m "Harden nonpayment accounts, bookings and discovery" \
  -m "Co-authored-by: coderabbitai[bot] <136622811+coderabbitai[bot]@users.noreply.github.com>"
git fetch origin
git merge origin/main
if git show-ref --verify --quiet refs/remotes/origin/coderabbit/razorpay-realtime-dashboard-notifications/6c2d01e8; then
  git merge origin/coderabbit/razorpay-realtime-dashboard-notifications/6c2d01e8
fi
# Resolve conflicts preserving unrelated upstream work; rerun affected checks.
git push -u origin coderabbit/razorpay-realtime-dashboard-notifications/6c2d01e8
```

In Vercel select Node 24, the existing project/root, `npm ci` and `npm run build`. Supply actual staging public/server variables in Preview settings; preserve all existing payment configuration. Deploy the branch as Preview, then complete the multi-account test matrix before any production promotion. This document does not assert that GitHub/Vercel has built or deployed the branch.

## Remaining release gates

- Live Auth/session, role/profile creation, Storage, RLS grants/views/RPCs and Realtime verification against the actual staging schema.
- Two-account ordinary and combo booking lifecycles, concurrent submissions, reconnect/retry, email delivery, and admin approval UI tests.
- Resolve or assess the remaining dependency advisories; full accessibility/contrast and Core Web Vitals measurement have not been performed.
- Verify static hotel identities/photos/claims with partners, tourism image/source currency, and all city/transport coordinates and aliases. No precise hotel availability, dispatch or live GPS is established.
- Assess pagination beyond the current bounded discovery result set; date-specific capacity and multi-slot booking inventory are absent.
- Durable ordinary status/email notification retry; support/admin content management and local jobs remain incomplete or absent.
- Payment-dependent checkout journeys require separate authorization and validation; no payment changes are included here.
