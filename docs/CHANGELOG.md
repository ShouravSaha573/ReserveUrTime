# 2026-08-19 — Phase 11
- Added verified Customer reviews with Restaurant replies and Platform moderation.
- Added Platform-vs-Restaurant ContactMessage routing, signed-in Customer history and anonymous status lookup.
- Added Customer/Restaurant Admin notifications and Order/Reservation/review/contact notification events.
- Added communication TTL retention, rate limiting and privacy/RBAC protections.
- Added Phase 11 smoke test and expanded connection-flow test.

# CHANGELOG.md

## 2026-08-11 — Phase 1 completed
- Implemented Platform Admin (`platform_admin`) role/login/dashboard foundation.
- Implemented Restaurant Admin (`restaurant_admin`) role/login/dashboard foundation.
- Added `User.restaurantId` restaurant assignment.
- Added server-side Platform Admin, Restaurant Admin and managed-restaurant guards.
- Added Restaurant Admin scoped read-only summary.
- Updated seed to migrate legacy `admin` and seed a development Restaurant Admin.
- Added Phase 1 RBAC smoke tests.
- Phase 2 is now next.

## 2026-08-10 — Planning/Architecture Revision
- Project renamed to ReserveUrTime.
- Old Admin renamed Platform Admin.
- Added future Restaurant Admin role and strict restaurant scope.
- Split platform representation from restaurant internal operations.
- Added approval workflow for Restaurant Admin requests to change restaurant name/listing image.
- Added required 3D exploded view / layered assembly transition.
- Rebuilt phase roadmap based on actual implemented baseline.

## Existing baseline inherited
- customer auth;
- public restaurant discovery/detail;
- reservation system;
- homepage mouse glow + galaxy;
- old admin auth foundation/minimal summary.


## 2026-08-11 — Platform management expansion
- Standardized human-visible names to **Platform Admin** and **Restaurant Admin**.
- Platform Admin can add/edit/remove/restore Restaurant listings.
- Platform Admin can edit the public listing image URL/path and platform-facing Restaurant information.
- Platform Admin can create/edit/remove/disable Restaurant Admin accounts.
- Platform Admin can assign/reassign Restaurant Admin accounts to active Restaurants.
- Restaurant removal is soft/non-destructive to preserve internal Restaurant data.
- Platform Admin remains prohibited from Restaurant-internal menu/3D/table/reservation/order management.
- Phase 2 split into Phase 2A (completed management foundation) and Phase 2B (Homepage CMS remaining).


## 2026-08-11 — Galaxy Restaurant Search enhancement
- Added public Restaurant search by Restaurant name or Cuisine.
- Added debounced/cancelled live suggestions on homepage.
- Added URL-backed filtered Restaurant directory search.
- Added lightweight CSS 3D tilt/orbits and galaxy warp transition.
- Added backend query cap, regex escaping and result limits.
- No new package added.


## 2026-08-15 — Phase 2B Homepage CMS + MVC migration
### Added
- `SiteContent` model.
- public homepage CMS API.
- Platform Admin Homepage CMS editor.
- `AuditLog` model/service/API/view.
- bounded Galaxy CMS presets.
- Restaurant featured/listing order controls.
- `frontend/` + `backend/` folder architecture.
- explicit MVC documentation.
- Phase 2B CMS smoke test.

### Changed
- old `frontend/` folder renamed to `frontend/`.
- old `backend/` folder renamed to `backend/`.
- root npm workspaces/scripts updated.
- Navbar/HomePage/Footer/Galaxy consume data-driven CMS content.
- public Restaurant ordering follows Platform Admin listing settings.
- Phase 2B marked DONE; Phase 3 marked NEXT.

## Phase 3 + Independent MVC startup
- Removed root npm workspace/concurrently dependency from the deliverable architecture.
- Frontend and backend are now independently installed and started.
- Added RestaurantProfile model and Restaurant Admin profile editor.
- Added ListingChangeRequest model.
- Added Restaurant Admin name/listing-image request UI and history.
- Added Platform Admin approval inbox with current-vs-proposed preview.
- Added atomic MongoDB transaction for approval application.
- Added Phase 3 smoke test.


## 2026-08-15 — Phase 4 Restaurant Internal Operations CMS
### Added
- `MenuCategory` model + Restaurant Admin CRUD.
- `MenuItem` basic dish model + Restaurant Admin CRUD.
- `GalleryItem` model + Restaurant Admin CRUD.
- Dining Table create/edit/remove/restore UI and APIs.
- protection against disabling/removing tables with upcoming active reservations.
- Restaurant Admin reservation schedule/filter/status management.
- shared Restaurant Admin section navigation.
- Phase 4 scoped-operation smoke test.
- seed sample categories/dish/gallery items using `$setOnInsert`.

### Preserved boundaries
- Platform Admin has no Restaurant-internal operational CRUD API.
- Restaurant Admin scope always derives from authenticated `restaurantId`.
- real 3D model fields remain deferred to Phase 6/7.

### Next
Phase 5 — Public Restaurant Experience + Basic Menu/Search/Filter.

## Phase 5 — Public Restaurant Experience + Basic Menu/Search/Filter
- Added public `/restaurant/:slug/experience` API.
- Added public `/restaurant/:slug/menu` API.
- Added service-layer aggregation for public Restaurant profile/menu/gallery.
- Added public dish search by name, description and ingredients.
- Added active category filtering.
- Public data exposes active/available dishes and published gallery only.
- Rebuilt Restaurant detail page into a restrained editorial Restaurant experience.
- Added dedicated `/restaurant/:slug/menu` page.
- Added debounced URL-backed menu search and request cancellation.
- Added fallback/error/loading/empty states.
- Expanded safe seed menu data for public Phase 5 testing.
- Added `npm run test:phase5` backend smoke test.
- Explicitly stopped before the GLB/GLTF exploded 3D phase.


## 2026-08-18 — Animation/icon source research + remaining-phase mapping
- Investigated the 18 requested animation/icon/design sources.
- Added `ANIMATION_ICON_SOURCE_STRATEGY.md` with source-by-source recommendations.
- Added `REMAINING_PHASE_ANIMATION_MAP.md` for Phase 6–14.
- Locked Phase 6 core to custom Three.js + React Three Fiber + Drei + GSAP + real GLB/GLTF.
- Classified Awwwards/GetLayers/Animmaster/Casberry/OriginKit as 3D/motion research sources.
- Classified Vengeance/Aceternity/21st/Skiper as selective React UI-motion sources.
- Classified Mobbin/ScreensDesign as UX flow/state references and Design Spells as micro-interaction inspiration.
- Selected useAnimations as primary animated-icon candidate and Lottieflow as secondary.
- Added third-party animation licensing/performance governance to the permanent security/performance document.
- No runtime code or dependencies were added in this research update.

## 2026-08-18 — Phase 6 real GLB exploded-dish prototype
- Added Three.js + React Three Fiber 8 + Drei + GSAP frontend dependencies.
- Added real ~90 KB `coal-roasted-pumpkin.glb` with seven meaningful named layers.
- Added `MenuItem.threeD` metadata contract with model/poster/camera/layer explosion offsets.
- Added public 3D dish metadata endpoint through route/controller/service MVC layers.
- Added lazy-loaded `/restaurant/:slug/menu/:dishSlug/3d` page.
- Added automatic GSAP exploded → assembled timeline and manual replay controls.
- Added OrbitControls, subtle idle float, reduced-motion handling, DPR cap and WebGL/poster/DOM fallback.
- Kept the Phase 5 ordinary public menu as permanent fallback.
- Added `PHASE_6_IMPLEMENTED.md`, `THREE_D_ASSET_PIPELINE.md` and Phase 6 smoke test.
- Phase 7 is now next; full Previous/Next 3D menu has not been started.

## 2026-08-18 — Phase 6 setup conflict hotfix
- Fixed `setup:phase6` MongoDB update-path conflict on `isActive`/defaulted fields by replacing mixed `$setOnInsert` + `$set` upsert logic with a find/create-or-save flow.
- No database reset is required; rerun `npm run setup:phase6`, then `npm run diagnose:phase6`.

## 2026-08-18 — Admin credential synchronization fix
- Added `npm run diagnose:auth` to verify management accounts against `backend/.env` without exposing passwords.
- Added `npm run sync:admin-credentials` to refresh Platform Admin and Restaurant Admin bcrypt hashes, roles, active state, and Restaurant Admin assignment.
- Kept credential synchronization explicit rather than running on every server startup.

## 2026-08-19 — Restaurant Admin 3D animation-control requirement locked
- Added a Phase 7 requirement for Restaurant Admin to configure Exploded Layers animation per 3D-enabled dish in the assigned Restaurant.
- Planned controls: named-layer participation, XYZ explode offsets, sequence/order, duration, stagger/delay, allowlisted easing, preview and reset.
- Confirmed Platform Admin has no Restaurant-internal 3D-animation editor.
- Added security rule forbidding arbitrary JS/CSS/shader/expression execution and requiring bounded server validation + `req.managedRestaurantId` scoping.
- Added `RESTAURANT_ADMIN_3D_ANIMATION_CONTROL.md` and a dedicated flow diagram.


## 2026-08-19 — Phase 7 full 3D menu + Restaurant Admin editor
- Added Restaurant-level 3D menu API and routes.
- Added Previous/Next/dot/mobile-swipe navigation with outgoing explode transition.
- Added current/previous/next GLB preloading.
- Added three more Ember House GLB demo assets so all four seeded dishes are 3D-enabled.
- Added `MenuItem.threeD.animation` and layer `enabled/sequence` metadata.
- Added Restaurant Admin 3D Animation Editor with live preview.
- Added restaurant-scoped backend validation, easing allowlist, numeric bounds and audit log.
- Added `setup:phase7`, `diagnose:phase7`, `test:phase7`.
- Updated docs/memory; Phase 8 is next.


## 2026-08-19 — Phase 8 favourites + Customer dashboard/profile
- Added `Favorite` model supporting Restaurant and menu-item targets with partial unique indexes.
- Added Customer MVC controller/service/routes under `/api/customer`.
- Added favourites list/add/remove APIs and server-side active/available target validation.
- Added optimistic favourite UI with rollback on failed writes.
- Added save controls to Restaurant cards, Restaurant detail, ordinary menu items and full 3D menu dishes.
- Added `/dashboard`, `/dashboard/favourites`, `/dashboard/profile`; preserved `/dashboard/reservations`.
- Added dashboard saved/reservation counts and nearest upcoming reservation.
- Added Customer name/phone editing while keeping login email read-only.
- Added Phase 8 smoke test and customer favourites/dashboard diagram.
- No new heavy motion dependency was added. Phase 9 is next.


## 2026-08-19 — Phase 9
- Added Customer Cart and Order models.
- Added one-Restaurant cart enforcement and explicit replacement path.
- Added server-authoritative price calculations.
- Added idempotent transaction-based checkout with immutable snapshots.
- Added Customer Cart/Orders pages and Add-to-Cart in DOM + 3D menus.
- Added Restaurant Admin order queue/status workflow + dashboard counts.
- Added Phase 9 docs/diagram/smoke test.
- At this historical Phase 9 checkpoint, Phase 10 SSLCOMMERZ became next (implemented later in the Phase 10 entry below).

## 2026-08-19 — Pre-Phase 10 security/privacy hardening
- audited authentication/RBAC, cross-origin mutations, query/input handling, Restaurant scoping, cart/order/reservation concurrency, 3D editor safety, media/privacy/logging, dependency versions and deployment headers;
- hardened unsafe browser mutations with trusted Origin + custom request marker;
- replaced unconditional proxy trust with `TRUST_PROXY` configuration;
- added production secret/HTTPS startup validation and production `__Host-` auth cookie naming;
- added JWT `authVersion` session revocation;
- added bcrypt password byte bounds and stronger new-password rules;
- added safe relative/allowlisted HTTPS public media validation + stored-data audit command;
- clarified Restaurant profile contact fields as public customer-facing data;
- minimized Order response PII/status-history actor data;
- replaced new raw audit IP storage with keyed hashes + retention, added sensitive audit-field redaction;
- minimized production error logging and added no-store sensitive API headers;
- made Order/Reservation state transitions conditional/atomic;
- added same-Customer active reservation slot uniqueness;
- migrated checkout idempotency uniqueness to Customer + checkout key;
- upgraded Vite 5.4.14 to 8.2.1 and plugin-react 6.0.5; locked dev/preview to localhost;
- added strict boolean validation, Phase8/9 seed-reset cleanup, order-note privacy wording and explicit X-Powered-By disable;
- added `test:security`, `test:flows`, `migrate:security`, `audit:data-security`, `audit:deps`;
- added `PRE_PHASE10_SECURITY_AUDIT.md` and `PHASE10_PAYMENT_SECURITY_GATE.md`;
- At this historical pre-payment checkpoint, Phase 10 remained NEXT; the implementation was added later, while the same local Atlas/dependency/build/manual gates remain required for runtime acceptance.

## 2026-08-19 — Phase 10 SSLCOMMERZ Sandbox payment
- Added `PaymentAttempt` model and Phase 10 payment configuration/service/controller/routes.
- Added Customer server-side SSLCOMMERZ session initiation, attempt history and reconciliation APIs.
- Added exact IPN/success/fail/cancel callback routes outside browser-origin marker; paid state still requires server-to-server gateway validation/query.
- Added transaction/amount/BDT/reference matching, risk hold, replay idempotency, duplicate-paid detection and atomic Order paid update.
- Added Order payment linkage fields and Customer billing-address profile fields.
- Updated Customer Cart/Orders and Restaurant Admin Orders for hosted payment/read-only verified status.
- Added `test:phase10` and `diagnose:phase10`.
- Updated payment/security/docs/memory and marked Phase 11 NEXT.
- Full IPN/Atlas/dependency/Vite/Sandbox E2E remains a local environment gate.

## 2026-08-19 — Motion + Photo Explode enhancement
- Added Motion for React (`motion`).
- Added Motion-powered 2.5D Photo Explode for normal dish images.
- Added Restaurant Admin image upload with PNG/JPEG/WebP magic-byte validation and 6 MB cap.
- Added `/restaurant-admin/photo-explode` editor with live preview and bounded controls.
- Normal menu image uploads automatically enable Photo Explode.
- Public menu renders interactive Photo Explode where enabled.
- True 3D GLB layers gained per-layer rotation X/Y/Z and explode scale; GSAP now animates position/rotation/scale together.
- Added setup/test commands and Restaurant Admin image guide.
- Phase 12 remains next.



## 2026-08-19 — Phase 12 cinematic UX + responsive/accessibility polish
- Added Motion spring scroll progress and restrained route-change glint/entry treatment.
- Added global skip-to-content and polite route-change announcement.
- Rebuilt mobile primary navigation as an accessible Motion drawer with role-aware links and scroll lock.
- Added Restaurant-card viewport reveal, fine-pointer perspective and sheen.
- Added consistent nav/button/input/focus micro-interactions and minimum key touch-target sizing.
- Added mobile scroll/snap treatment for Customer and Restaurant Admin section navigation.
- Refined small-screen 3D stage/controls.
- Added reduced-motion, coarse-pointer and reduced-transparency fallbacks.
- Added `test:phase12`, Phase 12 docs/memory/diagram.
- No business logic or payment/RBAC/3D persistence rules changed. Phase 13 is next.


## 2026-08-19 — Localhost + Restaurant loading corrective update
- Fixed `127.0.0.1:5173` frontend vs `localhost:5173` backend trusted-origin mismatch.
- Vite now runs on `localhost` and proxies same-origin `/api` requests to the separate backend at `localhost:5000`.
- Added safe development loopback alias handling without broadening production origins.
- Homepage now has Restaurant loading/error/retry/true-empty states instead of swallowing API failures.
- Added `diagnose:restaurants` and `test:local-runtime`.
- Lazy-loaded the Restaurant Admin 3D editor and added vendor chunk groups to reduce the oversized entry bundle.


## 2026-08-19 — 3D runtime + dependency hardening corrective checkpoint
- Fixed public menu/3D `Invalid record id.` crash caused by malformed legacy `MenuItem.categoryId` + Mongoose populate.
- Replaced public category populate with safe explicit category joining.
- Added `diagnose:demo-runtime` and non-destructive `repair:demo-runtime` to restore canonical Ember/Kori/Verde menus, category references, Ember four-GLB metadata and missing Photo Explode defaults.
- Hardened normal seed so canonical demo dish category/active/available fields are repaired on repeated seed.
- Upgraded React/ReactDOM 19.2.8, React Router DOM 7.18.2, R3F 9.7.0, Drei 10.7.8, Three 0.185.1 and Motion 13.1.0.
- Upgraded Express 4.22.2 and Mongoose 8.22.1; forced path-to-regexp 0.1.13.
- Added Multer `fieldNestingDepth: 1`.
- Split Three core, R3F and Drei vendor chunks.
- Added `test:runtime-repair`, `test:dependency-baseline`, and production audit scripts.
- Phase 13 remains next; local clean-install `npm audit` and dependency-backed build are required before claiming the exact installed tree is clean.

## 2026-08-19 — Exploded 3D core + frontend audit corrective fix
- Confirmed the real four-GLB R3F/Drei/GSAP exploded system was present; local failure happened in the backend before viewer mount.
- Replaced public Restaurant/category/menu/profile/gallery Mongoose read path with raw native collection reads to eliminate legacy-data cast failures.
- Safe category join now supports ObjectId and historical slug references.
- Added canonical Phase 7 runtime merge so stale Ember demo docs cannot remove required GLB layer sets.
- Made Restaurant Admin menu/3D/Photo/image reads legacy-category resilient.
- Increased default demo explode choreography visibility to 1.15s / 0.075s / 650ms with position + rotation + scale.
- Added `test:3d-core`; demo diagnosis now exercises actual public 3D service readiness.
- Remediated known Tailwind 3 development audit path with Tailwind 3.4.19, Sucrase 3.35.1 and glob 10.5.0 override.
- Split Drei transitives into separate Vite profiling chunks.
- Phase 13 remains next.

