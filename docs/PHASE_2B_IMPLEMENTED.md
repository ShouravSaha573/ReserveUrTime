# PHASE_2B_IMPLEMENTED.md

## Status
Phase 2B — Platform Admin Homepage CMS + remaining platform presentation controls — DONE.

## Implemented
- `SiteContent` MongoDB model.
- Public `GET /api/site/homepage`.
- Protected Platform Admin `GET/PATCH /api/platform-admin/homepage`.
- `AuditLog` model + recent audit API.
- Platform Admin Homepage CMS UI.
- Navbar/brand/footer/hero/Restaurant-section copy are data-driven.
- Hero media URL/path is data-driven.
- Galaxy Search visibility/placeholder is data-driven.
- Homepage section order/visibility is data-driven.
- Galaxy background uses bounded density/movement/shine/glow presets.
- Restaurants support `isFeatured`, `featuredOrder`, `listingOrder`.
- Public Restaurant listing follows `listingOrder`.
- Homepage featured Restaurants follow `featuredOrder`.
- Existing Platform Admin/Restaurant Admin boundary remains intact.
- Project folders renamed to `frontend/` and `backend/` with MVC mapping.

## Not included
- Restaurant Admin internal CMS.
- Restaurant public-name/listing-image approval workflow.
- Menu/dish CRUD.
- GLB/GLTF/3D system.

Those belong to later phases.
