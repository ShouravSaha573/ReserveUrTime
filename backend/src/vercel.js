import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { validateRuntimeSecurityConfig } from "./config/runtimeSecurity.js";

let startup;

function initialize() {
  if (!startup) {
    startup = Promise.resolve()
      .then(() => validateRuntimeSecurityConfig())
      .then(() => connectDB());
  }
  return startup;
}

export default async function handler(request, response) {
  await initialize();
  return app(request, response);
}
