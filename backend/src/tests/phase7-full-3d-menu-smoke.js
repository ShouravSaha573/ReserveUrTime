import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..", "..");
const projectRoot = path.resolve(backendRoot, "..");
const readBackend = (p) => fs.readFileSync(path.join(backendRoot, p), "utf8");
const readFrontend = (p) => fs.readFileSync(path.join(projectRoot, "frontend", p), "utf8");

const model = readBackend("src/models/MenuItem.js");
const adminRoutes = readBackend("src/routes/restaurantAdminRoutes.js");
const publicRoutes = readBackend("src/routes/restaurantRoutes.js");
const animationService = readBackend("src/services/threeDAnimationService.js");
const app = readFrontend("src/App.jsx");
const nav = readFrontend("src/components/RestaurantAdminSectionNav.jsx");
const hero = readFrontend("src/components/SignatureFoodHero.jsx");

for (const token of ["duration", "stagger", "easing", "sequence", "enabled"]) {
  assert.ok(model.includes(token), `Legacy Phase 7 schema metadata is missing ${token}.`);
}
assert.ok(animationService.includes("THREE_D_EASING_PRESETS"), "Legacy bounded 3D animation service should remain available in source history.");
assert.doesNotMatch(adminRoutes, /3d-animation/);
assert.doesNotMatch(publicRoutes, /menu\/3d/);
assert.equal(app.includes("Restaurant3DMenuPage"), false, "Full Restaurant 3D page must not be mounted.");
assert.equal(nav.includes("3D Animation"), false, "Restaurant Admin navigation must not expose a 3D editor.");
for (const id of ["burger-hero", "pizza-hero", "momo-hero", "kebab-hero", "soda-hero"]) {
  assert.ok(hero.includes(`id=\"${id}\"`), `Permanent homepage hero missing ${id}.`);
}
assert.equal(hero.includes("activeIndex"), false, "Homepage heroes must not be hidden behind the old selector carousel.");
console.log("Phase 7 Restaurant 3D UI/API retired; signature animated food showcase verified on homepage.");
