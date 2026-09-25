# Roadmap traceability

Baseline date: 2026-09-13. Scope: standalone `gala-produkts-saas` repository.
Sources remain unchanged: `PRODUCT-ROADMAP.md` and `reference/platform-review-original.txt`.

LOCAL = implemented locally, with the evidence described in TESTING.md. PARTIAL = some code exists, but criteria remain. MANUAL = external/device/operator evidence required. DEFERRED = conditional features not in the offered release. These are not production-complete checkboxes. A checked local-work summary is maintained in [PROGRESS.md](PROGRESS.md).

| IDs | Status | Implementation / remaining acceptance |
| --- | --- | --- |
| A1, A2 | LOCAL | Snapshot exports across metadata pages, reusable persisted archives, manifests and crash-lease recovery tests |
| A3 | PARTIAL | Route generation guards and event identity checks; delayed cross-account UI matrix still required |
| A4 | LOCAL | Stable IDs, paired-file finalize, checksum/decode validation, stage-aware retry |
| A5 | LOCAL | Metadata-first deletion and durable cleanup, thumbnail repair and cover cleanup queue |
| A6 | LOCAL | Fetch/XHR timeouts, remove/discard, authoritative end check; phone return behavior still manual |
| A7 | PARTIAL | Read-only missing-object inspection and thumbnail-repair job. Legacy MVP/orphan bucket inventory intentionally untouched |
| A8 | PARTIAL | Pinned dependencies, isolated check command, PR/main CI, CodeQL and test artifacts. First clean GitHub-hosted run and branch protection still require repository setup |
| A9 | MANUAL | Physical Android/iPhone/older phone, ten consecutive captures |
| B1 | LOCAL | Direct-manipulation guest editor without sliders, shared cover renderer, saved style/position tests; separate details/sharing |
| B2, B3 | LOCAL | Local datetime + hidden IANA, UTC server boundaries, DST rejection tests; no MVP migration |
| B4 | LOCAL | Draft/scheduled/live/paused/completed states and guest state polling |
| B5, B6 | LOCAL | Archive/restore vs confirmed delete, retained gallery, DB deadline and cleanup jobs |
| B7 | LOCAL | Draft/publish, description, duplicate and two cover starting points; no elaborate template editor |
| C1, C2 | LOCAL | Camera/select, 20-photo bounded queue, two parallel uploads, progress/preview/retry |
| C3 | LOCAL | Stable ID, bounded transient retry, no success before finalize |
| C4 | PARTIAL | Browser decode/resize plus authenticated bounded HEIC/HEIF conversion; older-device memory evidence absent |
| C5 | LOCAL | Optimized WebP only, consistently described as optimized, not originals |
| C6 | LOCAL | Bounded IndexedDB source queue survives refresh without storing guest tokens. No universal background-upload claim |
| C7 | MANUAL | Physical devices, network conditions and app-switch matrix |
| D1 | LOCAL | Stable `(created_at,id)` cursor pagination, filters and same-origin authorized media |
| D2 | LOCAL | Last updated, manual refresh and visible organizer polling; operating cost still to measure |
| D3, D4 | LOCAL | Guest/date/order filters, preview arrows/swipe, selection/bulk delete, all/selected export |
| D5 | LOCAL | Queued/processing/ready/failed jobs, retry, expiry and persisted files |
| D6 | PARTIAL | Worker repair and valid-file checks; automated bucket-wide reconciliation and production alerts remain |
| D7 | LOCAL | Same guest link, organizer opt-in, retained expiry and atomic event allowance, no guest ZIP |
| D8 | PARTIAL | Thumbnail/photo response bytes and allowance counters; pricing/cost thresholds not measured |
| D9 | PARTIAL | 1200px QR PNG and print view; physical print scans remain |
| D10 | DEFERRED | No pre-publication moderation queue is advertised; organizer deletion exists |
| E1 | LOCAL / MANUAL | Local register/verify/login/reset/session; mocked encrypted Supabase adapter. Real Auth/SMTP acceptance pending |
| E2 | LOCAL | Profile/email workflow and reviewed account-erasure request; not an unreviewed automatic billing deletion |
| E3, E4 | LOCAL | Empty states, draft form persistence, event states/search/order and support access |
| E5 | PARTIAL | Plan, used bytes/photo counts, granted retention and share allowance; customer cost study pending |
| E6 | PARTIAL | Native dialogs/focus, labels, icon names, responsive layouts, reduced motion; independent accessibility/device review pending |
| F1 | MANUAL | Customer interviews and paid pilot not performed. Monthly proposal is a reversible local hypothesis |
| F2 | LOCAL | Explore trial, EUR 15 Single Event, EUR 30 Gathering with four and EUR 70 Studio with twelve new publications per paid period; bounded entitlement snapshots, no unlimited, teams or annual plans |
| F3 | MANUAL | Actual cost and support measurements before price approval |
| F4 | LOCAL / MANUAL | Simulated checkout, Stripe test adapter, verified webhook ledger; no live purchase |
| F5 | PARTIAL | Canonical subscription reconciliation, duplicate/stale tests, failed/canceled outcomes. Real refund/invoice matrix pending |
| F6 | PARTIAL | Monthly status/cancel/provider portal code; no advertised yearly, team seat or automatic proration promises |
| F7 | LOCAL | Server publication ledger and upload reservations; entitlement retained after cancellation. Local concurrent last-slot/pass, cross-account pass and unpublished archive-restore regression tests pass; target PostgreSQL concurrency remains staging acceptance |
| G1 | LOCAL | Homepage/features/pricing/help/contact/auth/legal/security/status and local guest demo; final brand/domain/SEO canonical pending |
| G2, G3 | PARTIAL | Service-only auth/event/80%-allowance/share-expiry/export/retention/plan/support notices, dedupe, leases, bounded retries and operator recovery. Actual SMTP/Resend and preference delivery acceptance pending |
| G4 | PARTIAL | Support form/customer cases/transactional reply-outbox/admin mail retry and runbook. Actual support channel/hours and refund approval needed |
| G5 | MANUAL | Meaningful draft privacy/terms/refunds exist; legal entity, regions, consumer/tax review must be supplied and approved |
| H1 | LOCAL | Feature modules and server services, JS retained; no unnecessary framework rewrite |
| H2 | PARTIAL | Versioned migration ledger, checksum mismatch protection and additive delivery-lease migration; fresh/rerun/forward tests pass. Target PostgreSQL upgrade/backup drill pending |
| H3 | PARTIAL | Isolated worktree, local-only defaults, blocked legacy deployment, staged adapters and build allowlist; actual staging/CI/rollback drill pending |
| H4 | LOCAL / MANUAL | Direct service/API integration tests with local PostgreSQL engine; new Supabase/R2 target acceptance pending |
| H5 | MANUAL | Local negative tests are not an independent security review |
| H6 | PARTIAL | Structured logs, request IDs, database health, alert webhook and operations counters; provider dashboards and alert-delivery drill pending |
| H7, H8 | MANUAL | Backup/restore and load-test procedures documented; real cloud recovery/maximum-size tests not performed |
| H9 | PARTIAL | Admin role, customers/jobs/support/email/audit/usage, retry and reconciliation API; refund approval and controlled allowance tools not complete |
| H10 | DEFERRED | No teams offered; no unnecessary memberships model |
| I1, I2, I3 | PARTIAL | Uploaded rows, response bytes, jobs, orders and cases available; complete performance/retry/browser cost funnel remains |
| I4, I5 | MANUAL | Real independent full journey and provider renewal/cancel evidence required |
| I6 | LOCAL / MANUAL | Owner/CSRF/limits/cleanup/recovery/payment tests local; provider and independent review still required |
| I7 | MANUAL | No paid pilot or public launch performed |
| J1 | PROPOSED | QR poster designer v2: replace current editor when prioritized; event-only backgrounds/uploads, canvas editing and protected fresh QR layer. Preserve scan-safe export; no design inheritance |
| J2 | PROPOSED | Expand organizer guest-page appearance controls and responsive preview, separate from the QR poster editor. Guest-side photo editing is out of scope |

## What is not claimed

This is a substantial local implementation, not completion of every roadmap acceptance criterion. In particular physical devices, legal/operator identity, actual infrastructure, independent review, production backup/restore, maximum-size load tests and paid validation cannot be replaced with generated code or mock success messages.

No practice hours, Git commits, deployment successes or real tester feedback have been invented.
