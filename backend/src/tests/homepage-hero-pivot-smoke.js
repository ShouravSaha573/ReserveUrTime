import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..", "..");
const projectRoot = path.resolve(backendRoot, "..");
const frontendRoot = path.join(projectRoot, "frontend", "src");
const publicRoot = path.join(projectRoot, "frontend", "public");

const read = (file) => fs.readFileSync(file, "utf8");
const home = read(path.join(frontendRoot, "pages", "HomePage.jsx"));
const hero = read(path.join(frontendRoot, "components", "SignatureFoodHero.jsx"));
const galaxy = read(path.join(frontendRoot, "components", "visual", "GalaxyBackground.jsx"));
const app = read(path.join(frontendRoot, "App.jsx"));
const publicMenu = read(path.join(frontendRoot, "components", "public", "PublicMenuItem.jsx"));
const adminMenu = read(path.join(frontendRoot, "pages", "RestaurantAdminMenuPage.jsx"));
const vercel = read(path.join(projectRoot, "frontend", "vercel.json"));

assert.ok(home.indexOf("<SignatureFoodHero") < home.indexOf("restaurantsSection.enabled"), "Hero stack must render before Restaurants.");
for (const id of ["home-intro-hero", "burger-hero", "pizza-hero", "momo-hero", "kebab-hero", "soda-hero", "home-restaurant-search"]) {
  assert.ok(hero.includes(`id=\"${id}\"`) || hero.includes(`id: \"${id}\"`), `Homepage is missing permanent section ${id}.`);
}

assert.ok(hero.includes("SodaStyleFoodHero"), "Reusable Soda-style food hero renderer is missing.");
assert.ok(hero.includes("sketchfab.com/models/"), "Real interactive 3D food embeds are missing.");
for (const id of [
  "18e59d7dbd2243c69f469e0f056f44c4",
  "da6bfb4e80994d82bb152df635f09c68",
  "c7fca235524a4a62b652da0571ebc824",
  "26225729dd4d469fb7370c344f432329"
]) assert.ok(hero.includes(id), `Missing expected real 3D model source ${id}.`);

for (const bad of ["burger-layers", "pizza-cutout.webp", "momo-cutout.webp", "kebab-cutout.webp", "EXPLORE LAYERS", "ASSEMBLE", "SEPARATE THE FIRE", "OPEN THE FOLD"]) {
  assert.equal(hero.includes(bad), false, `Retired image/explode implementation still appears: ${bad}`);
}

const heroAssets = path.join(publicRoot, "hero-assets");
if (fs.existsSync(heroAssets)) {
  const forbidden = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(png|jpe?g|webp)$/i.test(entry.name) && /burger|pizza|momo|kebab/i.test(full)) forbidden.push(full);
    }
  };
  walk(heroAssets);
  assert.deepEqual(forbidden, [], `Homepage hero food image assets must not be bundled: ${forbidden.join(", ")}`);
}

assert.ok(hero.includes("deit_soda2.glb"), "Soda hero must retain the supplied real 3D can asset.");
assert.ok(hero.includes("Green%20Soda.png") && hero.includes("Blue%20Soda.png"), "Soda flavor cards are missing.");

assert.ok(galaxy.includes("coarsePointer ? 850 : 1450"), "Starfield desktop/mobile density reduction is missing.");
assert.ok(galaxy.includes("pointSize: 24"), "Star point size reduction is missing.");
assert.equal(galaxy.includes("4200"), false, "Old 4200-star density must be retired.");
assert.ok(galaxy.includes("UnrealBloomPass"), "Starfield bloom post-processing is missing.");

assert.ok(vercel.includes("frame-src https://sketchfab.com"), "Production CSP must allow the 3D model frame source.");

for (const retired of [
  "/restaurant/:slug/menu/3d",
  "/restaurant/:slug/menu/:dishSlug/3d",
  "/restaurant-admin/3d-animation",
  "/restaurant-admin/photo-explode"
]) {
  assert.equal(app.includes(retired), false, `Retired Restaurant 3D route is still mounted: ${retired}`);
}
assert.equal(adminMenu.includes("3D Animation"), false, "Restaurant Admin menu still exposes 3D Animation.");
assert.equal(adminMenu.includes("Photo Explode"), false, "Restaurant Admin menu still exposes Photo Explode.");
assert.equal(publicMenu.includes("/3d"), false, "Public menu item still links to Restaurant 3D.");
assert.ok(publicMenu.includes("restaurant-menu-image"), "Public dish image levitation hook is missing.");

console.log("Homepage polished Soda-style 3D hero smoke test passed.");
