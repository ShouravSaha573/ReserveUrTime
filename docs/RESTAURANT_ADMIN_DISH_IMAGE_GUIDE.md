# Restaurant Admin Dish Image Guide — Photo Explode

Use this guide when adding a dish image that should become a smooth Photo Explode animation.

## Recommended image
- **Format:** PNG, JPEG/JPG or WebP.
- **File size:** 6 MB or less.
- **Resolution:** ideally 1200–2000 px on the longest side.
- **Composition:** one main dish, centered.
- **Plate:** show the complete plate/bowl/glass; do not crop important edges.
- **Background:** transparent, dark, neutral or visually simple is best.
- **Camera:** top-down or gentle 30–45° angle.
- **Focus:** sharp dish edges and clear ingredient contrast.
- **Lighting:** even, premium lighting without blown highlights.
- **Spacing:** leave breathing room around the dish so separated slices still remain readable.

## Avoid
- multiple unrelated dishes in one photo;
- hands/faces around the dish;
- watermarks, logos or large text over the food;
- extreme perspective;
- motion blur;
- cut-off plates;
- very busy backgrounds;
- low-resolution screenshots;
- overexposed white plates disappearing into white backgrounds;
- SVG uploads (rejected for upload security).

## Why background matters
Photo Explode slices the complete image into animated bands. If the background is highly detailed, the background will also split and move. A simple or transparent background makes the food read as the main animated subject.

## Photo Explode vs real 3D
### Photo Explode
Input: one PNG/JPEG/WebP photo.  
Result: smooth 2.5D layered image animation.  
Best for: quickly giving every normal dish a premium explode/assemble effect.

### Real 3D Exploded Dish
Input: GLB/GLTF with named ingredient/food meshes.  
Result: real 3D geometry that can orbit, zoom and separate ingredient meshes in X/Y/Z.  
Best for: signature dishes and the full cinematic 3D menu.

A photo cannot reliably reveal hidden geometry behind the visible pixels, so Photo Explode never pretends to be real ingredient reconstruction.

## Quick workflow
1. Menu → Add/Edit dish.
2. Choose image file.
3. Save dish.
4. Photo Explode → choose dish.
5. Start with recommended settings.
6. Preview explode.
7. Adjust layer count/gap/depth/tilt slowly.
8. Preview assemble.
9. Save & publish.
