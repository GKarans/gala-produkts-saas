# Lumiq design concept

Local preview: http://127.0.0.1:5700/lumiq.html

An isolated new public homepage, not the earlier editorial CSS variation.
The existing homepage and operational application remain unchanged. Links to
registration, sign-in and legal pages intentionally enter the existing product.
Lumiq is a proposed name; domain availability and trademark clearance are not
confirmed. No registration, payment or deployment was performed.

## Implemented
- [x] New full-width composition, oversized wordmark, event imagery, pink closing
  band, dark pricing section and lime actions.
- [x] Local Three.js phone with textured screen, pointer rotation and horizontal
  drag to switch event scenes; explicit previous/next controls for keyboard use.
- [x] Simulated shutter with feedback; no camera permission or upload is requested.
- [x] Five local event scenes, LV/EN selection and shared canonical pricing data.
- [x] Static fallback image, capped pixel ratio, reduced idle motion preference,
  pause offscreen/background and renderer cleanup when leaving the page.
- [ ] Physical mobile-device performance and accessibility review before launch.
- [ ] Extend the approved identity to the remaining product pages after design acceptance.

References inspected: https://ellipsus.com/#introduction,
https://github.com/mona-sans, https://www.abtc.com/.
No logos, text or artwork from those sites are bundled.
Three.js distribution files are copied from the pinned installed package and
its MIT LICENSE is retained in public/vendor/three. On dependency updates,
refresh three.module.js and three.core.js together.

Run: node platform/tests/lumiq-browser.cjs (local preview must be running).
Screenshots are written to ignored platform/test-results.
