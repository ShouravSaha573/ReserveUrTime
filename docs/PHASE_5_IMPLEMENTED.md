# Phase 5 Implemented — Public Restaurant Experience + Basic Menu/Search/Filter

## Status
DONE.

## Public Restaurant experience
The public Restaurant page now consumes Restaurant-owned content without exposing Restaurant Admin write APIs:

- Platform-owned Restaurant listing identity: name, cover image, cuisine, location.
- Restaurant Admin-owned `RestaurantProfile`: tagline/story/reservation note/contact/hours.
- Active Menu Categories.
- Active + available Menu Items only.
- Published + active Gallery Items only.
- Existing customer-login gate remains required for booking.

## New public pages
- `/restaurant/:slug` — polished editorial Restaurant experience.
- `/restaurant/:slug/menu` — public non-3D menu with search/filter.

## Public menu search/filter
Search is server-side and supports:
- Dish name.
- Description.
- Ingredients.

Category filtering uses active Restaurant-owned Menu Categories.

Only dishes with both `isActive: true` and `isAvailable: true` are public.

## Public endpoints
- `GET /api/restaurants/:slug/experience`
- `GET /api/restaurants/:slug/menu?q=<query>&category=<categorySlug>`

## Reliability/performance
- Public Restaurant experience is aggregated to avoid many independent initial requests.
- Menu search query is trimmed and capped at 80 characters.
- Regex metacharacters are escaped.
- Public menu result count is capped at 100.
- Frontend menu input uses ~320 ms debounce via URL search state.
- Old menu requests are aborted when filters/search change.
- Gallery images use lazy loading after the first image.
- Public page has fallback content if RestaurantProfile fields are blank.

## Security boundaries preserved
- No public write endpoints were added.
- Restaurant Admin internal CRUD still requires Restaurant Admin authentication.
- Platform Admin still does not receive Restaurant-internal operational CRUD.
- Public endpoints only expose explicitly selected public fields.

## 3D boundary
No GLB/GLTF/model fields were added in Phase 5.
No Three.js/R3F/Drei dish renderer was added.
No exploded/layered assembly was started.

Phase 6 is the first 3D phase and must start from this stable public menu foundation.
