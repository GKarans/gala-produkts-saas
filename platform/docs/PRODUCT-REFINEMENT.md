# Product refinement worklist

Local-only scope. No commit, push, deployment, paid subscription or connection to existing production services. Checked items require actual tests, not only planned implementation.

## Interface and media
- [x] Align pricing headings, descriptions, prices and actions on every pricing surface.
- [x] Explain photo-count and combined optimized-photo/thumbnail byte caps; measure sample sizes before advertising that every count fits.
- [x] Review trial capacity and enforce fair-use limits server-side.
- [x] Shared fixed-size gallery viewer with over-image arrows, touch swipe, keyboard navigation and backdrop dismissal.
- [x] Editable secondary guest photo-selection button label.
- [x] Three existing color presets plus arbitrary color picker with readable button text.
- [x] Five cover options: Garden gathering, Wedding toast, Party, Coastal celebration, City rooftop.
- [x] Optional isolated visual theme experiment, disabled by default and removable without changing product behavior.

## Languages and accounts
- [x] Complete Latvian and English UI, validation, emails and policy drafts; persistent language choice and browser-language default. Customer event names and custom labels remain untouched.
- [x] Local registration: first name, surname, email, password confirmation, country calling code and phone. Country inference is a suggestion, never reliable geolocation.
- [x] Editable local profile and authenticated local password change with session invalidation tests. Remote identity-provider password change remains gated.
- [x] Personal/business account details. Billing address and relevant company/tax details are collected at checkout instead of registration.
- [x] Google sign-in adapter and configuration guide. The control stays visible locally with an honest staging notice; real OAuth acceptance requires the new staging provider. No GitHub sign-in.

## Documentation and security
- [x] Remove unnecessary authorship/tool references from product-facing prose. Preserve required third-party notices and truthful evidence; do not fabricate authorship or testing history.
- [x] Threat model and repeatable local tests mapped in SECURITY-VERIFICATION.md: authorization/IDOR, injection/XSS, CSRF, session/auth abuse, upload content/path/size, quota concurrency, webhook forgery/replay, dependency and secret checks.
- [x] Document findings, severity, fixes and residual risks. No claim of an unhackable product or an independent audit.
- [ ] Real R2/Supabase/OAuth/payment integration, device testing and independent penetration test after local acceptance and explicit approval.

## Decisions
Phone source images are optimized before storage; uploaded source size does not equal stored size. Photo and byte caps both apply, including thumbnails. Address/tax requirements need operator and jurisdiction approval before billing launch. A timezone may match multiple countries and cannot prove residence.
## Current language status
LV/EN preference, locale-aware dates, public pages, organizer workspace, account and guest flows, API errors, service emails and legal drafts have Latvian catalogs. Source-template translation deliberately leaves interpolated customer content untouched, while the DOM catalog only replaces known product phrases. Regression tests cover this boundary, and browser checks cover Latvian public, legal and workspace routes. Google OAuth uses PKCE, encrypted HttpOnly state and the isolated Supabase Auth provider; enabling the Google provider and its redirect URLs remains a staging-owner configuration step.

QR print tools include four original Lumiq designs, square, A5 and table-card PNG output, and localized poster text. Organizers can open Canva's poster maker and upload the exported JPEG, PNG or WebP as a private event background. Customer uploads are never promoted to a shared template automatically; any future community library requires explicit consent, editable source cleanup, licensing review and moderation.

Latest local verification: 51 backend/unit/integration tests passed, the public build validated 43 files, and the isolated browser suite passed responsive journeys, pricing alignment, gallery controls, five covers, LV public/legal/workspace routes and accessibility checks. This is not an independent penetration test, and no external staging providers were configured or deployed during local verification.

## Optional design preview
The public site uses one supported Gathering-derived design system under the Lumiq brand. Experimental 3D and alternate editorial routes were removed to keep one coherent product surface.
