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
- [ ] Complete Latvian and English UI, validation, emails and policy drafts; persistent language choice and browser-language default. Do not translate customer event names or custom labels.
- [x] Local registration: first name, surname, email, password confirmation, country calling code and phone. Country inference is a suggestion, never reliable geolocation.
- [x] Editable local profile and authenticated local password change with session invalidation tests. Remote identity-provider password change remains gated.
- [ ] Personal/business account details. Collect billing address and relevant company/tax details at checkout when needed; avoid unnecessary registration data.
- [ ] Google sign-in adapter and configuration guide; real OAuth acceptance only with new staging services. No GitHub sign-in.

## Documentation and security
- [x] Remove unnecessary authorship/tool references from product-facing prose. Preserve required third-party notices and truthful evidence; do not fabricate authorship or testing history.
- [x] Threat model and repeatable local tests mapped in SECURITY-VERIFICATION.md: authorization/IDOR, injection/XSS, CSRF, session/auth abuse, upload content/path/size, quota concurrency, webhook forgery/replay, dependency and secret checks.
- [ ] Document findings, severity, fixes and residual risks. No claim of an unhackable product or an independent audit.
- [ ] Real R2/Supabase/OAuth/payment integration, device testing and independent penetration test after local acceptance and explicit approval.

## Decisions
Phone source images are optimized before storage; uploaded source size does not equal stored size. Photo and byte caps both apply, including thumbnails. Address/tax requirements need operator and jurisdiction approval before billing launch. A timezone may match multiple countries and cannot prove residence.
## Current language status
LV/EN preference, locale-aware dates, navigation, pricing cards, account form labels and default guest photo actions are implemented. The home-page source templates, pricing explanation, feature descriptions and FAQ now have Latvian translations. Source-template translation deliberately leaves interpolated customer content untouched; two regression tests cover this boundary. Browser checks cover Latvian home, FAQ and feature text. Remaining account/organizer/guest messages, emails and legal drafts are not yet fully translated; the complete localization item stays unchecked. The Google sign-in flow is not implemented or displayed as a working button.

Latest local verification: 47 backend/unit tests passed, public build validated 28 files, and the refinement browser suite passed (pricing alignment, gallery controls, covers and localized public pages). This is not an independent penetration test. No provider setup, commit, push or deployment was performed.

## Optional design preview
Open `http://127.0.0.1:5700/?design=editorial`. Remove the query and reload to return to the normal treatment. The separate editorial-experiment.css affects public-page styling only, not data or permissions.
