# ReserveUrTime — 3D Runtime + Dependency Hardening Checkpoint

Date: 2026-08-19  
Base: Phase 12 + localhost/Restaurant runtime corrective build  
Status: **corrective checkpoint complete; Phase 13 remains next**

## Why this checkpoint exists
Local testing exposed three separate problems:

1. `/restaurant/ember-house/menu/coal-roasted-pumpkin/3d` could return `Invalid record id.`;
2. some demo Restaurants (for example Kori) could exist while their public menu returned zero dishes;
3. local `npm install` reported deprecated/known-vulnerable dependency paths.

These are runtime/data/dependency problems, not a reason to remove the 3D system.

## Public menu / 3D CastError fix
Older Atlas records may contain a legacy string/slug in `MenuItem.categoryId` instead of a valid `MenuCategory` ObjectId. Mongoose `populate("categoryId")` tries to cast that value and can throw a CastError, which the API previously surfaced as `Invalid record id.`.

Public Restaurant/menu/3D reads no longer call `populate()` on this legacy-sensitive field. They load the Restaurant's active categories separately and perform a safe in-memory ID join. A malformed old category reference therefore cannot take down the entire public menu or 3D menu.

The dedicated repair command also fixes known legacy demo category references in Atlas.

## Demo runtime repair
Use this on the existing development Atlas database:

```powershell
cd backend
npm run diagnose:demo-runtime
npm run repair:demo-runtime
npm run diagnose:demo-runtime
```

`repair:demo-runtime` is intentionally **not a database reset**. It:

- ensures Ember House, Kori and Verde are active demo Restaurants;
- ensures Starters/Mains/Desserts/Drinks categories exist and are active;
- creates only missing canonical demo dishes;
- repairs canonical demo dish `categoryId` references;
- re-enables the canonical demo dishes if old data left them inactive/unavailable;
- restores Phase 7 real-3D metadata for the four Ember House GLB demos;
- enables missing Photo Explode defaults when a canonical demo dish has an image;
- preserves existing Restaurant/dish descriptive content where possible;
- does not delete Orders, Reservations, Customers, Reviews, payments or other business records.

Expected development readiness:

```text
Ember House: 4+ public dishes, 4 real 3D demo dishes
Kori:        4+ public dishes
Verde:       4+ public dishes
Malformed demo category refs: 0
```

## 3D dependency alignment
The frontend dependency line is now aligned around React 19:

```text
React / ReactDOM        19.2.8
React Router DOM        7.18.2
Three.js                0.185.1
React Three Fiber       9.7.0
Drei                    10.7.8
Motion                  13.1.0
Vite                    8.2.1
```

This moves the project away from the older React-18/R3F-8/Drei-9 dependency path that produced the local `three-mesh-bvh@0.7.8` deprecation warning.

The project still uses the same animation ownership rule:

- Motion: DOM/image/page animation and Photo Explode;
- Three.js + R3F + Drei + GSAP: true named-mesh GLB exploded dishes.

## Backend dependency hardening
The backend now uses:

```text
Express                 4.22.2
Mongoose                8.22.1
Multer                  2.2.0
path-to-regexp override 0.1.13
```

Multer upload handling also sets `fieldNestingDepth: 1` in addition to file/field/part/size limits.

## Bundle splitting
The 3D route remains lazy. Vite vendor chunking now separates:

- `three-core`;
- `r3f-vendor`;
- `drei-vendor`;
- `gsap-vendor`;
- `motion-vendor`;
- `react-vendor`.

This does not remove Three.js's legitimate cost, but avoids treating the entire 3D stack as one monolithic initial application chunk.

## Static verification commands

```powershell
cd backend
npm run test:runtime-repair
npm run test:dependency-baseline
npm run test:flows
npm run test:security
npm run test:phase12
```

## Local dependency verification
Because the exact installed tree is determined by npm on the user's computer, perform a clean install after this dependency update.

Frontend:

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
npm run build
npm run audit:prod
```

Backend:

```powershell
cd backend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
npm run test:dependency-baseline
npm run audit:prod
```

Do not use `npm audit fix --force` blindly. Review any remaining advisory and its installed dependency path first.

## Real 3D test URLs
After backend repair and both servers are running:

```text
http://localhost:5173/restaurant/ember-house/menu/3d
http://localhost:5173/restaurant/ember-house/menu/coal-roasted-pumpkin/3d
http://localhost:5173/restaurant/ember-house/menu/signature-main/3d
```

Normal/Photo Explode menu examples:

```text
http://localhost:5173/restaurant/kori/menu
http://localhost:5173/restaurant/verde/menu
```

## Next
Phase 13 remains **Security + Performance + Reliability + Full QA**. This checkpoint fixes the concrete runtime and dependency problems found before Phase 13 rather than falsely marking Phase 13 as already complete.
