# Security audit pack

## Automated controls

- `npm run security`: tracked-file secret scan and high-severity dependency audit.
- `npm test`: authorization, CSRF, IDOR, rate-limit, payment signature, session encryption, quota, gallery revocation and cleanup tests.
- `npm run browser`: browser journeys, mobile layouts, keyboard entry, 200% zoom and axe checks.
- GitHub CodeQL on pull requests, `main`, and weekly schedule.
- Private R2 access, short-lived presigned writes, checksums, immutable reservations and read-time authorization.

## Independent engagement scope

An assessor with no implementation role must test the isolated staging origin. Scope includes authentication/OAuth account linking, password recovery, organizer IDOR, guest token boundaries, upload content and parser attacks, presigned URL replay, hidden-photo access, ZIP authorization, Stripe webhook replay, SSRF, XSS, CSRF, rate-limit bypass, security headers, dependency review and secret exposure. Supply test accounts for two organizers and one event per lifecycle state. Never supply production data.

Deliverables: dated methodology, tools and versions, reproducible evidence, severity and CVSS, affected endpoint, remediation guidance, retest result, and a signed executive summary. Critical/high findings block launch. Medium findings require an accepted owner and deadline. An internal automated run is not described as an independent penetration test.
