import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "../..");
const projectRoot = path.resolve(backendRoot, "..");
const read = (relative) => fs.readFileSync(path.join(projectRoot, relative), "utf8");

const packageJson = JSON.parse(read("frontend/package.json"));
assert.ok(packageJson.dependencies?.motion, "Motion runtime dependency is missing.");
assert.ok(packageJson.dependencies?.gsap, "GSAP true-3D dependency must remain.");
assert.ok(packageJson.dependencies?.three, "Three.js true-3D dependency must remain.");

const chrome = read("frontend/src/components/motion/CinematicChrome.jsx");
for (const feature of ["useScroll", "useSpring", "useReducedMotion", "Skip to main content", "aria-live", "main-content"]) {
  assert.ok(chrome.includes(feature), `Cinematic chrome feature missing: ${feature}`);
}

const navbar = read("frontend/src/components/Navbar.jsx");
for (const feature of ["AnimatePresence", "aria-expanded", "aria-controls", "Mobile navigation", "document.body.style.overflow"]) {
  assert.ok(navbar.includes(feature), `Responsive navigation feature missing: ${feature}`);
}

const app = read("frontend/src/App.jsx");
assert.ok(app.includes("CinematicChrome"), "Cinematic chrome is not mounted.");
assert.ok(app.includes('id="main-content"'), "Focusable main-content target is missing.");

const card = read("frontend/src/components/RestaurantCard.jsx");
assert.ok(card.includes("useReducedMotion"), "Restaurant card reduced-motion support missing.");
assert.ok(card.includes("whileInView"), "Restaurant card viewport reveal missing.");
assert.ok(card.includes("restaurant-card-sheen"), "Restaurant card cinematic sheen missing.");

const css = read("frontend/src/index.css");
for (const feature of [
  ".skip-link",
  ".cinematic-scroll-progress",
  ".mobile-menu-toggle",
  ":focus-visible",
  "prefers-reduced-motion: reduce",
  "prefers-reduced-transparency: reduce",
  "min-height: 2.75rem",
  "rut-route-enter",
  "scroll-snap-type: x proximity"
]) {
  assert.ok(css.includes(feature), `Phase 12 CSS feature missing: ${feature}`);
}

const photoExplode = read("frontend/src/components/motion/PhotoExplodeDish.jsx");
assert.ok(photoExplode.includes("useReducedMotion"), "Photo Explode reduced-motion fallback regressed.");
const canvas = read("frontend/src/components/three/ExplodedDishCanvas.jsx");
assert.ok(canvas.includes("gsap"), "True-3D GSAP choreography regressed.");
assert.ok(canvas.includes("rotationOffset"), "Detailed true-3D rotation choreography regressed.");

console.log("Phase 12 cinematic UX + responsive/accessibility smoke tests passed.");
