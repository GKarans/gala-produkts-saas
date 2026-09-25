# Production cost plan

Updated: 2026-09-25. Owner's current decision: free closed test only. No paid
plan is approved. The earlier EUR 60/month ceiling is not authorization to
spend. The owner wants paid production resources connected only after the
`lumiq.cam` transition and company registration. A pre-company domain handoff,
if performed, must remain a closed pilot behind Access on isolated test data;
it is not production. This document update creates or changes no cloud
resources.

## Current deployment facts

- The current `lumiq.cam` Worker is explicitly configured as staging and uses
  the `lumiq-staging-photos` bucket and the existing staging Hyperdrive binding.
- Production must use a fresh Supabase project and a separate private R2
  bucket. Staging data is not to be copied into production.
- The owner created a separate Supabase Free test project. The owner has since
  applied and verified migrations `001-platform` through
  `011-queue-job-dispatch`, RLS on all 17 protected tables, denied
  anon/authenticated SELECT, and the
  restricted `lumiq_runtime` database role. No MVP migration was run. This
  closed-test project must not be described as production, and no staging
  records are to be copied into it.
- Supabase account access is not available in the local environment, and the
  Supabase CLI is not installed. The owner must enter the new project's
  database URL into the hidden local migration prompt. Never put secret keys in
  chat or source control.
- The closed-test Hyperdrive/Worker and Access boundary are deployed. A
  synthetic photo upload, photographer-folder R2 layout, old synthetic-photo
  cleanup and one automatic ZIP were verified on 2026-09-25. This is closed
  test evidence only; use only synthetic events and disposable, consented
  images. Supabase Free may pause and has no automatic database backups.
- Worker uploads already pass through the Worker API (`uploadsViaApi: true`);
  browser clients do not receive direct R2 credentials or signed PUT targets.
- The Worker R2 adapter implements application-side operation and lifetime
  write-byte ceilings, with local tests for concurrent reservations, normal
  object paths and bounded streaming exports. R2 budget enforcement is enabled
  in the closed-test Worker, and a synthetic photo/thumbnail plus one automatic
  ZIP were successfully written there. The test does not prove aggregate
  account-level usage attribution or production load/overage behavior; retain
  synthetic-only uploads until those checks are complete.

## Lowest practical production candidate

| Service | Candidate | Price basis | Production caveat |
|---|---|---|---|
| PostgreSQL/Auth | One fresh Supabase Pro project, Micro compute | USD 25/month, about EUR 21.99 at the 2026-09-24 ECB reference rate, before tax/FX. The Pro plan includes USD 10 compute credits, enough for one Micro project. | Keep Micro and spend cap; compute and some add-ons are not covered by the cap. Check the actual organization invoice estimate before creating the project. |
| App/API/static assets | Cloudflare Workers Paid for the modeled maximum-use Studio service | USD 5/month account minimum | Workers Paid includes 10M dynamic requests and 30M CPU-ms/month; excess is metered, with no bandwidth egress charge. Hyperdrive has no separate Paid-plan fee. At 100 Studio accounts using all limits and 100 full-size views per photo, the model is about 120M image requests/month (about 4M/day) before uploads and other app requests, far above the Workers Free 100,000/day ceiling. Workers Free is only a strictly limited pilot option after measured traffic proves it fits. |
| Private photo objects | New private R2 Standard bucket | USD 0 only within 10 GB-month, 1 million Class A and 10 million Class B operations/month; egress is free. | Usage beyond free allocations is metered. An application-enforced aggregate storage/operation ceiling and account-level usage check are required before real guest uploads. |
| Transactional email | Defer custom sender decision; use no paid add-on initially | USD 0 candidate | Verify Supabase Auth delivery limits and recovery flow before inviting real organizers. |

For the maximum-use production candidate, the minimum fixed baseline is USD
30/month (Supabase Pro USD 25 plus Workers Paid USD 5; about EUR 26.39 at the
ECB reference rate in `BREAK-EVEN-PRICING.md`, before tax and payment conversion).
This is not a guarantee that the entire bill stays below EUR 60: R2 overages,
email, extra Supabase compute/projects, tax, FX fees, backups and existing
account-level subscriptions/usage are not included. Cloudflare budget alerts
are informational, not a billing hard stop. Supabase's spend cap excludes
compute and explicitly selected add-ons.

Cloudflare Queues include 1M operations/month on Workers Paid; the capacity
model's 9,600 monthly archive/job messages are about 28,800 normal operations
before retries, so Queue metering is estimated at USD 0 at that volume. Retries,
large messages and actual deployment usage still need measurement.

## Free-only alternative

Supabase Free costs USD 0, but is not the recommended service for real guest
photos: projects may pause after a week of inactivity, include no automatic DB
backups, and have a 500 MB database limit. It is suitable only for a closed,
disposable test where data loss and downtime are accepted, not the intended
production launch.

### Current decision and next step

- [x] Owner declined the USD 25/month Supabase Pro option for now.
- [x] Owner decision: defer paid production resources until after `lumiq.cam`
      has been transitioned and the company is registered. This does not
      authorize spending or public production use of test resources.
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
- [x] Create a separate private `lumiq-closed-test-photos` R2 bucket. Synthetic
      closed-test objects were uploaded and the disposable legacy test-photo
      pairs were later deleted; this bucket is not empty.
- [x] Create the separate closed-test Hyperdrive with caching disabled and
      origin connection limit 5; prepare the ignored test Worker config. A
      Wrangler dry-run resolved its Hyperdrive and R2 bindings.
- [x] Verify active Cloudflare Access for the exact test `workers.dev` host,
      set `PLATFORM_ORIGIN`, then deploy the separate test Worker. An anonymous
      `/healthz` request redirected to Access before Worker execution. Keep
      staging Hyperdrive, Worker, bucket and DNS untouched.
- [ ] Configure the test environment using local secrets (never commit them),
      then verify Hyperdrive DB access, Auth, storage controls and core journeys.
- [ ] After company registration and the controlled `lumiq.cam` transition,
      return with current itemized estimates and obtain explicit approval
      before creating any paid production resource or subscription.

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
- [Cloudflare Hyperdrive pricing](https://developers.cloudflare.com/hyperdrive/platform/pricing/)
- [Cloudflare Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/)
- [Cloudflare Workers Free request/CPU limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare R2 pricing and free tier](https://developers.cloudflare.com/r2/pricing/)
- [ECB reference rates, 23 September 2026](https://www.ecb.europa.eu/stats/shared/pdf/eurofxref.pdf)
