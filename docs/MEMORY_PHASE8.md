# MEMORY_PHASE8

Phase 8 is complete.

Canonical Customer routes:
- `/dashboard`
- `/dashboard/favourites`
- `/dashboard/reservations`
- `/dashboard/profile`

Canonical Customer APIs:
- `GET /api/customer/dashboard`
- `GET /api/customer/favorites`
- `POST /api/customer/favorites`
- `DELETE /api/customer/favorites/:targetType/:targetId`
- `PATCH /api/customer/profile`

`Favorite` supports two Customer-owned target types: active Restaurant and active/available menu item. Partial unique indexes prevent duplicate saves. Restaurant/dish eligibility is validated on the server.

Favourite controls exist on public Restaurant cards, Restaurant detail, ordinary menu dishes and Phase 7 full 3D dishes. Unauthenticated Save sends the user to Customer Login with a safe return path. Customer optimistic UI rolls back after failed writes.

Customer dashboard overview shows saved Restaurant/dish counts, reservation counts and nearest upcoming reservation. Profile editing is limited to name + phone; login email is read-only in Phase 8.

No new heavy motion dependency was added. Save feedback is small CSS motion and `prefers-reduced-motion` safe.

Phase 9 is next: Cart + Orders + Restaurant Admin order management.
