# Restaurant Internal Operations

## Ownership rule
Restaurant operational data belongs to Restaurant Admin, not Platform Admin.

Each internal operational record stores `restaurantId`, but controllers do not trust a Restaurant ID supplied by the browser. The effective Restaurant scope is taken from the authenticated Restaurant Admin account as `req.managedRestaurantId`.

## Models

### MenuCategory
`restaurantId`, `name`, `slug`, `description`, `displayOrder`, `isActive`.

### MenuItem
`restaurantId`, `categoryId`, `name`, `slug`, `description`, `ingredients[]`, `price`, `imageUrl`, `displayOrder`, `isAvailable`, `isActive`.

3D metadata is deliberately excluded until the dedicated 3D asset phase.

### DiningTable
Existing model remains Restaurant-scoped. Restaurant Admin controls number, capacity, area, availability/maintenance and active state.

### Reservation
Existing Customer booking data remains the source of truth. Restaurant Admin may manage operational status only for its own Restaurant.

### GalleryItem
`restaurantId`, `title`, `imageUrl`, `altText`, `caption`, `displayOrder`, `isPublished`, `isActive`.

## Soft-removal policy
Categories, dishes, tables and gallery items use soft removal so historical references/data are preserved.

## Table safety
A table with a future pending/confirmed reservation cannot be disabled or removed until the relevant reservation is resolved.

## Reservation transitions
- pending -> confirmed or cancelled
- confirmed -> completed or cancelled
- completed -> terminal
- cancelled -> terminal

## Platform boundary
Platform Admin still owns only platform presentation/listing identity and Restaurant Admin account lifecycle. It does not receive internal menu/table/reservation/gallery APIs.

## Phase 4 API routes

### Menu Categories
- `GET /api/restaurant-admin/menu/categories`
- `POST /api/restaurant-admin/menu/categories`
- `PATCH /api/restaurant-admin/menu/categories/:categoryId`
- `DELETE /api/restaurant-admin/menu/categories/:categoryId`

### Basic Dishes
- `GET /api/restaurant-admin/menu/items`
- `POST /api/restaurant-admin/menu/items`
- `PATCH /api/restaurant-admin/menu/items/:itemId`
- `DELETE /api/restaurant-admin/menu/items/:itemId`

### Dining Tables
- `GET /api/restaurant-admin/tables`
- `POST /api/restaurant-admin/tables`
- `PATCH /api/restaurant-admin/tables/:tableId`
- `DELETE /api/restaurant-admin/tables/:tableId`

### Reservation Operations
- `GET /api/restaurant-admin/reservations`
- `PATCH /api/restaurant-admin/reservations/:reservationId/status`

### Internal Gallery
- `GET /api/restaurant-admin/gallery`
- `POST /api/restaurant-admin/gallery`
- `PATCH /api/restaurant-admin/gallery/:galleryItemId`
- `DELETE /api/restaurant-admin/gallery/:galleryItemId`
