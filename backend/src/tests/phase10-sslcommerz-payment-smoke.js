import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "../..");
const projectRoot = path.resolve(backendRoot, "..");
const read = (relative) => fs.readFileSync(path.join(projectRoot, relative), "utf8");

function walkFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walkFiles(full) : [full];
  });
}

const paymentModel = read("backend/src/models/PaymentAttempt.js");
const orderModel = read("backend/src/models/Order.js");
const paymentService = read("backend/src/services/paymentService.js");
const paymentController = read("backend/src/controllers/paymentController.js");
const paymentRoutes = read("backend/src/routes/paymentRoutes.js");
const customerRoutes = read("backend/src/routes/customerRoutes.js");
const app = read("backend/src/app.js");
const security = read("backend/src/middleware/security.js");
const runtime = read("backend/src/config/runtimeSecurity.js");
const paymentConfig = read("backend/src/config/paymentConfig.js");
const envExample = read("backend/.env.example");
const cartPage = read("frontend/src/pages/CustomerCartPage.jsx");
const ordersPage = read("frontend/src/pages/CustomerOrdersPage.jsx");
const profilePage = read("frontend/src/pages/CustomerProfilePage.jsx");
const adminOrdersPage = read("frontend/src/pages/RestaurantAdminOrdersPage.jsx");
const seed = read("backend/src/seed/seed.js");

for (const token of ["transactionId", "paymentKey", "orderId", "amount", "currency", "validationId", "bankTransactionId", "riskLevel", "verifiedAt"]) {
  assert.ok(paymentModel.includes(token), `PaymentAttempt must persist ${token}.`);
}
assert.match(paymentModel, /userId:\s*1, paymentKey:\s*1/);
assert.match(paymentModel, /sessionKey:[\s\S]*?select:\s*false/);
assert.match(paymentModel, /validationId:[\s\S]*?select:\s*false/, "validationId must be server-only by default");
assert.match(paymentModel, /bankTransactionId:[\s\S]*?select:\s*false/);
assert.match(orderModel, /activePaymentAttemptId/);
assert.match(orderModel, /paymentTransactionId/);
assert.match(orderModel, /paidAt/);

for (const token of [
  "gwprocess/v4/api.php",
  "validationserverAPI.php",
  "merchantTransIDvalidationAPI.php",
  "total_amount",
  "currency",
  "tran_id",
  "ipn_url",
  "GatewayPageURL",
  "VALIDATED",
  "currency_amount",
  "risk_level",
  "withTransaction"
]) {
  assert.ok(paymentService.includes(token) || paymentConfig.includes(token), `Phase 10 gateway safety token missing: ${token}`);
}

assert.match(paymentService, /validateGatewayRecordAgainstAttempt/);
assert.match(paymentService, /sameMoney/);
assert.match(paymentService, /value_a/);
assert.match(paymentService, /value_b/);
assert.match(paymentService, /value_c/);
assert.match(paymentService, /duplicate_paid/);
assert.match(paymentService, /risk_hold/);
assert.match(paymentService, /prior risk hold is not treated as permanently terminal/i);
assert.doesNotMatch(paymentService, /card_no\s*[:=]/i, "ReserveUrTime must not persist or construct card number fields.");
assert.doesNotMatch(paymentService, /cvv|cvc/i, "ReserveUrTime must not collect CVV/CVC.");

for (const route of [
  '/sslcommerz/ipn',
  '/sslcommerz/success',
  '/sslcommerz/fail',
  '/sslcommerz/cancel'
]) assert.ok(paymentRoutes.includes(route), `Missing gateway callback route ${route}`);
assert.match(paymentRoutes, /express\.urlencoded/);
assert.match(paymentRoutes, /server-to-server validation|server-to-server reconciliation/i);
assert.ok(app.indexOf('app.use("/api/payments", paymentCallbackLimiter, paymentRoutes)') < app.indexOf('app.use(requireTrustedOrigin)'), "Gateway callbacks must be narrowly mounted before browser-origin enforcement.");
assert.ok(security.includes('"/api/payments"'), "Payment callbacks must receive no-store headers.");
assert.match(security, /paymentCallbackLimiter/);

for (const route of [
  'router.post("/orders/:orderId/payments/sslcommerz"',
  'router.get("/orders/:orderId/payments/sslcommerz"',
  'router.post("/orders/:orderId/payments/sslcommerz/reconcile"'
]) assert.ok(customerRoutes.includes(route), `Missing authenticated Customer payment route: ${route}`);
assert.match(customerRoutes, /router\.use\(authenticateUser, requireCustomer\)/);

assert.match(runtime, /validatePaymentRuntimeConfig/);
assert.match(paymentConfig, /securepay\.sslcommerz\.com/);
assert.match(paymentConfig, /sandbox\.sslcommerz\.com/);
assert.match(paymentConfig, /Production PAYMENT_CALLBACK_BASE_URL must use HTTPS/);
assert.match(paymentConfig, /PAYMENT_CLIENT_RETURN_URL must use an allowlisted frontend origin/);
assert.match(paymentConfig, /must be publicly reachable/);

for (const token of [
  "SSLCOMMERZ_ENABLED=true",
  "SSLCOMMERZ_IS_LIVE=false",
  "SSLCOMMERZ_STORE_ID=testbox",
  "PAYMENT_CALLBACK_BASE_URL=http://localhost:5000"
]) assert.ok(envExample.includes(token), `Missing Phase 10 env example: ${token}`);
assert.doesNotMatch(read("frontend/.env.example"), /SSLCOMMERZ_STORE_PASSWORD|store_passwd/i, "Gateway credentials must never be in frontend env.");
const frontendText = walkFiles(path.join(projectRoot, "frontend", "src"))
  .filter((file) => /\.(js|jsx|ts|tsx)$/.test(file))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
assert.doesNotMatch(frontendText, /SSLCOMMERZ_STORE_PASSWORD|store_passwd|\bqwerty\b|\btestbox\b/i, "frontend payment secret scan failed");


assert.match(cartPage, /Reserve Table/);
assert.match(cartPage, /gatewayUrl/);
assert.match(ordersPage, /Pay with SSLCOMMERZ/);
assert.match(ordersPage, /Check payment status/);
assert.match(ordersPage, /Browser redirects alone never mark an Order paid/);
assert.match(profilePage, /Billing contact for SSLCOMMERZ/);
assert.match(adminOrdersPage, /gateway-controlled and read-only/);
assert.match(adminOrdersPage, /paymentStatus === "paid"/);

assert.match(seed, /PaymentAttempt\.deleteMany/);

assert.match(paymentController, /processSslcommerzNotification/);
assert.doesNotMatch(paymentController, /req\.body.*paymentStatus/);

console.log("Phase 10 SSLCOMMERZ hosted payment + verification smoke tests passed.");
