import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "../..");
const projectRoot = path.resolve(backendRoot, "..");

function read(relative) {
  return fs.readFileSync(path.join(projectRoot, relative), "utf8");
}

const app = read("backend/src/app.js");
const customerRoutes = read("backend/src/routes/customerRoutes.js");
const restaurantAdminRoutes = read("backend/src/routes/restaurantAdminRoutes.js");
const platformAdminRoutes = read("backend/src/routes/platformAdminRoutes.js");
const restaurantRoutes = read("backend/src/routes/restaurantRoutes.js");
const reservationRoutes = read("backend/src/routes/reservationRoutes.js");
const frontApp = read("frontend/src/App.jsx");

for (const mount of [
  "/api/auth",
  "/api/restaurants",
  "/api/site",
  "/api/reservations",
  "/api/customer",
  "/api/contact",
  "/api/payments",
  "/api/platform-admin",
  "/api/restaurant-admin"
]) {
  assert.ok(app.includes(mount), `Missing app mount ${mount}`);
}

assert.match(customerRoutes, /router\.use\(authenticateUser,\s*requireCustomer\)/);
for (const route of ["/dashboard", "/favorites", "/cart", "/orders", "/profile", "/reviews", "/messages", "/notifications"]) {
  assert.ok(customerRoutes.includes(route), `Missing customer route ${route}`);
}

assert.match(
  restaurantAdminRoutes,
  /authenticateUser,\s*requireRestaurantAdmin,\s*requireManagedRestaurant/
);
for (const route of [
  "/profile",
  "/menu/categories",
  "/menu/items",
  "/menu/items/:itemId/image",
  "/tables",
  "/orders",
  "/reservations",
  "/gallery",
  "/reviews",
  "/messages",
  "/notifications",
  "/listing-change-requests"
]) {
  assert.ok(restaurantAdminRoutes.includes(route), `Missing Restaurant Admin route ${route}`);
}

assert.match(platformAdminRoutes, /router\.use\(authenticateUser,\s*requirePlatformAdmin\)/);
assert.doesNotMatch(platformAdminRoutes, /\/orders/);
assert.doesNotMatch(platformAdminRoutes, /\/menu\/items/);

assert.match(reservationRoutes, /authenticateUser/);
assert.match(reservationRoutes, /requireCustomer/);
assert.doesNotMatch(restaurantRoutes, /menu\/3d/);

for (const route of [
  "/dashboard",
  "/dashboard/favourites",
  "/dashboard/cart",
  "/dashboard/orders",
  "/dashboard/reviews",
  "/dashboard/messages",
  "/dashboard/notifications",
  "/dashboard/profile",
  "/dashboard/reservations",
  "/platform-admin/dashboard",
  "/restaurant-admin/dashboard",
  "/restaurant-admin/orders",
  "/restaurant-admin/reviews",
  "/restaurant-admin/messages",
  "/restaurant-admin/notifications",
  "/platform-admin/reviews",
  "/platform-admin/messages",
  "/contact"
]) {
  assert.ok(frontApp.includes(route), `Missing frontend route ${route}`);
}

for (const retired of [
  "/restaurant/:slug/menu/3d",
  "/restaurant-admin/3d-animation",
  "/restaurant-admin/photo-explode"
]) {
  assert.equal(frontApp.includes(retired), false, `Retired frontend route is still mounted: ${retired}`);
}
assert.doesNotMatch(restaurantAdminRoutes, /3d-animation|photo-explode/);

assert.match(app, /paymentRoutes/);
assert.match(customerRoutes, /payments\/sslcommerz/);
assert.ok(app.indexOf('app.use("/api/payments", paymentCallbackLimiter, paymentRoutes)') < app.indexOf("app.use(requireTrustedOrigin)"), "Gateway callback mount must stay outside browser CSRF/origin middleware while authenticated Customer writes remain protected.");

console.log("Flow/connection static smoke tests passed, including current Restaurant image-only menu flow, payments and communications.");
