# Twenty improvements status

1. **Implemented:** Lumiq brand, original mark and product-wide naming.
2. **Implemented in product:** LV/EN UI foundation, API error locale, account locale and localized service email paths. Final human copy review remains a release check.
3. **Implemented:** Google OAuth PKCE with encrypted HttpOnly state and Supabase verified-identity linking. Provider console setup requires the owner.
4. **Prepared:** isolated staging topology and exact setup guide. New external accounts/secrets are owner actions.
5. **Decided and prepared:** managed Node web service plus separate background worker using `render.yaml`.
6. **Implemented:** PR and `main` CI plus CodeQL. GitHub branch protection must be switched on in repository settings.
7. **Internal controls implemented; external gate open:** audit pack is ready, but only an independent assessor can produce the penetration-test report.
8. **Implemented tooling; cloud drill gate open:** backup, checksum verification and empty-target restore scripts are ready.
9. **Implemented:** stable 1,000-photo cursor capacity test and streaming ZIP upload. A dated staging concurrency run remains required.
10. **Implemented foundation:** structured logs, request IDs, database health and alert webhook. Provider dashboards/on-call destinations need staging credentials.
11. **Implemented:** IndexedDB upload source queue survives refresh without storing guest tokens.
12. **Implemented:** authenticated, bounded HEIC/HEIF-to-WebP conversion with clear fallback errors.
13. **Implemented:** `(created_at,id)` cursor pagination for both sort directions.
14. **Improved:** onboarding, curation, upload persistence, locale and contracts extracted into modules. Further marketing/workspace decomposition is maintenance work, not a launch blocker.
15. **Implemented:** shared media constants and structured contracts for critical mutations.
16. **Automated:** axe, keyboard entry, reduced motion and 200% zoom. Physical VoiceOver/NVDA sign-off remains an external release check.
17. **Implemented:** first-event checklist and a 15-minute, read-only QR preview that works before publication without consuming an allowance.
18. **Implemented:** favorites, gallery cover and bulk hide/restore with owner-only auditing.
19. **Implemented:** high-error-correction QR plus four original Lumiq table-card designs, a standalone square QR PNG, a Canva handoff and private final-design import. The organizer can drag the title and QR, choose among ten bundled Google Fonts, adjust sizes, save the layout, download the result, and print only the finished design. Native text is transparent over the artwork; the QR retains a light quiet zone. An uploaded Canva file is treated as the complete design and is rendered unchanged, with no Lumiq text or QR overlay. Customer designs are not reused without an explicit future consent and moderation process. Physical print/scan evidence remains a release check.
20. **Implemented model and billing collection:** 100/10,000-customer calculator, billing address/tax ID collection and legal/pilot gates. Tax approval and paid pilot cannot be completed in source code.
