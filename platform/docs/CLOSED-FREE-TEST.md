# Bezmaksas slēgtais tests

Updated: 2026-09-23. Current scope approved by the owner: $0 closed test only.
This is not production approval. Do not start paid plans, invite public users,
accept payments, or collect real guest photos.

## Isolation boundaries

- Keep the existing `lumiq.cam` Worker, staging Hyperdrive, staging database,
  staging bucket and DNS unchanged.
- Create a separate Supabase Free project, separate Cloudflare Hyperdrive
  configuration and separate private R2 bucket for the test. Do not restore or
  copy staging data into them.
- Deploy a separately named Worker to its `workers.dev` address only after a
  Cloudflare Access policy restricts that hostname to the owner and explicitly
  invited testers. `workers.dev` is public by default. Keep preview URLs off.
  Do not bind `lumiq.cam`, create a custom domain, change DNS/nameservers, or
  deploy the base `cloudflare/worker/wrangler.jsonc` file: it targets the
  existing staging Worker and domain.
- Do not create Render services, paid Supabase plans, Stripe resources, custom
  email, or any other paid add-on.
- Use only synthetic event names, test accounts and disposable images with
  consent. Supabase Free may pause and does not include automatic DB backups.

## Cost guardrails

“Free plan” does not mean an unconditional $0 bill. R2 usage above its free
allocation is metered, and account-level budget alerts are not hard caps. Keep
the test tiny and verify the Cloudflare account's current R2 usage before and
after it. Do not enable uploads until an application-side aggregate byte and
operation ceiling has been implemented and tested against retries and all
upload/read/export routes. If those limits cannot be proven, test auth and UI
without uploading to cloud storage.

Cloudflare Workers Free has hard daily request/CPU limits; exceeding them may
make the test unavailable. Supabase Free has database/storage quotas and
availability limitations. Review the current provider dashboards before
creating resources. Never upgrade a plan just to get past a quota prompt.
Hyperdrive is included on Workers Free for up to 100,000 database queries per
day; over-limit queries fail until the daily reset. Keep the test within that
limit.

## Provisioning sequence

1. Owner creates a new Supabase Free project in their authenticated account.
   Record its project reference privately. Do not send database passwords or
   keys in chat.
2. From a local PowerShell terminal at the repository root, run the checked-in
   forward migrations against only this new project's SSL database URL. This
   Windows/Node workstation could not resolve the new project's IPv6-only
   Direct host, so use Supabase **Connect → Session pooler** on port 5432.
   Copy the full Session pooler URI (username `postgres.<project-ref>`). Do not
   use Transaction pooler on port 6543. The script displays the project
   reference parsed from the URI and requires you to type only that reference
   at the confirmation prompt. Do not include `postgres.` or the pooler host.
   A blank or incomplete connection URI is rejected before any database access.
   Enter the connection URL only into the hidden terminal prompt below, never
   into chat, a file, or a screenshot:

   ```powershell
   .\platform\scripts\migrate-new-test.ps1
   ```

   The owner reran this script and verified `001-platform` through
   `006-r2-usage-guard`, RLS on all 17 protected tables, and no SELECT access
   for `anon` or `authenticated`. The output confirmed no MVP migration ran.
   The script clears temporary environment variables even if migration fails.
   Do not run MVP-specific SQL.
3. Create the restricted application DB login after migrations:

   ```powershell
   .\platform\scripts\provision-test-db-role.ps1
   ```

   Enter the same project's `postgres` admin URL in the hidden prompt and
   confirm the displayed project reference. At the second hidden prompt enter a
   random, URL-safe password of at least 32 characters from your password
   manager; keep it there for Hyperdrive configuration. The script creates
   `lumiq_runtime` with `BYPASSRLS` because the platform tables have RLS enabled
   without client policies. It grants only CRUD on public tables and future
   tables created by `postgres`; the login cannot create databases, roles,
   schemas or own tables. Keep its credential server-side only.
4. A separate Hyperdrive named `lumiq-closed-test` now exists. The authenticated
   Wrangler listing verified the test project's Session pooler host on port
   5432, database `postgres`, user `lumiq_runtime.<project-ref>`, caching
   disabled, and origin connection limit 5. Its ID is kept only in the ignored
   local Worker config. An owner-authenticated `/healthz` request later
   returned `database: ready`, confirming a query through the test Hyperdrive.
   Do not edit or reuse the existing staging Hyperdrive. The separate
   `lumiq-closed-test-photos` bucket
   is empty; keep it private and do not enable `r2.dev`.
5. The owner's Cloudflare account shows the `gkarans-events.workers.dev`
   subdomain. The git-ignored `cloudflare/worker/wrangler.closed-test.jsonc`
   now uses `https://lumiq-closed-test.gkarans-events.workers.dev` as
   `PLATFORM_ORIGIN`, with the test Hyperdrive ID and test bucket. Keep
   `workers_dev: true`, `preview_urls:
   false`, no `routes`, the unique Worker name, and staging mode/approval pair.
   It must bind only the test Hyperdrive and test bucket. Never inherit or copy
   the public domain, staging IDs, or bucket. Wrangler dry-run resolved the
   bindings and read all 65 built assets without deploying.
6. The owner created the Cloudflare Access self-hosted application
   `Lumiq Closed Test` for `lumiq-closed-test.gkarans-events.workers.dev`,
   with the `Lumiq closed test - owner` allow policy. After deployment, an
   anonymous `GET /` and `GET /healthz` returned HTTP 302; `/healthz` included
   a `Www-Authenticate: Cloudflare-Access` header and redirected to the
   account's Access login on 2026-09-23. This verifies the website entry and
   health route are gated before the Worker runs. The owner then opened
   `/healthz` through Access and received
   `{"status":"ok","service":"lumiq-cam","database":"ready","storage":"bound"}`.
   After version `636cb1e2-2e0e-49d3-914e-47f335f0239f` was deployed, the owner
   rechecked `/healthz` through Access and confirmed `database: ready` and
   `storage: bound`. This verifies Worker startup/migration checks and a query
   through the test Hyperdrive; it does not prove staging-data isolation. Keep
   only the owner and explicitly invited tester emails in the allow policy.
   Cloudflare's Access Free plan covers up to 50 users; do not upgrade if the
   dashboard offers a paid plan.
7. Add the new project's Supabase URL and publishable key and a newly generated
   session encryption key as Worker secrets for the closed-test Worker only.
   Keep all secrets out of the repository and chat. The session encryption
   key, Supabase URL and publishable key are configured. The owner verified
   authenticated health and database readiness on 2026-09-23; the endpoint
   returned `status: ok`, `database: ready`, and `storage: bound`.
8. Build and deploy only with the separate test config, for example:

   ```powershell
   npm run build
   npx wrangler deploy --config cloudflare/worker/wrangler.closed-test.jsonc
   ```

   The separate Worker was deployed on 2026-09-23. Wrangler's first version
   `63aed221-8446-448a-bb40-46ddb503d10f` bound only the test Hyperdrive, test
   R2 bucket and static assets. The session-secret update created version
   `3a9efb3f-2bba-49b1-a24c-0dd1e7c3d717`. The session-key and Supabase-URL
   secret updates created versions `762163c4-d8c6-436f-bd07-d9c4bc7fc569`,
   `a51b9cf7-5f7a-4d46-b115-beef2518e8cc` and
   `6d2820c4-619e-46a6-8aee-49f3dab6139c`. After local full checks and a
   closed-test-only dry run, version `636cb1e2-2e0e-49d3-914e-47f335f0239f`
   was deployed at 20:30 UTC on 2026-09-23 and is at 100%. The deployment
   bindings showed only the test Hyperdrive and R2 bucket, with the R2 budget
   guard enabled. Anonymous `/` and `/healthz` still return Access 302 after
   deployment. The owner rechecked authenticated `/healthz` on this version
   and confirmed the draft event `Balle` remained available after returning to
   the app. A code audit confirmed the Worker passes configured
   `PLATFORM_ORIGIN` into Supabase Auth and the closed-test config uses only the
   test `workers.dev` origin. The local Supabase adapter regression suite passed
   14/14 tests on 2026-09-23, including signup, password-reset and OAuth redirect
   construction from the supplied origin. Supabase's actual redirect allowlist,
   email templates, live recovery/OAuth flows and staging-data isolation remain
   unverified.
9. Initially test registration, login, event creation, guest page and QR with
   no cloud photos. The Worker R2 adapter now has an app-side monthly operation
   ceiling and lifetime write-byte ceiling, including Class A object deletion;
   local tests cover concurrent reservations, normal photo/object paths and
   bounded streaming exports. The focused Worker R2 adapter suite passed 5/5
   tests on 2026-09-23. This is local adapter evidence only, not a live R2
   upload/read/delete integration check. This guard is now deployed in version
   `636cb1e2-2e0e-49d3-914e-47f335f0239f`. The owner has rechecked
   authenticated health and basic event persistence. The owner reviewed
   account-level R2 usage and explicitly authorized one synthetic photo test.
   A disposable event named `Synthetic R2 Upload Test 2026-09-23` was created
   and published on 2026-09-23; publication consumed the sole remaining
   Explore allowance. Its organizer gallery still reported 0 photos after a
   refresh, so the guest photo flow is not verified. The test event is live
   until 2026-09-24 00:15 Europe/Riga. Do not use `Balle` for the photo test.
   Read-only Wrangler bucket info on 2026-09-23 initially showed
   `lumiq-closed-test-photos`: 0 objects / 0 B and
   `lumiq-staging-photos`: 11 objects / 502 kB. These are per-bucket counts;
   they do not establish account-wide storage or Class A/B operation usage.
   The owner dashboard screenshot for `lumiq-closed-test-photos`, last 24 hours
   on 2026-09-23, showed average storage 0 B, data retrieved 0 B, 3 Class A
   operations, 12 Class B operations and request distribution 9. This is a
   one-bucket 24-hour baseline only, not the account/month total.
   A later owner screenshot for the same bucket with **Last 30 days** selected
   showed average storage 0 B, data retrieved 0 B, 5 Class A operations,
   15 Class B operations and request distribution 9. This remains per-bucket
   data. The same screenshot's Class A/B chart legends showed 0, conflicting
   with the summary cards; treat those operation counts as provisional until
   reconciled.
   The owner then provided the R2 account Overview screenshot for the current
   billing period, 2026-09-12 through 2026-10-12: total storage 34.62 MB,
   account Class A 378, Class B 1.13k, and billable usage `$0.00`. Its inventory
   listed `app-images` 116 objects / 34.11 MB, `lumiq-closed-test-photos` 0 / 0,
   `lumiq-staging-photos` 11 / 501.9 kB, and EU `lumiq-staging-photos` 0 / 0.
   A separate Last 30 days screenshot for the staging bucket showed average
   storage 501.9 kB, data retrieved 0 B, 48 Class A operations, 72 Class B
   operations and request distribution 28. Its chart legends also showed 0,
   inconsistent with the summary cards. The account Overview is the
   account-level baseline for that billing period; per-bucket operation cards
   remain provisional. A later read-only Wrangler check and Cloudflare
   dashboard inspection on 2026-09-23 showed the test bucket now has 2 objects
   / 144.71 kB. The object browser identifies both under the `Balle` event:
   one WebP in `covers/` (45.6 kB, modified 23:21 Riga time) and one WebP in
   `qr/` (99.06 kB, modified 23:20). These are saved design assets, not guest
   photos; the dashboard showed no `photos/` objects, and both the `Balle` and
   synthetic-test event galleries reported 0 photos. The latest account
   Overview still shows 34.62 MB total storage and `$0.00` billable usage;
   Class A rose from 378 to 388, while Class B remains 1.13k. No guest photo
   upload has been completed or verified. Preserve the two Balle design
   assets; do not delete them as part of the synthetic photo test.
   On 2026-09-24, the authorized synthetic guest upload attempt was rejected:
   the browser showed `0 uploaded · 1 need attention`, and DevTools recorded
   `POST /api/guest/<slug>/reserve` returning HTTP 409. The UI reported that
   the event had reached its photo or storage allowance; the organizer gallery
   remained at `0 of 0`. Code inspection confirms the reservation check counts
   both `pending` and `uploaded` media against the event's photo and byte
   entitlement. A read-only database query found no `pending` or `uploaded`
   media rows. A follow-up read-only query on 2026-09-24 confirmed both
   `events.entitlement` and `event_publications.entitlement` have
   `jsonb_typeof(...) = 'string'`, although their displayed contents are
   serialized plan objects; consequently `->>'id'`, `->>'photos'` and
   `->>'bytes'` return null. The root cause was JSONB parameters receiving
   `JSON.stringify(object)` through `postgres.js`, which stores a JSON string
   scalar instead of an object. Application JSONB writes now pass structured
   values directly. Added forward migration `007-jsonb-parameter-encoding`
   unwraps historical object/array JSON strings across JSONB columns. A focused
   local regression test passed: it verifies new trial entitlements are JSON
   objects, repairs a simulated legacy scalar, then confirms a trial guest
   upload reservation succeeds. On 2026-09-24, the owner ran the isolated
   migration script and it verified `007-jsonb-parameter-encoding` alongside
   migrations 001-006 on the closed-test database. The closed-test-only Worker
   was deployed as version `f5f4c65d-446f-49a4-a48c-9d1716d73d4e`; Wrangler
   reported only the separate test Hyperdrive and `lumiq-closed-test-photos`
   bindings. After reloading the existing guest page, it reported that uploads
   had ended: the synthetic event's scheduled end was 2026-09-24 00:15
   Europe/Riga. No retry was sent and no guest photo is completed or verified.
   The single Explore publication slot is already consumed, so do not create
   another event, alter the expired event directly, or use `Balle` for this
   test. A fresh live upload test needs an owner-approved event allowance and
   a valid future event window.
   Local release checks on 2026-09-24 then passed: `npm test` (74/74),
   `npm run build` (60 public files), `npm run security` (160 tracked files,
   zero reported vulnerabilities), `npm run browser` (responsive journeys
   through accessibility), and Wrangler `--dry-run` with only the ignored
   closed-test config. The upload reservation test is local evidence only; the
   live R2 upload has not completed.

## Not yet ready to deploy

- The owner created a separate Supabase Free project. The latest migration
  script output verified versions `001-platform` through `007-jsonb-parameter-encoding`,
  RLS on 17 tables, denied `anon`/`authenticated` SELECT, and confirmed no MVP
  migration ran. Project identifiers and connection credentials are
  intentionally not copied into this repository.
- A previous Direct-host attempt failed at Node DNS resolution (`ENOTFOUND`);
  the later Session-pooler migration run completed. Do not rerun migrations
  unless the version/access checks show a missing migration.
- The owner reports `lumiq_runtime` was created and passed the provisioning
  script's privilege checks. A separate Hyperdrive targets that role, and the
  owner-authenticated `/healthz` verified its query path. Do not point
  Hyperdrive at the `postgres` admin role.
- A separate `lumiq-closed-test-photos` R2 bucket has been created and verified
  in the authenticated Cloudflare account. It now contains only two verified
  Balle design objects (`covers/` and `qr/`); no guest photo is present. A
  separate synthetic test event was published and consumed the sole remaining
  Explore allowance, but its gallery remains at 0 photos. The test Hyperdrive
  is configured with caching disabled and a
  five-connection origin limit. The ignored local Worker config binds it and
  the separate test bucket; Wrangler dry-run passed. The base Worker config is
  staging-only and must not be reused.
- The exact test `workers.dev` origin is configured and the separately named
  Worker is deployed. An anonymous request was confirmed to redirect to
  Cloudflare Access before reaching Worker code. The hostname Access
  application and owner allow rule are visible in the owner's dashboard. After
  Worker version `636cb1e2-2e0e-49d3-914e-47f335f0239f` was deployed, the owner
  rechecked `/healthz` through Access and confirmed database/storage readiness;
  the owner also confirmed draft event `Balle` persisted after returning to
  the app. Code-side Auth redirect checks passed 14/14 locally and use the
  configured test origin; the Supabase dashboard allowlist, email templates,
  live recovery/OAuth and staging-data isolation remain unverified.
- `PLATFORM_SESSION_ENCRYPTION_KEY`, `PLATFORM_SUPABASE_URL` and
  `PLATFORM_SUPABASE_PUBLISHABLE_KEY` are configured as Worker Secrets. The
  owner verified `/healthz` through Access and the Supabase/Hyperdrive query
  succeeded. Continue with test-only Auth and synthetic event checks; first
  verify requests cannot reach staging data. No photos have been uploaded.
- R2 operation and lifetime-byte limits are implemented in the Worker adapter
  and pass local tests; the guard is deployed in Worker version
  `636cb1e2-2e0e-49d3-914e-47f335f0239f`. Anonymous Access still blocks both
  `/` and `/healthz`. The owner confirmed authenticated health on that version.
  Account-level R2 usage has been rechecked: 34.62 MB total storage, `$0.00`
  billable usage, 388 Class A and 1.13k Class B for the current billing period.
  The test bucket has 2 design objects / 144.71 kB under Balle, not photos;
  staging remains at 11 objects / 501.9 kB. The JSONB fix is now deployed in
  Worker version `f5f4c65d-446f-49a4-a48c-9d1716d73d4e`; reloading its synthetic
  guest page showed that event had ended at 00:15 Europe/Riga, before a retry
  could be made. It remains at 0 guest photos, so the authorized photo test is
  not complete. The Explore publication allowance has already been consumed;
  do not create or publish another test event without fresh owner authorization.
- A closed test does not satisfy the production release gates in
  `LAUNCH-GATES.md`; production still requires a separate owner approval and
  verified infrastructure, backup/restore, security, reliability and legal
  gates.
