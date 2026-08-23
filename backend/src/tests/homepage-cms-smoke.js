import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const platformRoutes = read("src/routes/platformAdminRoutes.js");
const siteRoutes = read("src/routes/siteRoutes.js");
const platformController = read("src/controllers/platformAdminController.js");
const siteModel = read("src/models/SiteContent.js");
const restaurantModel = read("src/models/Restaurant.js");

for (const expected of [
  'router.get("/homepage"',
  'router.patch("/homepage"',
  'router.get("/audit-logs"'
]) {
  assert.ok(platformRoutes.includes(expected), `Missing Platform Admin CMS route: ${expected}`);
}

assert.ok(
  siteRoutes.includes('router.get("/homepage"'),
  "Missing public homepage CMS read route."
);

for (const expected of [
  "brand:",
  "hero:",
  "restaurantsSection:",
  "footer:",
  "galaxy:",
  "sectionOrder:"
]) {
  assert.ok(siteModel.includes(expected), `SiteContent model missing: ${expected}`);
}

assert.ok(
  platformController.includes("safeInternalPath"),
  "Homepage CMS must validate internal CTA paths."
);
assert.ok(
  platformController.includes("Galaxy shine interval must be between"),
  "Galaxy CMS bounds are missing."
);

for (const expected of ["isFeatured", "featuredOrder", "listingOrder"]) {
  assert.ok(
    restaurantModel.includes(expected),
    `Restaurant platform-listing control missing: ${expected}`
  );
}

console.log("Phase 2B Homepage CMS/MVC smoke tests passed.");
