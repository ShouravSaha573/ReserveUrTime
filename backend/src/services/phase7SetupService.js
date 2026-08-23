import {
  PHASE7_DEFAULT_ANIMATION,
  recommendedPhase7LayerDynamics
} from "../config/phase7ThreeDConfigs.js";

export async function applyPhase7ThreeDConfigToDish(dish, config, posterUrl = "") {
  dish.isActive = true;
  dish.isAvailable = true;

  if (!dish.threeD?.enabled || !dish.threeD?.modelUrl || !dish.threeD?.layers?.length) {
    dish.threeD = {
      enabled: true,
      modelUrl: config.modelUrl,
      posterUrl,
      modelScale: 1,
      cameraPosition: config.cameraPosition,
      cameraTarget: config.cameraTarget,
      animation: { ...PHASE7_DEFAULT_ANIMATION },
      layers: config.layers.map(([meshName, label, sequence, explodedOffset]) => ({
        meshName,
        label,
        enabled: true,
        sequence,
        explodedOffset,
        ...recommendedPhase7LayerDynamics(explodedOffset, sequence)
      }))
    };
  } else {
    const existingAnimation = dish.threeD.animation || {};
    const legacyDefaultTiming =
      Number(existingAnimation.duration ?? 0.95) === 0.95 &&
      Number(existingAnimation.stagger ?? 0.055) === 0.055 &&
      Number(existingAnimation.autoAssembleDelay ?? 180) === 180;

    dish.threeD.animation = {
      ...PHASE7_DEFAULT_ANIMATION,
      ...existingAnimation,
      // Upgrade only the old untouched demo timing. Restaurant Admin custom
      // timing remains preserved.
      ...(legacyDefaultTiming
        ? {
            duration: PHASE7_DEFAULT_ANIMATION.duration,
            stagger: PHASE7_DEFAULT_ANIMATION.stagger,
            autoAssembleDelay: PHASE7_DEFAULT_ANIMATION.autoAssembleDelay
          }
        : {})
    };

    const canonicalByName = new Map(
      config.layers.map(([meshName, label, sequence, explodedOffset]) => [
        meshName,
        { label, sequence, explodedOffset }
      ])
    );
    const existingByName = new Map((dish.threeD.layers || []).map((layer) => [layer.meshName, layer]));

    // Canonical demo meshes are the source of truth for the bundled GLB node
    // set. Existing matching Restaurant Admin settings win; missing/legacy
    // nodes are restored so the explode animation can never become empty.
    dish.threeD.layers = config.layers.map(([meshName, label, sequence, explodedOffset]) => {
      const layer = existingByName.get(meshName) || {};
      const rotation = layer.rotationOffset || { x: 0, y: 0, z: 0 };
      const legacyRotation = [rotation.x, rotation.y, rotation.z].every(
        (value) => Number(value || 0) === 0
      );
      const recommended = recommendedPhase7LayerDynamics(explodedOffset, sequence);
      return {
        meshName,
        label: layer.label || label || meshName,
        enabled: layer.enabled !== false,
        sequence: Number.isInteger(layer.sequence) ? layer.sequence : sequence,
        explodedOffset: layer.explodedOffset || explodedOffset,
        rotationOffset: legacyRotation ? recommended.rotationOffset : rotation,
        explodeScale:
          Number(layer.explodeScale || 1) === 1
            ? recommended.explodeScale
            : layer.explodeScale
      };
    });
  }

  await dish.save();
  return dish;
}
