# Launch gates

No public-sales readiness claim is made. These checks must be completed before enabling production. None requires spending money without a separate owner decision.

The runtime accepts `PLATFORM_RELEASE_APPROVED=staging` only with
`PLATFORM_MODE=staging`, or `PLATFORM_RELEASE_APPROVED=production` only with
`PLATFORM_MODE=production`. Set the production pair only after every required
engineering and owner-dependent gate below has dated evidence and explicit
owner approval. A matching environment flag is a release switch, not proof that
the gates passed.

## Engineering work still requiring completion or target-environment evidence

- [x] Closed-test database foundation only: migrations `001-platform` through `006-r2-usage-guard`, RLS on all 17 protected tables, anon/authenticated SELECT denied, and restricted `lumiq_runtime` role provisioned and privilege-checked. Evidence: owner ran `migrate-new-test.ps1` and `provision-test-db-role.ps1` against the separate Free test project on 2026-09-23. This is not production evidence.
- [x] Closed-test Hyperdrive connectivity: after Worker version `636cb1e2-2e0e-49d3-914e-47f335f0239f` reached 100%, the owner rechecked `/healthz` through Access and confirmed `database: ready` and `storage: bound` on 2026-09-23. This proves Worker startup checks and a database query through the separate test Hyperdrive; it is not production evidence.
- [x] Closed-test organizer smoke test: the owner signed into the protected app, created draft event `Balle`, and confirmed it remained after returning to the event. This proves a basic authenticated create/read path only; it does not prove guest flow, staging-data isolation, Auth recovery or photo storage.
- [ ] Closed-test Supabase Auth integration: a 2026-09-23 code audit confirmed the Worker passes its configured `PLATFORM_ORIGIN` to Supabase Auth; the closed-test config uses the test `workers.dev` origin, and the local adapter suite passed 14/14 tests including signup, reset and OAuth redirect construction. Still verify Supabase's actual redirect allowlist/email templates and live reset, change-email and concurrent-refresh flows in the closed-test project. Do not reuse staging Auth settings.
- [ ] Isolated R2 integration: preflight, signed PUT checksum/size enforcement, expired URL retry, private GET denial, finalize and immediate share revocation.
- [ ] Prove the implemented DB-shared limiter and trusted proxy/client-IP handling on the actual multi-instance staging deployment.
- [ ] Stripe sandbox renewal, delayed payment, changed plan, cancellation, taxes/invoices, failed payment, duplicate/out-of-order delivery and reconciliation. The local mock is not this evidence.
- [ ] Run the implemented numbered migration/checksum procedure against the production PostgreSQL target, including upgrade and backup/restore evidence. The closed-test schema was applied and verified, but no MVP migration or production migration was run.
- [ ] Upload memory profile on an older device with 20 mixed large JPEG/PNG/WebP and HEIC/HEIF files. Verify bounded server conversion, explicit fallback errors and IndexedDB queue recovery after refresh without persisting guest tokens.
- [ ] Validate alert webhook delivery, request-to-job correlation, failure classification and costs/support per event in staging. Structured logs, request IDs, health checks and alert hooks are implemented; provider dashboards still need target-environment evidence.
- [ ] Capacity test for maximum advertised event/ZIP allowances. Tune batching, worker memory and lease behavior with measurements.
- [ ] Independent security review: IDOR, XSS, CSRF, auth recovery, RLS/DB role, signed URL replay, malformed images, plan/owner bypass and admin authorization.
- [ ] Actual database plus object backup/restore drill to an empty isolated environment, with checksums and sample ZIP verification.
- [ ] Complete physical VoiceOver/NVDA and phone safe-area sign-off. Automated axe, keyboard entry, reduced motion, responsive viewports and 200% zoom checks already run in CI.

## Owner-dependent steps

1. Select legal operator name, registration/contact details, service jurisdiction, customer market and support channel. No details have been invented.
2. Check Lumiq trademark/domain availability. Replace the provisional brand if necessary.
3. Interview at least three target organizers. Compare occasional event passes with the current monthly test proposal; select one launch offer.
4. Measure storage/operations/API hosting/email/payment fees and support time. Set prices and a contingency margin only after those inputs exist.
5. Approve privacy notice, terms, refund/withdrawal rules, tax treatment, subprocessors, regions, retention, deletion/backup windows and rights-request process with qualified advice.
6. For the approved $0 closed test only, finish the separate test Hyperdrive, Access allowlist, Worker configuration/secrets and protected deployment in `CLOSED-FREE-TEST.md`. Production resources are not approved or provisioned; obtain a separate owner decision before creating or changing any production resource or paid plan.
7. Nominate an operator admin through a controlled backend procedure, not a browser role field. No demo admin is imported into staging.
8. Protect staging from public discovery and real customer use until testing finishes. Keep the closed-test Worker behind Access. Do not publish a draft privacy policy as legally approved.

## Physical-device script

1. Record phone model, OS, browser/version and test date; use only consented test photos.
2. Scan a printed QR from normal viewing distance and dim light.
3. Enter a name; take 10 consecutive photos; note every camera cancel, silent return, success and error.
4. Select 20 photos. Every selection must have a visible result; compare gallery and DB counts and check duplicates.
5. Interrupt Wi-Fi during photo, thumbnail and finalize separately. Restore network and retry. No success before both files are durable.
6. Switch apps, lock the screen, open the keyboard, rotate, test safe areas, change theme, try a long unbroken title/name.
7. Pause/resume and end the event while upload is running. Verify the server rejects incomplete new submissions after the boundary.
8. Turn guest sharing on, sort/filter, preview/download one optimized file, turn sharing off and re-open the same link.
9. Export all with an active filter and more than one metadata page; inspect the ZIP manifest and compare all IDs.
10. Repeat on Android Chrome, iPhone Safari and an older/lower-memory phone. Save screenshots and counts, not credentials or signed URLs.

## Acceptance thresholds for the first controlled pilot

- Zero observed wrong-account reads, silently lost successful uploads, duplicate saved UUIDs or incomplete successful exports.
- Every test failure recoverable or reported clearly; unresolved severity-1/2 findings block release.
- One fresh tester completes the whole organizer/guest/export/support journey without developer assistance.
- Restore drill produces the same verified photo count and hashes as the backup inventory.
- Upload/gallery/export latency and storage/operations costs recorded against a written budget chosen by the owner.
- A small paid pilot is only authorized after legal, provider and reliability gates pass. This task has not authorized or performed it.

## Evidence to record

For each gate: date, code version, environment ID, exact test steps, expected/actual, screenshots/log reference, tester and unresolved issue. Do not mark a checkbox based solely on code existing.
