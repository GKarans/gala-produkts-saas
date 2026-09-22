# Critical product audit

Date: 2026-09-17

Scope: the standalone `gala-produkts-saas` repository, including public UI,
server modules, database schema and migrations, tests, assets, build scripts and
product documentation. The Event Photo SaaS repository and services are outside
this audit.

## Baseline

- 51 backend and integration tests pass.
- The isolated browser suite passes at 320, 390, 768 and 1440 px.
- Register, verification, login, event publication, 20-photo upload with retry,
  gallery, viewer, guest designer, billing simulation and pricing checks pass.
- The public build contains 43 validated files and no known MVP endpoint or
  secret pattern.
- `npm audit` reports zero known dependency vulnerabilities at this baseline.

This is a strong local baseline, not proof of production readiness.

## Twenty highest-value improvements

### P0: settle the product and make the real system provable

1. **Choose one product identity and apply it everywhere.** The supported
   product surface now uses the Gathering-derived design under the Lumiq name.
   Confirm the final name after domain and trademark checks, then keep the
   wordmark, metadata, email sender, cookie prefix, object paths and copy aligned.

2. **Finish complete LV/EN localization.** Navigation and main marketing pages
   are translated, but workspace actions, validation errors, server responses,
   service emails and legal documents still contain English-only strings. Move
   all customer-visible copy to structured locale catalogs and add a test that
   crawls every route in both languages without untranslated fallback text.

3. **Implement Google sign-in with safe account linking.** Add Google OAuth only
   through the new Supabase Auth project. Define verified-email linking,
   duplicate-account handling, logout, revoked-consent and recovery behavior.
   Keep email/password available and do not add GitHub sign-in.

4. **Create a real isolated staging environment.** Connect a new Supabase
   database/Auth project, private R2 bucket, SMTP provider and Stripe test mode.
   Run the same journey against providers, including expired signed URLs,
   webhook replay, RLS denial, failed mail and immediate gallery revocation.

5. **Select and codify the deployment topology.** The product needs a persistent
   Node API and a separate worker; a static Netlify deployment is insufficient.
   Add repeatable infrastructure configuration, health/readiness checks, secret
   rotation, rolling deploy and rollback procedures for the selected host.

6. **Turn CI into a mandatory quality gate.** The workflow is manual-only. Run
   unit/integration/browser checks on pull requests and protected-branch pushes,
   add formatting/linting, dependency review, secret scanning, SQL migration
   checks and artifact retention. Keep the supported Gathering-derived Lumiq
   interface in the normal responsive and accessibility suite.

7. **Commission an independent security assessment.** Test IDOR, session theft,
   OAuth linking, CSRF, stored/reflected XSS, RLS and privileged-role boundaries,
   signed URL replay, malformed/decompression-bomb images, quota races, webhook
   forgery and admin authorization. Add HSTS and the final edge headers at the
   hosting layer, then record findings, fixes and residual risk.

8. **Prove backup and disaster recovery.** Back up PostgreSQL and R2 inventory,
   restore both into an empty environment and compare row counts, object hashes
   and sample ZIP manifests. Define RPO/RTO, backup retention, encryption,
   deletion behavior and a scheduled restore drill.

9. **Load-test the maximum paid plan and stream exports.** ZIP generation now
   streams bounded parts through the worker and stable cursor tests traverse a
   1,000-photo Studio gallery. The staging run must still test simultaneous
   events, signed uploads and retries while recording memory, CPU and latency.

10. **Add production observability and service objectives.** Introduce
    structured request/job correlation IDs, error reporting, queue depth and age,
    upload/finalize success rate, media latency, mail/webhook failures, storage
    spend and alarms. Define availability and recovery targets before selling.

### P1: remove user friction and make the code easier to evolve

11. **Persist and resume the guest upload queue.** A bounded IndexedDB source
    queue now survives refresh, supports retry/discard and cleans up after
    finalize without storing guest tokens. Universal background upload after
    the browser is closed is intentionally not claimed.

12. **Handle iPhone HEIC/HEIF gracefully.** Today those files are refused.
    Evaluate a memory-bounded conversion path and preserve orientation; if a
    device cannot convert safely, provide a precise fallback rather than a
    generic failure. Test recent iPhones and older low-memory devices.

13. **Replace offset photo pagination with cursor pagination.** Use
    `(created_at, id)` cursors so concurrent uploads or deletions cannot shift
    pages, duplicate cards or skip photos. Apply the same stable snapshot model
    to filters and guest sharing.

14. **Split large string-template modules and add typed API contracts.** Several
    frontend and server files compress many responsibilities into very long
    lines. Separate route handlers, views and domain services; introduce runtime
    schemas for every API input/output and generate shared types or contracts.
    This will reduce regressions in localization, billing and event state logic.

15. **Complete accessibility certification.** Run keyboard-only, screen-reader,
    focus-order, error-announcement, 200% zoom, contrast and reduced-motion tests
   in both languages. Verify touch target sizes and safe areas on physical
   phones using the supported Gathering-derived interface.

16. **Build a first-event onboarding journey.** Replace the empty dashboard with
    a short progress path: create event, choose cover, set exact times, preview
    guest page, print/test QR and publish. Add a safe test-QR mode so organizers
    can verify the experience without consuming a paid publication.

17. **Add organizer curation without making the guest flow heavier.** Let the
    organizer mark favorites, choose the gallery cover, bulk hide/restore and
    download only favorites. Keep guest contribution account-free and avoid
    automatic face recognition or invasive processing.

18. **Upgrade QR delivery into a print/share toolkit.** Offer tested A4/A5/table
    card exports, high-contrast variants, a short readable event URL and a scan
    test before download. Track QR opens without exposing guest identity.

### P2: prove that the product can be sold sustainably

19. **Measure the real unit economics and product funnel.** Record average
    optimized pair size, uploads per event, R2 operations, API egress, ZIP work,
    support time and payment fees. Combine this with privacy-aware funnel events
    from registration to first successful guest upload. Revalidate EUR 15/25/59
    using measured margins rather than maximum-capacity assumptions alone.

20. **Finish the commercial and legal path.** Confirm legal operator, domain,
    privacy roles, DPA/subprocessors, retention and backup deletion, consumer
    withdrawal/refunds, VAT/invoices and billing-address/company fields at
    checkout. Validate the offer with at least three organizers and one
    controlled paid pilot before public launch.

## Recommended execution order

Start with 1-6 so the product has one identity, complete language coverage and a
repeatable staging/CI path. Then complete 7-10 before any public pilot. Deliver
11-18 as the product-quality phase, and use the measurements from 19-20 for the
final launch decision.
