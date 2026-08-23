import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { PHASE7_THREE_D_CONFIGS } from "../config/phase7ThreeDConfigs.js";
import { MenuItem } from "../models/MenuItem.js";
import { Restaurant } from "../models/Restaurant.js";

async function main() {
  await connectDB();
  const restaurant = await Restaurant.findOne({ slug: "ember-house" });
  console.log(`Ember House: ${restaurant ? "FOUND" : "MISSING"}`);
  if (!restaurant) {
    await mongoose.connection.close();
    process.exitCode = 1;
    return;
  }

  let ready = 0;
  for (const slug of Object.keys(PHASE7_THREE_D_CONFIGS)) {
    const dish = await MenuItem.findOne({ restaurantId: restaurant._id, slug }).lean();
    const eligible = Boolean(
      dish?.isActive &&
      dish?.isAvailable &&
      dish?.threeD?.enabled &&
      dish?.threeD?.modelUrl &&
      dish?.threeD?.layers?.length
    );
    if (eligible) ready += 1;
    console.log(`${slug}: ${eligible ? "READY" : "NOT READY"}${dish?.threeD?.modelUrl ? ` -> ${dish.threeD.modelUrl}` : ""}`);
  }

  console.log(`3D menu readiness: ${ready}/${Object.keys(PHASE7_THREE_D_CONFIGS).length}`);
  console.log(`Public full 3D menu eligible: ${ready >= 4}`);
  await mongoose.connection.close();
}

main().catch(async (error) => {
  console.error("Phase 7 diagnosis failed:", error.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
