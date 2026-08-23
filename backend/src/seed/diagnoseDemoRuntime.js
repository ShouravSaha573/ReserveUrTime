import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import { DEMO_MENU_SEEDS, DEMO_RESTAURANTS } from "../config/demoRuntimeData.js";
import { PHASE7_THREE_D_CONFIGS } from "../config/phase7ThreeDConfigs.js";
import { MenuItem } from "../models/MenuItem.js";
import { Restaurant } from "../models/Restaurant.js";
import { getPublicThreeDMenu } from "../services/publicRestaurantExperienceService.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../../..");

async function exists(relativePublicUrl) {
  if (!relativePublicUrl?.startsWith("/models/")) return false;
  try {
    await fs.access(path.join(projectRoot, "frontend", "public", relativePublicUrl));
    return true;
  } catch {
    return false;
  }
}

async function run() {
  await connectDB();
  console.log(`Database: ${mongoose.connection.name}\n`);

  let totalExpected = 0;
  let totalReady = 0;
  let totalMalformedCategories = 0;

  for (const seed of DEMO_RESTAURANTS) {
    const restaurant = await Restaurant.findOne({ slug: seed.slug }).lean();
    if (!restaurant) {
      console.log(`${seed.name}: MISSING`);
      continue;
    }

    const expected = DEMO_MENU_SEEDS[seed.slug] || [];
    const rawItems = await MenuItem.collection
      .find({ restaurantId: restaurant._id })
      .project({ slug: 1, isActive: 1, isAvailable: 1, categoryId: 1, threeD: 1 })
      .toArray();
    const bySlug = new Map(rawItems.map((item) => [item.slug, item]));
    const malformed = rawItems.filter(
      (item) => !(item.categoryId instanceof mongoose.Types.ObjectId)
    );
    totalMalformedCategories += malformed.length;

    console.log(`${restaurant.name} (${seed.slug})`);
    console.log(`  Restaurant active: ${restaurant.isActive === true}`);
    console.log(`  Menu records: ${rawItems.length}`);
    console.log(`  Legacy/malformed category refs: ${malformed.length}`);

    for (const dish of expected) {
      totalExpected += 1;
      const row = bySlug.get(dish.slug);
      const ready = Boolean(row?.isActive && row?.isAvailable);
      if (ready) totalReady += 1;
      console.log(`  - ${dish.slug}: ${ready ? "PUBLIC" : row ? "NOT PUBLIC" : "MISSING"}`);
    }

    if (seed.slug === "ember-house") {
      let threeDReady = 0;
      for (const [slug, config] of Object.entries(PHASE7_THREE_D_CONFIGS)) {
        const row = bySlug.get(slug);
        const modelExists = await exists(config.modelUrl);
        const ready = Boolean(
          row?.isActive &&
            row?.isAvailable &&
            row?.threeD?.enabled &&
            row?.threeD?.modelUrl &&
            modelExists
        );
        if (ready) threeDReady += 1;
        console.log(
          `  3D ${slug}: ${ready ? "READY" : "NOT READY"} | model file: ${modelExists ? "FOUND" : "MISSING"}`
        );
      }
      console.log(`  Real 3D readiness: ${threeDReady}/4`);
    }
    console.log("");
  }

  console.log(`Demo public dish readiness: ${totalReady}/${totalExpected}`);
  console.log(`Malformed category references: ${totalMalformedCategories}`);

  try {
    const publicThreeD = await getPublicThreeDMenu({ restaurantSlug: "ember-house" });
    const runtimeItems = publicThreeD?.items || [];
    console.log(`Public 3D service readiness: ${runtimeItems.length}/4`);
    console.log(
      runtimeItems.length >= 4
        ? "Public 3D service cast-safe: true"
        : "Public 3D service cast-safe: true, but fewer than four 3D dishes are currently eligible"
    );
  } catch (error) {
    console.log(`Public 3D service cast-safe: false (${error.message})`);
  }
  console.log(
    totalReady === totalExpected && totalMalformedCategories === 0
      ? "Demo runtime ready: true"
      : "Demo runtime ready: false — run npm run repair:demo-runtime"
  );
}

run()
  .catch((error) => {
    console.error("Demo runtime diagnosis failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close().catch(() => {});
  });
