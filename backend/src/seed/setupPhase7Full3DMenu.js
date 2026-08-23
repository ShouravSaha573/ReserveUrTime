import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { PHASE7_THREE_D_CONFIGS } from "../config/phase7ThreeDConfigs.js";
import { MenuItem } from "../models/MenuItem.js";
import { Restaurant } from "../models/Restaurant.js";
import { applyPhase7ThreeDConfigToDish } from "../services/phase7SetupService.js";

async function main() {
  await connectDB();
  const restaurant = await Restaurant.findOne({ slug: "ember-house", isActive: true });
  if (!restaurant) throw new Error("Ember House was not found. Run npm run seed first.");

  const updated = [];
  for (const [slug, config] of Object.entries(PHASE7_THREE_D_CONFIGS)) {
    const dish = await MenuItem.findOne({ restaurantId: restaurant._id, slug });
    if (!dish) throw new Error(`Dish '${slug}' was not found. Run npm run seed first.`);
    await applyPhase7ThreeDConfigToDish(dish, config, restaurant.coverImageUrl || "/images/ember.svg");
    updated.push(`${dish.name} -> ${dish.threeD.modelUrl}`);
  }

  console.log("Phase 7 full 3D menu metadata is ready.");
  for (const line of updated) console.log(`- ${line}`);
  console.log("Existing Restaurant Admin animation edits are preserved for already-configured 3D dishes.");
  await mongoose.connection.close();
}

main().catch(async (error) => {
  console.error("Phase 7 setup failed:", error.message);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
