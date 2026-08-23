# Phase 8 Implemented — Favourites + Customer Profile/Dashboard

Date: 2026-08-19

## Scope completed
Phase 8 adds the authenticated Customer personal layer without changing public browsing, Restaurant Admin ownership, Platform Admin boundaries, or the Phase 7 3D engine.

### Customer favourites
Customers can save and remove:
- active Restaurants;
- active + currently available menu dishes.

Favourite controls are available from:
- homepage/directory Restaurant cards;
- Restaurant detail hero;
- normal public menu dishes;
- full 3D menu dishes.

Unauthenticated users who press Save are sent to Customer Login with a safe `returnTo` path. Platform Admin and Restaurant Admin sessions do not receive Customer favourite actions.

### Optimistic interaction with rollback
The frontend updates the saved state immediately, sends the authenticated write, then replaces local state with the server response. If the write fails, the previous state is restored. The save icon uses a small CSS-only state animation and respects `prefers-reduced-motion`.

### Customer dashboard
Protected routes:
- `/dashboard`
- `/dashboard/favourites`
- `/dashboard/reservations`
- `/dashboard/profile`

Overview includes:
- saved Restaurant count;
- saved dish count;
- total reservation count;
- upcoming reservation count;
- nearest upcoming reservation;
- account shortcut.

### Customer profile
Phase 8 allows safe editing of:
- name;
- phone.

Login email is deliberately read-only in this phase so email-change/reverification/recovery logic is not silently introduced.

## Backend MVC
Added:
- `src/models/Favorite.js`
- `src/services/customerAccountService.js`
- `src/controllers/customerController.js`
- `src/routes/customerRoutes.js`
- `src/tests/phase8-customer-favourites-profile-smoke.js`

Mounted at `/api/customer`.

APIs:
- `GET /api/customer/dashboard`
- `GET /api/customer/favorites`
- `POST /api/customer/favorites`
- `DELETE /api/customer/favorites/:targetType/:targetId`
- `PATCH /api/customer/profile`

Every endpoint requires `authenticateUser` + `requireCustomer`.

## Favourite data contract
`Favorite` stores one Customer-owned target:
- `targetType = restaurant` + `restaurantId`, or
- `targetType = menu_item` + `menuItemId`.

Partial unique indexes enforce one saved copy per Customer/target. The server verifies that a Restaurant is active and that a dish is active/available and belongs to an active Restaurant before saving it.

## Frontend additions
- `context/FavoritesContext.jsx`
- `components/FavouriteButton.jsx`
- `components/CustomerDashboardNav.jsx`
- `pages/CustomerDashboardPage.jsx`
- `pages/CustomerFavouritesPage.jsx`
- `pages/CustomerProfilePage.jsx`

The favourites context loads only for authenticated Customers and clears itself for logout/non-Customer roles.

## Permanent boundaries
- Public discovery/menu/3D browsing remains public.
- Saving/favourites requires Customer login.
- Restaurant Admin cannot inspect or alter Customer favourites.
- Platform Admin has no Customer favourite editing API.
- Phase 7 3D model/animation behaviour is unchanged.
- No new heavy animation/particle library was added for Phase 8.

## Validation
Run from `backend/`:
```bash
npm run test:phase8
```

Expected:
```text
Phase 8 favourites + customer profile/dashboard smoke tests passed.
```

## Next
Phase 9 — Cart + Orders + Restaurant Admin order management.
