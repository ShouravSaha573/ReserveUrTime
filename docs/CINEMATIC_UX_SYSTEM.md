# ReserveUrTime Cinematic UX System

## Purpose
Create a premium, dark, restaurant-cinematic experience without turning animation into a dependency for completing business tasks.

## Animation ownership
### Motion for React
Use for:
- page/section reveal;
- scroll progress;
- DOM/image hover/tap motion;
- mobile navigation entrance/exit;
- shared/layout motion;
- Photo Explode.

### GSAP + R3F/Drei/Three.js
Use only for true GLB/GLTF dish meshes and detailed exploded/assembled transforms.

### CSS
Use for inexpensive polish:
- focus rings;
- active-link underlines;
- sheen;
- background/glass treatments;
- pointer-mode fallbacks.

## Motion principles
1. Animation must explain hierarchy, state or spatial relationship.
2. No critical action waits on decorative animation.
3. Do not run several competing continuous effects at once.
4. Keep 3D and DOM animation engines separate.
5. Fine-pointer hover effects must have stable coarse-pointer equivalents.
6. Reduced motion must preserve meaning and functionality.
7. Do not animate security/payment truth.

## Current cinematic chrome
`CinematicChrome.jsx` provides:
- spring-smoothed scroll progress;
- route glint;
- route-load screen-reader announcement;
- skip-link access.

## Navigation
Desktop uses restrained active-link motion. Mobile uses an accessible Motion drawer, explicit expanded/collapsed state, role-aware routes and body scroll lock.

## Restaurant cards
Restaurant cards use viewport entry, gentle fine-pointer perspective and a one-pass sheen. Image zoom remains restrained and is disabled as a dependency on touch devices.

## Buttons/forms
Buttons have a short lift/shine on fine pointers; inputs receive stronger keyboard/focus indication. Touch controls maintain an accessible target size.

## Reduced motion / transparency
`prefers-reduced-motion` removes route glint, scroll progress, sheen and displacement-heavy effects. `prefers-reduced-transparency` removes blur/translucency where supported.

## 3D rule
True exploded dishes remain driven by the saved Restaurant Admin layer configuration. Phase 12 may polish the container/navigation but does not override Restaurant Admin-authored mesh transforms/timing.
