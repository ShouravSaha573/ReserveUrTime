import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PHASE7_THREE_D_CONFIGS } from "../config/phase7ThreeDConfigs.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "../..");
const projectRoot = path.resolve(backendRoot, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const publicService = fs.readFileSync(
  path.join(backendRoot, "src/services/publicRestaurantExperienceService.js"),
  "utf8"
);
assert(
  publicService.includes("MenuItem.collection") && publicService.includes("rawMenuFind"),
  "Public menu/3D reads are not using the legacy-safe raw Mongo boundary."
);
assert(
  publicService.includes("buildPhase7RuntimeAsset") && publicService.includes("attachRuntimeThreeD"),
  "Canonical Phase 7 runtime fallback is missing."
);
assert(
  !publicService.includes('.populate("categoryId"'),
  "Unsafe public category populate is still present."
);

const adminController = fs.readFileSync(
  path.join(backendRoot, "src/controllers/restaurantOperationsController.js"),
  "utf8"
);
assert(
  adminController.includes("MenuItem.collection") && adminController.includes("categoryById"),
  "Restaurant Admin menu list is not legacy-category safe."
);
assert(
  adminController.includes("buildPhase7RuntimeAsset") && adminController.includes("PHASE7_THREE_D_CONFIGS"),
  "Restaurant Admin menu list does not restore canonical demo 3D metadata."
);

const threeDService = fs.readFileSync(
  path.join(backendRoot, "src/services/threeDAnimationService.js"),
  "utf8"
);
assert(
  threeDService.includes("MenuItem.collection.findOne") && threeDService.includes("MenuItem.collection.updateOne"),
  "3D editor still hydrates legacy-broken menu documents through Mongoose."
);
assert(
  threeDService.includes("ownedRuntimeAsset") && threeDService.includes("buildPhase7RuntimeAsset"),
  "3D editor does not recover the canonical Ember runtime asset."
);

const canvas = fs.readFileSync(
  path.join(projectRoot, "frontend/src/components/three/ExplodedDishCanvas.jsx"),
  "utf8"
);
for (const token of ["gsap.timeline", "explodedOffset", "rotationOffset", "explodeScale", "Explode"]) {
  assert(canvas.includes(token), `Exploded dish runtime token missing: ${token}`);
}

for (const [slug, config] of Object.entries(PHASE7_THREE_D_CONFIGS)) {
  assert(config.layers.length >= 7, `${slug} does not contain a detailed exploded layer set.`);
  const modelFile = path.join(projectRoot, "frontend/public", config.modelUrl);
  assert(fs.existsSync(modelFile), `Missing GLB for ${slug}: ${config.modelUrl}`);
}

const frontendPackage = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "frontend/package.json"), "utf8")
);
assert(frontendPackage.devDependencies.tailwindcss === "3.4.19", "Tailwind 3.4.19 baseline missing.");
assert(frontendPackage.overrides?.sucrase === "3.35.1", "Patched Sucrase override missing.");
assert(frontendPackage.overrides?.glob === "10.5.0", "Patched glob override missing.");

console.log("Exploded-dish core runtime + frontend audit remediation smoke tests passed.");
