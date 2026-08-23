import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const routes = read("src/routes/restaurantRoutes.js");
const controller = read("src/controllers/publicRestaurantExperienceController.js");
const service = read("src/services/publicRestaurantExperienceService.js");
const menuModel = read("src/models/MenuItem.js");

assert.ok(
  routes.includes('router.get("/:slug/experience"'),
  "Phase 5 must expose a public Restaurant experience endpoint."
);
assert.ok(
  routes.includes('router.get("/:slug/menu"'),
  "Phase 5 must expose a public Restaurant menu endpoint."
);
assert.ok(
  controller.includes("getPublicExperience") && controller.includes("getPublicMenu"),
  "Public Restaurant endpoints must delegate to the service layer."
);
assert.ok(
  service.includes("isActive: true") && service.includes("isAvailable: true"),
  "Public menu must expose only active and currently available dishes."
);
assert.ok(
  service.includes("ingredients: matcher") && service.includes("description: matcher"),
  "Public menu search must support ingredients and description in addition to dish names."
);
assert.ok(
  service.includes("isPublished: true"),
  "Public Restaurant gallery must expose only published items."
);
assert.ok(
  menuModel.includes("isActive") && menuModel.includes("isAvailable"),
  "Phase 5 DOM menu fields must remain available as the permanent fallback after 3D begins."
);

console.log("Phase 5 public Restaurant experience/menu smoke tests passed.");
