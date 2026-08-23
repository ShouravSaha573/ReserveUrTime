# MEMORY — Phase 12

Phase 12 is complete.

ReserveUrTime now has a unified cinematic/responsive/accessibility layer without changing business logic. Motion for React owns DOM/image/chrome animation; GSAP + Three.js/R3F/Drei still own true GLB exploded dishes. New shared cinematic behavior includes a spring scroll-progress indicator, route glint/entry treatment, accessible mobile navigation, skip-to-content, route announcements, Restaurant-card reveal/perspective/sheen, button polish, stronger focus-visible states, touch target sizing, mobile section-nav scrolling/snap, 3D small-screen refinements, reduced-motion and reduced-transparency fallbacks.

No new decorative runtime dependency was added in Phase 12. Phase 13 is next: Security/Performance/Reliability/Full QA. Phase 13 should add no decorative library and must profile Motion, Photo Explode and WebGL/GSAP behavior on desktop/mobile/reduced-motion.


## Post-Phase-12 localhost corrective checkpoint
A local runtime regression was fixed: Vite now opens on `http://localhost:5173`, local API traffic uses `/api` proxied to the separately running `http://localhost:5000` backend, and development backend trust accepts the exact localhost/127.0.0.1 loopback equivalent. Homepage Restaurant failures are no longer silently rendered as an empty list. Added `diagnose:restaurants` and `test:local-runtime`. Phase 13 is still next.


## Later corrective checkpoint
After Phase 12 local testing, the project fixed a legacy menu-category CastError that blocked the public 3D menu, added non-destructive demo runtime repair/diagnosis, aligned the 3D frontend with React19/R3F9/Drei10/Three r185, and updated Express/Mongoose/path-to-regexp security baselines. Phase 13 remains next. See `3D_RUNTIME_DEPENDENCY_FIX.md`.
