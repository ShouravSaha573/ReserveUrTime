import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const vite = read("frontend/vite.config.js");
const api = read("frontend/src/lib/api.js");
const home = read("frontend/src/pages/HomePage.jsx");
const runtime = read("backend/src/config/runtimeSecurity.js");

const checks = [
  [vite.includes('host: "localhost"'), "Vite dev host is localhost"],
  [vite.includes('target: "http://localhost:5000"'), "Vite /api proxy targets localhost:5000"],
  [api.includes('import.meta.env.VITE_API_URL || "/api"'), "frontend API defaults to same-origin /api"],
  [home.includes("Restaurants could not be loaded."), "homepage exposes backend loading failure instead of pretending the list is empty"],
  [home.includes("Retry Restaurants"), "homepage Restaurant retry control exists"],
  [runtime.includes('url.hostname === "localhost"'), "development localhost loopback alias is handled"],
  [runtime.includes('url.hostname === "127.0.0.1"'), "development 127.0.0.1 loopback alias is handled"]
];

const failed = checks.filter(([ok]) => !ok);
if (failed.length) {
  for (const [, label] of failed) console.error(`FAIL: ${label}`);
  process.exit(1);
}

for (const [, label] of checks) console.log(`PASS: ${label}`);
console.log("Localhost + Restaurant runtime smoke tests passed.");
