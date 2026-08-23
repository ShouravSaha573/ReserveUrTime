# Phase 1 Test Guide

## Automated lightweight RBAC smoke test

```bash
npm run test:phase1
```

Expected:

```text
Phase 1 RBAC smoke tests passed.
```

## Platform management smoke test
```bash
npm run test:management
```
Expected:
```text
Platform Admin management smoke tests passed.
```

## Manual tests

### A. Customer regression
- Register customer.
- Login customer.
- Browse restaurants.
- Book table.
- View My Reservations.
- Cancel an active reservation.

### B. Platform Admin
- Login via `/platform-admin/login`.
- Dashboard loads `/api/platform-admin/summary`.
- Restaurant Admin/customer credentials must be rejected by Platform Admin login.

### C. Restaurant Admin
- Login via `/restaurant-admin/login`.
- Dashboard loads `/api/restaurant-admin/summary`.
- Assigned restaurant shown must match the seed assignment.
- Platform Admin/customer credentials must be rejected by Restaurant Admin login.

### D. Scope record
In MongoDB Atlas verify the Restaurant Admin user has:

```text
role = restaurant_admin
restaurantId = <assigned restaurant ObjectId>
```

### E. Boundary check
There are no Phase 1 Platform Admin routes for menu/table/reservation write operations and no Restaurant Admin routes for homepage/public restaurant listing writes.


### F. Platform Admin management regression
- Add/edit/remove/restore a Restaurant listing.
- Add/edit/remove a Restaurant Admin.
- Reassign Restaurant Admin to another active Restaurant.
- Disable Restaurant Admin and confirm login is denied.
- Confirm Platform Admin still has no Restaurant-internal write routes.
