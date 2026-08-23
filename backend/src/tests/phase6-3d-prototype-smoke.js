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
const routes = readBackend("src/routes/restaurantRoutes.js");
const viewer = readFrontend("src/components/three/ExplodedDishCanvas.jsx");
const app = readFrontend("src/App.jsx");
const hero = readFrontend("src/components/SignatureFoodHero.jsx");

for (const token of ["modelUrl", "posterUrl", "explodedOffset", "meshName", "cameraPosition"]) {
  assert.ok(model.includes(token), `Legacy Phase 6 metadata is missing ${token}.`);
}
assert.ok(viewer.includes("useGLTF") && viewer.includes("gsap.timeline"), "Legacy GLB viewer source should remain available as project history/fallback code.");
assert.equal(routes.includes('/menu/:dishSlug/3d'), false, "Restaurant public 3D endpoint must stay retired after the homepage pivot.");
assert.equal(app.includes('/restaurant/:slug/menu/:dishSlug/3d'), false, "Restaurant frontend 3D route must stay retired after the homepage pivot.");
assert.ok(hero.includes("burger-layers") && hero.includes("EXPLORE LAYERS") && hero.includes("id=\"burger-hero\""), "The permanent signature exploded-food interaction must now live on the homepage.");
console.log("Phase 6 legacy 3D source preserved; Restaurant 3D delivery retired in favor of homepage signature hero.");
