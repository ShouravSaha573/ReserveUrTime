# Platform Admin Management Update

## Implemented

Platform Admin can now manage two platform-owned resources directly from `/platform-admin/dashboard`:

### Restaurants
- Add a restaurant listing.
- Edit restaurant name, slug, description, public image URL, logo URL, cuisine, location, contact details, hours, theme, and public active status.
- Remove a restaurant from the public platform.
- Restore a removed restaurant.
- Restaurant removal is a **soft removal** (`isActive=false`) so restaurant-internal data is not destroyed.

### Restaurant Admin accounts
- Add Restaurant Admin.
- Edit Restaurant Admin name, email, phone, password, assigned restaurant, and active status.
- Remove Restaurant Admin account.
- Restaurant Admin assignment is always made to an active Restaurant.

## Permanent boundary

Platform Admin **cannot** edit restaurant-internal operations:
- Menu categories/items
- 3D dish models
- Exploded-view animation configuration
- Tables
- Restaurant reservations management
- Orders
- Restaurant gallery/internal content
- Restaurant operational settings

Those remain owned by the Restaurant Admin system in later phases.

## Naming

Human-visible role names are:
- **Platform Admin**
- **Restaurant Admin**

Technical backend role keys remain:
- `platform_admin`
- `restaurant_admin`

Technical route slugs remain:
- `/platform-admin/*`
- `/restaurant-admin/*`
