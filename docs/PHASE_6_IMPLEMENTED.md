# Phase 6 — 3D Asset Pipeline + ONE Exploded-Assembly Prototype — DONE

Date: 2026-08-18

## Scope completed
Phase 6 deliberately implements only ONE real 3D dish prototype. It does not build the full 3D carousel/menu yet.

Prototype dish:
- Restaurant: Ember House
- Dish: Coal-Roasted Pumpkin
- Public route: `/restaurant/ember-house/menu/coal-roasted-pumpkin/3d`
- Asset: `frontend/public/models/coal-roasted-pumpkin.glb`

## Real model asset
The bundled GLB is a real binary glTF asset (~90 KB) with meaningful named scene nodes:
- `Plate`
- `PumpkinBase`
- `CulturedCream`
- `CharredPumpkin`
- `SeedCrumb`
- `HerbGarnish`
- `SmokeSalt`

The model is intentionally lightweight and geometric for the pipeline prototype. Later production dishes can replace it with artist-made assets while preserving the same metadata contract and named-layer rules.

## Engine
Frontend 3D runtime:
- Three.js
- React Three Fiber 8.x because this project remains on React 18
- Drei 9.x
- GSAP 3.x

The 3D page is React-lazy-loaded so homepage, Restaurant discovery and the normal menu do not download/execute the 3D page bundle until the user opens the 3D route.

## MVC/backend metadata contract
`MenuItem.threeD` now supports:
- `enabled`
- `modelUrl`
- `posterUrl`
- `modelScale`
- `cameraPosition`
- `cameraTarget`
- `layers[]`
  - `meshName`
  - `label`
  - `explodedOffset { x, y, z }`

Public metadata endpoint:
`GET /api/restaurants/:slug/menu/:dishSlug/3d`

MVC flow:
`route -> publicRestaurantExperienceController -> publicRestaurantExperienceService -> MenuItem/Restaurant models`

Only active + available + 3D-enabled dishes are exposed.

## Assembly mechanics
On model load:
1. Exact assembled local positions are captured from the GLB nodes.
2. The configured exploded X/Y/Z offsets are added to those captured positions.
3. The model starts exploded unless reduced-motion is enabled.
4. GSAP animates every named layer back to its captured assembled transform.
5. User can replay `Explode layers` or `Assemble dish`.
6. OrbitControls provides drag/orbit and zoom interaction.
7. A very small idle Float is enabled only when motion is allowed.

The GLB itself remains the source of truth for the assembled geometry. The database stores only intentional explosion offsets, not duplicated absolute assembled transforms.

## Reliability/performance
- Phase 5 ordinary DOM menu remains permanent fallback.
- WebGL capability is checked before rendering the Canvas.
- Viewer errors fall back to poster/normal-menu navigation.
- `prefers-reduced-motion` skips the cinematic automatic assembly and idle float.
- Canvas DPR is capped at 1–1.5.
- No particle system, shader background or multiple models are loaded in Phase 6.
- The model is loaded only on the dedicated 3D route.
- GSAP timelines/tweens and timers are killed on cleanup.

## Seed behavior
Running `npm run seed` in `backend/` attaches the prototype metadata only when the Coal-Roasted Pumpkin dish does not already have a model URL. It does not reset normal menu edits.

## Tests
New source smoke test:
`npm run test:phase6`

It checks:
- 3D metadata schema;
- public 3D endpoint;
- MVC controller/service delegation;
- public active/available/3D-enabled restriction;
- required frontend dependencies;
- lazy-loaded 3D page;
- `useGLTF` + GSAP timeline;
- reduced-motion rule;
- bundled GLB existence and size guard.

## Explicitly NOT Phase 6
Not built yet:
- full Previous/Next 3D menu;
- current/previous/next model preloading;
- dish-to-dish assembly/disassembly transitions;
- mobile swipe between dishes;
- Restaurant Admin 3D asset uploader/editor;
- Cloudinary/object-storage GLB upload pipeline;
- production artist model replacement workflow;
- per-dish full 3D rollout.

Those belong to Phase 7 and later deployment/storage work.

## Next
Phase 7 — Full Real 3D Menu.

## Phase 6 prototype database repair command
If the 3D route shows `3D dish prototype not found`, the public endpoint is working but the current MongoDB record is missing one of the required public prototype flags/fields. Run from `backend/`:

```bash
npm run diagnose:phase6
npm run setup:phase6
```

`setup:phase6` is idempotent and only forces the seeded Ember House / Coal-Roasted Pumpkin prototype record to be active, available, 3D-enabled, and linked to `/models/coal-roasted-pumpkin.glb`.

## Phase 7 handoff requirement — Restaurant Admin control
A new locked requirement has been added after Phase 6: Restaurant Admin must be able to change the exploded-layer animation for 3D-enabled dishes in the assigned Restaurant's own menu. Phase 6 does not retroactively implement this editor. Phase 7 must expose the structured metadata safely with preview/reset and strict Restaurant scoping.


## Phase 7 supersession note
The Phase 6 single-dish prototype remains the foundation, but Phase 7 now productionizes it into the Restaurant-level full 3D menu and adds Restaurant Admin animation controls. See `PHASE_7_IMPLEMENTED.md`.


> Later compatibility note (2026-08-19): Phase 6 originally shipped on React 18/R3F 8/Drei 9. The current project has since migrated to React 19.2.8/R3F 9.7.0/Drei 10.7.8/Three 0.185.1 during the pre-Phase-13 runtime/dependency hardening checkpoint. The Phase 6 description above remains historical.
