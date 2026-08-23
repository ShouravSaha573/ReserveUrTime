# PERFORMANCE.md

- Debounce search, cancel stale GETs, paginate lists.
- Index restaurantId + common filters.
- Canvas galaxy uses capped DPR and reduced mobile stars.
- 3D loads current/next/previous only; lazy others.
- Compress GLB/textures; use poster fallback.
- Dispose geometries/materials/textures/timelines.
- Approval/CMS changes invalidate relevant cached public data, not whole site.


## Phase 7 3D performance rule
The full 3D menu preloads only the current, previous and next dish model URLs. The ordinary DOM menu remains available, Canvas DPR remains capped, and the app must not add menu-wide particle/shader effects before profiling.


## Phase 9 cart/order performance notes
Cart responses are compact and server-calculated. Order lists are capped (Customer 100, Restaurant Admin 250) rather than unbounded. No new animation library was added. Cart badge state is shared through one Customer Cart context instead of repeated per-component fetches.

## Pre-Phase 10 tooling/performance security checkpoint
Frontend tooling moved to Vite 8.2.1 + plugin-react 6.0.5. Local dev/preview binds to `127.0.0.1` and strict ports; filesystem access remains strict. Because Vite 8 changes the bundler to Rolldown, run `npm install` and `npm run build` locally before accepting Phase 10 runtime readiness and preserve the generated lockfile. Do not expose Vite dev/preview servers to public/LAN interfaces.



## Phase 10 payment performance/reliability
Payment adds no new frontend animation/runtime library. Gateway calls have bounded request timeout, payment attempts are idempotent, Customer can explicitly reconcile pending state, and duplicate callbacks do not create duplicate paid state. Payment-critical UI stays lightweight and clarity-first.


## Phase 11 performance
No new animation/runtime library was added. Review/message lists are capped (100–300 depending on scope), notification lists are capped, and TTL indexes reduce indefinite communication-data growth. Public Restaurant reviews load as a separate request rather than expanding the main Restaurant experience payload.

## Motion/Photo Explode performance rule
Motion is the approved DOM/image animation layer. Photo Explode is capped at 16 DOM layers per active visual and respects reduced motion. Avoid auto-playing many Photo Explode dishes simultaneously in long lists. The true 3D viewer stays lazy and uses R3F/GSAP only when its route is opened.



## Phase 12 cinematic boundary
Phase 12 adds presentation-only Motion/CSS behavior. It does not change authentication, payment, RBAC, Restaurant scoping or stored 3D configuration. Reduced-motion and coarse-pointer fallbacks prevent hover/continuous effects from becoming required interaction. Phase 13 must profile the new scroll/progress/nav/card effects together with Photo Explode and WebGL/GSAP, remove any unnecessary animation, and verify cleanup/layout-shift/mobile GPU behavior.


## Post-Phase-12 local bundle/runtime correction
- Restaurant Admin 3D animation editor is lazy-loaded so Three/R3F/Drei are not forced into the initial route graph.
- Vite manual vendor chunks separate React/router, Motion, GSAP and Three/R3F groups.
- Local frontend uses same-origin `/api` proxy to avoid direct cross-origin browser API calls during development.
- Re-run `npm run build` locally and inspect resulting chunk sizes before Phase 13 final profiling.


## Pre-Phase-13 3D bundle note
The 3D stack is now React19/R3F9/Drei10/Three r185. Vite splits `three-core`, `r3f-vendor` and `drei-vendor` instead of one combined `three-vendor` chunk. 3D routes remain lazy-loaded and only current/previous/next models may preload. Phase 13 must measure actual transfer/parse/GPU/memory cost rather than suppressing warnings by raising the chunk-size limit.

## Exploded 3D core performance checkpoint
The full 3D route remains lazy. Vite vendor grouping now separates Three core, R3F, Drei, three-mesh-bvh, camera-controls, Troika, GSAP, Motion and React groups instead of forcing Drei's major transitives into one named chunk. This improves profiling granularity but does not claim the 3D stack is small. Phase 13 must measure the real clean production build, route-level transferred bytes, parse/execute time, model loading, WebGL GPU/memory and mobile thermal behavior. Do not silence warnings by only increasing `chunkSizeWarningLimit`.

