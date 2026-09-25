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

The data model caps each Gathering event at 500 photos / 200 MiB and each
Studio event at 1,000 photos / 400 MiB. Event photo pairs include thumbnails;
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

## Conservative usage scenario

For comparison, each account is at full publication/photo/byte limits. Each
stored photo is viewed 100 times at full size. The Worker estimate uses 7 ms
CPU per served image, matching Cloudflare's published pricing example; this
must be replaced with measurements. R2 read requests count one full-size read
per view; thumbnails, retries, browsing metadata, ZIP delivery, and unrelated
Worker requests can add cost. ZIP storage is approximated as another copy of
the full event byte cap, a conservative upper bound. USD and EUR are left
  separate rather than hiding exchange-rate changes; the EUR floors use the
  reference rate above and are rounded estimates, not a payment quote.

| 100 customers, all on | Revenue/month | Approx. card fees | Approx. platform + storage + payment total/month | Per-account infra break-even |
|---|---:|---:|---:|---:|
| Single Event; 100 new purchases/month | EUR 1,500 one-time | EUR 47.50 | USD 33-53 + EUR 47.50 | about EUR 0.76-0.94 per sale at 100 sales/month |
| Gathering; all 4 events used | EUR 3,000/month | EUR 70 | USD 45-65 + EUR 70 | about EUR 1.10-1.27 per subscriber/month |
| Studio; all 12 events used | EUR 7,000/month | EUR 130 | USD 149-169 + EUR 130 | about EUR 2.61-2.78 per subscriber/month |

Platform ranges include one Supabase Pro project, Workers Paid, R2 usage with
no free-tier deduction, and $0-$20 email. Gathering assumes 400,000 R2 object
writes, 20M full-size reads, and approximately 75 GB-month for photos plus ZIPs;
R2 is about $10. Studio assumes 2.4024M writes (2.4M photo/thumb objects plus
about 2,400 ZIP parts), 121.2M Class B reads (120M full-size views plus 1.2M
source-photo reads for ZIP creation), and about 1.0 TB-month for photos plus
ZIPs; R2 is about $69.54 without shared-account free-tier deductions, and
Workers about $54.20 at the assumed request/CPU load. Queue operations for
9,600 messages remain under the Paid monthly allowance. Single assumes 100,000 writes, 5M reads and
approximately 18 GB-month for photos plus ZIPs; R2 is about $3. Total uses
Cloudflare $5 minimum and Supabase $25, and gives a range for email. These
figures are engineering arithmetic on current published unit rates, not a
provider invoice forecast.

Single Event is sensitive to monthly sales count because the shared $30-$50
base must be allocated over one-time purchases: at only 10 sales/month, the
infrastructure break-even rises to roughly EUR 3.50-5.50 per sale; at one
sale/month the business cannot cover shared fixed services from this product
alone at EUR 15. Subscriptions make fixed-cost coverage more predictable.

## Decision

On direct infrastructure and card-processing costs alone, the existing EUR
15 / EUR 30 / EUR 70 prices are well above the modeled break-even at 100
customers in each tier. Even the conservative Studio scenario leaves about
EUR 67 per customer/month before owner salary, support, tax and omitted
business costs. **Do not lower public prices to the calculated infrastructure floors**:
they only show that R2 storage is not currently the dominant expense. Keep
current prices provisional until real traffic, photo sizes, ZIP CPU, support
time, tax treatment and backups are measured.

The result changes materially if Studio customer usage exceeds the modeled
100 full-size views per photo, many previews repeatedly download originals,
photos/ZIPs are retained past policy, abuse drives traffic, Cloudflare/Supabase
need larger plans, or backup copies are kept. Conversely, lower average use
reduces variable costs. Test capacity and enforce budgets/alerts before sales.

## Important correction to the previous storage-only estimate

The capacity documents' “100 Studio” steady-state storage figure of 5.033 TB
was ten times too high for the current 400 MiB/event, 12 events/month and
30-day retention formula. Photo pairs alone are about 503 GB decimal at evenly
distributed full quotas; including an equally large ZIP copy is about 1.01 TB.
The published capacity tables have been corrected. This excludes backups,
peak accumulation or cleanup delay.
