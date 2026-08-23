# ReserveUrTime — Local Environment Setup

The local-development package includes ready-to-use `.env` files for both independent applications.

## Only value the user must provide

Open `backend/.env` and paste the personal MongoDB Atlas URI:

```env
MONGODB_URI=mongodb+srv://...
```

Do not share or commit the real URI.

## Backend local-development values

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=
JWT_SECRET=ReserveUrTime_Dev_JWT_2026_9f4c7e2b6a1d8c3f5e0a
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
COOKIE_SAME_SITE=lax
PLATFORM_ADMIN_EMAIL=platform@reserveurtime.local
PLATFORM_ADMIN_PASSWORD=ReserveUrTime@Admin2026
RESTAURANT_ADMIN_EMAIL=manager.ember@reserveurtime.local
RESTAURANT_ADMIN_PASSWORD=EmberManager@2026
RESTAURANT_ADMIN_RESTAURANT_SLUG=ember-house
SEED_RESET=false
```

## Frontend local-development value

```env
VITE_API_URL=http://localhost:5000/api
```

## Seeded accounts

### Platform Admin
- Email: `platform@reserveurtime.local`
- Password: `ReserveUrTime@Admin2026`

### Restaurant Admin — Ember House
- Email: `manager.ember@reserveurtime.local`
- Password: `EmberManager@2026`

Run `npm run seed` from `backend/` after adding `MONGODB_URI` to create/update the seeded accounts.

## Security note

These credentials and JWT secret are development defaults included for easy local setup. The root `.gitignore` ignores `.env` and `.env.*` except `.env.example`. Change the passwords and JWT secret before a public deployment.

## Security variables added before Phase 10
Local `backend/.env` / `.env.example` now include:
```env
TRUST_PROXY=false
AUDIT_HASH_SECRET=ReserveUrTime_Dev_Audit_2026_c8b2f1976a4d3e50
AUDIT_LOG_RETENTION_DAYS=90
CLIENT_URLS=
MEDIA_ALLOWED_ORIGINS=
```
Only `MONGODB_URI` remains intentionally blank/personal in the distributed project.

Before production, replace the development JWT/audit/admin secrets. Production frontend origins must be HTTPS. `TRUST_PROXY` must match the actual hosting topology; do not blindly set it because a tutorial uses `1`.

## Phase 10 SSLCOMMERZ local variables
Backend `.env` also includes:
```env
SSLCOMMERZ_ENABLED=true
SSLCOMMERZ_IS_LIVE=false
SSLCOMMERZ_STORE_ID=testbox
SSLCOMMERZ_STORE_PASSWORD=qwerty
PAYMENT_CALLBACK_BASE_URL=http://localhost:5000
PAYMENT_CLIENT_RETURN_URL=http://localhost:5173/dashboard/orders
```
`testbox/qwerty` are public documentation demo values, not private production credentials. If your SSLCOMMERZ Sandbox account provides different values, replace them in `backend/.env` only. Never add the Store Password to `frontend/.env` or a `VITE_*` variable.

`PAYMENT_CALLBACK_BASE_URL=http://localhost:5000` supports local browser return callbacks, but a real gateway-server IPN needs a publicly reachable HTTPS backend/tunnel URL.



## Localhost rule
Use `http://localhost:5173` for the frontend and `http://localhost:5000` for the backend. Local frontend `.env` uses `VITE_API_URL=/api`; Vite proxies it to the backend. Do not mix `127.0.0.1` and `localhost` manually when debugging cookies/CORS.
