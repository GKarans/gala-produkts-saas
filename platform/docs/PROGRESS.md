# Product progress

Updated: 2026-09-13. This checklist concerns only the isolated, uncommitted platform copy.
Checked means implemented and verified locally, not approved for public sales.
The original [roadmap](PRODUCT-ROADMAP.md) is preserved; the full ID mapping is in [ROADMAP-STATUS.md](ROADMAP-STATUS.md).

## Completed locally

- [x] Standalone `gala-produkts-saas` repository; MVP source and service configuration remain separate.
- [x] Local PostgreSQL-compatible database, private file storage, demo accounts and email inbox.
- [x] Homepage, product explanation, pricing proposal, help, contact, security and status pages.
- [x] Privacy, terms and refunds drafts with explicit pre-launch limitations, not invented legal approval.
- [x] Register, one-use verification, login, reset, profile, email change, logout and server sessions.
- [x] Draft events, publish, pause/resume, duplicate, archive/restore and confirmed deletion.
- [x] Precise start/end times; automatic hidden timezone detection; server-enforced end boundary.
- [x] Name snapshots plus immutable event/guest/photo IDs in storage paths.
- [x] QR PNG and print layout, with the same guest link for contribution and optional later sharing.
- [x] Guest designer without sliders: drag cover, zoom buttons, reset, undo, alignment, typeface and color swatches.
- [x] Click-to-edit text, welcome/camera preview modes and saved settings used by the real guest view.
- [x] Responsive cover framing and title wrapping; theme changes do not tint the cover image.
- [x] Camera/select, 20-item bounded upload queue, two concurrent uploads and visible progress/retry.
- [x] WebP optimization, thumbnail pair, checksums, server decode verification and idempotent finalization.
- [x] Gallery pagination, thumbnail-only grid, guest/date/order filters and image preview/download.
- [x] Guest date filtering in the viewer's automatically detected timezone.
- [x] Opt-in post-event guest gallery, expiry, immediate read-time revocation and atomic event request allowance.
- [x] Durable all/selected ZIP jobs, complete ID snapshots, manifests, reusable parts and expired-lease recovery.
- [x] Metadata-first deletion, retryable object cleanup, stale-upload expiration and thumbnail repair.
- [x] Cover replacement reserves cleanup before writing, preventing failed attachments becoming untracked files.
- [x] Trial/paid-plan entitlement enforcement and published-event allowance snapshots.
- [x] Publication regression: concurrent requests cannot consume the last subscription slot or one-time pass twice; another account cannot use the buyer's pass. Verified with isolated local database tests.
- [x] Restoring an ended, never-published draft no longer makes it public. Restoring does not grant a publication allowance.
- [x] Local payment simulation and test-only Stripe adapter with webhook signature/replay/order handling tests.
- [x] Explore trial retained; Single Event EUR 10 one-time pass; Gathering EUR 19/month with four new publications per paid period; Studio EUR 49/month with twelve. Server-side publication ledger prevents recycling consumed slots through completion or deletion. See PRICING.md.
- [x] Encrypted Supabase Auth session adapter and private R2 signed-upload adapter, without live connections.
- [x] Persistent rate limits shared across API processes and explicit trusted-proxy handling.
- [x] Versioned migration ledger with checksum protection and a forward delivery-lease migration.
- [x] Service notices for event completion, allowance warning, share expiry, export, retention and plan status.
- [x] Leased email delivery, bounded retries, provider idempotency keys and recoverable failure state.
- [x] Support cases and replies; role-gated operations, jobs, service-mail status and audit trail.
- [x] Repeatable local test/build commands and isolated browser verification that does not use preview data.
- [x] Manual-only CI definition prepared locally; no GitHub run or deploy triggered.
- [x] New-service setup guide, release checklist, operator runbooks and testing evidence.

## Interface refinement, 2026-09-14

- [x] Pricing grid aligns card actions; Explore increased to 350 MiB for new grants, with both quota limits explained.
- [x] Shared fixed-size photo viewer with on-image arrows, keyboard navigation, touch swipe and backdrop dismissal.
- [x] Five bundled event covers; editable photo-selection label; arbitrary hex color picker with automatic contrasting text.
- [x] Local registration/profile: separate names, optional normalized phone and country code, personal/business company name.
- [x] Local current-password-protected password change revokes all sessions and outstanding reset links.
- [x] Optional, separately styled editorial preview without changing default product behavior.
- [ ] Complete LV/EN translation. Preference, core navigation/forms, pricing cards and default guest actions implemented; prose/emails/error coverage remains.
- [ ] Google sign-in implementation and later real OAuth setup.

Detailed request checklist: [PRODUCT-REFINEMENT.md](PRODUCT-REFINEMENT.md). Security scope and residual gates: [SECURITY-VERIFICATION.md](SECURITY-VERIFICATION.md).

Current repository-wide priorities: [Critical product audit, 2026-09-17](CRITICAL-AUDIT-2026-09-17.md).

## Not yet accepted

- [ ] New Supabase/R2/Auth/SMTP/Stripe-test deployment and actual end-to-end provider validation.
- [ ] Clean-host CI execution. The workflow file exists but has not run on GitHub.
- [ ] Physical Android Chrome, iPhone Safari and older-phone capture/network/keyboard tests.
- [ ] Full maximum-plan load and memory tests; measured latency, traffic, cost and support budgets.
- [ ] Independent security/accessibility review and real database-plus-object restore drill.
- [ ] Legal operator/contact details, domain/brand clearance, approved policies, prices and tax treatment.
- [ ] Full production monitoring and alerts, verified support delivery, refund/operator approvals.
- [ ] Customer interviews, an independently completed journey, and an explicitly approved pilot.

Optional team accounts, annual billing, moderation-before-publication and persistent offline upload are not advertised in this release. They remain deferred rather than disguised as completed work.

## Next sequence

1. Finish local regression evidence and operator tooling without connecting the MVP services.
2. Owner completes the decisions in [LAUNCH-GATES.md](LAUNCH-GATES.md).
3. With explicit approval, connect new staging services using [SETUP.md](SETUP.md).
4. Execute provider, device, capacity, recovery and security checks; attach actual evidence.
5. Decide whether launch is justified. No sales or production readiness is assumed from this checklist.

No practice hours, tester feedback, commits or deployment results have been fabricated.
