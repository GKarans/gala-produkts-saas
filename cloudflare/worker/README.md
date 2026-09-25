# Cloudflare Worker deployment safety

`wrangler.jsonc` is bound to the existing `lumiq.cam` staging Worker, staging
Hyperdrive, and staging R2 bucket. Do not deploy or run local preview against
that configuration from this branch. The `cloudflare:deploy` and
`cloudflare:dev` npm aliases are intentionally blocked.

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
