# Galaxy Restaurant Search — Implemented

## Scope
A public restaurant-directory search experience is now implemented on:
- the public homepage hero;
- the `/restaurants` page.

This is **restaurant discovery search**, not the future dish/menu search.

## Search fields
Public users can search active restaurants by:
- Restaurant name;
- Cuisine name.

Examples:
- `Ember`
- `Japanese`
- `European`

## API
`GET /api/restaurants?q=<query>&limit=<1-50>`

Rules:
- only `isActive: true` restaurants are returned;
- query is trimmed and capped at 80 characters;
- regex-special characters are escaped before matching;
- matching is case-insensitive;
- only `name` and `cuisine` are searched;
- suggestion requests use `limit=6`;
- the main Restaurants page uses the same endpoint and URL query parameter.

## Frontend UX
Reusable component:
`frontend/src/components/GalaxyRestaurantSearch.jsx`

Homepage behavior:
1. User focuses search.
2. Search shell lifts slightly in 3D.
3. Subtle orbit lines and starfield become active.
4. Typing waits about 320 ms before calling the API (debounce).
5. Suggestions show restaurant image, name, cuisine and location.
6. Selecting a result plays a short galaxy/warp transition and opens that restaurant.
7. Pressing Enter/Explore plays the transition and opens `/restaurants?q=...`.

Restaurants page behavior:
- search query is stored in the URL;
- refreshing the page keeps the search;
- restaurant results are fetched from the backend;
- search can be cleared without affecting authentication or reservation state.

## 3D / Galaxy Animation
The search bar uses lightweight CSS 3D instead of adding a heavy WebGL dependency:
- CSS perspective;
- constrained pointer tilt using direct CSS variables (no React render per pointer move);
- translated Z layers for icon/input/button;
- subtle elliptical orbit rings;
- internal miniature starfield;
- focus light that reacts to pointer position;
- short 360 ms galaxy warp/launch transition before navigation;
- blurred/glass suggestion panel transition.

This keeps the real Three.js performance budget reserved for future GLB/GLTF food dishes.

## Performance / Reliability
- no new npm dependency;
- 320 ms debounce avoids API congestion;
- previous suggestion request is aborted when query changes;
- search calls use existing safe GET retry behavior;
- timers are cleaned when component unmounts;
- result limit prevents large suggestion payloads;
- mobile disables pointer 3D/orbit decoration;
- `prefers-reduced-motion` disables non-essential 3D/warp/orbit animations.

## Security
- search is public and read-only;
- inactive Restaurants are never returned;
- user input is not converted directly into an unsafe regex;
- query length is capped;
- public response fields remain restricted by `publicFields`.

## Boundary
This feature does not modify:
- Customer auth;
- Platform Admin permissions;
- Restaurant Admin permissions;
- Reservation authorization;
- Restaurant-internal menu/dish data.
