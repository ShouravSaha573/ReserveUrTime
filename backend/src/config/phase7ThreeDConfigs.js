export const PHASE7_THREE_D_CONFIGS = {
        "coal-roasted-pumpkin": {
          modelUrl: "/models/coal-roasted-pumpkin.glb",
          cameraPosition: { x: 4.8, y: 3.8, z: 5.8 },
          cameraTarget: { x: 0, y: 0, z: 0.55 },
          layers: [
            ["Plate", "Ceramic plate", 0, { x: 0, y: -0.65, z: -0.2 }],
            ["PumpkinBase", "Roasted pumpkin base", 1, { x: -0.75, y: -0.15, z: 0.55 }],
            ["CulturedCream", "Cultured cream", 2, { x: 0.8, y: 0.25, z: 0.9 }],
            ["CharredPumpkin", "Charred pumpkin", 3, { x: -0.35, y: 0.55, z: 1.35 }],
            ["SeedCrumb", "Smoked seed crumb", 4, { x: 0.85, y: 0.75, z: 1.7 }],
            ["HerbGarnish", "Herb garnish", 5, { x: -0.9, y: 1.0, z: 2.0 }],
            ["SmokeSalt", "Smoke salt", 6, { x: 1.05, y: 0.55, z: 2.25 }]
          ]
        },
        "signature-main": {
          modelUrl: "/models/ember-signature-plate.glb",
          cameraPosition: { x: 4.7, y: 3.4, z: 5.6 },
          cameraTarget: { x: 0, y: 0, z: 0.35 },
          layers: [
            ["Plate", "Dark ceramic plate", 0, { x: 0, y: -0.7, z: -0.2 }],
            ["HouseJus", "House jus", 1, { x: 0.65, y: 0.1, z: 0.65 }],
            ["SeasonalProtein", "Seasonal protein", 2, { x: -0.75, y: 0.45, z: 1.15 }],
            ["CharredVegetables", "Charred vegetables I", 3, { x: 1.0, y: 0.75, z: 1.45 }],
            ["CharredVegetables_2", "Charred vegetables II", 4, { x: 0.55, y: 1.0, z: 1.7 }],
            ["CharredVegetables_3", "Charred vegetables III", 5, { x: -0.45, y: 1.05, z: 1.9 }],
            ["CharredVegetables_4", "Charred vegetables IV", 6, { x: -1.0, y: 0.8, z: 1.6 }],
            ["HerbOil", "Herb oil", 7, { x: 0.2, y: 1.25, z: 2.2 }]
          ]
        },
        "burnt-honey-custard": {
          modelUrl: "/models/burnt-honey-custard.glb",
          cameraPosition: { x: 4.5, y: 3.5, z: 5.2 },
          cameraTarget: { x: 0, y: 0, z: 0.35 },
          layers: [
            ["Plate", "Ceramic plate", 0, { x: 0, y: -0.65, z: -0.25 }],
            ["Custard", "Silky custard", 1, { x: -0.45, y: 0.25, z: 0.75 }],
            ["BurntHoney", "Burnt honey", 2, { x: 0.55, y: 0.55, z: 1.2 }],
            ["ToastedGrains", "Toasted grains I", 3, { x: 1.0, y: 0.7, z: 1.45 }],
            ["ToastedGrains_2", "Toasted grains II", 4, { x: 0.75, y: 1.0, z: 1.65 }],
            ["ToastedGrains_3", "Toasted grains III", 5, { x: 0.25, y: 1.15, z: 1.8 }],
            ["ToastedGrains_4", "Toasted grains IV", 6, { x: -0.35, y: 1.15, z: 1.9 }],
            ["ToastedGrains_5", "Toasted grains V", 7, { x: -0.8, y: 0.95, z: 1.7 }],
            ["ToastedGrains_6", "Toasted grains VI", 8, { x: -1.05, y: 0.6, z: 1.5 }],
            ["ToastedGrains_7", "Toasted grains VII", 9, { x: -0.65, y: 0.35, z: 1.3 }],
            ["ToastedGrains_8", "Toasted grains VIII", 10, { x: 0.7, y: 0.35, z: 1.3 }],
            ["CitrusDust", "Citrus dust", 11, { x: 0.15, y: 1.35, z: 2.2 }]
          ]
        },
        "smoked-citrus-fizz": {
          modelUrl: "/models/smoked-citrus-fizz.glb",
          cameraPosition: { x: 4.0, y: 3.0, z: 5.0 },
          cameraTarget: { x: 0, y: 0, z: 1.0 },
          layers: [
            ["Glass", "Glass", 0, { x: 0, y: -0.45, z: -0.3 }],
            ["CitrusBase", "Citrus base", 1, { x: 0, y: 0.1, z: 0.7 }],
            ["Ice", "Ice I", 2, { x: -0.75, y: 0.5, z: 1.15 }],
            ["Ice_2", "Ice II", 3, { x: 0.65, y: 0.7, z: 1.4 }],
            ["Ice_3", "Ice III", 4, { x: -0.4, y: 0.95, z: 1.65 }],
            ["Ice_4", "Ice IV", 5, { x: 0.5, y: 1.1, z: 1.85 }],
            ["SmokeTea", "Smoke tea", 6, { x: 0, y: 1.3, z: 2.05 }],
            ["CitrusWheel", "Citrus wheel", 7, { x: 1.0, y: 1.5, z: 2.3 }],
            ["Herb", "Herb", 8, { x: -0.9, y: 1.65, z: 2.55 }]
          ]
        }
      };

export const PHASE7_DEFAULT_ANIMATION = Object.freeze({
  duration: 1.15,
  stagger: 0.075,
  easing: "power3.inOut",
  autoAssemble: true,
  autoAssembleDelay: 650,
  floatIntensity: 0.1,
  rotationIntensity: 0.06
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function recommendedPhase7LayerDynamics(explodedOffset = {}, sequence = 0) {
  const x = Number(explodedOffset?.x || 0);
  const y = Number(explodedOffset?.y || 0);
  const direction = sequence % 2 === 0 ? 1 : -1;
  return {
    rotationOffset: {
      x: clamp(y * 5.5 * direction, -18, 18),
      y: clamp(x * 6, -18, 18),
      z: clamp(direction * (2.5 + Math.abs(x) * 5), -14, 14)
    },
    explodeScale: clamp(1 + direction * 0.018, 0.94, 1.08)
  };
}

export function buildPhase7RuntimeAsset(config, existingAsset = {}, posterUrl = "") {
  const existingLayers = Array.isArray(existingAsset?.layers) ? existingAsset.layers : [];
  const existingByName = new Map(existingLayers.map((layer) => [layer?.meshName, layer]));

  const layers = (config?.layers || []).map(([meshName, label, sequence, explodedOffset]) => {
    const existing = existingByName.get(meshName) || {};
    const recommended = recommendedPhase7LayerDynamics(explodedOffset, sequence);
    return {
      meshName,
      label: existing.label || label || meshName,
      enabled: existing.enabled !== false,
      sequence: Number.isInteger(existing.sequence) ? existing.sequence : sequence,
      explodedOffset: {
        x: Number(existing.explodedOffset?.x ?? explodedOffset?.x ?? 0),
        y: Number(existing.explodedOffset?.y ?? explodedOffset?.y ?? 0),
        z: Number(existing.explodedOffset?.z ?? explodedOffset?.z ?? 0)
      },
      rotationOffset: {
        x: Number(existing.rotationOffset?.x ?? recommended.rotationOffset.x),
        y: Number(existing.rotationOffset?.y ?? recommended.rotationOffset.y),
        z: Number(existing.rotationOffset?.z ?? recommended.rotationOffset.z)
      },
      explodeScale: Number(existing.explodeScale ?? recommended.explodeScale)
    };
  });

  return {
    enabled: existingAsset?.enabled !== false,
    modelUrl: existingAsset?.modelUrl || config?.modelUrl || "",
    posterUrl: existingAsset?.posterUrl || posterUrl || "",
    modelScale: Number(existingAsset?.modelScale || 1),
    cameraPosition: existingAsset?.cameraPosition || config?.cameraPosition || { x: 4.8, y: 3.8, z: 5.8 },
    cameraTarget: existingAsset?.cameraTarget || config?.cameraTarget || { x: 0, y: 0, z: 0.5 },
    animation: {
      ...PHASE7_DEFAULT_ANIMATION,
      ...(existingAsset?.animation || {})
    },
    layers
  };
}

