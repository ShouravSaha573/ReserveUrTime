import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "../..");
const projectRoot = path.resolve(backendRoot, "..");

const backend = JSON.parse(fs.readFileSync(path.join(backendRoot, "package.json"), "utf8"));
const frontend = JSON.parse(fs.readFileSync(path.join(projectRoot, "frontend", "package.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(backend.dependencies.express === "4.22.2", "Express 4 security patch baseline missing.");
assert(backend.dependencies.mongoose === "8.22.1", "Mongoose 8.22.1 security patch baseline missing.");
assert(backend.dependencies.multer === "2.2.0", "Multer 2.2.0 baseline missing.");
assert(backend.overrides?.["path-to-regexp"] === "0.1.13", "path-to-regexp 0.1.13 override missing.");

assert(frontend.dependencies.react === "19.2.8", "React 19.2.8 baseline missing.");
assert(frontend.dependencies["react-dom"] === "19.2.8", "ReactDOM 19.2.8 baseline missing.");
assert(frontend.dependencies["@react-three/fiber"] === "9.7.0", "R3F 9.7.0 baseline missing.");
assert(frontend.dependencies["@react-three/drei"] === "10.7.8", "Drei 10.7.8 baseline missing.");
assert(frontend.dependencies.three === "0.185.1", "Three.js r185 baseline missing.");
assert(frontend.dependencies.motion === "13.1.0", "Motion 13.1.0 baseline missing.");
assert(frontend.dependencies["react-router-dom"] === "7.18.2", "React Router 7.18.2 baseline missing.");
assert(frontend.devDependencies.tailwindcss === "3.4.19", "Tailwind 3.4.19 baseline missing.");
assert(frontend.devDependencies.postcss === "8.5.26", "PostCSS 8.5.26 baseline missing.");
assert(frontend.devDependencies.autoprefixer === "10.5.4", "Autoprefixer 10.5.4 baseline missing.");
assert(frontend.overrides?.sucrase === "3.35.1", "Sucrase 3.35.1 remediation override missing.");
assert(frontend.overrides?.glob === "10.5.0", "glob 10.5.0 remediation override missing.");

const uploadController = fs.readFileSync(
  path.join(backendRoot, "src/controllers/photoExplodeController.js"),
  "utf8"
);
assert(uploadController.includes("fieldNestingDepth: 1"), "Multer field nesting limit missing.");

const publicService = fs.readFileSync(
  path.join(backendRoot, "src/services/publicRestaurantExperienceService.js"),
  "utf8"
);
assert(!publicService.includes('.populate("categoryId"'), "Public menu still uses unsafe category populate.");
assert(publicService.includes("attachSafeCategory"), "Safe category join missing.");
assert(publicService.includes("Restaurant.collection.findOne"), "Public Restaurant read is not using the raw cast-safe boundary.");
assert(publicService.includes("MenuCategory.collection"), "Public category read is not using the raw cast-safe boundary.");
assert(publicService.includes("buildPhase7RuntimeAsset"), "Canonical 3D runtime fallback is missing.");

console.log("Dependency + 3D runtime security baseline smoke tests passed.");
