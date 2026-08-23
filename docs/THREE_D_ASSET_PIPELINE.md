# ReserveUrTime 3D Asset Pipeline Contract

## Purpose
This is the canonical contract introduced in Phase 6. Future production dishes should follow it instead of inventing a new per-dish structure.

## Asset format
Preferred runtime format: `.glb`.
`.gltf` may be accepted later when external buffers/textures are deliberately managed, but one-file GLB is preferred for predictable loading.

## Named layer rule
Every independently animated food layer must have a stable, meaningful node/mesh name inside the GLB. Examples:
- `Plate`
- `Protein`
- `Sauce`
- `Garnish`

Do not depend on Blender-generated names such as `Cube.013` in production.

## Assembled transform rule
The GLB is the source of truth for the fully assembled dish. Runtime code captures each named node's original local transform after loading.

Database metadata stores only the exploded offsets. This prevents the database from drifting away from the artist-authored assembled model.

## MenuItem contract
```text
threeD.enabled
threeD.modelUrl
threeD.posterUrl
threeD.modelScale
threeD.cameraPosition {x,y,z}
threeD.cameraTarget {x,y,z}
threeD.layers[]
  meshName
  label
  explodedOffset {x,y,z}
```

## Prototype storage
Phase 6 local prototype:
`frontend/public/models/coal-roasted-pumpkin.glb`

Production deployment should later move admin-uploaded binary assets to object storage/CDN. Do not store GLB binary files directly inside MongoDB documents.

## Optimization target
Before a production dish is accepted:
- remove hidden geometry;
- merge static pieces where layer animation does not need separation;
- keep only meaningful animated nodes;
- compress textures;
- use Meshopt/Draco only after profiling loader/decode trade-offs;
- ship a poster fallback;
- test mobile GPU/memory;
- keep material count controlled.

## Loading rule
Phase 7 may preload only current/previous/next dishes. Never load the entire Restaurant 3D menu at once.

## Failure rule
If WebGL/model loading fails, navigate/present the ordinary Phase 5 DOM menu and poster image. 3D is enhancement, not the only path to menu information.

## Restaurant Admin animation editor contract
Phase 7 must expose the Phase 6 metadata contract through a safe Restaurant Admin editor. The GLB remains the assembled source of truth; the admin edits only animation metadata.

Planned structured contract:
```text
threeD.explodedAnimation.enabled
threeD.explodedAnimation.durationMs
threeD.explodedAnimation.staggerMs
threeD.explodedAnimation.easingPreset
threeD.layers[]
  meshName
  label
  participates
  order
  explodedOffset {x,y,z}
  durationFactor   # optional bounded number
  rotationOffset   # optional bounded xyz, only if production models require it
```

The UI must read available named layers, provide Explode/Assemble preview, validate before save, and offer reset-to-default. Backend validation and Restaurant scope are mandatory. No JavaScript/CSS/shader/expression field is allowed.


## Phase 7 productionized menu behavior
Phase 7 now uses the Phase 6 asset contract across multiple dishes. `MenuItem.threeD.animation` stores validated timing/presentation metadata while `threeD.layers[]` stores per-layer participation, sequence and exploded offsets. The assembled geometry still comes from named GLB nodes; absolute assembled transforms are not duplicated in MongoDB.

Public loading rule: fetch the 3D menu metadata, load current model, and preload only previous/next model URLs. Do not preload every GLB.

Restaurant Admin may edit animation metadata but does not edit arbitrary code/shaders. Production art replacement must keep stable named nodes or intentionally migrate the corresponding layer configuration.

## Image-based companion path: Photo Explode
Not every dish requires a custom GLB. Normal dish images may use the Motion-powered Photo Explode companion path. It slices the original image into 4–16 clipped image layers and animates them through CSS 3D transforms. This is a fast 2.5D presentation path, not a substitute for named-mesh GLB geometry. Signature dishes should still use the real 3D pipeline.

True GLB layer metadata now additionally supports `rotationOffset` and `explodeScale`.



## 2026-08-19 runtime repair / current 3D dependency baseline
Current runtime is React 19.2.8 + R3F 9.7.0 + Drei 10.7.8 + Three 0.185.1 + GSAP. The four Ember House real-3D demo GLBs remain bundled. If Atlas metadata predates Phase 7 or has malformed category references, use `npm run repair:demo-runtime`; do not manually edit ObjectIds. Public 3D reads intentionally avoid category populate so a category-data defect cannot disable the entire 3D dish experience.

## Runtime resilience rule — post Phase 12 corrective checkpoint
For public true-3D demo reads, the GLB and canonical named-mesh manifest are not allowed to disappear merely because an old Atlas document has malformed legacy category metadata. Public reads use native Mongo collection access and merge canonical Phase 7 mesh definitions with valid Restaurant Admin overrides. The GLB remains the assembled geometry source of truth; MongoDB stores safe choreography overrides. `repair:demo-runtime` should still normalize Atlas data, but the public signature 3D route no longer depends on that repair to avoid a cast crash.

Default demo choreography: 1.15s duration, 0.075s stagger, 650ms initial exploded hold, position + rotation + scale. Phase 13 must profile this on desktop/mobile and reduced-motion modes.

