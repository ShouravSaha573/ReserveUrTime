# Admin Credential Sync Fix

## Problem
Changing `PLATFORM_ADMIN_PASSWORD` or `RESTAURANT_ADMIN_PASSWORD` in `backend/.env` does not magically change an already-existing MongoDB user's bcrypt hash. If the database was created earlier with another password and the seed was not rerun, the login form correctly returns `Invalid email or password.`

## Safe diagnosis
From `backend/` run:

```bash
npm run diagnose:auth
```

The command does not print either password. It checks whether each account exists, whether the stored bcrypt hash matches the current `.env` password, whether the role is correct, whether the account is active, and whether the Restaurant Admin is assigned to the configured restaurant.

## Safe local-development repair
Run:

```bash
npm run sync:admin-credentials
```

This synchronizes only the two seeded management accounts from `backend/.env`:
- Platform Admin
- Restaurant Admin

It does not reset Restaurant/menu/reservation/gallery data and does not modify `MONGODB_URI`.

Then verify again:

```bash
npm run diagnose:auth
```

Both readiness lines should be `true`.

## Why this is not automatic on server startup
The backend intentionally does not overwrite admin passwords every time the server starts. Credential rotation is an explicit administrative action. This avoids unexpected password changes in deployed environments.
