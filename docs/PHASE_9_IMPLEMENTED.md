# Phase 9 Implemented — Cart + Orders + Restaurant Admin Order Management

Date: 2026-08-19

## Scope completed
Phase 9 adds a server-backed Customer cart, immutable order snapshots, Customer order history/cancellation, and Restaurant-scoped Restaurant Admin order operations. No payment gateway is implemented in this phase; online payment remains Phase 10.

## Customer cart
- Authenticated Customer-only cart under `/api/customer/cart`.
- One active Restaurant per cart.
- Available/active menu items only.
- Quantity 1–20.
- Backend recalculates unit price, line totals and subtotal from current `MenuItem.price`.
- Cross-Restaurant add returns a conflict unless the Customer explicitly confirms cart replacement.
- Cart automatically drops menu items that are no longer active/available.

## Order creation
- `POST /api/customer/orders` converts the current cart into an Order.
- MongoDB transaction creates the Order and clears the cart atomically.
- `checkoutKey` is unique/idempotent so repeated checkout submissions do not intentionally create duplicate orders.
- Order stores immutable snapshots: Restaurant, Customer, dish name/slug/image, unit price, quantity and line total.
- Initial status: `placed`.
- Initial payment status: `unpaid` because SSLCOMMERZ is Phase 10.

## Customer order operations
Routes:
- `/dashboard/cart`
- `/dashboard/orders`

Customer can:
- update quantity;
- remove items;
- clear cart;
- add optional order note;
- place order;
- view order history/status/payment state;
- cancel only a still-`placed`, `unpaid` order.

## Restaurant Admin order operations
Route:
- `/restaurant-admin/orders`

Restaurant Admin sees only `req.managedRestaurantId` orders and may apply:

```text
placed -> confirmed | cancelled
confirmed -> preparing | cancelled
preparing -> ready | cancelled
ready -> completed
completed -> terminal
cancelled -> terminal
```

Restaurant Admin cannot change payment status. Paid-order cancellation is blocked from this Phase 9 status flow so Phase 10 can enforce refund/payment rules.

## Public menu integration
Both the ordinary DOM menu and the full Phase 7 3D menu expose Customer `Add to cart` controls.

## New backend files
- `src/models/Cart.js`
- `src/models/Order.js`
- `src/services/orderService.js`
- `src/controllers/customerOrderController.js`
- `src/controllers/restaurantOrderController.js`
- `src/tests/phase9-cart-orders-smoke.js`

## New frontend files
- `src/context/CartContext.jsx`
- `src/components/AddToCartButton.jsx`
- `src/pages/CustomerCartPage.jsx`
- `src/pages/CustomerOrdersPage.jsx`
- `src/pages/RestaurantAdminOrdersPage.jsx`

## New APIs
Customer:
- `GET /api/customer/cart`
- `POST /api/customer/cart/items`
- `PATCH /api/customer/cart/items/:menuItemId`
- `DELETE /api/customer/cart/items/:menuItemId`
- `DELETE /api/customer/cart`
- `GET /api/customer/orders`
- `POST /api/customer/orders`
- `PATCH /api/customer/orders/:orderId/cancel`

Restaurant Admin:
- `GET /api/restaurant-admin/orders`
- `PATCH /api/restaurant-admin/orders/:orderId/status`

## Validation
- server-side Restaurant ownership;
- active Restaurant/menu-item validation;
- quantity bounds;
- note length bound;
- server-calculated monetary totals;
- immutable item snapshots;
- one-Restaurant cart rule;
- idempotent checkout key;
- transaction-based order-create/cart-clear;
- explicit order status transition graph;
- payment status read-only for Restaurant Admin in Phase 9.

## Next
Phase 10 — SSLCOMMERZ Sandbox payment integration.

## Security hardening performed after Phase 9
Before starting payment, Phase 9 was hardened rather than immediately adding Phase 10. The Order service now uses conditional atomic cancel/status writes, Customer/Restaurant Admin response minimization, and per-Customer checkout idempotency uniqueness. Sensitive Order API responses use no-store headers. Restaurant Admin still cannot set payment truth.

The one-time security migration converts an older global checkout-key index to `{userId, checkoutKey}`. Run it only after backing up Atlas. See `PRE_PHASE10_SECURITY_AUDIT.md`.

At the pre-Phase-10 security checkpoint, Phase 10 was intentionally unimplemented. It is now implemented in source; local security/build/dependency/Sandbox validation still must pass before runtime/deployment acceptance.

## Phase 10 follow-up
The `paymentStatus` placeholder created in Phase 9 is now connected to verified SSLCOMMERZ Hosted Checkout through a dedicated `PaymentAttempt` model. See `PHASE_10_IMPLEMENTED.md` and `PAYMENT_SYSTEM.md`. Phase 9 cart/order ownership, pricing, snapshots and checkout idempotency rules remain preserved.
