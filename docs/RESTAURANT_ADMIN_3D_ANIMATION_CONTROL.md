# Restaurant Admin — 3D Exploded Animation Control Requirement

Status: **Approved project requirement; implementation scheduled for Phase 7.**

## Requirement
A Restaurant Admin must be able to configure the **3D exploded-layer animation of dishes belonging to that Restaurant's own menu** from the Restaurant Admin dashboard.

The 3D model/GLB remains the source of truth for the fully assembled dish. Restaurant Admin changes affect only safe, structured animation metadata around named model layers.

## Per-dish controls
For each 3D-enabled dish, the Restaurant Admin should be able to:
- enable/disable the exploded animation for that dish;
- choose which named GLB/GLTF layers participate in the explode/assemble animation;
- edit each participating layer's exploded `x`, `y`, and `z` offset;
- change layer sequence/order;
- choose animation duration;
- choose stagger/delay between layers;
- choose an easing preset from an application allowlist;
- preview Explode and Assemble behavior before saving;
- reset the animation configuration to the model/default recommended values.

Phase 7 may also expose bounded per-layer duration factors or rotation offsets if the production GLB needs them, but they must remain validated numeric metadata rather than executable code.

## Ownership and authorization
```text
Authenticated Restaurant Admin
        ↓
User.restaurantId
        ↓
requireManagedRestaurant
        ↓
Own Restaurant MenuItem only
        ↓
Validated 3D animation configuration
```

Rules:
- Restaurant Admin may edit 3D animation settings only for MenuItems belonging to `req.managedRestaurantId`.
- A Restaurant ID supplied by the browser is never trusted as authorization.
- Platform Admin does **not** manage Restaurant-internal 3D animation settings.
- One Restaurant Admin must never be able to edit another Restaurant's dish animation metadata.

## Security boundary
The editor must never accept arbitrary JavaScript, CSS, HTML, shader code, expressions, function bodies, or unbounded runtime configuration.

Backend validation must enforce:
- known mesh/node names from the dish's 3D metadata contract;
- finite numeric X/Y/Z values inside bounded ranges;
- bounded duration/stagger values;
- allowlisted easing names;
- maximum layer count/config size;
- restaurant ownership and dish ownership;
- sanitized labels/text fields where applicable.

## Public behavior
After a valid configuration is saved, the public 3D dish experience reads that structured metadata and uses it for the dish's Explode/Assemble animation. The normal Phase 5 DOM menu remains the permanent fallback.

## Phase placement
- **Phase 6:** one fixed prototype and metadata/runtime pipeline — DONE.
- **Phase 7:** Restaurant Admin 3D animation editor + full multi-dish 3D menu — REQUIRED.
- **Phase 13:** security/performance regression testing for malicious/out-of-range animation settings — REQUIRED.


## Phase 7 implementation status — DONE
Implemented route: `/restaurant-admin/3d-animation`.

Implemented APIs:
- `GET /api/restaurant-admin/menu/items/:itemId/3d-animation`
- `PATCH /api/restaurant-admin/menu/items/:itemId/3d-animation`

Implemented controls: layer participation, sequence, XYZ offsets, duration, stagger, easing allowlist, auto-assemble, delay, float intensity and rotation intensity. The page includes live local preview, Preview Explode/Assemble, revert and recommended timing.

Backend rejects unknown/duplicate mesh names, out-of-range numbers and non-allowlisted easing. Ownership comes only from `req.managedRestaurantId`.

## Detailed layer-motion enhancement — implemented
The true GLB editor now also exposes bounded per-layer:
- rotation X/Y/Z in degrees (`-45..45`);
- explode scale (`0.8..1.25`).

The public Three.js/R3F viewer animates position, rotation and scale together through GSAP, then restores exact assembled GLB transforms. Existing restaurant scoping and allowlisted validation still apply.

A separate `/restaurant-admin/photo-explode` editor handles normal dish photographs with Motion. Photo Explode is a 2.5D image effect and must not be described as real ingredient geometry.

## Legacy-data resilience
Restaurant Admin 3D editor reads/updates target MenuItem records through a raw collection ownership query so an unrelated historical `categoryId` string cannot block the editor. Ownership is still enforced by the authenticated `restaurantId`; payload validation still rejects unknown meshes, duplicate meshes, out-of-range XYZ/rotation/scale values, unsupported easing and arbitrary executable input. Canonical demo mesh names can be restored for the four Ember House GLBs while valid matching Admin overrides are retained.

