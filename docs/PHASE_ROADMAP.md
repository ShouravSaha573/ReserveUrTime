# ReserveUrTime Phase Roadmap

## Phase 0 — Existing working baseline — DONE
Customer auth, public homepage, galaxy, Restaurant discovery, reservation/history/cancel.

## Phase 1 — Three-role RBAC — DONE
Customer, Platform Admin, Restaurant Admin and backend Restaurant scoping.

## Phase 2A — Platform Resource Management — DONE
Platform Admin Restaurant CRUD/soft removal and Restaurant Admin account management.

## Galaxy Restaurant Search — DONE
Search Restaurant name/Cuisine with debounced API + lightweight galaxy/3D transition.

## Phase 2B — Homepage CMS — DONE
Platform Admin controls data-driven homepage/public presentation.

## Phase 3 — Restaurant Admin Profile + Listing Change Approval — DONE
Restaurant profile, name/listing-image requests, Platform Admin approve/reject workflow.

## Phase 4 — Restaurant Internal Operations CMS — DONE
Menu Category CRUD, basic Dish CRUD, Dining Tables, Restaurant reservations, internal gallery.

## Phase 5 — Public Restaurant Experience + Basic Menu/Search/Filter — DONE
Ikoyi-inspired public Restaurant page, profile/story/contact/hours, active categories/available dishes, search/filter, published gallery and permanent DOM menu fallback.

## Phase 6 — 3D Asset Pipeline + ONE Exploded-Assembly Prototype — DONE
**Core engine:** Three.js + React Three Fiber 8 + Drei + GSAP.

Completed:
- real local GLB prototype for Ember House → Coal-Roasted Pumpkin;
- named layer convention;
- `MenuItem.threeD` metadata contract;
- public 3D metadata endpoint through MVC service/controller layers;
- lazy-loaded 3D route;
- GSAP exploded → assembled timeline from captured GLB transforms;
- replayable explode/assemble controls;
- OrbitControls + subtle idle float;
- WebGL/poster/DOM fallback;
- reduced-motion path;
- DPR cap and single-model loading;
- Phase 6 smoke test.

## Phase 7 — Full Real 3D Menu + Restaurant Admin 3D Animation Editor — DONE
Implemented:
- restaurant-level full 3D menu route and public API;
- four Ember House real GLB demo dishes with named layers;
- Previous/Next + dot navigation;
- outgoing disassembly before dish switch and incoming configured assembly;
- current/previous/next GLB preloading only;
- mobile horizontal swipe navigation;
- shared WebGL/poster/DOM/reduced-motion fallback rules;
- Restaurant Admin 3D Animation Editor for own Restaurant dishes;
- layer participation, sequence, bounded XYZ offsets, duration, stagger, allowlisted easing, auto-assemble delay, float/rotation intensity;
- live local preview, Explode/Assemble preview, revert and recommended timing;
- restaurant-scoped backend validation and audit logging;
- Phase 7 setup/diagnose/smoke-test commands.

Core engine remains custom Three.js + React Three Fiber + Drei + GSAP. External sources remain selective interaction/design references rather than runtime dependencies by default.

## Phase 8 — Favourites + Customer Profile/Dashboard — DONE
Implemented:
- Customer favourites for active Restaurants and active/available dishes;
- favourite controls on Restaurant cards, Restaurant detail, ordinary menu and full 3D menu;
- safe Customer-login `returnTo` for protected save actions;
- optimistic save/remove with rollback after failed writes;
- `/dashboard`, `/dashboard/favourites`, `/dashboard/reservations`, `/dashboard/profile`;
- saved counts, reservation counts and nearest upcoming reservation;
- safe name/phone profile editing with login email read-only;
- no new heavy motion dependency; small reduced-motion-safe save feedback only.

References used as design guidance: Mobbin + ScreensDesign for dashboard/favourites flows and Design Spells-style restrained micro-feedback.

## Phase 9 — Cart + Orders + Restaurant Order Management — DONE
Implemented:
- server-backed Customer cart;
- one-Restaurant-per-cart rule with explicit replace confirmation;
- Add-to-Cart from ordinary and full 3D menus;
- quantity/update/remove/clear flows;
- server-calculated price/line/subtotal values;
- idempotent `checkoutKey`;
- MongoDB transaction for Order create + Cart clear;
- immutable Customer/Restaurant/dish price snapshots;
- Customer order history + safe `placed + unpaid` cancellation;
- Restaurant Admin Restaurant-scoped order queue/status transitions;
- payment status schema prepared but payment gateway deferred to Phase 10.

References: Mobbin/ScreensDesign for flow clarity; restrained local micro-feedback only. No new animation dependency was required.

## Pre-Phase 10 Security/Privacy Gate — SOURCE HARDENING DONE; LOCAL VERIFICATION STILL REQUIRED
Source hardening is complete. The Phase 10 code was built on this hardened base. Before claiming local/live readiness, back up Atlas and run `migrate:security`, `audit:data-security`, security/flow/payment tests, dependency audits, the Vite 8 production build and manual regressions. See `PRE_PHASE10_SECURITY_AUDIT.md`.

## Phase 10 — SSLCOMMERZ Sandbox — DONE
Implemented:
- backend-only Sandbox credentials and server-side Create Session;
- server-authoritative stored Order total + `BDT`;
- dedicated `PaymentAttempt` with unique transaction/payment idempotency;
- hosted gateway redirect with expected-host validation;
- IPN + success/fail/cancel callbacks on a narrow gateway trust boundary;
- server-to-server Order Validation API + transaction-query reconciliation;
- transaction/order/Customer/PaymentAttempt/amount/currency matching;
- replay-safe/duplicate-safe verified payment processing;
- MongoDB transaction for PaymentAttempt verified + Order paid;
- gateway risk hold state;
- Customer Profile billing contact fields, Pay/Retry/Reconcile UI;
- Restaurant Admin payment state read-only and fulfilment allowed only after verified paid;
- no PAN/CVV/card-secret collection or storage;
- `test:phase10` and `diagnose:phase10`.

Payment-critical UI remains clarity-first with no new decorative animation dependency. Full IPN testing requires a public HTTPS callback URL; local dependency/build/Atlas/Sandbox E2E validation remains a local gate.

## Phase 11 — Reviews, Contact/Messages, Notifications — DONE
Implemented:
- verified-experience Customer reviews (completed reservation or completed paid Order);
- one review per Customer per Restaurant;
- public privacy-safe review output;
- Restaurant Admin replies for own Restaurant only;
- Platform Admin hide/republish moderation;
- Platform-vs-Restaurant targeted ContactMessage routing;
- signed-in Customer message history + anonymous reference/email status lookup;
- Restaurant Admin and Platform Admin message inbox separation;
- Customer + Restaurant Admin read/unread notifications;
- Order/Reservation/review/contact notification events;
- 180-day notification TTL + 365-day contact-message TTL;
- no new heavy animation dependency.

Design references remain restrained: Mobbin/ScreensDesign for flow clarity and Design Spells/useAnimations-style status feedback without adding a new runtime library.

## Phase 12 — Cinematic UX Polish — DONE
Implemented without changing business logic:
- Motion spring scroll-progress indicator + restrained route glint/entry treatment;
- accessible animated mobile navigation with role-aware routes and body scroll lock;
- skip-to-content + route-change polite screen-reader announcement;
- stronger global keyboard focus-visible treatment and ~44px key touch targets;
- Restaurant card viewport reveal, fine-pointer perspective and one-pass sheen;
- refined CTA/nav/button/input micro-interactions;
- Customer + Restaurant Admin section navigation mobile horizontal scroll/snap;
- small-screen 3D stage/control refinement;
- reduced-motion, coarse-pointer and reduced-transparency fallbacks;
- no new decorative runtime dependency beyond the already-approved Motion layer.

See `PHASE_12_IMPLEMENTED.md` and `CINEMATIC_UX_SYSTEM.md`.

## Corrective checkpoint before Phase 13 — 3D runtime + dependency hardening — DONE
- repaired public legacy category-reference crash path;
- added safe public category joins;
- added canonical demo menu/3D non-destructive Atlas repair + diagnosis;
- aligned React/R3F/Drei/Three/Router/Motion versions;
- moved Express/Mongoose/path-to-regexp to current patched baselines for the identified advisories;
- bounded Multer nested multipart fields;
- split 3D vendor chunks further;
- Phase 13 still owns final installed-tree audit, browser/mobile E2E, GPU/WebGL profiling, Lighthouse/Web Vitals, concurrency/failure testing and production-readiness QA.

## Phase 13 — Security/Performance/Reliability QA — NEXT
Do not add decorative libraries. Profile animation CPU/GPU/network cost, reduced motion, mobile DPR/quality, offscreen suspension, cleanup and fallbacks.

## Phase 14 — Deployment + Final Documentation
Freeze animation stack, verify licences/attribution, record external component/asset sources, complete production regression tests and deployment docs.

## Rule
Do not begin a later phase until the current phase regression tests pass locally. Do not introduce a third-party animation/component merely because it looks impressive; it must have a defined UX role and meet the performance/licensing rules.

## Post-Phase 11 Motion + Photo Explode Enhancement — DONE
Before Phase 12, ReserveUrTime added Motion for React (`motion`) as the approved DOM/image motion layer while keeping GSAP/R3F/Drei for true 3D. Restaurant Admin can upload a PNG/JPEG/WebP dish image (≤6 MB) and automatically enable a **Photo Explode** 2.5D layered animation, then tune it at `/restaurant-admin/photo-explode`. True GLB dishes also gained per-layer rotation offsets and explode scale for richer mesh choreography. This Motion + Photo Explode checkpoint became the input to Phase 12. Phase 12 is now complete; see `PHASE_12_IMPLEMENTED.md` and `CINEMATIC_UX_SYSTEM.md`.

## Final corrective gate before Phase 13 — Exploded 3D core — DONE
- Public 3D is now independent of Mongoose casting of legacy menu/category records.
- Canonical four-dish Ember GLB metadata is restored at runtime if old Atlas demo metadata is incomplete.
- Restaurant Admin's saved valid animation overrides remain preserved.
- Tailwind 3 audit tooling is pinned to the patched Sucrase/glob path.
- New regression: `test:3d-core`; local gate: `diagnose:demo-runtime` must report public 3D readiness `4/4` and cast-safe `true`.
- Phase 13 remains responsible for installed-tree audit, full production build, browser/mobile/WebGL/GPU/concurrency QA.

