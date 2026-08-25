import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, "..", "..");
const projectRoot = path.resolve(backendRoot, "..");
const readBackend = (relative) => fs.readFileSync(path.join(backendRoot, relative), "utf8");
const readFrontend = (relative) => fs.readFileSync(path.join(projectRoot, "frontend", relative), "utf8");

const cartModel = readBackend("src/models/Cart.js");
const orderModel = readBackend("src/models/Order.js");
const orderService = readBackend("src/services/orderService.js");
const customerRoutes = readBackend("src/routes/customerRoutes.js");
const adminRoutes = readBackend("src/routes/restaurantAdminRoutes.js");
const customerController = readBackend("src/controllers/customerOrderController.js");
const adminController = readBackend("src/controllers/restaurantOrderController.js");
const app = readFrontend("src/App.jsx");
const cartContext = readFrontend("src/context/CartContext.jsx");
const cartPage = readFrontend("src/pages/CustomerCartPage.jsx");
const ordersPage = readFrontend("src/pages/CustomerOrdersPage.jsx");
const adminOrdersPage = readFrontend("src/pages/RestaurantAdminOrdersPage.jsx");
const menuItem = readFrontend("src/components/public/PublicMenuItem.jsx");
const threeDMenu = readFrontend("src/pages/Restaurant3DMenuPage.jsx");

assert.ok(cartModel.includes("userId") && cartModel.includes("restaurantId") && cartModel.includes("quantity"), "Cart must be customer-owned, Restaurant-scoped, and quantity-aware.");
assert.ok(orderModel.includes("checkoutKey") && orderModel.includes("orderNumber"), "Order must support idempotent checkout and a public reference.");
assert.ok(orderModel.includes("customerSnapshot") && orderModel.includes("restaurantSnapshot") && orderModel.includes("unitPrice") && orderModel.includes("lineTotal"), "Orders must contain immutable customer/Restaurant/item snapshots.");
assert.ok(orderModel.includes('enum: ["unpaid", "pending", "paid", "failed", "refunded"]'), "Order schema must be ready for Phase 10 payment status without implementing the gateway now.");

for (const token of [
  'router.get("/cart"',
  'router.post("/cart/items"',
  'router.patch("/cart/items/:menuItemId"',
  'router.delete("/cart/items/:menuItemId"',
  'router.delete("/cart"',
  'router.get("/orders"',
  'router.post("/orders"',
  'router.patch("/orders/:orderId/cancel"'
]) assert.ok(customerRoutes.includes(token), `Missing Customer cart/order route: ${token}`);

assert.ok(customerRoutes.includes("authenticateUser") && customerRoutes.includes("requireCustomer"), "Customer cart/orders must be authenticated Customer-only APIs.");
assert.ok(adminRoutes.includes('router.get("/orders"') && adminRoutes.includes('router.patch("/orders/:orderId/status"'), "Restaurant Admin order routes are required.");
assert.ok(adminRoutes.includes("requireManagedRestaurant"), "Restaurant Admin order APIs must inherit managed Restaurant scoping.");
assert.ok(customerController.includes("placeCustomerOrder") && adminController.includes("updateRestaurantOrderStatus"), "Controllers must delegate order mechanics to the service layer.");

for (const token of ["restaurantId: cart.restaurantId", "isActive: true", "isAvailable: true", "unitPrice", "subtotal", "withTransaction", "checkoutKey"]) {
  assert.ok(orderService.includes(token), `Order service must enforce server-side cart/order integrity: ${token}`);
}
assert.ok(orderService.includes("Your cart already contains dishes from another Restaurant"), "Cross-Restaurant cart mixing must be explicitly rejected.");
assert.ok(orderService.includes('restaurantId,\n  orderId') || orderService.includes("restaurantId,"), "Restaurant Admin order writes must be Restaurant-scoped.");
assert.ok(orderService.includes("verified refund workflow") || orderService.includes("payment is verified"), "Paid-order cancellation/fulfilment must remain payment-safe after Phase 10.");

for (const route of ["/dashboard/cart", "/dashboard/orders", "/restaurant-admin/orders"]) {
  assert.ok(app.includes(route), `Missing Phase 9 frontend route: ${route}`);
}
assert.ok(cartContext.includes("replaceExistingRestaurant") && cartContext.includes("itemCount"), "Cart context must support one-Restaurant replacement and badge counts.");
assert.ok(cartPage.includes("checkoutKey") && cartPage.includes("SSLCOMMERZ"), "Cart checkout must preserve the Phase 9 idempotent Order key while Phase 10 adds payment.");
assert.ok(ordersPage.includes("Cancel order") && ordersPage.includes("paymentStatus"), "Customer order history must expose safe pre-confirmation cancellation and payment state.");
for (const token of ["Awaiting payment", "Paid / booked", "Cancelled", "Cancel unpaid order", "Payment: {order.paymentStatus}"]) {
  assert.ok(adminOrdersPage.includes(token), `Restaurant Admin payment-driven order view missing: ${token}`);
}
for (const removedAction of ["Start preparing", "Mark ready", "Complete", "Confirm paid order"]) {
  assert.ok(!adminOrdersPage.includes(removedAction), `Removed fulfilment action is still exposed: ${removedAction}`);
}
for (const source of [menuItem, threeDMenu]) {
  assert.ok(source.includes("AddToCartButton"), "Both DOM and 3D menus must support adding dishes to cart.");
}

console.log("Phase 9 cart + orders + Restaurant Admin order management smoke tests passed.");
