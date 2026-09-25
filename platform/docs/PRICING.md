# Current plan configuration

Prices and allowances are a local product configuration; no live billing price is changed by this document. Published event grants are snapshots, so a change to a plan does not shorten retention already promised to an event.

| Plan | Price | New publications | Photos/event | Storage/event | Event duration | Photo retention | Guest sharing |
|---|---:|---:|---:|---:|---:|---:|---:|
| Explore | Free trial | 1 | 50 | 30 MiB | 1 day / 24 hours | 7 days | Up to 4 days |
| Single Event | EUR 15 once | 1 pass | 500 | 200 MiB | Up to 3 days | 14 days | Up to 7 days |
| Gathering | EUR 30/month | 4 per paid period | 500 | 200 MiB | Up to 3 days | 14 days | Up to 7 days |
| Studio | EUR 70/month | 12 per paid period | 1000 | 400 MiB | Up to 3 days | 30 days | Up to 14 days |

The photo-count cap and total stored-byte cap are enforced independently. Stored bytes include the optimized WebP photo and its thumbnail, not the phone original. Explore allows 50 photos / 30 MiB (0.6 MiB per photo pair on average); Single Event and Gathering allow 500 / 200 MiB (0.4 MiB per pair); Studio allows 1,000 / 400 MiB (0.4 MiB per pair). These are arithmetic averages, not promises about actual file size or quality. Complex scenes may be larger, and the byte cap can be reached before the photo-count cap. At the configured per-file maxima (6 MiB photo + 1 MiB thumbnail), the byte caps can hold fewer photos than the count caps; actual optimized files vary, so the product must not promise a fixed average size per photo.

The first publication consumes a plan slot, including a future scheduled event; drafts do not. Archiving/deleting does not return a slot and monthly slots do not roll over. Single Event purchases remain separate from subscriptions.

The retention period starts when the event/photo-taking period ends. Photo access ends at `retention_at`, calculated from the event end and the entitlement at publication. The organizer chooses a sharing duration up to the plan maximum and the remaining retention time; sharing begins after the event and cannot exceed `retention_at`. At event end, the system automatically prepares a complete-gallery ZIP snapshot. Photos deleted later disappear from the live gallery but do not change that ZIP. At `retention_at`, both gallery files and ZIP parts are deleted; the Archive view retains only the event name, date/time and retention period. Existing published events keep their granted retention deadline when plan settings later change.

## Capacity model

For steady monthly publishing and evenly distributed activity, approximate active object storage as `organizers * events-per-period * min(photo-count * average-photo-pair-bytes, event-byte-cap) * retention-days / 30`. This excludes ZIP exports, backups, cleanup delay, and synchronized event peaks. MiB are binary (1024² bytes); TB in the following estimates are decimal.

| Subscribers | Mix | Active photos, at full byte allowances |
|---:|---|---:|
| 100 | 70% Gathering / 30% Studio | 178.398 GB |
| 10,000 | 70% Gathering / 30% Studio | 17.8398 TB |
| 100 | all Gathering | 39.147 GB |
| 10,000 | all Gathering | 3.9147 TB |
| 100 | all Studio | 503.316 GB |
| 10,000 | all Studio | 50.3316 TB |

These are upper-bound steady-state allowances, not storage purchase sizes. Add operational headroom, then separately model exports, backups, bursts and failed deletions. Measure actual p50/p95 photo-pair sizes before making commercial margin claims. Costs also include API compute/egress, database, email, payment fees, taxes and support; no profitability guarantee is implied.
