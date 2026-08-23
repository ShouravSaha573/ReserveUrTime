import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..", "..");
const projectRoot = path.resolve(backendRoot, "..");
const readBackend = (relative) => fs.readFileSync(path.join(backendRoot, relative), "utf8");
const readFrontend = (relative) => fs.readFileSync(path.join(projectRoot, "frontend", relative), "utf8");

const favoriteModel = readBackend("src/models/Favorite.js");
const routes = readBackend("src/routes/customerRoutes.js");
const service = readBackend("src/services/customerAccountService.js");
const controller = readBackend("src/controllers/customerController.js");
const app = readBackend("src/app.js");
const frontendApp = readFrontend("src/App.jsx");
const favoritesContext = readFrontend("src/context/FavoritesContext.jsx");
const favoriteButton = readFrontend("src/components/FavouriteButton.jsx");
const dashboard = readFrontend("src/pages/CustomerDashboardPage.jsx");
const favoritesPage = readFrontend("src/pages/CustomerFavouritesPage.jsx");
const profilePage = readFrontend("src/pages/CustomerProfilePage.jsx");
const restaurantCard = readFrontend("src/components/RestaurantCard.jsx");
const menuItem = readFrontend("src/components/public/PublicMenuItem.jsx");
const threeDMenu = readFrontend("src/pages/Restaurant3DMenuPage.jsx");

assert.ok(favoriteModel.includes('enum: ["restaurant", "menu_item"]'), "Favourite targets must support Restaurants and dishes.");
assert.ok(favoriteModel.includes("partialFilterExpression"), "Favourite uniqueness must be enforced safely for each target type.");
assert.ok(favoriteModel.includes("userId") && favoriteModel.includes("restaurantId") && favoriteModel.includes("menuItemId"), "Favourite model needs customer and target ownership fields.");

for (const token of [
  'router.get("/dashboard"',
  'router.get("/favorites"',
  'router.post("/favorites"',
  'router.delete("/favorites/:targetType/:targetId"',
  'router.patch("/profile"'
]) {
  assert.ok(routes.includes(token), `Missing Phase 8 customer route: ${token}`);
}
assert.ok(routes.includes("authenticateUser") && routes.includes("requireCustomer"), "Phase 8 customer APIs must be customer-authenticated.");
assert.ok(app.includes('app.use("/api/customer", customerRoutes)'), "Customer routes must be mounted.");

for (const token of ["Restaurant.findOne", "MenuItem.findOne", "isActive: true", "isAvailable: true", "userId"]) {
  assert.ok(service.includes(token), `Favourite service must validate ${token}.`);
}
assert.ok(service.includes("findOneAndUpdate") && service.includes("role: \"customer\""), "Profile updates must remain customer-scoped.");
assert.ok(controller.includes("listCustomerFavorites") && controller.includes("updateCustomerProfile"), "Customer controller must use the Phase 8 service layer.");

for (const route of ["/dashboard", "/dashboard/favourites", "/dashboard/profile", "/dashboard/reservations"]) {
  assert.ok(frontendApp.includes(route), `Frontend customer dashboard route missing: ${route}`);
}
assert.ok(favoritesContext.includes("optimistic") || favoritesContext.includes("previous = data"), "Favourites should provide optimistic save/remove with rollback state.");
assert.ok(favoritesContext.includes("setData(previous)"), "Failed favourite writes must roll back optimistic UI state.");
assert.ok(favoriteButton.includes("aria-pressed") && favoriteButton.includes("returnTo"), "Favourite button needs accessible state and customer-login return path.");

for (const source of [restaurantCard, menuItem, threeDMenu]) {
  assert.ok(source.includes("FavouriteButton"), "Public Restaurant/menu/3D experiences must expose favourite controls.");
}
assert.ok(dashboard.includes("Saved Restaurants") && dashboard.includes("Upcoming"), "Customer overview must include saved/reservation summary.");
assert.ok(favoritesPage.includes("Saved Restaurants") && favoritesPage.includes("Saved dishes"), "Favourites page must present both target types.");
assert.ok(profilePage.includes("Save profile") && profilePage.includes("readOnly"), "Customer profile must support safe name/phone edits while keeping email read-only in Phase 8.");

console.log("Phase 8 favourites + customer profile/dashboard smoke tests passed.");
