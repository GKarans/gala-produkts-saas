# Cloudflare Worker deployment safety

The legacy `lumiq-cam` Worker, its `lumiq-supabase` Hyperdrive config, and both
`lumiq-staging-photos` R2 buckets (default and EU jurisdictions) were deleted
on 2026-09-25. The owner reports that the underlying Supabase staging project
was also deleted; this has not been independently verified from Supabase. The
obsolete base `wrangler.jsonc` has been removed so it cannot point at retired
resources or recreate the old Worker. The `cloudflare:deploy` and
`cloudflare:dev` npm aliases remain intentionally blocked.

The closed-test Worker `lumiq-closed-test` currently serves both
`lumiq-closed-test.gkarans-events.workers.dev` and `lumiq.cam`, and uses only
the closed-test Hyperdrive and private R2 bucket. Keep its ignored local config
separate; the ignored local config must never be committed.

For the approved $0 closed test, follow
[`platform/docs/CLOSED-FREE-TEST.md`](../../platform/docs/CLOSED-FREE-TEST.md)
and use only the ignored `wrangler.closed-test.jsonc` file created on the
owner's machine. Keep Cloudflare Access enabled, keep photo uploads closed
until the R2 gates pass, and never commit that local config or its secrets.

Production infrastructure and public-domain changes have not been approved.
Do not deploy a production Worker, replace the current service, change DNS, or
enable paid resources until every gate in
[`platform/docs/LAUNCH-GATES.md`](../../platform/docs/LAUNCH-GATES.md) has dated
evidence and the owner has explicitly approved the production plan.

The eventual domain handoff and rollback procedure is documented in
[`platform/docs/CLOUDFLARE-CUTOVER.md`](../../platform/docs/CLOUDFLARE-CUTOVER.md).
It explicitly forbids splitting live traffic between the staging and
production databases.
