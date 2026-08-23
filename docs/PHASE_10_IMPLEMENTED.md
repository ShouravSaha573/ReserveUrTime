# ReserveUrTime — Phase 10 Implemented

Date: 2026-08-19
Status: **DONE in source — SSLCOMMERZ Sandbox hosted payment**

## Scope completed
Phase 10 connects the Phase 9 Order model to SSLCOMMERZ Hosted Checkout while preserving the pre-Phase-10 security gate.

Implemented:
- Customer-owned payment initiation for an existing Order;
- server-authoritative `Order.total` and `currency=BDT`;
- dedicated `PaymentAttempt` model;
- unique server-generated SSLCOMMERZ `tran_id` (max 30 characters);
- unique Customer `paymentKey` idempotency;
- backend-only SSLCOMMERZ credentials;
- server-side SSLCOMMERZ Create Session request;
- verified HTTPS gateway redirect host;
- success/fail/cancel callback endpoints;
- IPN endpoint;
- dedicated high-ceiling callback rate limiter separated from the normal browser API budget;
- server-to-server Order Validation API verification;
- server-to-server transaction-query reconciliation;
- transaction/order/Customer/PaymentAttempt/amount/currency checks;
- duplicate/replayed callback idempotency;
- MongoDB transaction for verified payment + Order state update;
- risk-level hold state;
- Customer payment retry/reconciliation UI;
- Restaurant Admin read-only payment state and paid-only fulfilment;
- Customer billing contact fields needed for hosted checkout;
- no PAN/CVV/card-secret storage or collection;
- development `SEED_RESET=true` cleanup extended to PaymentAttempt.

## Trust model
```text
Customer browser
      ↓ authenticated Customer API
Backend reads stored Order
      ↓
PaymentAttempt + unique tran_id
      ↓ server-to-server
SSLCOMMERZ Create Session
      ↓
Hosted GatewayPageURL
      ↓
Customer pays on gateway
      ↓
SSLCOMMERZ IPN / browser callback
      ↓
ReserveUrTime does NOT trust callback body as payment proof
      ↓ server-to-server validation/query
SSLCOMMERZ
      ↓
Compare transaction + Order + amount + BDT + references + status
      ↓
MongoDB transaction
      ↓
PaymentAttempt = verified_paid
Order.paymentStatus = paid
```

## Public gateway callbacks
Mounted before browser-origin mutation protection because SSLCOMMERZ is a server-to-server/browser-return trust boundary:

```text
POST /api/payments/sslcommerz/ipn
POST /api/payments/sslcommerz/success
POST /api/payments/sslcommerz/fail
POST /api/payments/sslcommerz/cancel
```

These routes accept a bounded URL-encoded payload. **Their body alone cannot set an Order to paid.** Payment state changes only after a server-side SSLCOMMERZ validation/query.

## Authenticated Customer payment APIs
All are under `authenticateUser + requireCustomer`:

```text
POST /api/customer/orders/:orderId/payments/sslcommerz
GET  /api/customer/orders/:orderId/payments/sslcommerz
POST /api/customer/orders/:orderId/payments/sslcommerz/reconcile
```

The backend always derives Customer ownership from `req.user._id`.

## PaymentAttempt states
```text
creating
pending
verified_paid
risk_hold
failed
cancelled
expired
invalid
duplicate_paid
```

`risk_hold` keeps the Order in `paymentStatus=pending`; a later explicit reconciliation re-queries the gateway so a later non-risk verified record can release the hold.

## Order changes
Phase 10 adds:
- `activePaymentAttemptId`;
- `paymentTransactionId`;
- `paidAt`.

Order payment states remain:
```text
unpaid | pending | paid | failed | refunded
```

Restaurant fulfilment is now payment-gated:
```text
placed + paid -> Restaurant Admin may Confirm
confirmed + paid -> Preparing
preparing + paid -> Ready
ready + paid -> Completed
```

Restaurant Admin cannot manually set `paymentStatus`, transaction IDs or refund state.

## Customer payment UX
`/dashboard/cart` now creates the Order and starts hosted checkout.

`/dashboard/orders` supports:
- Pay with SSLCOMMERZ for unpaid/failed eligible Orders;
- Check payment status for pending Orders;
- clear verified/failed/review/pending return-state messages;
- Customer cancellation only while `placed` and `unpaid|failed`.

Customer Profile now holds the minimum billing contact fields used for payment-session creation. Login email remains read-only.

## Environment
Backend only:
```env
SSLCOMMERZ_ENABLED=true
SSLCOMMERZ_IS_LIVE=false
SSLCOMMERZ_STORE_ID=testbox
SSLCOMMERZ_STORE_PASSWORD=qwerty
PAYMENT_CALLBACK_BASE_URL=http://localhost:5000
PAYMENT_CLIENT_RETURN_URL=http://localhost:5173/dashboard/orders
```

The included `testbox/qwerty` values are public documentation demo values. If SSLCOMMERZ issues different Sandbox credentials for the project, replace them in `backend/.env` only.

No SSLCOMMERZ secret exists in `frontend/.env` or any `VITE_*` variable.

## Local callback note
A browser can return to localhost, but SSLCOMMERZ servers cannot deliver a real IPN to a private localhost URL. Full IPN testing therefore requires a publicly reachable HTTPS backend/tunnel and a matching `PAYMENT_CALLBACK_BASE_URL`.

## Local validation commands
```powershell
cd backend
npm install
npm run migrate:security
npm run test:security
npm run test:flows
npm run test:phase9
npm run test:phase10
npm run diagnose:phase10
npm run audit:deps
```

Frontend:
```powershell
cd frontend
npm install
npm run build
npm audit --audit-level=high
npm run dev
```

The artifact environment passed source/smoke/parser validation, but a dependency-backed Vite build and live SSLCOMMERZ/Atlas end-to-end cannot be claimed until run locally.

## Deliberately not implemented as a normal button
Paid-order cancellation/refund is **not** implemented as a Restaurant Admin state override. A future refund workflow must call and verify the gateway refund API and update payment state from gateway truth.

## Next phase
**Phase 11 — Reviews + Contact/Messages + Notifications.**
