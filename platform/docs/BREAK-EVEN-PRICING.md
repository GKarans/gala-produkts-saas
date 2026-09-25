# Tier pricing: infrastructure break-even estimate

Model date: 2026-09-25. This is a planning estimate, not an accounting or tax
opinion and not a promise of profitability. Prices below are treated as EUR
before VAT. VAT collection/remittance, income tax, owner salary, support labor,
marketing, refunds, chargebacks, legal/accounting and backup/restore costs are
not included.

## Current product prices and limits

| Plan | Current price | Included new events |
|---|---:|---:|
| Explore | Free trial | 1 |
| Single Event | EUR 15 one-time | 1 |
| Gathering | EUR 30/month | 4 per paid period |
| Studio | EUR 70/month | 12 per paid period |

The data model caps each Explore event at 50 photos / 100 MiB, Single Event and
Gathering at 500 / 1000 MiB, and Studio at 1,000 / 2000 MiB. Each tier budgets
2 MiB per photo pair. Event photo pairs include thumbnails;
the post-event ZIP is an additional copy of originals and stays until retention
expires. Limits are separate count and byte ceilings.

## Vendor price inputs

- Cloudflare Workers Paid: USD 5/month account minimum, with 10M dynamic
  requests and 30M CPU milliseconds included; excess requests are $0.30 per
  million and CPU is $0.02 per million milliseconds. Worker bandwidth has no
  egress charge. Hyperdrive has no separate Paid-plan fee.
- Cloudflare Queues: 1M operations/month included on Workers Paid, then $0.40
  per million. A normal delivered message uses about three operations (write,
  read, delete). The maximum Studio scenario estimates 9,600 job messages, or
  28,800 operations before retries; Queue cost rounds to $0 at this volume.
- R2 Standard: $0.015/GB-month, $4.50/million Class A and $0.36/million
  Class B; published monthly free allowances are 10 GB-month, 1M A and 10M B.
  This model does **not** subtract the free allowances because other buckets in
  the Cloudflare account already use R2 and the allowance is shared.
- Supabase Pro: $25/month, with $10 compute credits that cover one Micro
  project at the listed base price. The model budgets $25 total for one
  production project and does not add a second staging database.
- Resend: $0 at up to 3,000 emails/month, subject to 100/day; $20/month for
  50,000/month with no daily limit. Supabase's default SMTP is unsuitable for
  production, so budget $0-$20 depending on actual rate/deliverability needs.
- Stripe standard EEA card: 1.5% + EUR 0.25 per successful transaction.
  Premium/international cards can cost more.
- Currency conversion for the examples: ECB EUR/USD reference rate 1.1367 on
  2026-09-24 (latest published when this model was prepared), so USD totals are
  converted at approximately USD 1 = EUR 0.8797. Actual card billing/exchange
  rates vary.

Live vendor price pages: [Workers](https://developers.cloudflare.com/workers/platform/pricing/),
[Hyperdrive](https://developers.cloudflare.com/hyperdrive/platform/pricing/),
[Queues](https://developers.cloudflare.com/queues/platform/pricing/),
[R2](https://developers.cloudflare.com/r2/pricing/),
[Supabase](https://supabase.com/pricing),
[Resend](https://resend.com/pricing?product=transactional),
[Supabase SMTP requirement](https://supabase.com/docs/guides/auth/auth-smtp),
[Stripe Latvia](https://stripe.com/en-lv/pricing/local-payment-methods),
[ECB reference rate](https://www.ecb.europa.eu/stats/shared/pdf/eurofxref.pdf).

## High-usage scenario

The reproducible calculation is `npm run cost -- [organizers] [event-slot-use]
[average-pair-MiB] [full-size-views-per-photo] [email-USD]`; it reads the
current limits from `shared/plans.js`. Each event's stored photo pairs are
capped at the plan's byte limit, even when the count limit would permit more.
The estimate includes the post-event ZIP as an additional copy of 90% of photo
pair bytes and retains it for the plan's retention period. This 90% is an
assumption to replace with measurements. It models the event itself as one day,
then applies the retention period. R2 free allowances are set to zero because
they are shared with other buckets; Cloudflare's rounding to whole billing
units is applied conservatively. Each photo is viewed 100 times at full size.
Worker CPU is assumed to be 7 ms per view, following Cloudflare's published
example, not a Lumiq measurement. The high email case uses USD 20/month.
The table uses a 2 MiB average photo pair, which fills each tier's byte
allowance at its maximum photo count.

| 100 customers, all on | Revenue/month | Platform/month | Stripe/month | Modeled costs/month | Contribution before excluded costs |
|---|---:|---:|---:|---:|---:|
| Single Event; 100 purchases/month | EUR 1,500 | USD 58.22 | EUR 47.50 | EUR 98.71 | EUR 1,401.29 |
| Gathering; 4 events each | EUR 3,000 | USD 73.05 | EUR 70.00 | EUR 134.26 | EUR 2,865.74 |
| Studio; 12 events each | EUR 7,000 | USD 229.61 | EUR 130.00 | EUR 331.99 | EUR 6,668.01 |

Platform/month includes one Supabase Pro project, Workers Paid with modeled
photo-view request/CPU usage, R2 storage/operations with no free-tier deduction,
and USD 20 email. The model creates 50k / 200k / 1.2M photos respectively,
each with 100 full-size views, and estimates 5.05M / 20.2M / 121.2M R2 reads
(including one source read per photo to build each ZIP). Estimated Worker view
requests are 5M / 20M / 120M. Other application requests, multipart ZIP
operations, retries, backups, database scaling and cleanup delays are excluded,
so this is still not an invoice or capacity guarantee. Run the model with
different assumptions before interpreting it as a forecast.

The modeled Single Event revenue assumes 100 new purchases each month. At only
10 purchases, platform cost allocation per sale rises sharply; one sale/month
cannot cover the shared production services alone. Subscription revenue is
more predictable, but this scenario does not include tax, company costs or
human support.

## Decision

On this intentionally heavy but still incomplete infrastructure/card scenario,
the existing EUR 15 / EUR 30 / EUR 70 prices exceed modeled service cost at
100 customers in one tier. Studio leaves about EUR 67 per account/month before
owner salary, support, tax and excluded costs. **This is not a profit forecast
or price recommendation.** Do not lower or finalize prices using this model;
measure real image sizes, traffic, ZIP jobs, backups and support time first.

The result changes materially if Studio customer usage exceeds the modeled
100 full-size views per photo, many previews repeatedly download originals,
photos/ZIPs are retained past policy, abuse drives traffic, Cloudflare/Supabase
need larger plans, or backup copies are kept. Conversely, lower average use
reduces variable costs. Test capacity and enforce budgets/alerts before sales.

## Important correction to the previous storage-only estimate

The earlier 400 MiB/event allowance yielded about 503 GB of Studio photo-pair
storage at 100 fully active accounts. The current 2000 MiB/event allowance
raises the 30-day photo-pair steady state to about 2.52 TB decimal; the modeled
90%-size ZIP adds about 2.26 TB. This excludes backups, peak accumulation and
cleanup delays.
