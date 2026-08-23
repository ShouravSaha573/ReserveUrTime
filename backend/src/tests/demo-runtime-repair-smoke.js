import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DEMO_MENU_SEEDS } from "../config/demoRuntimeData.js";
import { PHASE7_THREE_D_CONFIGS } from "../config/phase7ThreeDConfigs.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "../..");
const projectRoot = path.resolve(backendRoot, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const slug of ["ember-house", "kori", "verde"]) {
  assert(DEMO_MENU_SEEDS[slug]?.length === 4, `${slug} must have four demo dishes.`);
}
for (const dishSlug of Object.keys(PHASE7_THREE_D_CONFIGS)) {
  assert(
    DEMO_MENU_SEEDS["ember-house"].some((item) => item.slug === dishSlug),
    `3D dish '${dishSlug}' missing from Ember demo menu.`
  );
}

const publicService = fs.readFileSync(
  path.join(backendRoot, "src/services/publicRestaurantExperienceService.js"),
  "utf8"
);
assert(publicService.includes("attachSafeCategory"), "Public category safety join missing.");
assert(!publicService.includes('.populate("categoryId"'), "Public category populate can still CastError.");
assert(publicService.includes("MenuItem.collection"), "Public menu reads must bypass legacy Mongoose hydration.");
assert(publicService.includes("Restaurant.collection.findOne"), "Public Restaurant lookup must stay raw/cast-safe.");
assert(publicService.includes("MenuCategory.collection"), "Public categories must stay raw/cast-safe.");
assert(publicService.includes("buildPhase7RuntimeAsset"), "Public Phase 7 canonical GLB runtime fallback missing.");

const repair = fs.readFileSync(path.join(backendRoot, "src/seed/repairDemoRuntime.js"), "utf8");
assert(repair.includes("MenuItem.collection.updateOne"), "Raw legacy category repair missing.");
assert(repair.includes("applyPhase7ThreeDConfigToDish"), "Phase 7 3D repair missing.");
assert(repair.includes("defaultPhotoExplodeForImage"), "Photo Explode repair missing.");

for (const config of Object.values(PHASE7_THREE_D_CONFIGS)) {
  const modelFile = path.join(projectRoot, "frontend", "public", config.modelUrl);
  assert(fs.existsSync(modelFile), `Bundled GLB missing: ${config.modelUrl}`);
}

console.log("Demo menu + 3D runtime repair smoke tests passed.");
