# Cloudflare Production Cutover

Status: procedure only. Production resources and public-domain changes are not
approved or provisioned. This is not a deployment instruction for today.

## Non-negotiable boundary

The active `lumiq-cam` Worker and `lumiq.cam` currently use staging resources.
Do not use the checked-in `cloudflare/worker/wrangler.jsonc` to deploy new
code: it targets that live staging Worker and its data. Keep production
resources in a separate, owner-controlled configuration and secret set.

Cloudflare Worker versions include code, assets, bindings and compatibility
settings. A percentage rollout between a staging version and a production
version would send requests to different databases/buckets; do not do this for
Lumiq. Test candidate code against isolated production resources on a separate
Worker behind Access, then switch the domain once. A version-level rollback
restores code/config across routes, but does not rewind database or object
storage data. Never roll production traffic back to a version bound to staging.

## Owner's two-phase launch decision

The owner has deferred paid production resources until after `lumiq.cam` has
transitioned and the company is registered. Treat these as separate
milestones, not permission to expose the current staging-backed Worker publicly:

1. A pre-company domain transition, if separately approved, is only a closed
   pilot. It must use isolated test resources, synthetic data, disabled public
   registration/payments, and a verified Cloudflare Access allowlist. Test the
   Access gate in a private browser session before moving the hostname. If
   Access cannot be proven to cover every route and asset, do not point the
   domain at the candidate; continue on the existing closed-test hostname.
2. After company registration and a fresh cost review explicitly approved by
   the owner, provision separate paid production resources and complete every
   production gate below before opening the service to customers.

The existing staging-backed `lumiq-cam` Worker is not an acceptable public
production target. A domain move by itself does not turn staging into
production, and this procedure does not authorize changing the live domain.

## Before a cutover can be scheduled

All applicable gates in `LAUNCH-GATES.md` must have dated evidence and owner
approval. In addition:

1. Create a production Supabase project, restricted runtime role, Hyperdrive
   config and private R2 bucket. Verify their account/project/bucket identities
   independently. Production must not share the staging database, R2 bucket,
   auth project, credentials or Access policy.
2. Configure production-only secrets in an isolated candidate Worker. Keep
   `lumiq-cam` and its staging secrets/bindings unchanged during candidate
   testing. Give the candidate a distinct Worker name, `workers.dev` hostname,
   no custom domain, and an Access allowlist limited to the owner/testers.
   Before deployment, run `npx wrangler hyperdrive list` and pass the current
   closed-test Hyperdrive ID to `npm run production:preflight -- <production-config.jsonc> --closed-test-hyperdrive-id=<id>`.
   The preflight checks static binding names and declared Auth/database project
   reference consistency, then queries Cloudflare's read-only Hyperdrive config
   and compares its remote Supabase origin to the declared project reference.
   It does not prove Cloudflare Access policy, TLS, secret values, or that the
   configured R2/Queue resources exist. Use
   `npx wrangler deploy --dry-run --config <production-config.jsonc>` and
   independently verify every displayed binding before any deployment. Keep
   this JSONC file valid JSON syntax (no comments) while using the current
   preflight script.
3. Apply reviewed forward migrations to the production DB only after a fresh
   verified backup and restore drill. Confirm checksums, RLS, runtime-role
   grants and the expected migration manifest. Never apply the platform MVP
   schema to a legacy database.
4. Test registration, email confirmation, login, reset, email change, session
   refresh, organizer isolation, signed upload, private reads, sharing revoke,
   automatic event-end ZIP, retention cleanup, alerts and support on the
   candidate using synthetic data. Verify every write lands only in production
   resources. Clean test data through the application's retention process.
5. Rehearse recovery from the verified backup into an empty isolated target.
   Record object checksums, DB counts, ZIP manifest, recovery time and the
   operator who verified it. A successful backup command alone is insufficient.
6. Prepare and independently verify the exact production `PLATFORM_ORIGIN`,
   Supabase Site URL/redirect allowlist, Worker mode/approval pair, R2 limits,
   error alerts, cost alerts and support contact. Set the non-secret
   `PLATFORM_SUPABASE_PROJECT_REF` to the project verified from the production
   Hyperdrive origin; it must match the Supabase Auth URL. No wildcard auth
   redirects.
7. Record the current `lumiq-cam` version, staging resource IDs, domain/TLS
   state, and the chosen no-staging rollback/maintenance response. Do not
   proceed if the response would expose staging data to production users.

## Cutover window

Schedule a low-traffic window and have one operator execute while another
checks the evidence. Warn testers that the site may briefly be unavailable.

1. Pause new uploads and publication on the candidate. Take a final production
   DB backup and R2 inventory/checksum manifest. Verify both are readable.
2. Confirm candidate deployment is the intended release and still binds only
   production DB/R2. Re-read Worker mode/approval and all production secrets;
   do not paste secret values into logs, chat or screenshots.
3. Set Supabase Site URL and exact allowed redirects to `https://lumiq.cam`.
   Set the candidate's canonical origin to `https://lumiq.cam`. Do not send
   auth emails during the interval while the root domain still reaches staging.
4. Remove the existing `lumiq.cam` Custom Domain association from the staging
   Worker, then attach the domain to the already-tested production candidate in
   Cloudflare. Do not change Namecheap nameservers or add guessed DNS records;
   Cloudflare Custom Domains manages its DNS record and certificate.
5. Confirm the production Worker is the sole owner of `lumiq.cam`, TLS validates
   without bypasses, and production `GET /healthz` reports the expected ready
   state. Confirm the closed-test hostname remains Access-protected.
6. Run a controlled production smoke: operator login, reset-link destination,
   create/publish a disposable event, upload one generated image, confirm
   gallery and ZIP, revoke sharing, and confirm cross-account denial. Verify
   DB/R2 object IDs match the production resources. Do not use real guest photos.
7. Keep registration/invites closed until smoke evidence, logs, R2 operations,
   DB health and alert delivery are reviewed. Then the owner explicitly decides
   when to open registration and announce the service.

## Rollback / containment

### Before any real customer writes

If the smoke test fails, stop new writes. The pre-cutover `lumiq-cam` version
may be restored to the domain only while the app is still a closed test and no
production customer data has been accepted. The production DB/R2 remain intact;
do not copy them into staging. Correct the candidate and repeat all failed
checks before another cutover.

### After production data exists

Do not reattach the staging Worker, and do not roll back to a version whose
bindings or secrets point at staging. First contain access (disable registration
and uploads or restrict the hostname to the operator), preserve logs and take
a fresh production backup. Roll back only to a separately tested,
production-compatible Worker version that is still bound to the production
resources and supports the current additive DB schema; otherwise fix forward
while access is contained. Worker rollback does not restore DB/R2 state.

For a later production release, record the exact known-good production version
ID and rehearse that same-backend rollback before promotion. Use Wrangler's
version/deployment commands only after confirming the Worker name and current
production bindings:

```powershell
npx wrangler deployments list --name <production-worker-name>
npx wrangler rollback <known-good-production-version-id> --name <production-worker-name> --message "Lumiq production rollback"
```

After rollback, verify the active deployment ID, production health, login,
existing event/gallery access, one synthetic upload and R2/DB error rates.
Never assume a rollback restores external resources or user data.

## Cloudflare behavior references

- [Worker versions and deployments](https://developers.cloudflare.com/workers/versions-and-deployments/)
- [Version overrides and zero-percent smoke tests](https://developers.cloudflare.com/workers/versions-and-deployments/version-overrides/)
- [Worker rollback behavior](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)
- [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
