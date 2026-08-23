# Phase 4 — Restaurant Internal Operations CMS — IMPLEMENTED

## Scope completed
Restaurant Admin now owns operational CRUD for only the Restaurant assigned to the authenticated account.

### Menu Categories
- create;
- list;
- edit;
- soft remove;
- restore;
- display ordering.

### Basic Dishes
- create;
- list;
- edit;
- soft remove;
- restore;
- category assignment;
- name/slug;
- description;
- comma/array ingredients;
- price;
- image URL;
- display order;
- availability.

Real GLB/GLTF/3D fields are intentionally not part of Phase 4.

### Dining Tables
- create;
- edit table number/capacity/area;
- available/maintenance status;
- soft remove/restore;
- upcoming active reservation protection before disabling/removing a table.

### Reservation Operations
- Restaurant Admin list is restricted to the assigned Restaurant;
- filter by date/status;
- pending -> confirmed/cancelled;
- confirmed -> completed/cancelled;
- completed/cancelled are terminal;
- cancellation releases the reservation collision key;
- customer/table information is populated for operational use.

### Internal Gallery
- create/edit/remove/restore gallery items;
- title/image URL/alt text/caption;
- published/draft;
- display order.

## Security boundary
All routes are below `/api/restaurant-admin/*` and use:

1. `authenticateUser`
2. `requireRestaurantAdmin`
3. `requireManagedRestaurant`

Operational writes force `restaurantId = req.managedRestaurantId` on the backend. Restaurant Admin does not choose an arbitrary Restaurant ID.

Platform Admin receives no Menu/Table/Gallery/Restaurant operational CRUD routes.

## Frontend pages
- `/restaurant-admin/menu`
- `/restaurant-admin/tables`
- `/restaurant-admin/reservations`
- `/restaurant-admin/gallery`

A shared Restaurant Admin section navigation connects dashboard/profile/menu/tables/reservations/gallery/listing requests.

## Models added
- `MenuCategory`
- `MenuItem`
- `GalleryItem`

Existing `DiningTable` and `Reservation` remain the operational sources for tables/bookings.

## Seed changes
The development seed now creates safe sample categories, one sample editable dish and one sample gallery item for each seeded Restaurant using `$setOnInsert`, so later seed runs do not intentionally overwrite edits to an existing sample record.

## Test
Run inside `backend/`:

```bash
npm run test:phase4
```

Expected:

```text
Phase 4 Restaurant internal operations smoke tests passed.
```
