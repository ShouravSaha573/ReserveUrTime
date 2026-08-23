# TODO.md

## Current completed checkpoint
Phase 11 — Reviews + Contact/Messages + Notifications.

## Local Phase 7 verification
Backend:
1. `cd backend && npm install`.
2. For an existing Phase 6 database: `npm run setup:phase7`.
3. `npm run diagnose:phase7` should report `4/4` and `Public full 3D menu eligible: true`.
4. `npm run test:phase7`.
5. `npm run dev`.

Frontend:
1. `cd frontend && npm install`.
2. `npm run build`.
3. `npm run dev`.
4. Verify `/restaurant/ember-house/menu/3d`.
5. Verify Previous/Next and dot navigation.
6. Verify outgoing dish explodes before switching.
7. Verify adjacent models load without preloading the entire menu.
8. Verify mobile horizontal swipe.
9. Verify reduced-motion/WebGL/poster/normal-menu fallback.
10. Login as Restaurant Admin and verify `/restaurant-admin/3d-animation`.
11. Change one layer XYZ offset/timing, Preview Explode/Assemble, Save, then verify public 3D menu uses the saved configuration.
12. Verify Restaurant Admin cannot modify a dish from another Restaurant.

## Phase 8 — DONE
- Customer Restaurant + dish favourites.
- Favourite/unfavourite from public Restaurant/menu/3D experiences.
- Customer dashboard overview/navigation.
- Saved Restaurants/dishes presentation.
- Reservation history integration preserved.
- Optimistic feedback with rollback on failed writes.
- Customer name/phone profile editing; login email read-only.
- No new heavy animation dependency.

## Phase 9 — DONE
- server-backed one-Restaurant Customer cart;
- Add to Cart from ordinary + 3D menu;
- bounded quantities and server-calculated totals;
- idempotent transaction-based Order creation;
- immutable Order snapshots;
- Customer order history/cancellation;
- Restaurant Admin scoped order queue/status workflow;
- payment status prepared but gateway deferred.

## Phase 10 — DONE
- [x] dedicated `PaymentAttempt`;
- [x] backend-only SSLCOMMERZ Sandbox configuration;
- [x] server-authoritative Order amount/currency;
- [x] hosted Create Session;
- [x] IPN/success/fail/cancel callbacks;
- [x] Validation API + transaction-query reconciliation;
- [x] transaction/order/amount/BDT/reference checks;
- [x] replay/idempotency/duplicate-payment protection;
- [x] risk hold;
- [x] atomic verified payment + Order paid state;
- [x] Customer billing contact/payment UX;
- [x] Restaurant Admin paid-only fulfilment + read-only gateway state;
- [x] Phase 10 smoke/diagnostic tooling.

## Local Phase 10 release gate
- [ ] back up Atlas;
- [ ] run `npm run migrate:security`;
- [ ] review `npm run audit:data-security`;
- [ ] run `test:security`, `test:flows`, `test:phase9`, `test:phase10`;
- [ ] run backend/frontend dependency audits;
- [ ] run frontend Vite 8 production build on Node 26.7.0;
- [ ] test successful Sandbox payment;
- [ ] test failed/cancelled payment;
- [ ] test duplicate callback/reconcile behavior;
- [ ] test public HTTPS IPN delivery;
- [ ] verify Restaurant Admin cannot fulfil unpaid/pending or edit payment truth.

## Phase 11 — DONE
- [x] verified-experience Customer reviews;
- [x] one review per Customer per Restaurant;
- [x] public review summary + privacy-safe author display;
- [x] Restaurant Admin own-Restaurant reply flow;
- [x] Platform Admin hide/republish moderation;
- [x] public + signed-in contact submission;
- [x] explicit Platform vs Restaurant message routing;
- [x] signed-in Customer message history;
- [x] anonymous message reference/email status lookup;
- [x] Restaurant Admin / Platform Admin inbox separation;
- [x] Customer + Restaurant Admin read/unread notifications;
- [x] Order/Reservation/review/contact notification events;
- [x] 180-day notification and 365-day contact-message retention;
- [x] Phase 11 smoke + updated flow-connection test.

## Local Phase 11 regression gate
- [ ] complete a reservation and submit/edit/delete a review;
- [ ] complete a paid Order and confirm review eligibility;
- [ ] verify public review appears and never exposes Customer email/phone;
- [ ] verify Restaurant Admin can reply but cannot hide review;
- [ ] verify Platform Admin can hide/republish;
- [ ] verify Platform-vs-Restaurant message inbox separation;
- [ ] verify signed-in Customer message history + reply notification;
- [ ] verify anonymous reference/email message lookup;
- [ ] verify Order/Reservation status notifications;
- [ ] run `npm run test:phase11`, `npm run test:flows`, `npm run test:security`;
- [ ] run frontend Vite 8 production build locally.

## Phase 12 — DONE
- [x] Apply cinematic Motion/CSS system across shared chrome and Restaurant discovery.
- [x] Add accessible mobile navigation and route announcement/skip link.
- [x] Improve mobile Customer/Restaurant Admin section navigation.
- [x] Add focus-visible/touch-target/reduced-motion/reduced-transparency rules.
- [x] Refine small-screen 3D controls without changing GLB business/config flows.
- [x] Add `test:phase12`.

## Next phase — Phase 13
Security + Performance + Reliability + Full QA. Do not add decorative libraries.

## Later
Phase 14 deployment/docs.

## Phase 10 canonical memory
Phase 10 is complete in source. Payment initiation is Customer-owned and server-authoritative. SSLCOMMERZ credentials are backend-only, `PaymentAttempt` owns gateway transaction state, and Order becomes `paid` only after server-to-server SSLCOMMERZ verification plus transaction/amount/BDT/reference checks. Browser success/fail/cancel callbacks are not payment proof. Restaurant Admin cannot set paid/refunded and cannot advance fulfilment until verified paid. Full IPN/Sandbox E2E, Atlas migration, dependency audits and Vite build remain local validation gates.

## Motion + Photo Explode checkpoint — completed
- [x] Add Motion for React for DOM/image motion.
- [x] Add Restaurant Admin dish image upload (PNG/JPEG/WebP, 6 MB max).
- [x] Auto-enable 2.5D Photo Explode for uploaded/safe image dishes.
- [x] Add Restaurant Admin Photo Explode editor and live preview.
- [x] Add reduced-motion-safe public Photo Explode.
- [x] Add detailed true-3D per-layer rotation and explode scale controls.
- [x] Add setup/test command and image-authoring guide.
- [x] Phase 12: apply the cinematic system consistently across shared public/customer/admin chrome without changing business logic.
- [ ] Phase 14: replace local runtime upload storage with persistent object storage/CDN for production.



## Local runtime corrective checkpoint — DONE
- [x] Bind Vite to `localhost` instead of forcing `127.0.0.1`.
- [x] Use local `/api` Vite proxy to the separately running backend.
- [x] Add exact development loopback origin compatibility.
- [x] Show Restaurant API error/retry separately from true empty data.
- [x] Add `diagnose:restaurants` and `test:local-runtime`.
- [x] Lazy-load heavy 3D admin route and split major vendor groups.
- [ ] On the user's machine, run `npm run diagnose:restaurants` and confirm active Restaurant records.
- [ ] On the user's machine, rerun `npm run build` and review the new chunk sizes.


## Corrective checkpoint completed before Phase 13
- [x] Fix legacy category populate/CastError on public menu and 3D menu.
- [x] Add non-destructive canonical demo menu/3D repair and diagnosis.
- [x] Restore Kori/Verde demo menus when missing/inactive without resetting the full database.
- [x] Restore four Ember real-3D demo configurations.
- [x] Upgrade frontend React/R3F/Drei/Three/Motion/Router dependency baseline.
- [x] Upgrade Express/Mongoose and force patched path-to-regexp 0.1.13.
- [x] Bound Multer field nesting depth.
- [x] Add dependency/runtime static regression tests.
- [ ] LOCAL: clean reinstall frontend/backend and confirm `npm run audit:prod` output.
- [ ] Phase 13: full security/performance/reliability/browser/mobile QA.

## Exploded 3D core corrective checkpoint — DONE
- [x] Remove Mongoose casting from the public Restaurant/menu/full-3D read boundary.
- [x] Accept legacy ObjectId/string Restaurant/category references safely for reads.
- [x] Join categories by current ObjectId or historical slug.
- [x] Add canonical four-dish Ember GLB runtime fallback while preserving valid Admin overrides.
- [x] Keep Restaurant Admin true-3D/Photo-Explode/image operations legacy-category safe.
- [x] Make demo explode/assemble timing visibly detailed.
- [x] Add `test:3d-core`.
- [x] Remediate known Tailwind 3 -> Sucrase -> glob high audit path in package metadata.
- [ ] LOCAL: clean install and confirm `npm audit`/`npm run audit:prod`.
- [ ] LOCAL: confirm `Public 3D service readiness: 4/4` and cast-safe `true`.
- [ ] LOCAL: visually verify Explode/Assemble on all four Ember GLBs.
- [ ] Phase 13: profile Three/Drei chunk transfer/parse, WebGL GPU/memory and mobile performance.

