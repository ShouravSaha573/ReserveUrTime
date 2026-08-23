import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "../..");
const projectRoot = path.resolve(backendRoot, "..");
const read = (relative) => fs.readFileSync(path.join(projectRoot, relative), "utf8");

const packageJson = JSON.parse(read("frontend/package.json"));
assert.ok(packageJson.dependencies?.motion, "Motion dependency is missing.");

const routes = read("backend/src/routes/restaurantAdminRoutes.js");
assert.ok(routes.includes('/menu/items/:itemId/image'), "Normal Restaurant Admin dish image upload must remain available.");
assert.ok(routes.includes("requireManagedRestaurant"), "Restaurant ownership middleware missing.");
assert.doesNotMatch(routes, /photo-explode|3d-animation/);

const app = read("frontend/src/App.jsx");
assert.equal(app.includes('/restaurant-admin/photo-explode'), false, "Photo Explode route must remain retired.");
assert.equal(app.includes('/restaurant-admin/3d-animation'), false, "3D editor route must remain retired.");

const publicMenu = read("frontend/src/components/public/PublicMenuItem.jsx");
assert.equal(publicMenu.includes("PhotoExplodeDish"), false, "Restaurant menus must render normal photography rather than Photo Explode.");
assert.ok(publicMenu.includes("restaurant-menu-image"), "Restaurant menu levitation image hook is missing.");

const hero = read("frontend/src/components/SignatureFoodHero.jsx");
assert.ok(hero.includes("SodaStyleFoodHero"), "Homepage Soda-style 3D food hero renderer is missing.");
assert.ok(hero.includes("food3d-model-parallax"), "Homepage interactive 3D food stage is missing.");
assert.ok(hero.includes("sketchfab.com/models/"), "Real 3D food model embeds are missing.");
assert.equal(hero.includes("burger-layers"), false, "Burger hero must not use photographic layer images.");
assert.equal(hero.includes("-cutout.webp"), false, "Food heroes must not use PNG/WebP/JPG cutout assets.");
assert.equal(hero.includes("EXPLORE LAYERS"), false, "Homepage food explode controls must remain retired.");
assert.equal(hero.includes("const [exploded"), false, "Homepage food explode state must remain retired.");
console.log("Motion/photo pivot smoke tests passed: Restaurant images + Soda-style intact 3D homepage food heroes.");
