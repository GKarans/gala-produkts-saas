# Security verification plan and evidence

Scope: local platform copy only. No scanning of the original Netlify, Supabase, R2 or third-party systems. This is engineering verification, not an independent penetration test and not a guarantee against compromise.

## Threat model
- Unauthenticated internet client attempting organizer access, authentication abuse or forged uploads.
- Authenticated organizer trying to read or mutate another owner's event, photos, passes, jobs or support cases.
- Guest with a valid event link attempting to bypass event state, sharing expiry, content type or upload limits.
- Duplicate, delayed or forged payment events; concurrent quota reservations.
- Untrusted event names, guest names, filenames, cover settings and support content reaching browser markup or storage paths.
- Stolen sessions, password-reset links, accidental secrets in browser bundles and unfinished cleanup jobs.

## Repeatable local checks
Run `npm run check` in the isolated copy. The test server uses ephemeral data; the command includes the repository secret scanner and `npm audit --audit-level=high`.

| Control | Local evidence | Remaining |
| --- | --- | --- |
| Event/photo ownership and CSRF | platform.test.mjs, reliability.test.mjs | Independent authenticated multi-account assessment |
| Session and reset lifecycle | account-profile.test.mjs: current-password check, password mismatch, all-session/reset-link revocation | Real identity-provider acceptance |
| Quota concurrency and pass ownership | allowances.test.mjs | Multi-process PostgreSQL stress test |
| Content checksum, decode and file pairing | platform.test.mjs, reliability.test.mjs | Adversarial image corpus and parser review |
| Guest share expiry/revocation | reliability.test.mjs | Real media cache and provider path validation |
| Webhook integrity and replay | platform.test.mjs, allowances.test.mjs | Stripe sandbox delivery matrix |
| Browser isolation | Build boundary scanner, customer journey external-request check | Final CSP and proxy/CDN configuration |
| Cover input | Fixed bundled cover allowlist and normalized hex color; cover.test.mjs | Independent stored-XSS review |

## Release gates
Record severity, reproduction, affected boundary, fix, regression and residual risk for each finding. Before public launch: independent OWASP ASVS assessment, actual dependency/SBOM review, rate-limit and resource exhaustion checks in an authorized staging environment, backup restoration, monitoring and incident drill. Do not run unbounded load or fuzzing against third-party services.

References: [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), [Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), [ASVS](https://owasp.org/www-project-application-security-verification-standard/).
