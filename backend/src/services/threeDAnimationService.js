import { strictBoolean } from "../utils/validation.js";
import mongoose from "mongoose";
import { MenuItem } from "../models/MenuItem.js";
import { Restaurant } from "../models/Restaurant.js";
import { PHASE7_THREE_D_CONFIGS, buildPhase7RuntimeAsset } from "../config/phase7ThreeDConfigs.js";

export const THREE_D_EASING_PRESETS = [
  "power1.inOut",
  "power2.inOut",
  "power3.inOut",
  "sine.inOut",
  "expo.inOut"
];

const clampNumber = (value, label, { min, max, fallback }) => {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    const error = new Error(`${label} must be between ${min} and ${max}.`);
    error.status = 400;
    throw error;
  }
  return Math.round(number * 1000) / 1000;
};

const cleanName = (value, label, max = 120) => {
  const result = String(value ?? "").trim().slice(0, max);
  if (!result) {
    const error = new Error(`${label} is required.`);
    error.status = 400;
    throw error;
  }
  return result;
};

export function animationDefaultsFromAsset(asset = {}) {
  const layers = Array.isArray(asset.layers) ? asset.layers : [];
  const rawSequences = layers.map((layer) => Number(layer.sequence ?? 0));
  const legacyAllZero = layers.length > 1 && rawSequences.every((value) => value === 0);
  return {
    duration: Number(asset.animation?.duration ?? 1.15),
    stagger: Number(asset.animation?.stagger ?? 0.075),
    easing: THREE_D_EASING_PRESETS.includes(asset.animation?.easing)
      ? asset.animation.easing
      : "power3.inOut",
    autoAssemble: asset.animation?.autoAssemble !== false,
    autoAssembleDelay: Number(asset.animation?.autoAssembleDelay ?? 650),
    floatIntensity: Number(asset.animation?.floatIntensity ?? 0.1),
    rotationIntensity: Number(asset.animation?.rotationIntensity ?? 0.06),
    layers: layers.map((layer, index) => ({
      meshName: layer.meshName,
      label: layer.label || layer.meshName,
      enabled: layer.enabled !== false,
      sequence: legacyAllZero ? index : (Number.isInteger(layer.sequence) ? layer.sequence : index),
      explodedOffset: {
        x: Number(layer.explodedOffset?.x || 0),
        y: Number(layer.explodedOffset?.y || 0),
        z: Number(layer.explodedOffset?.z || 0)
      },
      rotationOffset: {
        x: Number(layer.rotationOffset?.x || 0),
        y: Number(layer.rotationOffset?.y || 0),
        z: Number(layer.rotationOffset?.z || 0)
      },
      explodeScale: Number(layer.explodeScale ?? 1)
    }))
  };
}

export function validateThreeDAnimationPayload(body, existingAsset) {
  const existing = animationDefaultsFromAsset(existingAsset);
  const submittedLayers = Array.isArray(body.layers) ? body.layers : existing.layers;

  if (submittedLayers.length === 0 || submittedLayers.length > 40) {
    const error = new Error("3D animation must contain between 1 and 40 model layers.");
    error.status = 400;
    throw error;
  }

  const knownNames = new Set(existing.layers.map((layer) => layer.meshName));
  const seenNames = new Set();

  const layers = submittedLayers.map((layer, index) => {
    const meshName = cleanName(layer.meshName, "Mesh name");
    if (!knownNames.has(meshName)) {
      const error = new Error(`Unknown GLB mesh layer: ${meshName}.`);
      error.status = 400;
      throw error;
    }
    if (seenNames.has(meshName)) {
      const error = new Error(`Duplicate GLB mesh layer: ${meshName}.`);
      error.status = 400;
      throw error;
    }
    seenNames.add(meshName);

    const sequence = clampNumber(layer.sequence, "Layer sequence", {
      min: 0,
      max: 99,
      fallback: index
    });

    return {
      meshName,
      label: String(layer.label ?? meshName).trim().slice(0, 120) || meshName,
      enabled:
        layer.enabled === undefined
          ? existing.layers.find((item) => item.meshName === meshName)?.enabled !== false
          : strictBoolean(layer.enabled, `${meshName} layer enabled state`),
      sequence: Math.round(sequence),
      explodedOffset: {
        x: clampNumber(layer.explodedOffset?.x, `${meshName} X offset`, {
          min: -5,
          max: 5,
          fallback: 0
        }),
        y: clampNumber(layer.explodedOffset?.y, `${meshName} Y offset`, {
          min: -5,
          max: 5,
          fallback: 0
        }),
        z: clampNumber(layer.explodedOffset?.z, `${meshName} Z offset`, {
          min: -5,
          max: 5,
          fallback: 0
        })
      },
      rotationOffset: {
        x: clampNumber(layer.rotationOffset?.x, `${meshName} X rotation`, { min: -45, max: 45, fallback: 0 }),
        y: clampNumber(layer.rotationOffset?.y, `${meshName} Y rotation`, { min: -45, max: 45, fallback: 0 }),
        z: clampNumber(layer.rotationOffset?.z, `${meshName} Z rotation`, { min: -45, max: 45, fallback: 0 })
      },
      explodeScale: clampNumber(layer.explodeScale, `${meshName} explode scale`, {
        min: 0.8,
        max: 1.25,
        fallback: 1
      })
    };
  });

  const easing = String(body.easing ?? existing.easing).trim();
  if (!THREE_D_EASING_PRESETS.includes(easing)) {
    const error = new Error("Unsupported 3D animation easing preset.");
    error.status = 400;
    throw error;
  }

  return {
    duration: clampNumber(body.duration, "Animation duration", {
      min: 0.2,
      max: 4,
      fallback: existing.duration
    }),
    stagger: clampNumber(body.stagger, "Animation stagger", {
      min: 0,
      max: 0.5,
      fallback: existing.stagger
    }),
    easing,
    autoAssemble: body.autoAssemble === undefined
      ? existing.autoAssemble
      : strictBoolean(body.autoAssemble, "Auto assemble"),
    autoAssembleDelay: Math.round(
      clampNumber(body.autoAssembleDelay, "Auto-assemble delay", {
        min: 0,
        max: 5000,
        fallback: existing.autoAssembleDelay
      })
    ),
    floatIntensity: clampNumber(body.floatIntensity, "Float intensity", {
      min: 0,
      max: 0.5,
      fallback: existing.floatIntensity
    }),
    rotationIntensity: clampNumber(body.rotationIntensity, "Rotation intensity", {
      min: 0,
      max: 0.5,
      fallback: existing.rotationIntensity
    }),
    layers
  };
}

function ownedItemQuery(restaurantId, itemId) {
  if (!mongoose.isValidObjectId(itemId)) {
    const error = new Error("Invalid dish id.");
    error.status = 400;
    throw error;
  }
  return {
    _id: new mongoose.Types.ObjectId(itemId),
    restaurantId: mongoose.isValidObjectId(restaurantId)
      ? new mongoose.Types.ObjectId(String(restaurantId))
      : restaurantId
  };
}

async function ownedRuntimeAsset(item, restaurantId) {
  const restaurantQueryId = mongoose.isValidObjectId(restaurantId)
    ? new mongoose.Types.ObjectId(String(restaurantId))
    : restaurantId;
  const restaurant = await Restaurant.collection.findOne(
    { _id: restaurantQueryId },
    { projection: { slug: 1, coverImageUrl: 1 } }
  );
  const canonical = restaurant?.slug === "ember-house"
    ? PHASE7_THREE_D_CONFIGS[item?.slug]
    : null;

  return canonical
    ? buildPhase7RuntimeAsset(
        canonical,
        item?.threeD || {},
        item?.threeD?.posterUrl || item?.imageUrl || restaurant?.coverImageUrl || ""
      )
    : item?.threeD || {};
}

export async function getOwnedThreeDAnimation(restaurantId, itemId) {
  // Raw collection read is intentional: legacy MenuItem.categoryId values must
  // not prevent Restaurant Admin from opening the 3D editor.
  const item = await MenuItem.collection.findOne(ownedItemQuery(restaurantId, itemId));

  if (!item) return null;
  const runtimeAsset = await ownedRuntimeAsset(item, restaurantId);
  if (!runtimeAsset?.enabled || !runtimeAsset?.modelUrl || !runtimeAsset?.layers?.length) {
    const error = new Error("This dish does not have an enabled 3D model.");
    error.status = 409;
    throw error;
  }

  const runtimeItem = { ...item, threeD: runtimeAsset };
  return {
    item: runtimeItem,
    animation: animationDefaultsFromAsset(runtimeAsset),
    easingPresets: THREE_D_EASING_PRESETS
  };
}

export async function updateOwnedThreeDAnimation(restaurantId, itemId, body) {
  const query = ownedItemQuery(restaurantId, itemId);
  const item = await MenuItem.collection.findOne(query);
  if (!item) return null;

  const runtimeAsset = await ownedRuntimeAsset(item, restaurantId);
  if (!runtimeAsset?.enabled || !runtimeAsset?.modelUrl || !runtimeAsset?.layers?.length) {
    const error = new Error("This dish does not have an enabled 3D model.");
    error.status = 409;
    throw error;
  }

  const animation = validateThreeDAnimationPayload(body, runtimeAsset);
  const submittedByName = new Map(animation.layers.map((layer) => [layer.meshName, layer]));
  // Base persistence on the complete runtime layer set. This means a legacy
  // partial demo document is repaired when the Restaurant Admin publishes.
  const layers = runtimeAsset.layers.map((layer, index) => {
    const submitted = submittedByName.get(layer.meshName);
    return {
      meshName: layer.meshName,
      label: submitted?.label || layer.label || layer.meshName,
      enabled: submitted?.enabled !== false,
      sequence: submitted?.sequence ?? index,
      explodedOffset: submitted?.explodedOffset || layer.explodedOffset || { x: 0, y: 0, z: 0 },
      rotationOffset: submitted?.rotationOffset || layer.rotationOffset || { x: 0, y: 0, z: 0 },
      explodeScale: submitted?.explodeScale ?? layer.explodeScale ?? 1
    };
  });

  await MenuItem.collection.updateOne(query, {
    $set: {
      "threeD.enabled": true,
      "threeD.modelUrl": runtimeAsset.modelUrl,
      "threeD.posterUrl": runtimeAsset.posterUrl || "",
      "threeD.modelScale": Number(runtimeAsset.modelScale || 1),
      "threeD.cameraPosition": runtimeAsset.cameraPosition,
      "threeD.cameraTarget": runtimeAsset.cameraTarget,
      "threeD.animation": {
        duration: animation.duration,
        stagger: animation.stagger,
        easing: animation.easing,
        autoAssemble: animation.autoAssemble,
        autoAssembleDelay: animation.autoAssembleDelay,
        floatIntensity: animation.floatIntensity,
        rotationIntensity: animation.rotationIntensity
      },
      "threeD.layers": layers,
      updatedAt: new Date()
    }
  });

  const updated = await MenuItem.collection.findOne(query);
  const updatedAsset = await ownedRuntimeAsset(updated, restaurantId);
  return {
    item: { ...updated, threeD: updatedAsset },
    animation: animationDefaultsFromAsset(updatedAsset),
    easingPresets: THREE_D_EASING_PRESETS
  };
}
