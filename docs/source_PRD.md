# PRD.md — ReserveUrTime Product Requirements

## Product Goal
Build a premium multi-restaurant platform where anyone can discover restaurants and browse immersive 3D food, customers can reserve/order after login, Platform Admin manages the platform/public directory, and each Restaurant Admin independently manages the inside of its assigned restaurant.

## Actors
- Guest
- Customer
- Platform Admin (`platform_admin`)
- Restaurant Admin (`restaurant_admin`)

## Public Journey
Homepage → Restaurant Discovery → Select Restaurant → Restaurant Page → Menu/Gallery/Reviews → Real 3D Dish Menu → Login only when a protected customer action is attempted.

## Customer Journey
Register/Login → Book Table / Favourite / Cart / Checkout → Reservation & Order History → Payments → Dashboard.

## Platform Admin Journey
`/platform-admin/login` → Platform Dashboard → Restaurant Directory management → Restaurant Admin account management → Homepage CMS → Review name/listing-image change requests → Platform settings/audit.

### Restaurant Admin account management
Platform Admin can create, edit, remove, disable, assign and reassign Restaurant Admin accounts. Each active Restaurant Admin must be assigned to an active Restaurant.

## Restaurant Admin Journey
`/restaurant-admin/login` → restaurant-scoped dashboard → internal profile → menu/categories → dish images/3D models → per-dish exploded-animation editor → tables/reservations → orders → gallery/reviews → submit platform identity change request if name/listing image must change.

## Management Boundary
Platform Admin owns **platform representation**. Restaurant Admin owns **restaurant internal operations/content**.

### Platform-owned representation
- restaurant platform name;
- slug/listing identity;
- image shown on homepage/Restaurants tab;
- listing visibility/featured status/order;
- homepage restaurant selection presentation;
- platform homepage and global site settings.

### Restaurant-owned internal data
- internal hero/about content distinct from platform card image;
- menu/category/dish data;
- 3D model and exploded-layer configuration;
- tables/reservations;
- orders;
- restaurant gallery/reviews/internal settings.

## Approval Requirement
Restaurant Admin may propose a new restaurant name or platform listing image. Proposal remains pending until Platform Admin approves. Approval must atomically update the public restaurant listing and request status, then invalidate/refresh public cache.

## 3D Signature Requirement
Dishes support a real **3D exploded view / layered assembly transition**: separate named meshes/layers move apart in X/Y/Z, reveal ingredient/layer structure, then animate back into the completed dish. This is combined with floating idle motion and Previous/Next transitions.

## Success Criteria
- Current working auth/reservation/discovery remains stable.
- Three roles are enforced on backend.
- Cross-restaurant data access is impossible through normal API use.
- Platform Admin has no restaurant-internal write API.
- Restaurant Admin cannot directly write platform identity fields.
- Approval applies requested name/listing image immediately and audibly.
- Homepage CMS is data-driven.
- 3D has performant fallback behavior.
- Mobile stays smooth.


## Restaurant directory search requirement
Public users must be able to search the platform Restaurant directory by Restaurant name or Cuisine without logging in. The homepage search should match the galaxy visual identity and the Restaurants page should preserve the query in the URL. Search must remain separate from the future Restaurant-internal dish/menu search.


## Phase 2B product update
The public platform shell is now data-driven through Platform Admin Homepage CMS. Brand/nav labels, hero copy/media/CTA, Galaxy Search visibility, Restaurant section copy/order, footer, and bounded Galaxy presets can be updated without editing React source.

Restaurant public listing metadata now includes featured state/order and directory order.

Architecture is now explicitly separated into `frontend/` and `backend/`, with backend MVC layers and React as the View layer.

Next product increment: Restaurant Admin internal profile + Restaurant name/listing-image approval workflow.

## Phase 4 product update
Restaurant Admin internal operations CMS is now implemented for the assigned Restaurant: Menu Categories, basic Dishes, Dining Tables, reservation schedule/status operations and internal Gallery.

Platform Admin remains excluded from these operational APIs. Restaurant-owned writes derive scope from the authenticated Restaurant Admin assignment.

Basic dishes intentionally contain no real 3D fields yet. The next increment is Phase 5 public Restaurant experience + basic public menu/search/filter. Real GLB/GLTF exploded-assembly work starts only after the public data flow is stable.


## Phase 5 product update
Public Restaurant experience and the ordinary public menu/search/filter flow are complete. This DOM menu is a permanent fallback for the future WebGL/3D experience.

## Animation and interaction source policy — 2026-08-18
ReserveUrTime may use external component libraries and design galleries as **selective references**, not as a mixed visual system.

The real dish experience must be a custom GLB/GLTF implementation using Three.js, React Three Fiber, Drei and GSAP. Awwwards/GetLayers/Animmaster/Casberry/OriginKit can guide scene/motion research; Vengeance/Aceternity/21st/Skiper can guide small React interactions around the canvas; Mobbin/ScreensDesign guide proven product flows; Design Spells guides micro-interactions; useAnimations/Lottieflow may provide small animated icons.

Every external component/asset must have a known source/licence, measured dependency/performance cost, reduced-motion behavior and a static/fallback path where applicable.

## Phase 6 delivered 3D requirement
- One real GLB dish prototype is implemented for Ember House → Coal-Roasted Pumpkin.
- Public route: `/restaurant/ember-house/menu/coal-roasted-pumpkin/3d` after seed.
- Engine: Three.js + React Three Fiber 8 + Drei + GSAP.
- Named GLB layers are animated from configured exploded XYZ offsets back to their artist-authored assembled transforms.
- WebGL/reduced-motion/model failure paths preserve the ordinary DOM menu/poster.
- Full Previous/Next 3D menu remains Phase 7.

## Restaurant Admin 3D animation ownership
Restaurant Admin owns the **Restaurant-internal exploded-animation configuration** for 3D-enabled dishes in the assigned Restaurant only. The editor must use structured metadata, not executable code. Required controls include named-layer participation, exploded XYZ offsets, sequence/order, duration, stagger/delay, allowlisted easing, preview and reset. Saved settings drive the public dish's Explode/Assemble behavior.

Platform Admin has no Restaurant-internal 3D-animation editor. Public listing identity remains a separate Platform Admin responsibility.


## Phase 7 delivered requirement
ReserveUrTime now provides a full Restaurant-level 3D menu with Previous/Next/swipe navigation and adjacent-model preload. Restaurant Admin has a live-preview per-dish exploded-layer editor scoped to the assigned Restaurant. The Phase 5 DOM menu remains mandatory fallback.


## Phase 8 implemented customer experience
Authenticated Customers can save active Restaurants and active/available dishes, review both groups in `/dashboard/favourites`, view an overview of saved/reservation counts and the nearest upcoming reservation, keep reservation history at `/dashboard/reservations`, and edit name/phone at `/dashboard/profile`. Login email changes are deliberately deferred. Favourite state uses optimistic UI with server-authoritative replacement and rollback after failed writes.

Phase 9 is next: Cart + Orders + Restaurant Admin order management.


## Phase 9 Cart + Order requirements — implemented
- Customer cart is persisted server-side and Customer-authenticated.
- A cart can contain dishes from one Restaurant only; changing Restaurant requires explicit Customer confirmation to replace the existing cart.
- Both ordinary menu and full 3D menu can add dishes to the cart.
- Quantity is bounded 1–20.
- Client totals are display-only; backend recalculates current menu price, line totals, subtotal and final Phase 9 total.
- Order placement uses an idempotent checkout key and atomic Order-create/Cart-clear transaction.
- Order item/Customer/Restaurant snapshots preserve historical truth if menu/profile values change later.
- Customer can view Order history and cancel only an unconfirmed `placed + unpaid` order.
- Restaurant Admin can manage only own Restaurant Orders through the defined status transition graph.
- Restaurant Admin cannot manually change `paymentStatus`.
- Phase 10 SSLCOMMERZ verification is implemented and uses server-authoritative Order totals.

## Pre-Phase 10 security acceptance criteria
Before payment implementation is considered start-ready:
- current Phase 0–9 route/RBAC boundaries must pass regression checks;
- unsafe browser mutations require trusted-origin/request-marker verification;
- old management sessions must revoke after credential/account/Restaurant assignment changes;
- stored public media must satisfy the site-relative/HTTPS allowlist policy;
- no high/critical dependency finding may be silently accepted;
- Vite production build must pass on the normal Node 26.7.0 Windows environment;
- live Atlas security migration/data audit must be completed after backup.

Phase 10 payment acceptance criteria — implemented in source:
- server reads `Order.total`/`currency`; client cannot choose trusted payment amount;
- backend-only SSLCOMMERZ credentials and Sandbox mode;
- unique PaymentAttempt/transaction identity;
- server-side session initiation;
- IPN + Order Validation API verification before paid state;
- verified amount/currency/transaction/order match;
- idempotent callback processing;
- atomic Order/Payment state transition;
- no manual Restaurant Admin paid/refund switch;
- no PAN/CVV/gateway-secret storage/logging;
- customer return page queries server state rather than trusting URL callback fields.



## Phase 10 implemented product requirements
- Customer pays an existing owned Order through SSLCOMMERZ Hosted Checkout.
- Backend determines trusted amount/currency from stored Order; browser cannot set trusted totals.
- Customer must have bounded phone/billing contact data before session creation.
- PaymentAttempt is the canonical gateway transaction record.
- Customer can retry failed/unpaid Orders and reconcile pending payment.
- IPN and browser-return callbacks are never payment proof by themselves.
- Backend validates/query-reconciles SSLCOMMERZ and verifies transaction ID, Order/Customer/attempt references when returned, expected amount and BDT.
- `risk_level=1` remains a hold and cannot enter Restaurant fulfilment.
- Verified payment is atomic/idempotent; duplicate success does not overwrite the first paid transaction.
- Restaurant Admin sees payment state but cannot set paid/refunded; fulfilment requires paid.
- ReserveUrTime never collects or stores PAN/CVV.
- Paid refund is a separate gateway-backed workflow, not a manual Order status edit.

## Phase 11 next product requirements
Reviews, Contact/Messages and Notifications become the next phase. They must preserve privacy/RBAC, avoid exposing Customer personal data unnecessarily, and use restrained notification animation only where it improves status comprehension.


## Phase 11 implemented product requirements
- Customer review eligibility requires a completed reservation or completed paid Order.
- A Customer can maintain one review per Restaurant.
- Public review presentation uses a privacy-safe display name and never publishes Customer email/phone.
- Restaurant Admin may reply only for the assigned Restaurant; Platform Admin controls hide/republish moderation.
- Contact supports explicit Platform vs Restaurant routing.
- Signed-in Customers have message history; anonymous users can check using reference + email.
- Customer and Restaurant Admin notifications provide read/unread state for relevant review/contact/Order/Reservation events.
- Communication input is bounded and abuse-limited; notification/contact data has retention limits.
- Phase 11 adds no heavy animation dependency; communication feedback remains restrained and reduced-motion safe.

Phase 12 is next: cinematic UI/UX polish without changing established business/security boundaries.

## Added visual requirement — normal image → Photo Explode
Restaurant Admin must be able to add a normal dish image and have ReserveUrTime provide a smooth layered explode/assemble presentation. Implemented as Motion-powered 2.5D image slicing so it works for ordinary photos without falsely claiming 3D reconstruction. The admin receives image-quality guidance and bounded animation controls. Signature dishes continue to use real GLB/GLTF named-mesh exploded animation.



## Phase 12 cinematic UX
Completed: Motion/CSS shared cinematic chrome, accessible mobile navigation, skip-to-content/route announcements, Restaurant-card reveal/perspective/sheen, focus/touch/mobile navigation refinements and reduced-motion/transparency fallbacks. No business/RBAC/payment/Restaurant ownership behavior changed. Phase 13 is NEXT.


## Runtime compatibility requirement added before Phase 13
Public Restaurant/menu/3D browsing must remain available even when legacy menu records contain malformed category references. Category metadata must be joined safely instead of allowing a single malformed legacy foreign key to crash the response. Development builds must provide a non-destructive canonical demo repair path for Ember House/Kori/Verde and their 3D/Photo Explode demo readiness. Installed dependency versions must stay on reviewed patched baselines and be re-audited after a clean install.

## Signature experience corrective acceptance criteria
Before Phase 13 begins locally: Ember House full 3D menu must return four eligible GLB dishes; direct Coal-Roasted Pumpkin 3D route must render the named-layer viewer instead of `Invalid record id.`; Explode/Assemble must visibly animate XYZ + rotation + scale; Restaurant Admin 3D editor must open for the same dishes; and the clean frontend installed tree must no longer contain the known vulnerable Tailwind/Sucrase/glob CLI path. `diagnose:demo-runtime` is the authoritative runtime precheck.

