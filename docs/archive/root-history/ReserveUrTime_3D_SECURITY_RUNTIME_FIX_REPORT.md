# ReserveUrTime — 3D Runtime, Demo Data & Dependency Security Fix Report

Date: 2026-08-19  
Base: Phase 12 + localhost/Restaurant runtime fix  
Status: **Corrective checkpoint complete; Phase 13 remains next.**

## Problems reproduced from local testing

1. `GET /restaurant/ember-house/menu/coal-roasted-pumpkin/3d` could show **3D menu unavailable — Invalid record id.**
2. Kori could load as a Restaurant while its public menu showed **0 dishes**.
3. Frontend installation reported the deprecated `three-mesh-bvh@0.7.8` dependency path and high-severity audit warnings.
4. Backend installation reported moderate/high audit warnings.
5. The Phase 12 production build worked, but the old Three vendor chunk remained large.

## Root cause of `Invalid record id.`

Older Atlas menu records can contain a legacy string/slug in `MenuItem.categoryId` instead of a valid `MenuCategory` ObjectId. The public menu/3D service previously used Mongoose `populate("categoryId")`. Mongoose then attempted to cast the legacy value and could throw a CastError. The global error handler surfaced that as `Invalid record id.`.

### Fix
Public Restaurant experience, normal menu, single-dish 3D and full 3D menu reads no longer populate this legacy-sensitive field. Active categories are loaded separately and joined safely in memory. Invalid legacy category references no longer crash the entire public menu or 3D response.

The same legacy-sensitive populate was removed from the Restaurant Admin Photo Explode and true-3D animation read paths.

## Kori / demo-menu repair

The old demo seed primarily used insert-only behavior, so an already-existing Restaurant/dish could remain missing, inactive, unavailable or attached to a malformed category reference.

New commands:

```powershell
npm run diagnose:demo-runtime
npm run repair:demo-runtime
```

`repair:demo-runtime` is non-destructive. It:

- ensures Ember House, Kori and Verde are active demo Restaurants;
- ensures Starters/Mains/Desserts/Drinks exist and are active;
- repairs known legacy demo `categoryId` strings to real ObjectIds;
- creates only missing canonical demo dishes;
- makes canonical demo dishes active/available;
- restores the four Ember House Phase 7 true-3D configurations;
- enables missing Photo Explode defaults where a canonical dish already has an image;
- preserves existing descriptive Restaurant/dish content where possible;
- does **not** reset Customers, Reservations, Orders, payments, Reviews or other business records.

Expected development baseline:

```text
Ember House: 4+ public dishes; 4 true-3D demo dishes ready
Kori:        4+ public dishes
Verde:       4+ public dishes
Malformed canonical demo category references: 0
```

The normal `npm run seed` flow was also hardened so future repeated demo seeding repairs the canonical category reference and active/available state instead of preserving broken demo state indefinitely.

## Bundled true-3D assets verified

The project still contains four real GLB assets under `frontend/public/models/`:

```text
coal-roasted-pumpkin.glb
ember-signature-plate.glb
burnt-honey-custard.glb
smoked-citrus-fizz.glb
```

Therefore the reported missing 3D view was a data/query-runtime problem, not missing model files.

## Frontend dependency alignment

The clean package now uses:

```text
React / ReactDOM        19.2.8
React Router DOM        7.18.2
Three.js                0.185.1
React Three Fiber       9.7.0
Drei                    10.7.8
Motion                  13.1.0
Vite                    8.2.1
```

This replaces the older React-18/R3F-8/Drei-9 dependency path that locally pulled deprecated `three-mesh-bvh@0.7.8`.

True 3D remains lazy-loaded and still uses Three.js + R3F + Drei + GSAP. Motion remains the DOM/image/Photo Explode engine.

## Backend dependency/security baseline

The clean package now pins:

```text
Express                 4.22.2
Mongoose                8.22.1
Multer                  2.2.0
path-to-regexp override 0.1.13
```

The image-upload Multer configuration also sets:

```text
fieldNestingDepth: 1
```

in addition to the existing file-count, field-count, parts, size and magic-byte validation limits.

## React Router hardening

The old React Router 6.x line used by the project fell inside a currently documented affected range for a backslash-based external-navigation/open-redirect issue. The project is now on React Router DOM 7.18.2, above the 7.18.0 patched boundary while preserving the existing declarative `BrowserRouter` architecture.

## 3D bundle splitting

The Phase 12 local build showed one large combined Three vendor chunk. Vite now separates:

```text
three-core
r3f-vendor
drei-vendor
gsap-vendor
motion-vendor
react-vendor
```

This does not pretend Three.js is small; it keeps the heavy 3D runtime out of normal initial routes and makes the dependency groups easier to profile in Phase 13.

## New regression tests

```powershell
npm run test:runtime-repair
npm run test:dependency-baseline
```

Existing flow/security/Phase tests were re-run after the source changes.

## Source validation performed

Passed in the artifact environment:

- backend JavaScript syntax checks;
- Platform Admin management smoke test;
- Phase 2B/3/4/5/6/7/8/9/10/11 smoke tests;
- Motion + Photo Explode smoke test;
- Phase 12 cinematic UX smoke test;
- security baseline smoke test;
- route/connection smoke test;
- localhost runtime smoke test;
- new demo-runtime-repair smoke test;
- new dependency/3D-runtime baseline smoke test;
- frontend JS/JSX parser validation;
- bundled GLB presence checks.

## What still requires the user's local machine

The distributed project intentionally keeps `MONGODB_URI` blank, and the artifact environment cannot reproduce the user's exact npm lock tree. Therefore these are **local gates**, not claimed as passed here:

- live Atlas `diagnose:demo-runtime` / `repair:demo-runtime`;
- clean installed-tree `npm audit` after dependency replacement;
- dependency-backed React 19/R3F 9 production build;
- browser E2E of the repaired Atlas data;
- Phase 13 Lighthouse/Web Vitals/GPU/WebGL/mobile/concurrency testing.

Do not use `npm audit fix --force` blindly. Inspect any remaining installed dependency path first.

## Exact local recovery sequence

### Backend

```powershell
cd backend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install

npm run diagnose:demo-runtime
npm run repair:demo-runtime
npm run diagnose:demo-runtime

npm run test:runtime-repair
npm run test:dependency-baseline
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
npm run build
npm run audit:prod
npm run dev
```

### Browser checks

```text
http://localhost:5173/restaurant/ember-house/menu/3d
http://localhost:5173/restaurant/ember-house/menu/coal-roasted-pumpkin/3d
http://localhost:5173/restaurant/kori/menu
http://localhost:5173/restaurant/verde/menu
http://localhost:5173/restaurant-admin/3d-animation
http://localhost:5173/restaurant-admin/photo-explode
```

## Important 3D boundary

The four bundled **true GLB exploded dishes** are currently the Ember House demo set. Kori and Verde receive normal menu data and can use Photo Explode for dish images. A Kori/Verde dish becomes a true ingredient/mesh 3D dish only when a real GLB/GLTF asset with named meshes and valid per-layer configuration is supplied.

## Next phase

**Phase 13 — Security + Performance + Reliability + Full QA** remains next. This corrective checkpoint fixes the concrete failures discovered during local Phase 12 testing; it does not falsely mark Phase 13 as complete.
