import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "../..");
const projectRoot = path.resolve(backendRoot, "..");
const read = (relative) => fs.readFileSync(path.join(projectRoot, relative), "utf8");

const reviewModel = read("backend/src/models/Review.js");
const contactModel = read("backend/src/models/ContactMessage.js");
const notificationModel = read("backend/src/models/Notification.js");
const reviewService = read("backend/src/services/reviewService.js");
const contactService = read("backend/src/services/contactService.js");
const notificationService = read("backend/src/services/notificationService.js");
const restaurantRoutes = read("backend/src/routes/restaurantRoutes.js");
const customerRoutes = read("backend/src/routes/customerRoutes.js");
const restaurantAdminRoutes = read("backend/src/routes/restaurantAdminRoutes.js");
const platformAdminRoutes = read("backend/src/routes/platformAdminRoutes.js");
const contactRoutes = read("backend/src/routes/contactRoutes.js");
const security = read("backend/src/middleware/security.js");
const orderService = read("backend/src/services/orderService.js");
const reservationController = read("backend/src/controllers/restaurantOperationsController.js");
const app = read("frontend/src/App.jsx");
const customerNav = read("frontend/src/components/CustomerDashboardNav.jsx");
const restaurantAdminNav = read("frontend/src/components/RestaurantAdminSectionNav.jsx");
const restaurantDetail = read("frontend/src/pages/RestaurantDetailPage.jsx");
const contactPage = read("frontend/src/pages/ContactPage.jsx");

assert.match(reviewModel, /userId:\s*1, restaurantId:\s*1/, "One Customer review per Restaurant must be unique.");
for (const token of ["rating", "verifiedExperience", "eligibilitySource", "restaurantReply", "moderationReason"]) {
  assert.ok(reviewModel.includes(token), `Review model missing ${token}.`);
}
assert.match(reviewService, /status:\s*"completed"/);
assert.match(reviewService, /paymentStatus:\s*"paid"/);
assert.match(reviewService, /completed_reservation|completed_paid_order/);
assert.match(reviewService, /notifyRestaurantAdmins/);
assert.match(reviewService, /createNotification/);
assert.doesNotMatch(reviewService, /email:\s*review\.userId/i, "Public review output must not expose Customer email.");

for (const token of ["targetType", "senderName", "senderEmail", "subject", "body", "status", "expiresAt"]) {
  assert.ok(contactModel.includes(token), `ContactMessage missing ${token}.`);
}
assert.match(contactModel, /expireAfterSeconds:\s*0/);
assert.match(contactService, /targetType === "restaurant"/);
assert.match(contactService, /senderUserId:/);
assert.match(contactService, /notifyRestaurantAdmins/);
assert.match(contactService, /contact_reply/);
assert.match(contactService, /lookupPublicContactMessage/);
assert.match(contactService, /randomBytes\(6\)/);
assert.match(contactRoutes, /router\.post\("\/status", contactLimiter/);
assert.doesNotMatch(contactService, /console\.log\([^)]*senderEmail/i, "Contact PII must not be logged.");

assert.match(notificationModel, /recipientUserId/);
assert.match(notificationModel, /isRead/);
assert.match(notificationModel, /expireAfterSeconds:\s*60 \* 60 \* 24 \* 180/);
assert.match(notificationService, /safeHref/);
assert.match(notificationService, /recipientUserId:\s*userId/);

assert.ok(restaurantRoutes.includes('router.get("/:slug/reviews"'), "Public Restaurant reviews route missing.");
for (const token of [
  'router.get("/reviews/eligibility"',
  'router.get("/reviews"',
  'router.post("/reviews"',
  'router.patch("/reviews/:reviewId"',
  'router.delete("/reviews/:reviewId"',
  'router.post("/contact", contactLimiter',
  'router.get("/messages"',
  'router.get("/notifications"',
  'router.patch("/notifications/read-all"'
]) assert.ok(customerRoutes.includes(token), `Customer Phase 11 route missing: ${token}`);

for (const token of [
  'router.get("/reviews"',
  'router.patch("/reviews/:reviewId/reply"',
  'router.get("/messages"',
  'router.patch("/messages/:messageId"',
  'router.get("/notifications"'
]) assert.ok(restaurantAdminRoutes.includes(token), `Restaurant Admin Phase 11 route missing: ${token}`);
assert.match(restaurantAdminRoutes, /requireManagedRestaurant/);

for (const token of [
  'router.get("/reviews"',
  'router.patch("/reviews/:reviewId/moderate"',
  'router.get("/messages"',
  'router.patch("/messages/:messageId"'
]) assert.ok(platformAdminRoutes.includes(token), `Platform Admin Phase 11 route missing: ${token}`);

assert.match(security, /contactLimiter/);
assert.ok(security.includes('"/api/contact"'), "Contact responses should be no-store.");
assert.match(orderService, /type:\s*"order_status"/);
assert.match(reservationController, /type:\s*"reservation_status"/);

for (const route of [
  "/contact",
  "/dashboard/reviews",
  "/dashboard/messages",
  "/dashboard/notifications",
  "/restaurant-admin/reviews",
  "/restaurant-admin/messages",
  "/restaurant-admin/notifications",
  "/platform-admin/reviews",
  "/platform-admin/messages"
]) assert.ok(app.includes(route), `Frontend Phase 11 route missing: ${route}`);

assert.ok(customerNav.includes("Reviews") && customerNav.includes("Messages") && customerNav.includes("Notifications"), "Customer navigation must expose reviews/messages/notifications.");
assert.ok(restaurantAdminNav.includes("Reviews") && restaurantAdminNav.includes("Messages") && restaurantAdminNav.includes("Notifications"), "Restaurant Admin navigation must expose Phase 11 tools.");
assert.match(restaurantDetail, /RestaurantReviewsSection/);
assert.match(restaurantDetail, /Message Restaurant/);
assert.match(contactPage, /Do not include passwords, payment card data, government IDs/);

console.log("Phase 11 reviews + contact/messages + notifications smoke tests passed.");
