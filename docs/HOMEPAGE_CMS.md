# HOMEPAGE_CMS.md

## Status
DONE — Phase 2B.

## Owner
Platform Admin only.

## Goal
Ordinary homepage/platform-presentation changes must not require React source edits.

## Current model
`SiteContent` document with `siteKey="homepage"`.

## Data-driven groups
### Brand/navigation
- brand name;
- Home label;
- Restaurants label;
- Customer Login/Register labels.

### Hero
- enable/disable;
- eyebrow;
- title;
- accent title;
- description;
- optional hero media URL/path;
- Browse CTA label + safe internal path;
- Register CTA label + safe internal path;
- Galaxy Search enable/disable;
- Galaxy Search placeholder.

### Restaurant section
- enable/disable;
- eyebrow/title;
- View all label/path;
- featured Restaurant count;
- hero/Restaurants section order.

Featured Restaurant membership/order is owned by platform Restaurant listing fields:
- `isFeatured`;
- `featuredOrder`;
- `listingOrder`.

### Footer
- footer text.

### Galaxy safe presets
- enabled;
- density `low|medium|high`;
- movement `subtle|normal`;
- shine interval 1800–10000ms;
- glow intensity `low|medium|high`.

No arbitrary JavaScript or CSS injection is accepted.

## APIs
Public:
`GET /api/site/homepage`

Platform Admin:
- `GET /api/platform-admin/homepage`
- `PATCH /api/platform-admin/homepage`
- `GET /api/platform-admin/audit-logs`

## UI
`/platform-admin/homepage`

## Reliability
Public frontend keeps safe built-in defaults if homepage CMS read temporarily fails, so the public site does not become blank.

## Boundary
Homepage CMS does not expose Restaurant-internal menu/table/reservation/order/3D write access.
