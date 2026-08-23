# ReserveUrTime — Signature Hero Pivot Run Guide

This build uses the new final visual direction:

- Homepage starts with the signature animated hero.
- Hard-coded homepage showcases: Burger, Pizza, Momo, Chicken Fry Bowl, Kebabs, Soda Can.
- Restaurants appear after the signature hero.
- Restaurant menus use normal real-food images with a subtle levitation effect.
- Public Restaurant 3D menu routes and Restaurant Admin 3D/Photo Explode routes are retired.
- No Meshy/API key is required for this build.

## 1. Extract the project

Extract the ZIP to a short path, for example:

```powershell
E:\ReserveUrTime_HeroPivot
```

Do not run the project from inside the ZIP.

## 2. Check Node.js

Use Node 20.19+ or Node 22:

```powershell
node -v
npm -v
```

## 3. Configure the backend

Open PowerShell:

```powershell
cd E:\ReserveUrTime_HeroPivot\backend
Copy-Item .env.example .env
```

Open `backend\.env` and set your real MongoDB Atlas URI:

```env
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER/ReserveUrTime?retryWrites=true&w=majority
```

Keep secrets only in `backend\.env`. Do not put MongoDB/JWT/payment secrets in the frontend.

For localhost, keep:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
TRUST_PROXY=false
SEED_RESET=false
```

## 4. Install backend dependencies

```powershell
npm install
```

## 5. Seed only if this is a fresh database

If your existing Atlas database already contains ReserveUrTime data, skip this step.

For a fresh database only:

```powershell
npm run seed
```

`SEED_RESET=false` should remain set unless you deliberately want a reset.

## 6. Run the current validation checks

```powershell
npm run test:hero-pivot
npm run test:cms
npm run test:flows
npm run test:security
npm run test:phase5
npm run test:phase8
npm run test:phase9
npm run test:phase10
npm run test:phase11
npm run test:phase12
```

The important new result is:

```text
Homepage Hero Pivot smoke test passed.
```

The old Phase 6/7 test commands now verify that the legacy source remains archived while Restaurant 3D delivery stays retired:

```powershell
npm run test:phase6
npm run test:phase7
npm run test:motion-photo
```

## 7. Start the backend

```powershell
npm run dev
```

Check:

```text
http://localhost:5000/api/health
```

Keep this terminal open.

## 8. Configure the frontend

Open a second PowerShell terminal:

```powershell
cd E:\ReserveUrTime_HeroPivot\frontend
Copy-Item .env.example .env
```

For local development, keep:

```env
VITE_API_URL=/api
```

## 9. Install and build the frontend

```powershell
npm install
npm run build
```

If the build succeeds, start Vite:

```powershell
npm run dev
```

Open:

```text
http://localhost:5173
```

## 10. Homepage verification

At `/`, verify this exact order:

```text
Navbar
  ↓
Signature Hero
  ↓
Burger / Pizza / Momo / Chicken / Kebabs / Soda selector
  ↓
Galaxy Restaurant Search
  ↓
Restaurants section
  ↓
Footer
```

Test each hero selector:

1. Burger — real photographic separated ingredients. Press `Explore layers` and `Assemble`.
2. Pizza — real photographic depth/explode presentation.
3. Momo — real photographic depth/explode presentation.
4. Chicken — real photographic depth/explode presentation.
5. Kebab — real photographic depth/explode presentation.
6. Soda — true interactive 3D can; switch `Classic` ↔ `Zero Lime` and move the pointer around the can.

The background should show mint/jade/bone stars with twinkle, pointer reaction, scroll acceleration and bloom.

## 11. Important Soda requirement

The Soda scene deliberately uses the external GLB/texture URLs supplied in `Hero_Section.txt` and loads Google's `<model-viewer>` from `unpkg.com`.

Therefore the browser needs internet access for the Soda scene. The five food showcases are local assets and do not need an external generation API.

If the Soda can says `Loading 3D can…` forever:

1. Confirm your browser has internet access.
2. Open DevTools → Network.
3. Confirm `unpkg.com` and `api.getlayers.ai` are reachable.
4. Disable extensions that block cross-site media/scripts and reload.

No card, paid API or Meshy account is required.

## 12. Restaurant page verification

Open a Restaurant menu, for example:

```text
http://localhost:5173/restaurant/ember-house/menu
```

Expected:

- normal real-food menu images;
- subtle continuous levitation;
- Favourite and Add to Cart still work;
- no `Open Full 3D Menu` button;
- no Explode/Assemble controls inside Restaurant pages.

The old frontend routes should be unavailable:

```text
/restaurant/ember-house/menu/3d
/restaurant-admin/3d-animation
/restaurant-admin/photo-explode
```

## 13. Restaurant Admin verification

Open:

```text
http://localhost:5173/restaurant-admin/login
```

Then:

```text
http://localhost:5173/restaurant-admin/menu
```

Expected:

- Category CRUD remains.
- Dish CRUD remains.
- Dish image URL remains.
- PNG/JPEG/WebP upload remains.
- Transparent PNG/WebP is recommended for the levitating public-menu look.
- No `3D Animation` link.
- No `Photo Explode` link.

Restaurant Admin ownership remains scoped through `requireManagedRestaurant`.

## 14. Platform Admin homepage verification

Open:

```text
http://localhost:5173/platform-admin/homepage
```

Platform Admin can edit homepage copy/search/Restaurant-section settings and galaxy presets, but:

```text
Signature Hero is always first
Restaurants are always second
```

The CMS cannot disable the signature hero or move Restaurants above it.

## 15. Customer-flow regression checks

Verify these still work:

```text
Customer Register/Login
Restaurant discovery/search
Reservation
Favourites
Cart
Checkout/Orders
SSLCOMMERZ sandbox flow
Reviews
Messages/Contact
Notifications
Profile
```

The hero pivot does not delete Customer, Order, Reservation or Payment data.

## 16. Production/Vercel note

The frontend `vercel.json` CSP already permits the supplied `unpkg.com` model-viewer script and HTTPS model/media requests needed by the Soda hero.

Set production `VITE_API_URL` to your deployed backend API. Keep all backend secrets in the backend hosting environment only.

## 17. If something looks wrong

Use this order:

```powershell
# Backend
cd backend
npm install
npm run test:hero-pivot
npm run test:flows
npm run test:security
npm run dev

# Frontend — new terminal
cd frontend
npm install
npm run build
npm run dev
```

Then hard-refresh the browser with `Ctrl + Shift + R`.
