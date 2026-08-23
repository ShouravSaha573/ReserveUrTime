import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { MenuItem } from "../models/MenuItem.js";
import { defaultPhotoExplodeForImage } from "../services/photoExplodeService.js";

function dynamics(explodedOffset = {}, sequence = 0) {
  const x = Number(explodedOffset?.x || 0);
  const y = Number(explodedOffset?.y || 0);
  const direction = sequence % 2 === 0 ? 1 : -1;
  return {
    rotationOffset: {
      x: Math.max(-18, Math.min(18, y * 5.5 * direction)),
      y: Math.max(-18, Math.min(18, x * 6)),
      z: Math.max(-14, Math.min(14, direction * (2.5 + Math.abs(x) * 5)))
    },
    explodeScale: Math.max(0.94, Math.min(1.08, 1 + direction * 0.018))
  };
}

async function main() {
  await connectDB();
  const items = await MenuItem.find({});
  let photoEnabled = 0;
  let threeDEnhanced = 0;

  for (const item of items) {
    let changed = false;

    if (item.imageUrl) {
      const existing = item.photoExplode?.toObject?.() || item.photoExplode || {};
      if (!existing.sourceImageUrl) {
        item.photoExplode = {
          ...defaultPhotoExplodeForImage(item.imageUrl),
          ...existing,
          enabled: true,
          sourceImageUrl: item.imageUrl
        };
        photoEnabled += 1;
        changed = true;
      }
    }

    if (item.threeD?.enabled && item.threeD?.layers?.length) {
      let enhancedThisDish = false;
      item.threeD.layers = item.threeD.layers.map((layer, index) => {
        const rotation = layer.rotationOffset || { x: 0, y: 0, z: 0 };
        const hasRotation = [rotation.x, rotation.y, rotation.z].some((value) => Number(value || 0) !== 0);
        const hasScale = Number(layer.explodeScale || 1) !== 1;
        if (hasRotation || hasScale) return layer;
        enhancedThisDish = true;
        const recommended = dynamics(layer.explodedOffset, Number(layer.sequence ?? index));
        return {
          meshName: layer.meshName,
          label: layer.label || layer.meshName,
          enabled: layer.enabled !== false,
          sequence: Number.isInteger(layer.sequence) ? layer.sequence : index,
          explodedOffset: layer.explodedOffset || { x: 0, y: 0, z: 0 },
          ...recommended
        };
      });
      if (enhancedThisDish) {
        threeDEnhanced += 1;
        changed = true;
      }
    }

    if (changed) await item.save();
  }

  console.log("Motion + Photo Explode setup complete.");
  console.log(`Photo Explode initialized: ${photoEnabled}`);
  console.log(`Legacy 3D dishes given cinematic rotation/scale defaults: ${threeDEnhanced}`);
  console.log("Existing non-default Restaurant Admin 3D rotation/scale edits were preserved.");
  await mongoose.connection.close();
}

main().catch(async (error) => {
  console.error("Motion + Photo Explode setup failed:", error.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
