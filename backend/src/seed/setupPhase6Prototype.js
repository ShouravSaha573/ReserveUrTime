import "dotenv/config";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import { MenuCategory } from "../models/MenuCategory.js";
import { MenuItem } from "../models/MenuItem.js";
import { Restaurant } from "../models/Restaurant.js";

const MODEL_URL = "/models/coal-roasted-pumpkin.glb";

const THREE_D_CONFIG = {
  enabled: true,
  modelUrl: MODEL_URL,
  posterUrl: "/images/ember.svg",
  modelScale: 1,
  cameraPosition: { x: 4.8, y: 3.8, z: 5.8 },
  cameraTarget: { x: 0, y: 0, z: 0.55 },
  layers: [
    { meshName: "Plate", label: "Ceramic plate", explodedOffset: { x: 0, y: -0.65, z: -0.2 } },
    { meshName: "PumpkinBase", label: "Roasted pumpkin base", explodedOffset: { x: -0.75, y: -0.15, z: 0.55 } },
    { meshName: "CulturedCream", label: "Cultured cream", explodedOffset: { x: 0.8, y: 0.25, z: 0.9 } },
    { meshName: "CharredPumpkin", label: "Charred pumpkin", explodedOffset: { x: -0.35, y: 0.55, z: 1.35 } },
    { meshName: "SeedCrumb", label: "Smoked seed crumb", explodedOffset: { x: 0.85, y: 0.75, z: 1.7 } },
    { meshName: "HerbGarnish", label: "Herb garnish", explodedOffset: { x: -0.9, y: 1.0, z: 2.0 } },
    { meshName: "SmokeSalt", label: "Smoke salt", explodedOffset: { x: 1.05, y: 0.55, z: 2.25 } }
  ]
};

async function ensureStarterCategory(restaurant) {
  let category = await MenuCategory.findOne({
    restaurantId: restaurant._id,
    slug: "starters"
  });

  if (!category) {
    category = await MenuCategory.create({
      restaurantId: restaurant._id,
      name: "Starters",
      slug: "starters",
      description: "",
      displayOrder: 1,
      isActive: true
    });
    return category;
  }

  if (!category.isActive) {
    category.isActive = true;
    await category.save();
  }

  return category;
}

async function ensurePrototypeDish(restaurant, category) {
  let item = await MenuItem.findOne({
    restaurantId: restaurant._id,
    slug: "coal-roasted-pumpkin"
  });

  const threeDConfig = {
    ...THREE_D_CONFIG,
    posterUrl: restaurant.coverImageUrl || THREE_D_CONFIG.posterUrl
  };

  if (!item) {
    item = await MenuItem.create({
      restaurantId: restaurant._id,
      categoryId: category._id,
      name: "Coal-Roasted Pumpkin",
      slug: "coal-roasted-pumpkin",
      description: "Roasted pumpkin, cultured cream and smoked seed crumb.",
      ingredients: ["Pumpkin", "Cultured cream", "Seeds"],
      price: 720,
      imageUrl: restaurant.coverImageUrl || "/images/ember.svg",
      displayOrder: 1,
      isActive: true,
      isAvailable: true,
      threeD: threeDConfig
    });
    return item;
  }

  // Update only the fields needed to make the existing dish eligible for Phase 6.
  // Using document.save() avoids MongoDB update-path conflicts between
  // $setOnInsert/defaults and $set on fields such as isActive/isAvailable.
  item.categoryId = category._id;
  item.isActive = true;
  item.isAvailable = true;
  item.threeD = threeDConfig;
  await item.save();

  return item;
}

async function setupPhase6Prototype() {
  await connectDB();

  const restaurant = await Restaurant.findOne({ slug: "ember-house" });
  if (!restaurant) {
    throw new Error("Ember House was not found. Run `npm run seed` first.");
  }

  const category = await ensureStarterCategory(restaurant);
  const item = await ensurePrototypeDish(restaurant, category);

  console.log("Phase 6 prototype ready:");
  console.log(`Restaurant: ${restaurant.slug}`);
  console.log(`Dish: ${item.slug}`);
  console.log(`Active: ${item.isActive}`);
  console.log(`Available: ${item.isAvailable}`);
  console.log(`3D enabled: ${item.threeD?.enabled}`);
  console.log(`Model URL: ${item.threeD?.modelUrl || "MISSING"}`);
}

setupPhase6Prototype()
  .catch((error) => {
    console.error("Phase 6 prototype setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
