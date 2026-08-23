# Phase 7 Implemented — Full 3D Menu + Restaurant Admin 3D Animation Editor

Status: **DONE**

## Public full 3D menu
Phase 7 converts the single Phase 6 prototype into a reusable restaurant-level 3D menu.

Routes:
- `/restaurant/:slug/menu/3d` — opens the first enabled 3D dish.
- `/restaurant/:slug/menu/:dishSlug/3d` — opens a selected 3D dish inside the same full-menu experience.

API:
- `GET /api/restaurants/:slug/menu/3d` — returns only active, available, 3D-enabled dishes for that Restaurant.
- Existing `GET /api/restaurants/:slug/menu/:dishSlug/3d` remains available for single-dish metadata compatibility.

Public behavior:
- Previous/Next dish navigation.
- Dot navigation for all currently enabled 3D dishes.
- Outgoing dish explodes before route selection moves to the incoming dish.
- Incoming dish performs its configured exploded → assembled motion.
- Current + previous + next GLB URLs are preloaded; the entire 3D menu is not eagerly preloaded.
- Mobile horizontal swipe changes dishes when horizontal movement clearly exceeds vertical movement.
- Orbit/zoom remains available.
- Phase 5 DOM menu remains the permanent accessible fallback.
- WebGL failure falls back to poster/normal menu.
- `prefers-reduced-motion` avoids cinematic auto-animation.

## Seeded Phase 7 Ember House GLBs
- Coal-Roasted Pumpkin → `/models/coal-roasted-pumpkin.glb`
- Ember Signature Plate → `/models/ember-signature-plate.glb`
- Burnt Honey Custard → `/models/burnt-honey-custard.glb`
- Smoked Citrus Fizz → `/models/smoked-citrus-fizz.glb`

All are real `.glb` files with named nodes. Phase 7 is an infrastructure/demo milestone; production art can replace these assets later without changing the data contract.

## Restaurant Admin 3D Animation Editor
Protected route:
- `/restaurant-admin/3d-animation`

Protected API:
- `GET /api/restaurant-admin/menu/items/:itemId/3d-animation`
- `PATCH /api/restaurant-admin/menu/items/:itemId/3d-animation`

Restaurant Admin can edit **only dishes belonging to `req.managedRestaurantId`**.

Editable safe settings per dish:
- named-layer participation (`enabled`);
- sequence/order;
- exploded X/Y/Z offset;
- animation duration;
- stagger;
- allowlisted easing preset;
- automatic assembly on open;
- automatic assembly delay;
- idle float intensity;
- idle rotation intensity.

Editor features:
- live local GLB preview;
- Preview Explode;
- Preview Assemble;
- revert unsaved changes;
- recommended timing reset;
- explicit Save & Publish.

## Security rules
The backend validates every 3D-animation write:
- Restaurant ownership is server derived, never trusted from request body.
- Dish ID must belong to the authenticated Restaurant Admin's Restaurant.
- Dish must already have an enabled 3D model.
- submitted mesh names must already exist in that dish's stored named-layer configuration;
- duplicate/unknown mesh names are rejected;
- each XYZ offset is bounded to `-5…5`;
- duration is bounded to `0.2…4s`;
- stagger is bounded to `0…0.5s`;
- auto-assemble delay is bounded to `0…5000ms`;
- float/rotation intensity are bounded to `0…0.5`;
- easing is restricted to the application allowlist;
- arbitrary JavaScript/CSS/HTML/shader/expression input is not accepted.

Platform Admin has no Restaurant-internal 3D animation editor.

## MVC additions
Backend:
- `src/controllers/restaurant3DController.js`
- `src/services/threeDAnimationService.js`
- `src/services/phase7SetupService.js`
- `src/config/phase7ThreeDConfigs.js`
- public full-menu logic remains in `publicRestaurantExperienceController` + `publicRestaurantExperienceService`.

Frontend:
- `src/pages/Restaurant3DMenuPage.jsx`
- `src/pages/RestaurantAdmin3DAnimationPage.jsx`
- shared `src/components/three/ExplodedDishCanvas.jsx` now consumes saved animation metadata.

## Setup / migration commands
Existing database:
```bash
cd backend
npm install
npm run setup:phase7
npm run diagnose:phase7
npm run test:phase7
npm run dev
```

Fresh development database can use `npm run seed` instead; the seed now adds missing Phase 7 3D metadata while preserving already-configured Restaurant Admin animation settings.

Frontend:
```bash
cd frontend
npm install
npm run build
npm run dev
```

## Regression rule
Never remove the ordinary DOM menu. The 3D menu is progressive enhancement and must remain bounded by mobile/GPU/accessibility fallback rules.
