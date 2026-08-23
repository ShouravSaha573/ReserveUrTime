# Phase 1 — Role Refactor + Multi-Admin Security Foundation — DONE

## Implemented
- `admin` -> `platform_admin` terminology and backend role migration.
- `restaurant_admin` role.
- Nullable `User.restaurantId`, required for Restaurant Admin access.
- Separate management logins:
  - `/platform-admin/login`
  - `/restaurant-admin/login`
- Separate protected dashboards.
- Separate backend namespaces:
  - `/api/platform-admin/*`
  - `/api/restaurant-admin/*`
- `requirePlatformAdmin`.
- `requireRestaurantAdmin`.
- `requireManagedRestaurant`.
- Restaurant Admin dashboard derives scope from authenticated `user.restaurantId`.
- Platform Admin has no restaurant-internal write routes.
- Restaurant Admin has no platform write routes.
- Legacy `role: admin` migration in the development seed.
- Development Restaurant Admin seed account assigned by restaurant slug.
- Phase 1 RBAC smoke test command.

## Deliberately NOT implemented inside Phase 1
At the moment Phase 1 was completed, these were intentionally excluded: Homepage CMS, Restaurant directory CRUD, Restaurant Admin internal CRUD, listing approval workflow, and menu/3D.

**Current package update:** Restaurant directory CRUD and Restaurant Admin account management have since been added as the Platform-management expansion. Homepage CMS, Restaurant Admin internal CRUD, listing approval, and menu/3D remain later work.

## Exit criteria
The code now supports three authenticated roles with separate routes and a server-derived restaurant scope. Run `npm run test:phase1` plus the manual login/regression checks in `PHASE_1_TEST_GUIDE.md`.
