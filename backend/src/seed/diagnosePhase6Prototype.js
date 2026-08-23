import "dotenv/config";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import { MenuItem } from "../models/MenuItem.js";
import { Restaurant } from "../models/Restaurant.js";

async function diagnose() {
  await connectDB();
  const restaurant = await Restaurant.findOne({ slug: "ember-house" }).lean();

  if (!restaurant) {
    console.log("Ember House: MISSING");
    return;
  }

  const item = await MenuItem.findOne({
    restaurantId: restaurant._id,
    slug: "coal-roasted-pumpkin"
  }).lean();

  console.log("Ember House: FOUND");
  if (!item) {
    console.log("Coal-Roasted Pumpkin: MISSING");
    return;
  }

  console.log("Coal-Roasted Pumpkin: FOUND");
  console.log(`isActive: ${Boolean(item.isActive)}`);
  console.log(`isAvailable: ${Boolean(item.isAvailable)}`);
  console.log(`threeD.enabled: ${Boolean(item.threeD?.enabled)}`);
  console.log(`threeD.modelUrl: ${item.threeD?.modelUrl || "MISSING"}`);
  console.log(
    `Public 3D endpoint eligible: ${Boolean(
      item.isActive && item.isAvailable && item.threeD?.enabled && item.threeD?.modelUrl
    )}`
  );
}

diagnose()
  .catch((error) => {
    console.error("Phase 6 diagnosis failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
