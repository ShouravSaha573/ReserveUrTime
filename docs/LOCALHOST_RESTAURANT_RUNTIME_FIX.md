# ReserveUrTime — Localhost + Restaurant Runtime Fix

Date: 2026-08-19
Base: Phase 12 complete

## Problem confirmed from local screenshots
The Phase 12 frontend was intentionally bound to `127.0.0.1:5173`, while the backend trusted `http://localhost:5173`. The browser therefore used the Origin `http://127.0.0.1:5173` but the backend CORS/trusted-origin list was based on `http://localhost:5173`.

Public CMS/Restaurant requests could fail even though Vite itself was running. `HomePage` also swallowed the Restaurant request error and showed a misleading empty-state message.

## Fixes
- Vite local host is now `localhost`, so `npm run dev` reports `http://localhost:5173/`.
- Local frontend `.env` now uses `VITE_API_URL=/api`.
- Vite proxies `/api` to the separately running backend at `http://localhost:5000`.
- Development backend trusted origins safely recognise the exact `localhost`/`127.0.0.1` loopback equivalents. Production behaviour is unchanged.
- Homepage Restaurant loading now has loading/error/empty states and a Retry button; backend connection failure is no longer presented as “no featured Restaurants”.
- Added `npm run diagnose:restaurants` to inspect live Atlas Restaurant availability without printing credentials.
- Added `npm run test:local-runtime` to prevent the local-origin regression.
- Restaurant Admin 3D editor is lazy-loaded and Vite vendor chunking separates Three/R3F, GSAP, Motion and React vendor groups to reduce the previous oversized entry bundle.

## Correct local run
Backend terminal:

```powershell
cd backend
npm install
npm run diagnose:restaurants
npm run dev
```

Frontend terminal:

```powershell
cd frontend
npm install
npm run build
npm run dev
```

Open exactly:

```text
http://localhost:5173
```

Backend health:

```text
http://localhost:5000/api/health
```

If `diagnose:restaurants` reports zero active Restaurants and this is the intended course/demo database, keep `SEED_RESET=false` and run `npm run seed` once, then restart the backend.

## Architecture preserved
Frontend and backend still start separately. The local Vite proxy only removes browser-origin mismatch; it does not merge the applications.
