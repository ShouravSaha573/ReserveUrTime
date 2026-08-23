import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const routes = read("src/routes/restaurantAdminRoutes.js");
const controller = read("src/controllers/restaurantOperationsController.js");
const platformRoutes = read("src/routes/platformAdminRoutes.js");
const categoryModel = read("src/models/MenuCategory.js");
const itemModel = read("src/models/MenuItem.js");
const galleryModel = read("src/models/GalleryItem.js");
const tableModel = read("src/models/DiningTable.js");

for (const expected of [
  'router.get("/menu/categories"',
  'router.post("/menu/categories"',
  'router.patch("/menu/categories/:categoryId"',
  'router.delete("/menu/categories/:categoryId"',
  'router.get("/menu/items"',
  'router.post("/menu/items"',
  'router.patch("/menu/items/:itemId"',
  'router.delete("/menu/items/:itemId"',
  'router.get("/tables"',
  'router.post("/tables"',
  'router.patch("/tables/:tableId"',
  'router.delete("/tables/:tableId"',
  'router.get("/reservations"',
  'router.patch("/reservations/:reservationId/status"',
  'router.get("/gallery"',
  'router.post("/gallery"',
  'router.patch("/gallery/:galleryItemId"',
  'router.delete("/gallery/:galleryItemId"'
]) {
  assert.ok(routes.includes(expected), `Missing Phase 4 Restaurant Admin route: ${expected}`);
}

for (const modelSource of [categoryModel, itemModel, galleryModel, tableModel]) {
  assert.ok(modelSource.includes("restaurantId"), "Every Restaurant-owned operational model must contain restaurantId.");
}

assert.ok(
  routes.includes("requireRestaurantAdmin") && routes.includes("requireManagedRestaurant"),
  "Restaurant operational APIs must use Restaurant Admin authentication and backend Restaurant scope."
);
assert.ok(
  controller.includes("req.managedRestaurantId"),
  "Restaurant operations must derive Restaurant scope from authenticated Restaurant Admin."
);
assert.ok(
  controller.includes('restaurantId: req.managedRestaurantId'),
  "Restaurant-owned writes must force authenticated Restaurant scope."
);
assert.ok(
  controller.includes("hasFutureReservation"),
  "Dining table removal must protect upcoming active reservations."
);
assert.ok(
  controller.includes('reservationId') && controller.includes('restaurantId: req.managedRestaurantId'),
  "Reservation status management must remain scoped to the assigned Restaurant."
);
assert.ok(
  !platformRoutes.includes("menu/categories") &&
    !platformRoutes.includes("menu/items") &&
    !platformRoutes.includes('router.get("/tables"') &&
    !platformRoutes.includes('router.get("/gallery"'),
  "Platform Admin routes must not expose Restaurant-internal operational CRUD."
);
assert.ok(
  !routes.includes("/restaurants/:restaurantId"),
  "Restaurant Admin must not select arbitrary Restaurant scope in Phase 4 routes."
);
assert.ok(
  itemModel.includes("restaurantId") && itemModel.includes("isAvailable"),
  "Phase 4 Restaurant-owned dish scoping/availability fields must remain intact after later 3D phases."
);

console.log("Phase 4 Restaurant internal operations smoke tests passed.");
