# ReserveUrTime — Homepage Signature Hero Pivot Implementation Report

Date: 2026-08-23

## Goal implemented

The project no longer uses exploded 3D dish experiences inside Restaurants. The signature interaction is moved to the homepage, while Restaurant menus use realistic ordinary food photography with levitation.

## Homepage

The homepage now always begins with `SignatureFoodHero` before Restaurants. Six hard-coded showcase scenes are included:

- Burger — six separated real photographic burger layers.
- Pizza — real photographic 2.5D depth/explode presentation.
- Momo — real photographic 2.5D depth/explode presentation.
- Chicken Fry Bowl — real photographic 2.5D depth/explode presentation.
- Kebabs — real photographic 2.5D depth/explode presentation.
- Soda Can — true `<model-viewer>` 3D can with pointer tilt, flavor switching, floating fruit/leaves, bubbles and a two-stage spin.

## Background

`GalaxyBackground.jsx` was rebuilt around the supplied starfield direction:

- 4,200 desktop particles;
- mint / jade / bone palette;
- individual twinkle;
- endless Z drift;
- pointer repulsion;
- scroll-driven forward surge;
- cursor parallax;
- barrel roll;
- multi-pass bloom;
- dark complementary background with animated corner-atmosphere shader.

Mobile/reduced-motion variants lower the star count or motion load.

## Restaurant experience

Public Restaurant menu cards now use normal food images with `object-contain`, realistic drop shadows and a gentle levitating animation. Favourite/Add-to-Cart and menu search/category flows remain unchanged.

Removed from active frontend/backend routing:

- public Restaurant 3D menu route;
- public Restaurant individual 3D dish route;
- Restaurant Admin 3D Animation route/API;
- Restaurant Admin Photo Explode route/API.

Legacy source files/metadata remain only as archived project history/fallback code and are not reachable through the current application UI/API routes.

## CMS

The homepage CMS now forces:

```text
Signature Hero → Restaurants
```

The signature hero cannot be disabled or moved below Restaurants. Platform Admin can still edit normal homepage copy, CTAs, search, Restaurant-section settings and safe galaxy presets.

## Security/data scope preserved

The pivot does not weaken role boundaries:

- Restaurant Admin still uses `requireManagedRestaurant`.
- Platform Admin does not gain Restaurant operational controls.
- Customer, Order, Reservation and Payment records are not reset by this update.
- Existing cart/order/payment/review/contact/notification routes remain mounted.

## Validation completed in artifact environment

Passed:

- `Homepage Hero Pivot` static smoke test;
- Homepage CMS/MVC smoke test;
- current flow/connection smoke test;
- security baseline smoke test;
- Phase 5 public Restaurant smoke test;
- Phase 8 favourites/profile smoke test;
- Phase 9 cart/orders smoke test;
- Phase 10 payment static smoke test;
- Phase 11 communications smoke test;
- Phase 12 cinematic UX smoke test;
- retired Phase 6/7/Motion smoke tests under the new pivot rules;
- backend syntax check across 110 JavaScript files;
- frontend JSX/JS parse across 70 source files;
- relative frontend import resolution check.

Not claimed in the artifact environment:

- fresh `npm install` completion;
- dependency-backed Vite production build;
- live MongoDB Atlas end-to-end browser run.

The dependency install attempt timed out in the artifact environment, so `npm run build` remains a local-machine gate and is included in the run guide.
