# Motion.dev + Photo Explode Enhancement

Date: 2026-08-19  
Status: **Implemented after Phase 11, before Phase 12. Phase 12 remains NEXT.**

## Why this enhancement exists
ReserveUrTime already uses Three.js + React Three Fiber + Drei + GSAP for true GLB/GLTF exploded dishes. The project now also uses **Motion for React** (`motion` package) for smooth DOM/image animation, layout/reveal motion and the new image-based Photo Explode experience.

Official reference: https://motion.dev/

Motion is used where it fits best:
- DOM/image layer transitions;
- hover/tap and viewport reveals;
- accessible reduced-motion handling;
- layout-friendly UI motion.

GSAP/R3F remains the core of real 3D mesh choreography. Motion does **not** replace the Three.js engine.

## New Photo Explode mode
A Restaurant Admin may upload a normal dish photo or use a safe image URL. The application can convert that photo into a **2.5D layered explode/assemble effect** by rendering the same image as multiple horizontal clipped layers and animating each layer through X/Y/Z, rotation and scale with Motion.

This works with any accepted PNG/JPEG/WebP image, but the result quality depends strongly on the input photo.

### Important technical truth
A single flat photo does **not** contain real hidden 3D ingredient geometry. Therefore Photo Explode is a cinematic 2.5D image-slice effect. It does not claim to reconstruct actual ingredient meshes.

For true ingredient-by-ingredient 3D separation, Restaurant Admin must continue using a named-mesh GLB/GLTF asset in the existing 3D workflow.

## Restaurant Admin workflow
1. Open `/restaurant-admin/menu`.
2. Create/edit a dish.
3. Upload a PNG/JPEG/WebP image (max 6 MB) or use a safe existing image URL.
4. Saving the dish stores the image and enables Photo Explode.
5. Open `/restaurant-admin/photo-explode`.
6. Select the dish.
7. Tune layer count, gap, depth, tilt, duration, stagger and Motion feel.
8. Preview Explode/Assemble locally.
9. Save & publish.
10. The public DOM menu shows the interactive Photo Explode visual.

## Motion controls
Per-dish Photo Explode controls are bounded and structured:
- enabled;
- source image URL;
- 4–16 image layers;
- layer gap 4–48;
- depth 0–90;
- tilt 0–12;
- duration 0.25–2.5 seconds;
- stagger 0–0.15 seconds;
- allowlisted Motion feel: `cinematic`, `soft`, `snappy`, `spring`;
- optional future auto-preview flag.

No JavaScript/CSS/HTML expressions are accepted from Restaurant Admin.

## True 3D exploded motion upgraded too
Named GLB layers now support:
- X/Y/Z exploded position offsets;
- X/Y/Z **rotation offsets** in degrees;
- per-layer **explode scale**;
- sequence;
- participation;
- global duration/stagger/easing/auto-assemble/float settings.

The 3D viewer animates position, rotation and scale together through GSAP for more detailed choreography while restoring the exact assembled GLB transforms.

## Performance/accessibility
- `useReducedMotion()` disables the heavy displacement path for users requesting reduced motion.
- Public Photo Explode stays inside the DOM/CSS transform pipeline; it does not create another WebGL canvas.
- True 3D remains lazily loaded.
- The permanent normal DOM menu remains the fallback.
- Photo layers are capped at 16.
- Uploads are capped at 6 MB and restricted to magic-byte-verified PNG/JPEG/WebP.

## Storage note
Local development uploads are written to `frontend/public/uploads/menu-images/` and are gitignored. This is suitable for local/course development only. Phase 14 deployment must replace local runtime storage with persistent object storage/CDN before production publishing.
