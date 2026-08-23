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
const security = read("backend/src/middleware/security.js");
const auth = read("backend/src/middleware/auth.js");
const user = read("backend/src/models/User.js");
const token = read("backend/src/utils/token.js");
const order = read("backend/src/services/orderService.js");
const audit = read("backend/src/services/auditService.js");
const media = read("backend/src/utils/mediaUrl.js");
const frontendApi = read("frontend/src/lib/api.js");

const paymentService = read("backend/src/services/paymentService.js");
const paymentRoutes = read("backend/src/routes/paymentRoutes.js");
const paymentConfig = read("backend/src/config/paymentConfig.js");
const frontendPkg = JSON.parse(read("frontend/package.json"));
const viteConfig = read("frontend/vite.config.js");

assert.match(app, /helmet/);
assert.match(app, /app\.disable\("x-powered-by"\)/);
assert.match(app, /getTrustProxySetting/);
assert.match(app, /noStoreSensitiveResponses/);
assert.match(security, /x-reserveurtime-request/i);
assert.match(frontendApi, /X-ReserveUrTime-Request/);
assert.match(paymentRoutes, /express\.urlencoded/);
assert.match(paymentConfig, /validationserverAPI\.php/);
assert.match(paymentService, /validateGatewayRecordAgainstAttempt/);
assert.doesNotMatch(paymentService, /cvv|cvc/i);


assert.match(user, /authVersion/);
assert.match(token, /ver:\s*Number\(user\.authVersion/);
assert.match(auth, /payload\.ver/);
assert.match(auth, /Session was revoked/);

assert.match(media, /MEDIA_ALLOWED_ORIGINS/);
assert.match(media, /url\.protocol !== "https:"/);
assert.doesNotMatch(audit, /ipAddress:\s*req\.ip/);
assert.match(audit, /createHmac/);
assert.match(audit, /SENSITIVE_AUDIT_KEY/);
assert.match(audit, /\[redacted\]/);

assert.doesNotMatch(order, /populate\("statusHistory\.changedBy",\s*"name email role"\)/);
assert.match(order, /findOneAndUpdate/);
assert.match(order, /The order changed while you were updating it/);

assert.equal(frontendPkg.devDependencies.vite, "8.2.1");
assert.equal(frontendPkg.devDependencies["@vitejs/plugin-react"], "6.0.5");
assert.match(viteConfig, /host:\s*"localhost"/);
assert.doesNotMatch(viteConfig, /host:\s*"0\.0\.0\.0"/);
assert.match(viteConfig, /target:\s*"http:\/\/localhost:5000"/);
assert.match(viteConfig, /strictPort:\s*true/);

const sourceFiles = [];
for (const base of ["backend/src", "frontend/src"]) {
  const stack = [path.join(projectRoot, base)];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(target);
      else if (/\.(js|jsx)$/.test(entry.name) && !target.includes(`${path.sep}tests${path.sep}`)) {
        sourceFiles.push(target);
      }
    }
  }
}

for (const file of sourceFiles) {
  const text = fs.readFileSync(file, "utf8");
  assert.doesNotMatch(text, /\beval\s*\(/, `eval() found in ${file}`);
  assert.doesNotMatch(text, /new\s+Function\s*\(/, `new Function() found in ${file}`);
  assert.doesNotMatch(text, /dangerouslySetInnerHTML/, `dangerouslySetInnerHTML found in ${file}`);
}

console.log("Security baseline smoke tests passed.");
