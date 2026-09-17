# Approved local pricing

Approved 2026-09-14. Local only; no live billing prices or services changed.

| Plan | EUR | Publications | Photos/event | Retention after event | Sharing |
|---|---:|---|---:|---:|---:|
| Explore | 0 | 1/account | 50 | 14 days | up to 7 days |
| Single Event | 15 once | 1 purchased pass | 500 | 30 days | up to 30 days |
| Gathering | 25/month | 4/paid period | 500 | 30 days | up to 30 days |
| Studio | 59/month | 12/paid period | 1000 | 60 days | up to 60 days |

First publication consumes the allowance, including scheduled events. Drafts do
not count. Ending, deleting or archiving does not restore a publication. No
monthly rollover. Single Event does not create or replace a subscription.
Four Single Events cost EUR 60, compared with EUR 25 for Gathering's four.

Existing published-event entitlement snapshots are preserved.
Gallery access does not end with the subscription. Organizers retain access and
can enable guest sharing for the event's remaining retention window after
cancellation or expiry. Guests still require enabled sharing. The 30/60-day
deadline runs from event end, not subscription end or the date sharing is enabled.
New plan-funded publications require an eligible subscription.
No database data
was rewritten. Real payment-provider prices need separate staging configuration.
Tax treatment and commercial release approval remain outstanding.

Storage is included, not advertised as a rounded GB allowance. Internal capacity
is exactly 7 MiB per allowed photo: 6 MiB photo plus 1 MiB thumbnail. This is
350 / 3500 / 3500 / 7000 MiB by plan. Both byte and count reservations remain
server-enforced. Originals are not stored; browser optimization uses WebP and
2400 px longest edge. Source formats and size restrictions still apply.

## Capacity planning

Decimal TB; 30-day billing model, short events, uniform activity and timely
deletion. All users publish and fill every event. The 1 MiB pair average is an
assumption, not a measured customer average. Maximum uses 7 MiB pairs.

| Subscribers | Mix | At 1 MiB/pair | At maximum pair size |
|---:|---|---:|---:|
| 100 | 70% Gathering, 30% Studio | 0.902 TB | 6.312 TB |
| 10000 | 70% Gathering, 30% Studio | 90.178 TB | 631.243 TB |
| 100 | all Gathering | 0.210 TB | 1.468 TB |
| 10000 | all Gathering | 20.972 TB | 146.801 TB |
| 100 | all Studio | 2.517 TB | 17.616 TB |
| 10000 | all Studio | 251.658 TB | 1761.608 TB |

Formula: users * events/period * photos/event * bytes/pair * retentionDays/30.
Retention starts at event end; upload-window duration and synchronized events
increase peak occupancy. These are steady-state estimates, not hard peak bounds.
Add 30% operational headroom for an initial forecast, and model ZIP archives,
backups, cleanup failures and bursty scheduling separately. R2 grows with use;
no fixed-size disk purchase is needed. Budgets and alerts are still required.

Single buyers are not in subscriber rows. 100 Single purchases once add at most
0.367 TB; 10000 add 36.700 TB for their retention window, before overhead.

Earlier CAPACITY-SCENARIOS.md describes superseded prices/limits for comparison.
No profitability guarantee: include processing, API bandwidth, database, email,
support, payment fees, tax, acquisition and free-account usage in the budget.
The current private media route relays bytes through the API host; free R2 egress
does not guarantee free API-host egress.
