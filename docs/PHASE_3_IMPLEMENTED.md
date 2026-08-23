# Phase 3 — Restaurant Admin Profile + Listing Change Approval — IMPLEMENTED

## Goal completed
Restaurant Admin now has a restaurant-scoped management area without gaining direct control over Platform-owned Restaurant identity fields.

## Restaurant Admin
- Can read/update only the internal `RestaurantProfile` assigned to its backend-derived `restaurantId`.
- Can submit a public Restaurant name change request.
- Can submit a homepage/Restaurants-tab listing image change request.
- Can see pending/approved/rejected history and Platform Admin notes.
- Cannot select another Restaurant ID in these APIs.
- Cannot directly write `Restaurant.name` or `Restaurant.coverImageUrl`.

## Platform Admin
- Has an approval inbox.
- Sees current vs proposed name or image.
- Can approve or reject with an optional note.
- Approval atomically updates the `Restaurant` listing record and request status inside a MongoDB transaction.
- Approval/rejection is written to the audit log.

## New models
- `RestaurantProfile`
- `ListingChangeRequest`

## New Restaurant Admin routes
- `GET /api/restaurant-admin/profile`
- `PATCH /api/restaurant-admin/profile`
- `GET /api/restaurant-admin/listing-change-requests`
- `POST /api/restaurant-admin/listing-change-requests`

## New Platform Admin routes
- `GET /api/platform-admin/listing-change-requests`
- `PATCH /api/platform-admin/listing-change-requests/:requestId/review`

## New View routes
- `/restaurant-admin/profile`
- `/restaurant-admin/listing-requests`
- `/platform-admin/change-requests`

## Important rule
Approving a Restaurant name request changes only the public name. The stable Restaurant `slug` is not automatically changed, so existing public links do not break.
