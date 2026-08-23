# ReserveUrTime — Exploded 3D Core Runtime + Frontend Audit Fix

Date: 2026-08-19  
Base: Phase 12 + prior 3D/runtime corrective checkpoint  
Status: **Corrective checkpoint complete. Phase 13 remains next.**

## Why this checkpoint exists
Local testing proved that the true GLB assets and the React/Three/GSAP viewer existed, but the public full-3D API could fail before the viewer mounted with `Invalid record id.`. The visible symptom therefore looked like “3D was never implemented” even though the real animation code and four GLB assets were present.

A separate clean frontend install also still reported one high-severity audit warning. The project now treats both as first-class pre-Phase-13 blockers.

## Exploded layers are real runtime code
The true 3D viewer remains `frontend/src/components/three/ExplodedDishCanvas.jsx` and uses:
- `useGLTF()` to load a real GLB;
- named mesh lookup with `model.getObjectByName(meshName)`;
- exact assembled position/rotation/scale captured from the GLB;
- Restaurant Admin-controlled exploded X/Y/Z offsets;
- Restaurant Admin-controlled rotation X/Y/Z and explode scale;
- sequence + stagger + duration + allowlisted easing;
- a GSAP timeline that animates position, rotation and scale;
- explicit **Explode layers** and **Assemble dish** controls;
- reduced-motion fallback;
- OrbitControls and restrained idle Float behavior.

The four bundled Ember House GLBs remain:
1. `/models/coal-roasted-pumpkin.glb`
2. `/models/ember-signature-plate.glb`
3. `/models/burnt-honey-custard.glb`
4. `/models/smoked-citrus-fizz.glb`

## Deep root cause: legacy Atlas casting before WebGL
Historical development data can contain `MenuItem.categoryId` as a slug/string such as `starters` or `mains`, although the current Mongoose schema expects an ObjectId. Removing `populate()` reduced the risk, but a core public path should not depend on Mongoose casting historical documents at all.

### Final boundary
The public Restaurant/menu/3D service now uses **native collection reads** for the entire read path:
- `Restaurant.collection.findOne`
- `MenuCategory.collection.find`
- `MenuItem.collection.find/findOne`
- `RestaurantProfile.collection.findOne`
- `GalleryItem.collection.find`

This means legacy category values are treated as data, not cast as ObjectIds. Categories are joined manually. The join recognizes both current ObjectId keys and historical category slugs.

The public menu filters also accept Restaurant foreign keys stored as either the current ObjectId or the historical string form. This is a compatibility boundary, not a new storage convention; `repair:demo-runtime` remains the normal way to normalize demo data.

## Canonical 3D runtime fallback
For the four canonical Ember House demo dishes, the bundled Phase 7 manifest is now the runtime source of truth for required model URL, camera setup and named mesh set.

If old Atlas data is missing/partial, the public response reconstructs the complete canonical asset with `buildPhase7RuntimeAsset()` while preserving matching Restaurant Admin overrides where they exist.

This prevents a stale demo document from silently removing the defining exploded-layers experience.

Recommended default choreography is intentionally visible:
- duration: `1.15s`
- stagger: `0.075s`
- initial exploded hold: `650ms`
- easing: `power3.inOut`
- restrained per-layer rotation + explode scale defaults

Custom Restaurant Admin settings remain authoritative for matching known mesh names.

## Restaurant Admin legacy resilience
The following internal paths also use raw MenuItem collection reads/updates so one malformed historical `categoryId` cannot block 3D editing:
- Restaurant Admin menu list;
- true 3D animation editor;
- Photo Explode editor;
- dish image upload.

All existing ownership controls remain: target dish must belong to `req.managedRestaurantId`; arbitrary mesh names/easing/scripts remain rejected.

## Frontend audit remediation
The local `npm install` warning matched the known Tailwind CSS 3 development dependency path through Sucrase to vulnerable `glob` CLI versions.

The clean package now uses:
- Tailwind CSS `3.4.19`;
- PostCSS `8.5.26`;
- Autoprefixer `10.5.4`;
- Sucrase override `3.35.1`;
- `glob` override `10.5.0`.

`glob@10.5.0` is the patched 10.x boundary for GHSA-5j98-mcp5-4vw2 / CVE-2025-64756. This keeps the project on Tailwind 3 and avoids a forced Tailwind 4 migration immediately before final QA.

The exact installed-tree audit must still be verified on the user's Windows machine after deleting the old lockfile/node_modules and reinstalling. Do not use `npm audit fix --force` blindly.

## 3D bundle split
Vite continues to lazy-load 3D routes and now separates:
- `three-core`
- `r3f-vendor`
- `drei-vendor`
- `three-bvh-vendor`
- `three-controls-vendor`
- `troika-vendor`
- `gsap-vendor`
- `motion-vendor`
- `react-vendor`

This is a profiling improvement, not a claim that Three/Drei is small. Phase 13 must use the actual local production build to profile transfer/parse/GPU/memory cost instead of hiding size warnings.

## New/updated regression command
```powershell
cd backend
npm run test:3d-core
```

The test verifies the raw Mongo boundary, canonical GLB fallback, GSAP exploded transform code, all four bundled GLBs, and the frontend audit-remediation package baseline.

`diagnose:demo-runtime` also calls the real public 3D service. Expected local result after repair:
```text
Public 3D service readiness: 4/4
Public 3D service cast-safe: true
```

## Exact local recovery
### Backend
```powershell
cd backend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
npm run repair:demo-runtime
npm run diagnose:demo-runtime
npm run test:3d-core
npm run test:runtime-repair
npm run test:dependency-baseline
npm run test:phase6
npm run test:phase7
npm run test:motion-photo
npm run test:flows
npm run test:security
npm run audit:prod
npm run dev
```

### Frontend
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
npm audit
npm run build
npm run audit:prod
npm run dev
```

### Browser gates
- `http://localhost:5173/restaurant/ember-house/menu/3d`
- `http://localhost:5173/restaurant/ember-house/menu/coal-roasted-pumpkin/3d`
- `http://localhost:5173/restaurant-admin/3d-animation`
- `http://localhost:5173/restaurant-admin/photo-explode`

If the browser still shows a backend error after `Public 3D service cast-safe: true`, capture the backend terminal stack trace generated by the `/api/restaurants/ember-house/menu/3d` request. The generic browser message alone is not enough for the next diagnostic step.

## Phase boundary
This is a corrective checkpoint only. **Phase 13 — Security + Performance + Reliability + Full QA remains next.**
