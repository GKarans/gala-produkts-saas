# Production cost plan

Updated: 2026-09-23. Owner's current decision: free closed test only. No paid
plan is approved. The earlier EUR 60/month ceiling is not authorization to
spend. This document update creates or changes no cloud resources.

## Current deployment facts

- The current `lumiq.cam` Worker is explicitly configured as staging and uses
  the `lumiq-staging-photos` bucket and the existing staging Hyperdrive binding.
- Production must use a fresh Supabase project and a separate private R2
  bucket. Staging data is not to be copied into production.
- The owner created a separate Supabase Free test project. The owner has since
  applied and verified migrations `001-platform` through `006-r2-usage-guard`,
  RLS on all 17 protected tables, denied anon/authenticated SELECT, and the
  restricted `lumiq_runtime` database role. No MVP migration was run. This
  closed-test project must not be described as production, and no staging
  records are to be copied into it.
- Supabase account access is not available in the local environment, and the
  Supabase CLI is not installed. The owner must enter the new project's
  database URL into the hidden local migration prompt. Never put secret keys in
  chat or source control.
- Until the closed-test Hyperdrive/Worker integration and access policy are
  deployed and verified, do not invite testers or upload any photos to cloud
  storage. Then use only synthetic test events and disposable, consented test
  images; Supabase Free may pause and has no automatic database backups.
- Worker uploads already pass through the Worker API (`uploadsViaApi: true`);
  browser clients do not receive direct R2 credentials or signed PUT targets.
- The Worker R2 adapter implements application-side operation and lifetime
  write-byte ceilings, with local tests for concurrent reservations, normal
  object paths and bounded streaming exports. These controls have not yet been
  verified in a deployed test Worker or against aggregate Cloudflare account
  usage; cloud photo uploads remain gated off until both checks pass.

## Lowest practical production candidate

| Service | Candidate | Price basis | Production caveat |
|---|---|---|---|
| PostgreSQL/Auth | One fresh Supabase Pro project, Micro compute | USD 25/month, about EUR 21.91 at the ECB rate on this document's date, before tax/FX. The Pro plan includes USD 10 compute credits, enough for one Micro project. | Keep Micro and spend cap; compute and some add-ons are not covered by the cap. Check the actual organization invoice estimate before creating the project. |
| App/API/static assets | Existing Cloudflare Worker, Workers Free | USD 0 | 100,000 Worker requests/day, 10 ms CPU per invocation and 100,000 Hyperdrive queries/day; excess free-tier use fails rather than becoming paid overage. Production smoke tests must establish that the app fits these limits. |
| Private photo objects | New private R2 Standard bucket | USD 0 only within 10 GB-month, 1 million Class A and 10 million Class B operations/month; egress is free. | Usage beyond free allocations is metered. An application-enforced aggregate storage/operation ceiling and account-level usage check are required before real guest uploads. |
| Transactional email | Defer custom sender decision; use no paid add-on initially | USD 0 candidate | Verify Supabase Auth delivery limits and recovery flow before inviting real organizers. |

The estimated fixed baseline for the candidate is USD 25/month (about EUR
21.91 before tax and payment conversion). This is not a guarantee that the
entire bill stays below EUR 60: R2 overages, any extra Supabase compute/project,
tax, FX fees, and existing account-level subscriptions/usage are not included.
Cloudflare budget alerts are informational, not a billing hard stop. Supabase's
spend cap excludes compute and explicitly selected add-ons.

## Free-only alternative

Supabase Free costs USD 0, but is not the recommended service for real guest
photos: projects may pause after a week of inactivity, include no automatic DB
backups, and have a 500 MB database limit. It is suitable only for a closed,
disposable test where data loss and downtime are accepted, not the intended
production launch.

### Current decision and next step

- [x] Owner declined the USD 25/month Supabase Pro option for now.
- [x] Current scope is a free closed test only; no public launch, paying
      customers, or real guest-photo collection.
- [x] Owner created a separate Supabase Free project. Keep staging untouched
      and do not copy its data.
- [x] Apply and verify the isolated platform schema on the new test project;
      verify all six expected migrations, RLS and denied anon/authenticated
      SELECT. The successful rerun may emit a harmless `platform_migrations
      already exists, skipping` notice.
- [x] Provision and verify the restricted test runtime DB role. Its password
      remains local to the owner and must only be configured as a server-side
      secret.
- [x] Create a separate empty `lumiq-closed-test-photos` R2 bucket. No objects
      have been uploaded.
- [x] Create the separate closed-test Hyperdrive with caching disabled and
      origin connection limit 5; prepare the ignored test Worker config. A
      Wrangler dry-run resolved its Hyperdrive and R2 bindings.
- [x] Verify active Cloudflare Access for the exact test `workers.dev` host,
      set `PLATFORM_ORIGIN`, then deploy the separate test Worker. An anonymous
      `/healthz` request redirected to Access before Worker execution. Keep
      staging Hyperdrive, Worker, bucket and DNS untouched.
- [ ] Configure the test environment using local secrets (never commit them),
      then verify Hyperdrive DB access, Auth, storage controls and core journeys.
- [ ] Before any real launch, return to the owner with the exact current cost
      estimate and request explicit approval for recurring charges.

## Required cost gates

- [ ] Before paid production, owner approves the exact recurring Supabase plan
      after seeing the current organization-level estimate and confirms whether
      EUR 60 includes any existing staging/account costs.
- [ ] Keep the Worker on Free only if target-environment organizer, guest,
      upload, gallery, QR and export journeys pass under its CPU/query limits;
      otherwise stop and present the USD 5/month Worker Paid alternative.
- [ ] Measure current Cloudflare account R2 consumption. Set a production
      aggregate byte/object and operation budget below the available free
      allocation; fail new uploads closed before the cap.
- [ ] Verify the R2 application-side ceilings on the deployed closed-test
      Worker and compare them with live account-level R2 usage before enabling
      even test photo uploads. Local tests alone do not satisfy this gate.
- [ ] Verify every R2 write/read path, including cover replacement and export
      generation/download, is subject to the same meter and retries cannot
      bypass it.
- [ ] Set billing notifications, but do not treat notifications as a hard cap.
- [ ] Record the first month's actual database, Worker, R2, email and payment
      costs before raising product photo limits or inviting more customers.

## Pricing references

- [Supabase plans and included compute credits](https://supabase.com/pricing)
- [Supabase cost-control exclusions](https://supabase.com/docs/guides/platform/cost-control)
- [Cloudflare Workers pricing and Hyperdrive limits](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare Workers Free request/CPU limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare R2 pricing and free tier](https://developers.cloudflare.com/r2/pricing/)
- [ECB reference rates, 23 September 2026](https://www.ecb.europa.eu/stats/shared/pdf/eurofxref.pdf)
