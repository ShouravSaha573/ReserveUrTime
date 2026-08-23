import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");

const routes = fs.readFileSync(
  path.join(root, "src/routes/platformAdminRoutes.js"),
  "utf8"
);
const controller = fs.readFileSync(
  path.join(root, "src/controllers/platformAdminController.js"),
  "utf8"
);

for (const expected of [
  'router.get("/restaurants"',
  'router.post("/restaurants"',
  'router.patch("/restaurants/:restaurantId"',
  'router.delete("/restaurants/:restaurantId"',
  'router.get("/restaurant-admins"',
  'router.post("/restaurant-admins"',
  'router.patch("/restaurant-admins/:userId"',
  'router.delete("/restaurant-admins/:userId"'
]) {
  assert.ok(routes.includes(expected), `Missing route: ${expected}`);
}

assert.ok(controller.includes('role: "restaurant_admin"'));
assert.ok(controller.includes('isActive: false'));
assert.ok(controller.includes('Restaurant Admin created.'));
assert.ok(controller.includes('Restaurant Admin removed.'));
assert.ok(controller.includes('Restaurant removed from the public platform.'));

console.log("Platform Admin management smoke tests passed.");
