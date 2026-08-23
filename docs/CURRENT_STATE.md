# CURRENT_STATE.md

## DONE
- MERN + MongoDB Atlas foundation.
- Independent `frontend/` and `backend/` startup.
- Public cinematic homepage, galaxy background and mouse glow.
- Galaxy Restaurant Search by Restaurant name/Cuisine.
- Customer register/login/logout.
- Reservation availability/booking/history/cancel.
- Platform Admin and Restaurant Admin RBAC.
- Platform Admin Restaurant and Restaurant Admin account management.
- Platform Admin Homepage CMS.
- Restaurant Admin RestaurantProfile management.
- Restaurant name/listing-image approval workflow.
- Restaurant Admin Menu Category CRUD.
- Restaurant Admin basic Dish CRUD.
- Restaurant Admin Dining Table CRUD/status.
- Restaurant Admin reservation operations.
- Restaurant Admin internal Gallery CRUD.
- Public editorial Restaurant experience.
- Public Restaurant profile/story/contact/hours.
- Public active category + available dish menu.
- Public dish search by name/description/ingredient.
- Public category filter.
- Public published gallery.
- Permanent `/restaurant/:slug/menu` DOM fallback.
- Phase 6 `MenuItem.threeD` asset/animation metadata contract.
- One real GLB prototype: Ember House → Coal-Roasted Pumpkin.
- Named GLB layers + deliberate exploded X/Y/Z offsets.
- Lazy-loaded React Three Fiber/Drei viewer.
- GSAP automatic exploded → assembled animation + manual replay.
- WebGL/poster/normal-menu fallback.
- Reduced-motion + capped DPR behavior.
- Public 3D endpoint `/api/restaurants/:slug/menu/:dishSlug/3d`.
- Phase 6 smoke test.
- Phase 7 full Restaurant-level 3D menu endpoint and route.
- Four Ember House 3D-enabled demo dishes with separate GLB assets.
- Previous/Next + dot navigation across 3D dishes.
- Outgoing explode-before-switch transition and incoming configured assembly.
- Current/previous/next GLB preloading only.
- Mobile horizontal swipe between 3D dishes.
- Restaurant Admin 3D Animation Editor at `/restaurant-admin/3d-animation`.
- Restaurant-scoped per-dish layer participation, sequence, XYZ offsets, duration, stagger, easing, auto-assemble delay, float/rotation controls.
- Live admin 3D preview + Explode/Assemble + revert/recommended timing.
- Server bounds/mesh/easing/ownership validation and audit logging.
- Phase 7 smoke test.
- Phase 8 Customer favourites for active Restaurants and active/available dishes.
- Optimistic favourite save/remove with rollback on failure.
- Customer dashboard overview, favourites, reservations navigation and profile page.
- Customer dashboard reservation/favourite summary and nearest upcoming reservation.
- Customer name/phone profile editing with login email read-only.
- Phase 8 smoke test.
- Phase 9 server-backed Customer Cart.
- One-Restaurant-per-cart enforcement with explicit cross-Restaurant replacement confirmation.
- Add-to-Cart on ordinary DOM menu and full 3D menu.
- Server-side price/line/subtotal recalculation.
- Phase 9 Order model with immutable Customer/Restaurant/dish snapshots.
- Idempotent checkout key + MongoDB transaction for Order create/Cart clear.
- Customer `/dashboard/cart` and `/dashboard/orders`.
- Customer cancellation limited to `placed + unpaid|failed` orders; pending/paid cancellation is blocked from the normal path.
- Restaurant Admin `/restaurant-admin/orders` with Restaurant-scoped status management.
- Restaurant Admin cannot change payment status.
- Phase 9 smoke test.
- Phase 10 `PaymentAttempt` model and server-authoritative SSLCOMMERZ Hosted Checkout.
- Customer payment initiation/retry/reconcile APIs scoped by authenticated Customer ownership.
- Public SSLCOMMERZ IPN/success/fail/cancel routes with server-to-server validation/query before any paid state.
- Transaction/order/amount/BDT/reference verification, duplicate callback idempotency and risk hold.
- Atomic verified payment + Order paid update with `paidAt` and transaction linkage.
- Customer Profile billing contact fields required for payment session creation.
- Customer Cart/Orders SSLCOMMERZ payment UX and return-state messages.
- Restaurant Admin payment status is read-only and fulfilment is gated on `paid`.
- Phase 10 smoke test + payment diagnostics.
- Phase 11 verified-experience Customer reviews with Restaurant Admin reply and Platform Admin moderation.
- Public privacy-safe Restaurant review summary/list.
- Phase 11 Platform-vs-Restaurant ContactMessage routing, signed-in Customer message history and anonymous reference/email status lookup.
- Customer + Restaurant Admin in-app notifications with Order/Reservation/review/contact events.
- Phase 11 notification/contact TTL retention and contact-specific abuse rate limiting.
- Phase 11 smoke test + updated connection-flow test.

## NOT YET BUILT
- Restaurant Admin 3D asset upload/editor.
- Verified paid-order refund workflow (gateway-backed; not a manual status override).
- Transactional email/SMS/push delivery.
- Paid-order verified refund workflow.
- Final security/performance/reliability QA and deployment phases.

## CURRENT PHASE
Phase 12 complete in source.

## NEXT
Phase 13 — Security + Performance + Reliability + Full QA.

## 3D permanent rules
- The Phase 5 DOM menu is never removed.
- 3D is progressive enhancement.
- GLB named nodes are the assembled source of truth.
- Database stores explosion offsets/scene metadata, not duplicated absolute assembled transforms.
- Never preload the entire 3D menu.

## Animation source strategy
Read `ANIMATION_ICON_SOURCE_STRATEGY.md` and `REMAINING_PHASE_ANIMATION_MAP.md`. Core food 3D remains custom Three.js/R3F/Drei/GSAP; external libraries/sites are selective references/support only.

### Admin credential synchronization
Local development now includes explicit `diagnose:auth` and `sync:admin-credentials` commands. This resolves stale MongoDB bcrypt hashes after `.env` management credentials are changed, without resetting Restaurant data.

## Phase 7 Restaurant Admin 3D control
Implemented. Restaurant Admin controls safe exploded-layer animation metadata only for 3D dishes belonging to the authenticated admin's assigned Restaurant. Platform Admin has no access to this Restaurant-internal editor.

## PRE-PHASE 10 SECURITY/PRIVACY GATE — SOURCE HARDENING DONE
- unsafe browser mutations require trusted Origin + `X-ReserveUrTime-Request: 1`;
- production originless unsafe browser mutations are rejected;
- `TRUST_PROXY` is environment-controlled instead of hard-coded;
- production startup rejects development JWT/admin/audit secrets and non-HTTPS frontend origins;
- JWT sessions use `authVersion` so credential/assignment/account changes revoke old sessions;
- passwords are bounded to 72 UTF-8 bytes and stronger new-password validation is enforced;
- public media is restricted to safe relative paths or allowlisted HTTPS origins;
- Restaurant profile contact labels explicitly identify data as public/customer-facing;
- Customer/Restaurant Admin Order payloads minimize PII and status-history actor data;
- audit logs use keyed IP hashes, retention TTL and sensitive-field redaction instead of new raw IP storage;
- production error logging is PII-minimized;
- Order and Reservation state transitions use conditional atomic updates;
- same Customer cannot hold multiple active tables for the same Restaurant/date/time;
- Order idempotency index now matches service semantics: `userId + checkoutKey`;
- Vite upgraded from vulnerable 5.4.14 to 8.2.1; local dev/preview bind to `localhost` and the frontend uses a same-origin `/api` proxy to the separately running backend;
- strict boolean validation added to sensitive state toggles;
- `SEED_RESET=true` includes Favorite/Cart/PaymentAttempt/Order cleanup;
- authenticated/sensitive API responses use `no-store`;
- new `test:security`, `test:flows`, `migrate:security`, `audit:data-security`, `audit:deps` commands.

### Environment-dependent gate still required locally
Before claiming Phase 10 locally ready: back up Atlas, run `migrate:security`, review `audit:data-security`, run Phase 10/security/flow tests and dependency audits, run the Vite 8 production build, and manually regress critical Phase 0–10 flows. The artifact does not contain a MongoDB URI, so live Atlas/SSLCOMMERZ E2E was not claimed here.

## NEXT AFTER LOCAL PHASE 10/11 VALIDATION
Phase 12 — Cinematic UI/UX polish + responsive/accessibility refinement — DONE

## Post-Phase 11 motion/image enhancement — DONE
- Motion for React (`motion`) is now an approved runtime dependency for DOM/image animation.
- Public menu cards use reduced-motion-safe Motion reveals/layout behavior.
- Any accepted dish PNG/JPEG/WebP or safe image URL can enable Photo Explode, a 2.5D sliced-image explode/assemble effect.
- Restaurant Admin upload flow: `/restaurant-admin/menu`; Photo Explode editor: `/restaurant-admin/photo-explode`.
- Photo Explode controls: 4–16 layers, gap, depth, tilt, duration, stagger and allowlisted Motion feel.
- True GLB exploded layers additionally support bounded per-layer rotation X/Y/Z and explode scale.
- Single-photo Photo Explode is not claimed as true ingredient reconstruction; real ingredient geometry still requires GLB/GLTF named meshes.
- Phase 12 is complete; Phase 13 is NEXT.



## PHASE 12 CINEMATIC/ACCESSIBILITY LAYER — DONE
- Motion spring scroll progress + route glint/entry treatment.
- Accessible role-aware mobile navigation drawer.
- Skip-to-main-content and route-change screen-reader announcement.
- Restaurant-card viewport reveal/perspective/sheen.
- Stronger focus-visible, touch target and form/button polish.
- Customer/Restaurant Admin mobile section-nav scroll/snap.
- Small-screen 3D control/stage refinement.
- Reduced-motion, coarse-pointer and reduced-transparency fallbacks.
- Business logic/payment/RBAC/3D persistence unchanged.


## Localhost / Restaurant loading corrective checkpoint
- Fixed a development-origin mismatch where Vite opened on `127.0.0.1:5173` while backend trust/CORS expected `localhost:5173`.
- Vite now opens at `http://localhost:5173` and proxies `/api` to `http://localhost:5000`.
- Development trusted origins recognise exact localhost/127.0.0.1 loopback aliases; production allowlists remain explicit.
- Homepage distinguishes backend failure from a genuinely empty Restaurant database and provides Retry.
- Added `diagnose:restaurants` and `test:local-runtime`.
- Heavy 3D admin route is lazy-loaded and vendor chunking separates Three/R3F, GSAP, Motion and React groups.
- Phase 13 remains NEXT after this corrective checkpoint.


## 3D runtime + dependency corrective checkpoint — DONE
- Fixed public menu/full-3D `Invalid record id.` failures caused by legacy/malformed `MenuItem.categoryId` values combined with Mongoose populate.
- Public menu/experience/3D reads now safely join active categories in memory and tolerate malformed legacy references.
- Added non-destructive `repair:demo-runtime` + `diagnose:demo-runtime`; canonical Ember/Kori/Verde menu baseline can be repaired without `SEED_RESET=true`.
- Repair restores the four Ember Phase 7 GLB configurations and missing Photo Explode defaults while preserving existing descriptive content where possible.
- Bundled real GLBs remain present for Coal-Roasted Pumpkin, Ember Signature Plate, Burnt Honey Custard and Smoked Citrus Fizz.
- Frontend aligned to React 19.2.8 + R3F 9.7.0 + Drei 10.7.8 + Three 0.185.1 + Motion 13.1.0 + React Router DOM 7.18.2.
- Backend aligned to Express 4.22.2 + Mongoose 8.22.1 + Multer 2.2.0; `path-to-regexp` forced to patched 0.1.13; multipart field nesting bounded.
- Added `test:runtime-repair`, `test:dependency-baseline`, and production-only audit aliases.
- Three core/R3F/Drei are split into separate lazy-route vendor chunks rather than one combined 3D vendor chunk.
- A clean local reinstall + `npm audit` remains required to verify the exact Windows-installed transitive dependency tree.
- Phase 13 remains NEXT.

## Exploded 3D core/runtime corrective checkpoint — DONE
- Confirmed the real exploded-dish engine exists: four bundled Ember GLBs + R3F/Drei + GSAP position/rotation/scale choreography.
- Root local failure was before WebGL: legacy Atlas foreign-key/category shapes could trigger Mongoose casting and surface `Invalid record id.`.
- Public Restaurant/menu/3D reads now use raw Mongo collection reads across Restaurant, MenuCategory, MenuItem, RestaurantProfile and GalleryItem.
- Safe category joins support current ObjectIds and historical category slugs.
- Canonical Phase 7 runtime fallback reconstructs all required Ember model/layer metadata while preserving valid Restaurant Admin overrides.
- Restaurant Admin menu/true-3D/Photo-Explode/image paths are legacy-category resilient.
- True-3D demo choreography is more visible: 1.15s duration, 0.075s stagger, 650ms exploded hold, plus restrained rotation/scale.
- Frontend Tailwind 3 audit path remediated with Tailwind 3.4.19 + Sucrase 3.35.1 + glob 10.5.0 override; exact local installed-tree audit remains mandatory.
- Added `test:3d-core`; `diagnose:demo-runtime` now verifies the actual public 3D service path.
- Phase 13 remains NEXT.

