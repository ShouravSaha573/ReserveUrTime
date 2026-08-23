# MEMORY.md — ReserveUrTime Canonical Project Memory

## Project
ReserveUrTime is a premium multi-Restaurant MERN platform with Customer, Platform Admin and Restaurant Admin roles.

Human labels are always **Platform Admin** and **Restaurant Admin**. Backend keys remain `platform_admin` and `restaurant_admin`.

## Architecture
```text
ReserveUrTime/
├── frontend/   # React/Vite View/client
├── backend/    # Express/Mongoose MVC API
└── docs/
```
Frontend and backend start independently in separate terminals.

MVC:
- Model → `backend/src/models/`
- Controller → `backend/src/controllers/`
- Routes → `backend/src/routes/`
- Services → `backend/src/services/`
- View → `frontend/src/pages/` + `frontend/src/components/`

Frontend never accesses MongoDB directly.

## Design direction
- Alchemist: dark cinematic atmosphere + mouse-follow light.
- Hongbao: Restaurant discovery/listing structure.
- Ikoyi: individual Restaurant/menu presentation.
- ReserveUrTime signature: galaxy Restaurant search + real 3D dishes + exploded/layered assembly.

## Access/ownership boundaries
Public browsing does not require Customer login. Login is required for booking, favourites, checkout/orders and personal dashboard features.

Platform Admin owns platform shell, homepage CMS, public Restaurant listing identity/order/featured state, Restaurant Admin account lifecycle and approval of Restaurant Admin listing name/image change requests.

Platform Admin must NOT get Restaurant-internal CRUD for menu, dishes, 3D operational assets, tables, Restaurant reservation operations, orders, internal gallery/profile/settings.

Restaurant Admin is backend-scoped to its assigned `restaurantId` and owns Restaurant-internal profile/menu/table/reservation/gallery operations. Public listing name/image changes go through Platform Admin approval.

## Completed phases
- Phase 0: MERN/Atlas, Customer auth, homepage, discovery, reservation/history/cancel.
- Phase 1: three-role RBAC + Restaurant Admin server scoping.
- Phase 2A: Platform Admin Restaurant + Restaurant Admin account management.
- Galaxy Restaurant Search: Restaurant name/Cuisine, debounce/cancel, CSS 3D/warp.
- Phase 2B: Homepage CMS, AuditLog, featured/listing order, MVC folder separation.
- Phase 3: RestaurantProfile + listing name/image request approval transaction.
- Phase 4: Restaurant Admin Category/Dish/Table/Reservation/Gallery internal operations.
- Phase 5: public Restaurant experience, menu/search/filter/gallery + permanent DOM menu fallback.
- Phase 6: ONE real GLB exploded-dish prototype + 3D metadata/runtime pipeline.
- Phase 7: full 3D menu + Restaurant Admin 3D Animation Editor.
- Phase 8: Customer favourites + expanded Customer dashboard/profile.

## Phase 6 canonical 3D state
Prototype:
- Ember House → Coal-Roasted Pumpkin.
- route `/restaurant/ember-house/menu/coal-roasted-pumpkin/3d` after seed.
- asset `frontend/public/models/coal-roasted-pumpkin.glb`, ~90 KB.
- named nodes: Plate, PumpkinBase, CulturedCream, CharredPumpkin, SeedCrumb, HerbGarnish, SmokeSalt.

`MenuItem.threeD` contract:
- enabled;
- modelUrl;
- posterUrl;
- modelScale;
- cameraPosition;
- cameraTarget;
- layers with meshName/label/explodedOffset XYZ.

Frontend engine:
- Three.js;
- React **19.2.8** / ReactDOM 19.2.8;
- React Three Fiber **9.7.0** paired with React 19;
- Drei **10.7.8**;
- Three.js **0.185.1**;
- React Router DOM **7.18.2**;
- Motion **13.1.0** for DOM/image motion;
- GSAP 3.x.

Mechanics:
- load real GLB with `useGLTF`;
- capture original GLB layer local positions as assembled source of truth;
- add database exploded offsets;
- GSAP timeline animates exploded → assembled;
- replay Explode/Assemble;
- OrbitControls + subtle idle Float;
- lazy-load the entire 3D page;
- DPR cap 1–1.5;
- `prefers-reduced-motion` simplified path;
- WebGL/model failure falls back to poster + Phase 5 DOM menu.

Permanent 3D rule: the ordinary DOM menu is never removed. 3D is progressive enhancement.

## Animation-source strategy
- Core 3D: custom Three.js/R3F/Drei/GSAP.
- 3D inspiration: Awwwards, GetLayers, Animmaster Lib, Casberry Particles, OriginKit.
- React UI motion: Vengeance UI, Aceternity UI, 21st.dev, selective Skiper UI.
- UX/mobile flow: Mobbin, ScreensDesign.
- Micro-interactions: Design Spells.
- Animated icons: useAnimations first, Lottieflow secondary.
- daisyUI: utility/accessibility reference only.
- Animos: marketing/showcase video, not runtime.
- UI.live: inspiration-only until specific source/licence verified.

Never install every animation library. Select minimum dependencies and verify licence/performance/reduced-motion behavior.

## Next phase
**Phase 11 — Reviews + Contact/Messages + Notifications.**

Phase 0–11 are complete in source. Preserve Phase 10 payment trust boundaries and Phase 11 communication/privacy boundaries while preparing Phase 12 cinematic polish.

## Mandatory quality rule
Before auth/API/database/3D/payment/deployment changes, read `SECURITY_PERFORMANCE_RELIABILITY.md`.

## Admin credential sync fix (2026-08-18)
If Platform Admin/Restaurant Admin credentials in `backend/.env` differ from hashes already stored in MongoDB, login returns the intentionally generic `Invalid email or password.` response. Use `npm run diagnose:auth`, then `npm run sync:admin-credentials`, then diagnose again. The sync only refreshes the configured Platform Admin and Restaurant Admin accounts and the Restaurant Admin assignment; it does not reset operational data.

## New locked requirement — Restaurant Admin 3D animation control
Restaurant Admin must be able to configure the **Exploded Layers animation per 3D-enabled dish** in the assigned Restaurant's own menu. Phase 7 must provide a safe dashboard editor for layer participation, exploded X/Y/Z offsets, sequence/order, duration, stagger/delay, allowlisted easing, live Explode/Assemble preview and reset-to-default.

The server forces `req.managedRestaurantId`; Platform Admin has no Restaurant-internal 3D-animation editor. Arbitrary JavaScript/CSS/shader/expression input is forbidden. The public 3D viewer reads the saved structured metadata. This editor is implemented in Phase 7.


## Phase 7 canonical memory
Phase 7 is complete. Full 3D menu route `/restaurant/:slug/menu/3d`; selected dish route `/restaurant/:slug/menu/:dishSlug/3d`. Ember House has four demo GLBs. Navigation explodes the outgoing dish before switching and incoming dish uses its configured assemble motion. Only current/previous/next models are preloaded. Mobile swipe is supported. Restaurant Admin editor `/restaurant-admin/3d-animation` controls safe per-dish layer participation, sequence, XYZ offsets, duration, stagger, easing, auto-assemble delay, float and rotation. Backend validates bounds/known meshes/easing and scopes writes by `req.managedRestaurantId`. Phase 8–10 have since been completed; Phase 11 is complete; Phase 12 is now next.


## Phase 8 canonical memory
Phase 8 is complete. `Favorite` supports Customer-owned Restaurant and menu-item targets with partial unique indexes. Protected Customer APIs live under `/api/customer`; favourites are exposed on public Restaurant cards, Restaurant detail, normal menu and 3D menu but saving requires Customer login. `/dashboard` shows saved/reservation stats + nearest upcoming reservation; `/dashboard/favourites` shows saved Restaurants/dishes; `/dashboard/reservations` preserves existing history/cancel; `/dashboard/profile` edits name/phone while email stays read-only. Favourite UI is optimistic with rollback after failed writes. Phase 9–10 are now complete; Phase 11 is complete; Phase 12 is next.


## Phase 9 — COMPLETE
- Server-backed Customer Cart model.
- One Restaurant per cart; cross-Restaurant add requires explicit replacement.
- Add-to-Cart exists on Phase 5 DOM menu and Phase 7 3D menu.
- Server validates active Restaurant + active/available MenuItem and recalculates money.
- Order has unique `orderNumber` + per-Customer unique `checkoutKey`, immutable snapshots, status history, and verified payment linkage.
- MongoDB transaction creates Order and clears Cart.
- Customer: `/dashboard/cart`, `/dashboard/orders`; safe cancellation only while `placed + unpaid|failed`.
- Restaurant Admin: `/restaurant-admin/orders`, scoped by `req.managedRestaurantId`; status flow placed→confirmed→preparing→ready→completed with bounded cancellation.
- Restaurant Admin cannot mark payment paid/refunded.
- Phase 10 SSLCOMMERZ Sandbox is implemented; Phase 11 is complete; Phase 12 is next.

## 2026-08-19 — Pre-Phase 10 security/privacy hardening checkpoint
At the pre-Phase-10 checkpoint, Phase 9 was the latest functional phase. Before SSLCOMMERZ, a source-level security/privacy audit was completed and confirmed findings were fixed: mutation CSRF/origin marker, configurable proxy trust, production-secret validation, JWT authVersion revocation, password byte bounds, media-origin allowlist, public-profile privacy labeling, Order PII minimization, keyed/retained/redacted audit logs, production error minimization, atomic Order/Reservation status transitions, same-Customer reservation-slot uniqueness, per-Customer checkout idempotency index, Vite 8 tooling upgrade/localhost dev server, strict booleans, Phase8/9 reset cleanup, order-note privacy wording, no-store sensitive API responses, and explicit X-Powered-By disable.

New commands: `test:security`, `test:flows`, `migrate:security`, `audit:data-security`, `audit:deps`.

Important limitation: the packaged `backend/.env` intentionally has blank `MONGODB_URI`; therefore the Atlas migration/data audit and live browser E2E must be run locally. The sandbox also could not complete npm registry installation, so local dependency audit + Vite 8 build remain required.

Phase 10 was implemented on this hardened base. Local migration/dependency/build/Sandbox E2E gates still apply before claiming runtime readiness.

## 2026-08-19 — Phase 10 SSLCOMMERZ Sandbox
- Dedicated `PaymentAttempt` model with unique `transactionId` and Customer `paymentKey`.
- Customer-owned server-side SSLCOMMERZ Create Session using stored Order total/currency.
- Backend-only credentials; no payment secret in frontend/VITE env.
- Public exact IPN/success/fail/cancel callback routes are outside browser Origin marker but cannot set paid from their bodies.
- Backend validates/queries SSLCOMMERZ and matches transaction, Order, Customer, PaymentAttempt, amount and BDT before paid.
- Verified payment + Order paid update is atomic/idempotent; risk level 1 becomes `risk_hold`; second successful transaction after paid becomes `duplicate_paid`.
- Customer profile now includes bounded billing contact fields; Customer Orders supports Pay/Retry/Reconcile.
- Restaurant Admin payment state remains read-only and fulfilment requires verified paid.
- No PAN/CVV/card-secret storage.
- Local IPN needs a public HTTPS callback URL.
- `test:phase10` and `diagnose:phase10` added.
- Phase 11 is complete; Phase 12 is NEXT.


## Phase 11 canonical memory
Phase 11 DONE: verified-experience Customer reviews, Restaurant Admin own-Restaurant replies, Platform Admin moderation, Platform/Restaurant scoped ContactMessages, signed-in Customer message history, anonymous reference+email status lookup, Customer/Restaurant Admin read-unread notifications, and Order/Reservation/review/contact events. Notification TTL 180d; ContactMessage TTL 365d. Phase 12 NEXT.

## Latest checkpoint — Motion + Photo Explode
After Phase 11 and before Phase 12, Motion.dev/Motion for React was added for DOM/image animation. Restaurant Admin dish upload can auto-enable Photo Explode (2.5D image slices) and tune it at `/restaurant-admin/photo-explode`. Uploaded images are PNG/JPEG/WebP only, ≤6 MB, with magic-byte verification. Local uploads are development-only storage under `frontend/public/uploads/menu-images`; Phase 14 must use persistent object storage. True 3D GLB layers now also have rotation offsets and explode scale. Phase 12 remains NEXT.



## Phase 12 cinematic UX
Completed: Motion/CSS shared cinematic chrome, accessible mobile navigation, skip-to-content/route announcements, Restaurant-card reveal/perspective/sheen, focus/touch/mobile navigation refinements and reduced-motion/transparency fallbacks. No business/RBAC/payment/Restaurant ownership behavior changed. Phase 13 is NEXT.


## 2026-08-19 — Localhost/Restaurant runtime corrective checkpoint
After Phase 12, local screenshots exposed a development-only origin mismatch: Vite was bound to `127.0.0.1:5173` while backend trust/CORS expected `http://localhost:5173`, causing public CMS/Restaurant requests to fail and the homepage to misleadingly show no Restaurants. Fixed by binding Vite to `localhost`, using local `VITE_API_URL=/api` with a Vite proxy to `http://localhost:5000`, safely accepting exact loopback aliases in development, and adding explicit Restaurant loading/error/true-empty states. New commands: `diagnose:restaurants` and `test:local-runtime`. Frontend/backend remain separate processes. Phase 13 remains NEXT.


### Latest corrective checkpoint
Public 2D/3D menu reads no longer use Mongoose `populate(categoryId)` because legacy Atlas records could contain category slugs/strings and trigger `Invalid record id.`. Safe category joining + `repair:demo-runtime` now repair/contain that legacy state. The demo repair restores four canonical dishes for Ember/Kori/Verde and four real GLB configurations for Ember without resetting Customer/Reservation/Order/payment data. Dependency baseline was also moved to React19/R3F9/Drei10/Three r185 and Express4.22.2/Mongoose8.22.1/path-to-regexp0.1.13. Phase 13 is still next.

## Latest corrective checkpoint — exploded 3D core
The true exploded GLB system is implemented and is the signature ReserveUrTime experience. The local `Invalid record id.` symptom occurred before WebGL mounted due legacy Atlas casting. Public Restaurant/menu/3D reads now use native collection reads, safe category ObjectId/slug joins and a canonical four-GLB Ember runtime fallback. Restaurant Admin true-3D/Photo-Explode/image paths are also resilient to legacy category data. Frontend audit remediation uses Tailwind 3.4.19 + Sucrase 3.35.1 + glob 10.5.0 override. New check: `npm run test:3d-core`; expected live diagnostic `Public 3D service readiness: 4/4`, cast-safe `true`. Phase 13 is next.

