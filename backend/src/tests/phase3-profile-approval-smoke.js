import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const restaurantAdminRoutes = read("src/routes/restaurantAdminRoutes.js");
const platformRoutes = read("src/routes/platformAdminRoutes.js");
const profileModel = read("src/models/RestaurantProfile.js");
const requestModel = read("src/models/ListingChangeRequest.js");
const requestService = read("src/services/listingChangeService.js");
const restaurantAdminController = read("src/controllers/restaurantAdminController.js");

for (const expected of [
  'router.get("/profile"',
  'router.patch("/profile"',
  'router.get("/listing-change-requests"',
  'router.post("/listing-change-requests"'
]) {
  assert.ok(restaurantAdminRoutes.includes(expected), `Missing Restaurant Admin Phase 3 route: ${expected}`);
}

for (const expected of [
  'router.get("/listing-change-requests"',
  'router.patch("/listing-change-requests/:requestId/review"'
]) {
  assert.ok(platformRoutes.includes(expected), `Missing Platform Admin approval route: ${expected}`);
}

assert.ok(profileModel.includes("restaurantId"), "RestaurantProfile must be restaurant-scoped.");
assert.ok(profileModel.includes("unique: true"), "RestaurantProfile should be unique per Restaurant.");
assert.ok(requestModel.includes('enum: ["restaurant_name", "listing_image"]'), "Listing request types are missing.");
assert.ok(requestModel.includes('enum: ["pending", "approved", "rejected"]'), "Listing request statuses are missing.");
assert.ok(requestService.includes('request.type === "restaurant_name"'), "Approval service must apply name changes explicitly.");
assert.ok(requestService.includes("coverImageUrl"), "Approval service must apply listing image changes explicitly.");
assert.ok(restaurantAdminController.includes("req.managedRestaurantId"), "Restaurant Admin controller must use backend-derived Restaurant scope.");
assert.ok(!restaurantAdminRoutes.includes("/restaurants/:restaurantId"), "Restaurant Admin must not choose arbitrary Restaurant scope through a route parameter.");

console.log("Phase 3 Restaurant profile/listing approval smoke tests passed.");
