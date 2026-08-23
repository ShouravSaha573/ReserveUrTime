# ReserveUrTime — Phase 10 SSLCOMMERZ Payment Security Gate

Date: 2026-08-19
Phase 10 status: **IMPLEMENTED IN SOURCE — local Sandbox/IPN/build/dependency/Atlas validation still required.**

## Why this gate exists
Phase 9 intentionally stopped at `paymentStatus=unpaid`. Payment changes the trust boundary: browser redirects/callback bodies are not proof that money was received. SSLCOMMERZ documents three backend responsibilities: create a transaction session, receive IPN/payment notification, and validate the transaction/order/amount with its validation API.

## Locked Phase 10 architecture

```text
Customer owns Order
      ↓
Authenticated server initiation
      ↓
Server reads Order.total + currency from MongoDB
      ↓
PaymentAttempt / transaction ID created
      ↓
Server calls SSLCOMMERZ Sandbox
      ↓
Customer follows gateway URL
      ↓
SSLCOMMERZ IPN + customer return callback
      ↓
Dedicated backend gateway endpoint
      ↓
Server validates with SSLCOMMERZ Order Validation API
      ↓
Compare transaction ID + Order + amount + BDT currency + accepted gateway status
      ↓
Atomic/idempotent payment state transition
      ↓
Order.paymentStatus = paid only after verification
```

## Non-negotiable rules
1. SSLCOMMERZ Store ID/password exist **only in backend environment variables**. Never use `VITE_*` for gateway credentials.
2. Browser-supplied `total_amount`, currency or Customer identity is never authoritative. Read Order values from MongoDB.
3. Payment initiation requires authenticated Customer ownership of the Order and an allowed state. Initial design: `status=placed` and `paymentStatus=unpaid`.
4. Generate a unique server-side gateway transaction ID; add a unique/indexed PaymentAttempt record.
5. Do not mark an Order paid from success/fail/cancel redirect parameters alone.
6. IPN/callback validation must call SSLCOMMERZ validation and compare amount/currency/transaction/order values before committing payment.
7. Duplicate or replayed callbacks must be idempotent.
8. Payment + Order state update must be atomic/conditional so an old callback cannot overwrite a newer/refunded state.
9. Customer Order cancellation remains unavailable after payment becomes pending/paid.
10. Restaurant Admin cannot mark an Order paid/refunded and cannot edit gateway transaction values.
11. Paid cancellation/refund is a separate verified gateway workflow, not a normal order-status button.
12. Never log Store Password, card values, CVV, full gateway credential payloads or browser cookies. Audit redaction is already installed as a second line of defence.
13. Return URLs should carry only an opaque order/payment reference and display status obtained from the server; do not put sensitive gateway payloads in frontend URLs.
14. Payment-critical pages use minimal motion and retain clear loading/error/retry states.

## CSRF/IPN separation
Current browser mutations require `X-ReserveUrTime-Request: 1` and trusted Origin. SSLCOMMERZ IPN is server-to-server and will not carry that browser header.

**Do not globally disable `requireTrustedOrigin`.**

Phase 10 now uses narrow exact gateway callback/IPN routes excluded from the browser marker **only because callback hints are independently validated/reconciled with SSLCOMMERZ before any paid state is accepted**.

## Backend environment variables
Real/live credentials must never be committed. The local course package includes public documentation demo Sandbox values; replace them with assigned Sandbox credentials if required.

```env
SSLCOMMERZ_ENABLED=true
SSLCOMMERZ_STORE_ID=testbox
SSLCOMMERZ_STORE_PASSWORD=qwerty
SSLCOMMERZ_IS_LIVE=false
PAYMENT_CALLBACK_BASE_URL=http://localhost:5000
PAYMENT_CLIENT_RETURN_URL=http://localhost:5173/dashboard/orders
```

`SSLCOMMERZ_IS_LIVE=false` is mandatory during Phase 10 development.

## Implemented PaymentAttempt fields

```text
PaymentAttempt
- orderId
- userId
- restaurantId
- provider = sslcommerz
- environment = sandbox | live
- paymentKey (Customer idempotency)
- transactionId (unique)
- sessionKey / validationId / bankTransactionId (server-only by default)
- gatewayPageUrl (server-only by default; returned only to owning Customer initiation)
- amount
- currency = BDT
- status: creating | pending | verified_paid | risk_hold | failed | cancelled | expired | invalid | duplicate_paid
- gatewayStatus / riskLevel / riskTitle
- verifiedAt / lastNotificationAt / callbackCount / failureReason
- timestamps
```

Do not store card PAN/CVV or other cardholder secrets.

## Manual regression matrix required before claiming Phase 10 locally ready
- Customer register/login/logout/me.
- Platform Admin login + Restaurant management + Restaurant Admin management + Homepage CMS + listing approval.
- Restaurant Admin login + profile/menu/3D/tables/reservations/orders/gallery.
- Restaurant public discovery/search/detail/DOM menu/3D menu.
- Customer reservation availability/book/cancel.
- Customer favourites/profile.
- Customer cart add/update/remove/replace-Restaurant/clear.
- Customer order creation/idempotency/order history/cancel.
- Restaurant Admin order status transitions and cross-Restaurant denial.
- CSRF marker missing => mutation denied.
- Wrong Origin => mutation denied.
- stale/revoked JWT => denied.
- reduced-motion + 3D fallback remains functional.

## Production settings to decide during Phase 14, not hard-code now
- exact Vercel frontend origin(s);
- exact Render/custom backend origin;
- `TRUST_PROXY` matching deployment topology;
- fresh production JWT/audit/admin secrets;
- `COOKIE_SAME_SITE` based on actual frontend/backend site relationship;
- `MEDIA_ALLOWED_ORIGINS` exact CDN/domain list;
- HTTPS/TLS only.

## Local acceptance condition for Phase 10
The implementation exists; before claiming local/runtime readiness:
1. local `migrate:security` succeeds on the backed-up Atlas database;
2. `audit:data-security` issues are reviewed/fixed;
3. backend `test:security`, `test:flows`, `test:phase9`, `test:phase10` pass;
4. backend and frontend dependency audits have no unresolved high/critical issue accepted without documentation;
5. frontend Vite 8 production build succeeds;
6. manual Phase 0–10 critical flow regression succeeds;
7. successful + failed/cancelled + pending/reconcile Sandbox paths are tested;
8. full IPN behavior is tested using a publicly reachable HTTPS callback URL.


## Gate implementation result
Phase 10 follows the locked architecture:
- server-side Create Session;
- server-authoritative BDT Order total;
- backend-only credentials;
- dedicated PaymentAttempt;
- narrow callback routes;
- Validation/Transaction Query server-to-server reconciliation;
- amount/currency/transaction/reference verification;
- idempotent/atomic paid state;
- risk hold;
- no Restaurant Admin paid/refund override;
- no card-secret collection/storage.

See `PHASE_10_IMPLEMENTED.md` and `PAYMENT_SYSTEM.md`.
