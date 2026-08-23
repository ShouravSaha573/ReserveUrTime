# ReserveUrTime Memory — Motion + Photo Explode Checkpoint

Date: 2026-08-19

Phase 0–11 remain complete. **Phase 12 has not started.**

Latest implementation:
- Motion for React added for DOM/image motion (`motion/react`).
- Home hero and public menu received reduced-motion-safe Motion reveals/layout animation.
- Normal dish images can become Motion-powered Photo Explode visuals.
- Restaurant Admin can upload PNG/JPEG/WebP <= 6 MB while creating/editing a dish.
- Upload content is checked by magic bytes; SVG is rejected.
- Upload/safe image URL enables `MenuItem.photoExplode`.
- Restaurant Admin editor: `/restaurant-admin/photo-explode`.
- Photo controls: enabled, source image, layer count, gap, depth, tilt, duration, stagger, allowlisted motion feel.
- Public normal menu shows interactive 2.5D explode/assemble when enabled.
- Photo Explode is not true ingredient reconstruction; signature real 3D remains named-mesh GLB/GLTF.
- Real GLB `threeD.layers[]` now also supports `rotationOffset` and `explodeScale` in addition to XYZ offsets and sequence.
- GSAP animates GLB position + rotation + scale and returns exact assembled transforms.
- Existing Atlas data can be initialized with `npm run setup:motion-photo`.
- Validation command: `npm run test:motion-photo`.
- Local upload storage is development-only; Phase 14 must move runtime uploads to persistent object storage/CDN.
- Next phase remains Phase 12 cinematic/responsive/accessibility polish.
