# ReserveUrTime — Localhost / Restaurant Loading Fix Report

Date: 2026-08-19
Base: Phase 12 complete

## Root cause
The frontend Vite server was bound to `127.0.0.1:5173` while backend local trust/CORS configuration expected `http://localhost:5173`. The frontend also called `http://localhost:5000/api` directly. This created a loopback-origin mismatch (`127.0.0.1` vs `localhost`) in the browser. Public API requests could fail, while the homepage silently converted the failure into an empty Restaurant list.

## Fixed
- Vite now runs at `http://localhost:5173`.
- Local frontend API uses same-origin `/api`.
- Vite `/api` proxy targets the separately running backend at `http://localhost:5000`.
- Development backend safely allows exact localhost/127.0.0.1 loopback aliases; production trust remains explicit.
- Homepage now distinguishes Loading / Backend Error / True Empty Database states and provides Retry.
- Added `diagnose:restaurants` and `test:local-runtime` backend commands.
- Lazy-loaded Restaurant Admin 3D editor and added safe manual vendor chunking for React, Motion, GSAP and Three/R3F to reduce the previous oversized entry bundle.

## Validation
Passed in the artifact environment:
- all backend JS syntax;
- Platform Admin management and Phase 2B–12 source smoke tests used in this checkpoint;
- security baseline;
- route/connection smoke;
- new localhost/runtime smoke test;
- frontend JS/JSX parser pass over 69 source files.

A fresh dependency-backed Vite build could not be rerun in the artifact environment because npm registry installation timed out. The user's preceding local screenshot already confirmed Vite 8.2.1 builds successfully; rerun `npm run build` locally after replacing the fixed source to verify the new chunk output.

## Local commands
Backend:
```powershell
cd backend
npm install
npm run diagnose:restaurants
npm run test:local-runtime
npm run test:security
npm run dev
```

Frontend:
```powershell
cd frontend
npm install
npm run build
npm run dev
```

Open `http://localhost:5173`.
