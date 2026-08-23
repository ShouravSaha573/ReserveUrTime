import "dotenv/config";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import {
  DEMO_CATEGORY_SEEDS,
  DEMO_MENU_SEEDS,
  DEMO_RESTAURANTS
} from "../config/demoRuntimeData.js";
import { PHASE7_THREE_D_CONFIGS } from "../config/phase7ThreeDConfigs.js";
import { MenuCategory } from "../models/MenuCategory.js";
import { MenuItem } from "../models/MenuItem.js";
import { Restaurant } from "../models/Restaurant.js";
import { applyPhase7ThreeDConfigToDish } from "../services/phase7SetupService.js";
import { defaultPhotoExplodeForImage } from "../services/photoExplodeService.js";

function missing(value) {
  return value === undefined || value === null || value === "";
}

async function ensureRestaurant(seed) {
  let restaurant = await Restaurant.findOne({ slug: seed.slug });
  if (!restaurant) {
    restaurant = await Restaurant.create(seed);
    console.log(`Created missing demo Restaurant: ${seed.name}`);
    return restaurant;
  }

  // This command is explicitly a demo-runtime repair command. It restores the
  // three canonical demo Restaurants to a browseable state but preserves any
  // Restaurant Admin / Platform Admin text and media customizations.
  restaurant.isActive = true;
  restaurant.isFeatured = true;
  if (missing(restaurant.name)) restaurant.name = seed.name;
  if (missing(restaurant.description)) restaurant.description = seed.description;
  if (missing(restaurant.coverImageUrl)) restaurant.coverImageUrl = seed.coverImageUrl;
  if (missing(restaurant.cuisine)) restaurant.cuisine = seed.cuisine;
  if (missing(restaurant.location)) restaurant.location = seed.location;
  if (missing(restaurant.phone)) restaurant.phone = seed.phone;
  if (missing(restaurant.email)) restaurant.email = seed.email;
  if (missing(restaurant.openingHours)) restaurant.openingHours = seed.openingHours;
  if (missing(restaurant.theme)) restaurant.theme = seed.theme;
  if (!Number.isFinite(restaurant.featuredOrder)) restaurant.featuredOrder = seed.featuredOrder;
  if (!Number.isFinite(restaurant.listingOrder)) restaurant.listingOrder = seed.listingOrder;
  await restaurant.save();
  return restaurant;
}

async function ensureCategories(restaurant) {
  const bySlug = new Map();
  for (const seed of DEMO_CATEGORY_SEEDS) {
    let category = await MenuCategory.findOne({
      restaurantId: restaurant._id,
      slug: seed.slug
    });
    if (!category) {
      category = await MenuCategory.create({
        restaurantId: restaurant._id,
        name: seed.name,
        slug: seed.slug,
        description: "",
        displayOrder: seed.displayOrder,
        isActive: true
      });
      console.log(`  Created category: ${seed.name}`);
    } else {
      category.isActive = true;
      if (missing(category.name)) category.name = seed.name;
      if (!Number.isFinite(category.displayOrder)) category.displayOrder = seed.displayOrder;
      await category.save();
    }
    bySlug.set(seed.slug, category);
  }
  return bySlug;
}

async function ensureDemoDish(restaurant, categoryBySlug, seed) {
  const existingRaw = await MenuItem.collection.findOne({
    restaurantId: restaurant._id,
    slug: seed.slug
  });

  const category = categoryBySlug.get(seed.category);
  if (!category) throw new Error(`Missing category '${seed.category}'.`);

  if (!existingRaw) {
    const item = await MenuItem.create({
      restaurantId: restaurant._id,
      categoryId: category._id,
      name: seed.name,
      slug: seed.slug,
      description: seed.description,
      ingredients: seed.ingredients,
      price: seed.price,
      imageUrl: restaurant.coverImageUrl || "",
      displayOrder: seed.displayOrder,
      isAvailable: true,
      isActive: true,
      photoExplode: restaurant.coverImageUrl
        ? defaultPhotoExplodeForImage(restaurant.coverImageUrl)
        : undefined
    });
    console.log(`  Created missing dish: ${item.name}`);
    return item;
  }

  // Raw collection update deliberately runs before hydrating through Mongoose.
  // It repairs legacy values such as categoryId: "starters" which otherwise
  // can make populate() throw CastError("Invalid record id").
  await MenuItem.collection.updateOne(
    { _id: existingRaw._id },
    {
      $set: {
        restaurantId: restaurant._id,
        categoryId: category._id,
        isActive: true,
        isAvailable: true
      }
    }
  );

  const item = await MenuItem.findById(existingRaw._id);
  if (!item) throw new Error(`Could not reload repaired dish '${seed.slug}'.`);

  if (missing(item.name)) item.name = seed.name;
  if (missing(item.description)) item.description = seed.description;
  if (!Array.isArray(item.ingredients) || item.ingredients.length === 0) {
    item.ingredients = seed.ingredients;
  }
  if (!Number.isFinite(item.price)) item.price = seed.price;
  if (!Number.isFinite(item.displayOrder)) item.displayOrder = seed.displayOrder;
  if (missing(item.imageUrl)) item.imageUrl = restaurant.coverImageUrl || "";

  if (item.imageUrl && (!item.photoExplode?.sourceImageUrl || !item.photoExplode?.enabled)) {
    item.photoExplode = {
      ...defaultPhotoExplodeForImage(item.imageUrl),
      ...(item.photoExplode?.toObject?.() || item.photoExplode || {}),
      enabled: true,
      sourceImageUrl: item.photoExplode?.sourceImageUrl || item.imageUrl
    };
  }

  await item.save();
  return item;
}

async function repairLegacyCategorySlugs(restaurant, categoryBySlug) {
  const rawItems = await MenuItem.collection
    .find({ restaurantId: restaurant._id })
    .project({ _id: 1, slug: 1, categoryId: 1 })
    .toArray();

  let repaired = 0;
  for (const raw of rawItems) {
    if (raw.categoryId instanceof mongoose.Types.ObjectId) continue;
    const legacySlug = String(raw.categoryId || "").trim().toLowerCase();
    const category = categoryBySlug.get(legacySlug);
    if (!category) continue;
    await MenuItem.collection.updateOne(
      { _id: raw._id },
      { $set: { categoryId: category._id } }
    );
    repaired += 1;
  }
  return repaired;
}

async function run() {
  await connectDB();
  console.log("\nRepairing ReserveUrTime demo runtime without resetting the database...\n");

  for (const restaurantSeed of DEMO_RESTAURANTS) {
    const restaurant = await ensureRestaurant(restaurantSeed);
    const categoryBySlug = await ensureCategories(restaurant);
    const repairedLegacy = await repairLegacyCategorySlugs(restaurant, categoryBySlug);
    if (repairedLegacy) {
      console.log(`  Repaired ${repairedLegacy} legacy category reference(s).`);
    }

    const dishSeeds = DEMO_MENU_SEEDS[restaurant.slug] || [];
    for (const dishSeed of dishSeeds) {
      const item = await ensureDemoDish(restaurant, categoryBySlug, dishSeed);
      if (restaurant.slug === "ember-house" && PHASE7_THREE_D_CONFIGS[item.slug]) {
        await applyPhase7ThreeDConfigToDish(
          item,
          PHASE7_THREE_D_CONFIGS[item.slug],
          item.imageUrl || restaurant.coverImageUrl || "/images/ember.svg"
        );
      }
    }

    const activeDishCount = await MenuItem.countDocuments({
      restaurantId: restaurant._id,
      isActive: true,
      isAvailable: true
    });
    const threeDCount = await MenuItem.countDocuments({
      restaurantId: restaurant._id,
      isActive: true,
      isAvailable: true,
      "threeD.enabled": true,
      "threeD.modelUrl": { $nin: ["", null] }
    });
    console.log(`${restaurant.name}: ${activeDishCount} public dish(es), ${threeDCount} real 3D dish(es).`);
  }

  console.log("\nDemo runtime repair complete.");
  console.log("Next: npm run diagnose:demo-runtime");
}

run()
  .catch((error) => {
    console.error("Demo runtime repair failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
  });
