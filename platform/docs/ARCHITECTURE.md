# Architecture and decisions

## Isolation

This platform lives in the standalone `gala-produkts-saas` repository. It has no Git history, deployment configuration, secrets or runtime dependency on the Event Photo SaaS MVP repository.

Only `platform/public`, selected shared configuration and local Lucide assets are served. Production deployment remains disabled until the launch gates and new-service setup are completed.

## Product boundary

Photo-only. No video, face recognition, automated photo editing, native applications, teams or claims of unlimited storage. Lumiq is a provisional name, not a cleared trademark. Marketing illustrations are fictional scenes, not customers or testimonials.

The offered local pricing model is Explore, EUR 15 Single Event, EUR 25 Gathering and EUR 59 Studio. These remain test hypotheses, not a validated final tax-inclusive offer. Single Event serves occasional organizers without creating a subscription. Annual billing and team seats are intentionally not advertised.

## Components

| Layer | Local | Future isolated staging |
| --- | --- | --- |
| UI | HTML, CSS, browser ES modules, local Lucide | Same UI and same-origin API |
| Auth | Scrypt password hashes, verification outbox | Supabase Auth REST through server adapter |
| DB | Persistent PGlite under `.local/database` | New Supabase PostgreSQL, server-only role |
| Objects | Local filesystem | New private R2 bucket, official AWS S3 SDK |
| API | Node 22, loopback only | Long-running Node process behind HTTPS |
| Jobs | Local process, durable DB rows | Separate Node worker using same isolated DB/R2 |
| Billing | Explicit simulation, no charge | Stripe test keys only; live keys rejected |
| Mail | Local inbox | Supabase SMTP for auth; Resend outbox for service mail |

The Node runtime is used because Sharp decoding and reusable ZIP generation need bounded native processing and a persistent worker. Supabase Auth/DB and R2 remain the selected data services. No framework rewrite or microservices platform was introduced.

## Data model

`accounts`, `sessions`, `auth_tokens`: identity and server sessions. Supabase access/refresh tokens are encrypted with AES-256-GCM before persistence; browser receives only an opaque HttpOnly session cookie.

`subscriptions`, `orders`, `payment_events`: purchased capabilities, test checkout, deduplicated notifications. Published events retain their entitlement snapshot when the account cancels or changes plan.

`events`, `guests`, `media`: owner, precise UTC period with captured IANA zone, retention, sharing allowance, immutable guest/photo IDs and paired optimized/thumbnail objects.

`jobs`: retryable exports, photo/event/object deletion and thumbnail repair. `deliveries`: deduplicated service-mail outbox with leases, provider idempotency and bounded backoff. `support_cases`: support and erasure requests. `audit`: administrative changes. `metrics`: completed uploads and media-response bytes, not browser-save confirmations. `request_limits`: shared rate allowances. `platform_migrations`: checksummed schema versions.

All tables have RLS enabled and no browser policies. Authorization is server-side; the server DB role is privileged only for platform tables. RLS alone does not replace API owner/guest/admin checks.

## Time and lifecycle

Organizer inputs local datetime, browser supplies IANA zone invisibly. Luxon converts to UTC; ambiguous or nonexistent DST input is rejected with a clear message. Guests see dates in their own device locale/zone. Server UTC determines the actual boundaries, independent of a guest changing their clock.

States: draft -> scheduled/live -> paused/resumed -> completed. A future event can be designed and its QR prepared. Sharing and exports become available at the precise ending instant. Archive hides and disables sharing; restoring an ended event returns its gallery, while a future event returns as a paused draft. Permanent delete revokes access first and queues file deletion.

Retention is a database deadline. The worker processes it without requiring an organizer to open the dashboard. Existing MVP events are not imported or reinterpreted.

## Upload protocol

1. Guest receives a random token bound to one event. Names are attribution, not verified identity.
2. Browser decodes JPEG/PNG/WebP once, respects orientation, resizes to a maximum dimension of 2400px and creates a 360px thumbnail. Only optimized WebP is retained. Authenticated HEIC/HEIF sources use a bounded server conversion endpoint, with a precise JPEG fallback when conversion is unavailable.
3. Source limit 30 MB, 60 MP after decoding, 20 selected photos, 150 MB source batch, two concurrent uploads. Optimized file limit 6 MiB; thumbnail limit 1 MiB. Real low-memory devices still require testing because decoding allocates memory before the pixel check.
4. Stable UUID and checksums reserve bytes/photo allowance under an event DB lock. Prefixes use name snapshots plus IDs.
5. Local: PUT to the local API. Staging: 5-minute checksum/length-bound signed PUT directly to R2. No secret is sent to the browser.
6. Finalize verifies both files, hashes and actual decode. It marks a row uploaded only while the authoritative event is still open. Retrying an already completed photo is idempotent.
7. Transient failures get at most two delayed foreground retries, then visible manual Retry. Pending source photos are bounded in IndexedDB and restored after refresh without persisting the guest token. Universal background upload after closing the browser is not claimed.
8. Discard marks the reservation deleted. Cleanup waits past the signed-URL lifetime. Stale pending reservations expire after 24 hours.

## Reading, sharing and exports

Grid metadata never contains original objects; image elements request thumbnails. Preview and individual downloads recheck ownership or an active ended-event share. Public R2 access is off. Revocation stops future authorized responses, but cannot take back a photo already downloaded or bytes already in flight.

Shared gallery requests and image requests increment an atomic per-event allowance. Default 20,000 requests is provisional. It is not a per-person download limit, and clients cannot reset it. Guests have no ZIP endpoint.

Organizer Export all snapshots every matching uploaded ID across pages; Export selected snapshots explicit IDs. Jobs create 64 MiB source-byte batches, each ZIP with a manifest. Prepared archives are reusable for seven days or until event retention, whichever ends first. Worker recovery reclaims expired leases. Memory/throughput for maximum paid allowances still needs load tests.

## Deployment and release boundary

`npm run build` validates only public files and checks for reference infrastructure/private files. It is not a static-only substitute for the Node API.

The migration runner applies `001-platform` from `platform/server/schema.sql` and numbered migrations through `005-gallery-curation` from `platform/server/migrations/`. A locked, checksummed ledger rejects changed applied SQL outside local development. API startup refuses missing versions. Further changes require forward entries and a backup/restore procedure. This does not migrate MVP data; real target PostgreSQL migration/restore acceptance remains pending.

Production remains locked. See SETUP.md and LAUNCH-GATES.md. Local tests do not establish real Supabase/R2/Stripe compatibility, legal compliance, phone behavior or commercial viability.
