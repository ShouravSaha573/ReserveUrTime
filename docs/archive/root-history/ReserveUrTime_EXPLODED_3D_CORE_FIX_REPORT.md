# ReserveUrTime — Exploded 3D Core Runtime & Frontend Audit Fix Report

Date: 2026-08-19  
Base: Phase 12 + previous 3D/dependency corrective checkpoint  
Result: **The real exploded-dish implementation is preserved and its failing runtime data path is hardened. The known Tailwind/Sucrase/glob high-audit path is remediated in package metadata.**

## Local symptoms addressed
- `/restaurant/ember-house/menu/coal-roasted-pumpkin/3d` could show `3D menu unavailable — Invalid record id.`.
- The normal menu could show `OPEN FULL 3D MENU`, proving 3D metadata existed, but the full-3D API failed before WebGL rendered.
- Frontend `npm install` could still report one high-severity vulnerability.
- The production build still showed a large Drei vendor chunk.

## Deep 3D fix
The true 3D code was already present: real bundled GLBs, named meshes, R3F/Drei viewer, GSAP timeline, XYZ/rotation/scale exploded transforms, precise reassembly and Restaurant Admin controls.

The failure occurred before the viewer mounted. Historical Atlas records can contain category/foreign-key strings from old project phases. The full public Restaurant/menu/3D read path now bypasses Mongoose hydration/casting and uses native collection reads for Restaurant, MenuCategory, MenuItem, RestaurantProfile and GalleryItem. Category joins recognize ObjectId and old category slug forms.

For the four Ember House demo dishes, the Phase 7 bundled manifest now reconstructs any missing/partial model/layer runtime metadata while preserving valid matching Restaurant Admin overrides. Therefore a stale old demo document cannot silently remove the signature exploded-layer experience.

## Animation detail
Default demo choreography is now deliberately visible: 1.15s duration, 0.075s stagger and 650ms initial exploded hold. Every participating named mesh can animate:
- X/Y/Z position;
- rotation X/Y/Z;
- explode scale;
- sequence/stagger/duration/easing;
then returns to the exact assembled transforms captured from the GLB.

## Frontend high audit remediation
The known Tailwind 3 -> Sucrase -> glob CLI audit path is addressed with:
- Tailwind CSS 3.4.19
- PostCSS 8.5.26
- Autoprefixer 10.5.4
- Sucrase 3.35.1 override
- glob 10.5.0 override

`glob@10.5.0` is the patched 10.x boundary for GHSA-5j98-mcp5-4vw2 / CVE-2025-64756. Exact audit output must be confirmed on the user's clean Windows install because this artifact environment cannot build the user's generated lock tree.

## Bundle organization
Vite now separates Three core, R3F, Drei, three-mesh-bvh, camera-controls, Troika, GSAP, Motion and React vendor groups. Phase 13 will profile actual runtime/transfer/GPU cost; the project does not hide warnings by merely raising the chunk-size threshold.

## New/updated checks
- `npm run test:3d-core`
- `npm run test:runtime-repair`
- `npm run test:dependency-baseline`
- updated Phase 6/7/Motion/static regression tests
- `npm run diagnose:demo-runtime` now verifies the actual public 3D service path.

Expected local diagnostic after repair:
```text
Public 3D service readiness: 4/4
Public 3D service cast-safe: true
```

## Local sequence
Backend:
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

Frontend:
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

Browser gates:
- `http://localhost:5173/restaurant/ember-house/menu/3d`
- `http://localhost:5173/restaurant/ember-house/menu/coal-roasted-pumpkin/3d`
- `http://localhost:5173/restaurant-admin/3d-animation`

## Validation in artifact environment
Passed:
- syntax check across 109 backend JS files;
- Phase 6 real GLB smoke test;
- Phase 7 full 3D/Admin editor smoke test;
- Motion + Photo Explode smoke test;
- Phase 12 cinematic UX smoke test;
- localhost runtime smoke test;
- flow/connection smoke test;
- security baseline smoke test;
- demo-runtime repair smoke test;
- dependency baseline smoke test;
- new exploded-3D core smoke test;
- TypeScript parser pass across 69 frontend JS/JSX files;
- all four bundled GLB presence checks.

Not claimed here: fresh dependency-backed Vite build, generated-lockfile `npm audit`, live Atlas repair/E2E, browser WebGL/GPU profiling. Those remain local/Phase-13 gates.

## Next phase
**Phase 13 — Security + Performance + Reliability + Full QA.**
