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
   the app. Still verify auth callbacks use only the test URL and requests
   cannot reach staging data.
9. Initially test registration, login, event creation, guest page and QR with
   no cloud photos. The Worker R2 adapter now has an app-side monthly operation
   ceiling and lifetime write-byte ceiling, including Class A object deletion;
   local tests cover concurrent reservations, normal photo/object paths and
   bounded streaming exports. This guard is now deployed in version
   `636cb1e2-2e0e-49d3-914e-47f335f0239f`. The owner has rechecked
   authenticated health and basic event persistence. Cloud photo upload
   remains closed until the test account's aggregate R2 usage is reviewed and
   the owner explicitly starts a tiny synthetic upload test. Record provider
   usage before and after it.

## Not yet ready to deploy

- The owner created a separate Supabase Free project. The latest migration
  script output verified versions `001-platform` through `006-r2-usage-guard`,
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
- A separate empty `lumiq-closed-test-photos` R2 bucket has been created and
  verified in the authenticated Cloudflare account. No test objects have been
  uploaded. The test Hyperdrive is configured with caching disabled and a
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
  the app. Auth recovery and staging-data isolation are still unverified.
- `PLATFORM_SESSION_ENCRYPTION_KEY`, `PLATFORM_SUPABASE_URL` and
  `PLATFORM_SUPABASE_PUBLISHABLE_KEY` are configured as Worker Secrets. The
  owner verified `/healthz` through Access and the Supabase/Hyperdrive query
  succeeded. Continue with test-only Auth and synthetic event checks; first
  verify requests cannot reach staging data. No photos have been uploaded.
- R2 operation and lifetime-byte limits are implemented in the Worker adapter
  and pass local tests; the guard is deployed in Worker version
  `636cb1e2-2e0e-49d3-914e-47f335f0239f`. Anonymous Access still blocks both
  `/` and `/healthz`. The owner confirmed authenticated health on that version.
  Inspect aggregate R2 usage before any cloud photo test. No photo test has
  been run.
- A closed test does not satisfy the production release gates in
  `LAUNCH-GATES.md`; production still requires a separate owner approval and
  verified infrastructure, backup/restore, security, reliability and legal
  gates.
