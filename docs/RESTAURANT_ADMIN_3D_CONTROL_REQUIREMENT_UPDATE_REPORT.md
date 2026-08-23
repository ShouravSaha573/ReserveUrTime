# ReserveUrTime — Restaurant Admin 3D Animation-Control Requirement Update

Date: 2026-08-19

## Requirement added
Restaurant Admin must be able to change the Exploded Layers animation for 3D-enabled dishes in the assigned Restaurant's own menu.

## Planned Phase 7 controls
- layer participation;
- exploded X/Y/Z offsets;
- sequence/order;
- duration;
- stagger/delay;
- allowlisted easing preset;
- Explode/Assemble preview;
- reset to default/recommended configuration.

## Boundaries
- Restaurant-scoped through authenticated `req.managedRestaurantId`;
- Platform Admin has no Restaurant-internal 3D animation editor;
- no arbitrary JavaScript/CSS/HTML/shader/expression execution;
- backend validates numeric bounds, layer IDs, config size and easing allowlist;
- GLB remains the assembled geometry source of truth;
- Phase 5 DOM menu/poster remain fallback.

## Files updated
- `docs/RESTAURANT_ADMIN_3D_ANIMATION_CONTROL.md` (new)
- `docs/PHASE_ROADMAP.md`
- `docs/TODO.md`
- `docs/source_PRD.md`
- `docs/source_RESTAURANT_SYSTEM.md`
- `docs/THREE_D_ASSET_PIPELINE.md`
- `docs/source_DATABASE_SCHEMA.md`
- `docs/source_AUTH_RBAC.md`
- `docs/SECURITY_PERFORMANCE_RELIABILITY.md`
- `docs/CURRENT_STATE.md`
- `docs/source_MEMORY.md`
- `docs/PHASE_6_IMPLEMENTED.md`
- `docs/REMAINING_PHASE_ANIMATION_MAP.md`
- `docs/CHANGELOG.md`
- `README.md`
- `docs/diagrams/restaurant_admin_3d_animation_control.mmd` (new)

## Implementation status
Documentation/requirements are updated now. The actual Restaurant Admin editor remains a **Phase 7 implementation task**; Phase 6 runtime code was not falsely marked as already supporting it.


## Implementation update
The requirement described in this report is now implemented in Phase 7. See `PHASE_7_IMPLEMENTED.md` and `/restaurant-admin/3d-animation`.
