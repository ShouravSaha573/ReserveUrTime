# ReserveUrTime — Signature Homepage Hero Pivot

## Final visual direction

Restaurant pages no longer expose customer-facing exploded 3D dish experiences. They use ordinary food photography with a subtle levitation treatment so menus remain realistic, lightweight and fast.

The homepage owns the signature animation layer and always renders before the Restaurants section. Its six hard-coded showcase scenes are:

1. Burger — real photographic separated layers.
2. Pizza — real photographic depth/explode presentation.
3. Momo — real photographic depth/explode presentation.
4. Chicken Fry Bowl — real photographic depth/explode presentation.
5. Kebabs — real photographic depth/explode presentation.
6. Soda Can — true interactive 3D model-viewer scene.

## Homepage background

The global background is a Three.js star volume based on the supplied `Background_space_stars.txt` specification: 4,200 desktop points, mint/jade/bone star palette, twinkle, endless Z drift, cursor repulsion, scroll acceleration, barrel spin, parallax, bloom and complementary animated shader atmosphere.

## Soda scene

The Soda scene follows the supplied `Hero_Section.txt` interaction direction. It uses the supplied GetLayers public assets for the can, leaves, cherries/blueberries and flavor textures. The can tilts with the pointer, floats in a teal/blue radial environment, and uses a two-stage 360° → 720° flavor-change spin with blur and fruit replacement.

Because these Soda GLB/texture assets are remote, the browser needs internet access for that one hero scene. The other five food showcases are bundled locally.

## CMS rule

Platform Admin may edit homepage copy, CTAs, search settings, Restaurant-section copy and safe galaxy presets. The signature hero is permanently first and cannot be disabled/reordered below Restaurants from CMS.

## Restaurant rule

Restaurant Admin continues to control its own menu categories, dishes, prices, availability and food images. Restaurant food images are shown normally with a gentle float/levitation treatment. The previous Restaurant 3D Animation and Photo Explode pages are no longer routed or linked from the application.

Legacy 3D backend/source files are retained only as project history and compatibility code; they are not part of the current customer/Restaurant Admin UI flow.
