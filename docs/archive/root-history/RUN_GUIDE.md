# ReserveUrTime — Run Guide

Frontend and backend are separate applications and must be started in two terminals.

## 1. Environment
The project already contains `backend/.env` and `frontend/.env`.

Set only your personal Atlas URI:
```env
MONGODB_URI=YOUR_WORKING_MONGODB_ATLAS_URI
```

Frontend is already:
```env
VITE_API_URL=http://localhost:5000/api
```

Local admin accounts:
```text
Platform Admin
platform@reserveurtime.local
ReserveUrTime@Admin2026

Restaurant Admin — Ember House
manager.ember@reserveurtime.local
EmberManager@2026
```

## 2. One-time/security setup after upgrading from Phase 9 hardened base
Back up Atlas first, then from `backend/`:
```powershell
npm install
npm run migrate:security
npm run audit:data-security
npm run test:security
npm run test:flows
npm run test:phase9
npm run test:phase10
npm run audit:deps
```

If using a fresh/older seeded DB and you need demo 3D data:
```powershell
npm run seed
npm run setup:phase7
npm run diagnose:phase7
```
Keep `SEED_RESET=false` in normal development.

## 3. Phase 10 SSLCOMMERZ environment
Backend local defaults:
```env
SSLCOMMERZ_ENABLED=true
SSLCOMMERZ_IS_LIVE=false
SSLCOMMERZ_STORE_ID=testbox
SSLCOMMERZ_STORE_PASSWORD=qwerty
PAYMENT_CALLBACK_BASE_URL=http://localhost:5000
PAYMENT_CLIENT_RETURN_URL=http://localhost:5173/dashboard/orders
```

The demo credentials are public documentation examples. Replace them in `backend/.env` if your Sandbox account uses different credentials.

Never add SSLCOMMERZ Store Password to frontend/VITE variables.

Check configuration without printing the password:
```powershell
cd backend
npm run diagnose:phase10
```

### Localhost limitation
Browser success/fail/cancel can return to localhost. A genuine SSLCOMMERZ server IPN cannot reach your private localhost. For full IPN testing, expose the backend through a public HTTPS tunnel/backend URL and set `PAYMENT_CALLBACK_BASE_URL` to that public origin.

## 4. Start Backend — Terminal 1
```powershell
cd E:\Downloads\ReserveUrTime\backend
npm install
npm run dev
```
Backend: `http://localhost:5000`
Health: `http://localhost:5000/api/health`

## 5. Start Frontend — Terminal 2
```powershell
cd E:\Downloads\ReserveUrTime\frontend
npm install
npm run build
npm run dev
```
Frontend: `http://localhost:5173`

## 6. Main routes
```text
Customer Login
http://localhost:5173/customer/login

Customer Dashboard
http://localhost:5173/dashboard

Customer Cart
http://localhost:5173/dashboard/cart

Customer Orders / payment status
http://localhost:5173/dashboard/orders

Customer Profile / billing contact
http://localhost:5173/dashboard/profile

Platform Admin
http://localhost:5173/platform-admin/login

Restaurant Admin
http://localhost:5173/restaurant-admin/login

Restaurant Admin Orders
http://localhost:5173/restaurant-admin/orders

Full 3D menu
http://localhost:5173/restaurant/ember-house/menu/3d

Restaurant Admin 3D editor
http://localhost:5173/restaurant-admin/3d-animation
```

## 7. Test a Sandbox payment
1. Register/login as Customer.
2. Complete phone + billing address in `/dashboard/profile`.
3. Add one or more active dishes from one Restaurant to Cart.
4. Open `/dashboard/cart`.
5. Click **Place order & pay with SSLCOMMERZ**.
6. ReserveUrTime creates the Order, then the backend creates a hosted SSLCOMMERZ session using the stored Order total/BDT.
7. Complete a Sandbox gateway transaction.
8. Return to `/dashboard/orders` and verify the Order says paid only after backend reconciliation.
9. Login as Restaurant Admin and verify fulfilment controls appear only for verified-paid Orders.

For a pending transaction, Customer can use **Check payment status**. The backend re-queries SSLCOMMERZ; the browser does not decide payment truth.

## 8. Expected Phase 10 security behavior
- missing/wrong browser Origin/request marker on protected mutations -> denied;
- Customer cannot pay another Customer's Order;
- browser-supplied amount is ignored;
- callback body alone cannot mark paid;
- unpaid/pending Order cannot enter Restaurant fulfilment;
- Restaurant Admin cannot mark paid/refunded;
- duplicate verified callback does not duplicate Order payment state;
- no card PAN/CVV is collected by ReserveUrTime.

## 9. Admin credential repair
If login credentials in `.env` differ from old MongoDB hashes:
```powershell
cd backend
npm run diagnose:auth
npm run sync:admin-credentials
npm run diagnose:auth
```
Then restart backend.

## 10. 3D repair commands
```powershell
cd backend
npm run diagnose:phase6
npm run setup:phase6
npm run setup:phase7
npm run diagnose:phase7
```

## 11. Before public deployment
Do not use the included development secrets/admin passwords. Replace JWT/audit/admin credentials, configure HTTPS, exact frontend origins, `TRUST_PROXY`, media origins and real SSLCOMMERZ credentials. Keep Sandbox until the Sandbox test matrix passes.


## Phase 11 routes
Customer/public:
- `http://localhost:5173/contact`
- `http://localhost:5173/dashboard/reviews`
- `http://localhost:5173/dashboard/messages`
- `http://localhost:5173/dashboard/notifications`

Restaurant Admin:
- `/restaurant-admin/reviews`
- `/restaurant-admin/messages`
- `/restaurant-admin/notifications`

Platform Admin:
- `/platform-admin/reviews`
- `/platform-admin/messages`

Backend Phase 11 checks:
```powershell
cd backend
npm run test:phase11
npm run test:flows
npm run test:security
```

No Phase 11 database migration is required. MongoDB creates `reviews`, `contactmessages` and `notifications` when first used. `SEED_RESET=true` now also clears these development collections.

## Motion + Photo Explode setup on an existing database
Backend:
```powershell
cd backend
npm install
npm run setup:motion-photo
npm run test:motion-photo
npm run dev
```
Frontend separately:
```powershell
cd frontend
npm install
npm run build
npm run dev
```
Restaurant Admin pages:
- Menu/image upload: `http://localhost:5173/restaurant-admin/menu`
- Photo Explode editor: `http://localhost:5173/restaurant-admin/photo-explode`
- True GLB editor: `http://localhost:5173/restaurant-admin/3d-animation`

Local runtime image uploads go to `frontend/public/uploads/menu-images/`. Production deployment must use persistent object storage/CDN.



## Phase 12 cinematic UX validation
Backend static/regression checks:
```powershell
cd backend
npm run test:phase12
npm run test:flows
npm run test:security
```
Frontend:
```powershell
cd frontend
npm install
npm run build
npm run dev
```
Manual Phase 12 checks:
- Tab once on a page and verify `Skip to main content` appears and works.
- On a narrow/mobile viewport, open/close the navigation drawer and verify role-appropriate links.
- Verify Customer and Restaurant Admin section navigations horizontally scroll instead of collapsing.
- Verify focus rings are visible using keyboard navigation.
- Enable OS/browser reduced motion and verify non-essential glint/sheen/displacement stops while functionality remains.
- Check Restaurant discovery and 3D menu on a small phone width.


## Correct local URLs after the localhost runtime fix
Run backend and frontend in separate terminals.

Backend:
```powershell
cd backend
npm install
npm run diagnose:restaurants
npm run dev
```
Health check: `http://localhost:5000/api/health`

Frontend:
```powershell
cd frontend
npm install
npm run build
npm run dev
```
Open: `http://localhost:5173`

The frontend uses `VITE_API_URL=/api` locally and Vite proxies `/api` to `http://localhost:5000`. If the homepage says the backend cannot be reached, verify the backend terminal is still running. If `npm run diagnose:restaurants` reports zero active Restaurants in the intended demo database, keep `SEED_RESET=false`, run `npm run seed` once, then restart the backend.


## Required one-time repair after the 3D/runtime dependency update
Because the dependency majors and demo runtime repair changed, use a clean install instead of reusing the old `node_modules`. Keep/copy your existing private `backend/.env` first.

Backend:
```powershell
cd backend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
npm run diagnose:demo-runtime
npm run repair:demo-runtime
npm run diagnose:demo-runtime
npm run test:runtime-repair
npm run test:dependency-baseline
npm run audit:prod
npm run dev
```

Frontend (separate terminal):
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
npm run build
npm run audit:prod
npm run dev
```

Expected demo routes after repair:
- `http://localhost:5173/restaurant/ember-house/menu/3d` — four real GLB demo dishes.
- `http://localhost:5173/restaurant/ember-house/menu/coal-roasted-pumpkin/3d` — detailed exploded layers.
- `http://localhost:5173/restaurant/kori/menu` — canonical Kori dishes + Photo Explode where enabled.

If `npm audit` still reports anything, run plain `npm audit` and inspect the exact package path; do not use `npm audit fix --force` blindly.

## Latest exploded-3D recovery gate
After replacing the project with the latest corrective package, use a clean dependency install and repair only the demo runtime data.

Backend:
```powershell
cd backend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
npm run repair:demo-runtime
npm run diagnose:demo-runtime
npm run test:3d-core
npm run test:runtime-repair
npm run test:dependency-baseline
npm run test:phase6
npm run test:phase7
npm run test:motion-photo
npm run test:flows
npm run test:security
npm run audit:prod
npm run dev
```

Frontend, separate terminal:
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install
npm audit
npm run build
npm run audit:prod
npm run dev
```

Expected `diagnose:demo-runtime`: `Public 3D service readiness: 4/4` and `Public 3D service cast-safe: true`. Then open `/restaurant/ember-house/menu/3d`. Do not use `npm audit fix --force` blindly.

