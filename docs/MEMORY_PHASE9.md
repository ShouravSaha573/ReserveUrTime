# ReserveUrTime Memory — Phase 9

> **Superseded current-state note (2026-08-19):** Phase 10 SSLCOMMERZ Sandbox is now implemented in source. This file preserves the earlier Phase 9/pre-payment checkpoint; use `MEMORY_PHASE10.md` for current state.


Phase 9 is complete.

Canonical behavior:
- Customer cart is persisted server-side in `Cart` and requires Customer authentication.
- A cart may contain dishes from only one Restaurant at a time.
- Public normal and 3D menus expose `Add to cart`.
- Cross-Restaurant add requires explicit replacement confirmation.
- Server validates active Restaurant + active/available dish and recalculates all money.
- Order checkout uses unique `checkoutKey`, MongoDB transaction, immutable dish/Restaurant/Customer snapshots, and clears the cart atomically.
- Order status starts `placed`; paymentStatus starts `unpaid` because payment is Phase 10.
- Customer routes: `/dashboard/cart`, `/dashboard/orders`.
- Restaurant Admin route: `/restaurant-admin/orders`.
- Restaurant Admin is forced to `req.managedRestaurantId` and cannot change payment status.
- Status flow: placed -> confirmed -> preparing -> ready -> completed, with bounded cancellation paths.
- Customer can cancel only `placed + unpaid` orders.
- Paid cancellation is intentionally deferred to Phase 10 refund/payment rules.
- At the Phase 9 checkpoint, Phase 10 SSLCOMMERZ was next; it is now implemented.

## Pre-Phase 10 security addendum
After Phase 9, security/privacy hardening was applied without adding payment runtime code. Important Order changes: conditional atomic state transitions, per-Customer checkout-key uniqueness, Customer/Restaurant Admin response minimization, no-store API responses, and audit redaction. Global browser mutation security now requires trusted Origin + ReserveUrTime custom request marker. JWT authVersion revokes stale management sessions. Phase 10 must follow `PHASE10_PAYMENT_SECURITY_GATE.md` and validate SSLCOMMERZ IPN/transaction/amount/currency server-side before marking an Order paid.

