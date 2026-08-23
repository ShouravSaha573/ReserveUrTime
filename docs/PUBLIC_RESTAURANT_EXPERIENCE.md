# Public Restaurant Experience

## Purpose
Provide the customer-facing Restaurant experience after a visitor selects a Restaurant from the ReserveUrTime platform.

The visual direction is restrained, dark, editorial and food-focused, inspired by the previously selected Ikoyi-style presentation without copying its exact implementation.

## Data ownership

### Platform Admin controlled public listing identity
- Restaurant name.
- Listing/cover image.
- Cuisine.
- Location.
- Listing visibility/order.

### Restaurant Admin controlled internal/public Restaurant content
- Tagline.
- About/story.
- Reservation note.
- Restaurant contact/hours.
- Menu Categories.
- Dishes.
- Gallery.

Public name/listing-image changes requested by Restaurant Admin still require Platform Admin approval.

## Public Restaurant page
Route:

`/restaurant/:slug`

Sections:
1. Cinematic Restaurant hero.
2. Story/About.
3. Current menu preview.
4. Published gallery.
5. Visit/contact/hours.
6. Booking CTA.

Booking remains Customer-login protected.

## Full public menu
Route:

`/restaurant/:slug/menu`

Features:
- Public without login.
- Available dishes only.
- Search dish name/description/ingredients.
- Filter by active category.
- Price, description, ingredients and image.
- Loading/error/empty states.
- URL-backed `q` and `category` filters.
- 320 ms search debounce.
- Request cancellation on rapid changes.

## API

### Experience
`GET /api/restaurants/:slug/experience`

Returns:
- `restaurant`
- `profile`
- `categories`
- `menuPreview`
- `gallery`

### Menu
`GET /api/restaurants/:slug/menu?q=&category=`

Returns:
- `restaurant`
- `categories`
- `items`
- current search/category metadata

## Phase 6 handoff
The Phase 5 menu is intentionally normal DOM/React UI. It is the fallback and data-contract foundation for the next real-3D phase.


## Phase 7 3D extension
The normal public menu remains the baseline. A Restaurant with 3D-enabled dishes now exposes `/restaurant/:slug/menu/3d` plus dish-specific URLs. The 3D route supports Previous/Next/dots/mobile swipe and adjacent-model preload while preserving poster/DOM fallback.
