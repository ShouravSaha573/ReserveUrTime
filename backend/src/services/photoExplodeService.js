import mongoose from "mongoose";
import { MenuItem } from "../models/MenuItem.js";
import { publicMediaUrl } from "../utils/mediaUrl.js";
import { strictBoolean } from "../utils/validation.js";

export const PHOTO_EXPLODE_EASING_PRESETS = [
  "cinematic",
  "soft",
  "snappy",
  "spring"
];

const DEFAULTS = {
  enabled: true,
  layerCount: 8,
  gap: 18,
  depth: 36,
  tilt: 2.5,
  duration: 0.9,
  stagger: 0.04,
  easing: "cinematic",
  autoPreview: false
};

function numberField(value, label, { min, max, fallback }) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    const error = new Error(`${label} must be between ${min} and ${max}.`);
    error.status = 400;
    throw error;
  }
  return Math.round(parsed * 1000) / 1000;
}

function ownedQuery(restaurantId, itemId) {
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

export function normalizePhotoExplode(item) {
  const source = item?.photoExplode || {};
  return {
    enabled: source.enabled === true,
    sourceImageUrl: source.sourceImageUrl || item?.imageUrl || "",
    layerCount: Number(source.layerCount ?? DEFAULTS.layerCount),
    gap: Number(source.gap ?? DEFAULTS.gap),
    depth: Number(source.depth ?? DEFAULTS.depth),
    tilt: Number(source.tilt ?? DEFAULTS.tilt),
    duration: Number(source.duration ?? DEFAULTS.duration),
    stagger: Number(source.stagger ?? DEFAULTS.stagger),
    easing: PHOTO_EXPLODE_EASING_PRESETS.includes(source.easing)
      ? source.easing
      : DEFAULTS.easing,
    autoPreview: source.autoPreview === true
  };
}

export function validatePhotoExplodePayload(body, item) {
  const current = normalizePhotoExplode(item);
  const sourceImageUrl = publicMediaUrl(
    body.sourceImageUrl ?? item.imageUrl ?? current.sourceImageUrl,
    "Photo explode source image",
    1000
  );

  if (!sourceImageUrl) {
    const error = new Error("Add a dish image before enabling Photo Explode.");
    error.status = 409;
    throw error;
  }

  const easing = String(body.easing ?? current.easing).trim();
  if (!PHOTO_EXPLODE_EASING_PRESETS.includes(easing)) {
    const error = new Error("Unsupported Photo Explode easing preset.");
    error.status = 400;
    throw error;
  }

  return {
    enabled:
      body.enabled === undefined
        ? current.enabled
        : strictBoolean(body.enabled, "Photo Explode enabled state"),
    sourceImageUrl,
    layerCount: Math.round(
      numberField(body.layerCount, "Photo layer count", {
        min: 4,
        max: 16,
        fallback: current.layerCount
      })
    ),
    gap: numberField(body.gap, "Photo layer gap", {
      min: 4,
      max: 48,
      fallback: current.gap
    }),
    depth: numberField(body.depth, "Photo layer depth", {
      min: 0,
      max: 90,
      fallback: current.depth
    }),
    tilt: numberField(body.tilt, "Photo layer tilt", {
      min: 0,
      max: 12,
      fallback: current.tilt
    }),
    duration: numberField(body.duration, "Photo explode duration", {
      min: 0.25,
      max: 2.5,
      fallback: current.duration
    }),
    stagger: numberField(body.stagger, "Photo explode stagger", {
      min: 0,
      max: 0.15,
      fallback: current.stagger
    }),
    easing,
    autoPreview:
      body.autoPreview === undefined
        ? current.autoPreview
        : strictBoolean(body.autoPreview, "Photo Explode auto-preview")
  };
}

export async function getOwnedPhotoExplode(restaurantId, itemId) {
  // Raw read avoids hydrating historical menu documents with malformed legacy
  // category references. Photo Explode ownership is still fixed by restaurantId.
  const item = await MenuItem.collection.findOne(ownedQuery(restaurantId, itemId));
  if (!item) return null;
  if (!item.imageUrl && !item.photoExplode?.sourceImageUrl) {
    const error = new Error("This dish does not have an image yet.");
    error.status = 409;
    throw error;
  }
  return {
    item,
    photoExplode: normalizePhotoExplode(item),
    easingPresets: PHOTO_EXPLODE_EASING_PRESETS
  };
}

export async function updateOwnedPhotoExplode(restaurantId, itemId, body) {
  const query = ownedQuery(restaurantId, itemId);
  const item = await MenuItem.collection.findOne(query);
  if (!item) return null;

  const config = validatePhotoExplodePayload(body || {}, item);
  await MenuItem.collection.updateOne(query, {
    $set: {
      photoExplode: config,
      updatedAt: new Date()
    }
  });

  const updated = await MenuItem.collection.findOne(query);
  return {
    item: updated,
    photoExplode: normalizePhotoExplode(updated),
    easingPresets: PHOTO_EXPLODE_EASING_PRESETS
  };
}

export function defaultPhotoExplodeForImage(imageUrl) {
  return {
    ...DEFAULTS,
    sourceImageUrl: imageUrl
  };
}
