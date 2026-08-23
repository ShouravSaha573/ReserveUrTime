# Memory — Exploded 3D Core Runtime Fix

- The four real Ember House GLB assets and GSAP/R3F exploded viewer are implemented; local “3D menu unavailable / Invalid record id.” was a backend legacy-data query failure before WebGL mounted.
- Public Restaurant/menu/3D reads now use native Mongo collection reads end-to-end to avoid Mongoose casting historical `categoryId`/foreign-key shapes.
- Categories are safely joined by ObjectId or legacy slug.
- Canonical Ember Phase 7 3D manifest is a runtime fallback; missing/partial old Atlas `threeD` data cannot erase the four demo exploded-layer sets.
- Restaurant Admin menu/3D/Photo Explode/image-update reads also avoid hydrating legacy-broken MenuItem records while retaining `req.managedRestaurantId` ownership validation.
- Recommended true-3D timing: 1.15s duration, 0.075s stagger, 650ms exploded hold, `power3.inOut`, restrained rotation/scale.
- Frontend Tailwind 3 audit remediation: Tailwind 3.4.19 + PostCSS 8.5.26 + Autoprefixer 10.5.4 + Sucrase 3.35.1 + glob 10.5.0 override. Verify locally with a clean install and `npm audit`; never force-fix blindly.
- New regression: `npm run test:3d-core`.
- Expected diagnostic: `Public 3D service readiness: 4/4` and `Public 3D service cast-safe: true`.
- Phase 13 remains NEXT.
