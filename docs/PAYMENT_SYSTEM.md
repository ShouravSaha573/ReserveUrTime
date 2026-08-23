# ReserveUrTime Payment System

## Provider
Phase 10 implements **SSLCOMMERZ Hosted Checkout in Sandbox mode**.

Core rule: ReserveUrTime never accepts a browser redirect or callback body as proof of payment. Financial truth comes from SSLCOMMERZ server-to-server validation/query results matched against the stored Order and PaymentAttempt.

## Ownership
- Customer may start/reconcile payment only for an Order whose `userId` equals authenticated `req.user._id`.
- Restaurant Admin may only view payment state on Orders for `req.managedRestaurantId`.
- Restaurant Admin cannot set paid/refunded or edit gateway references.
- Platform Admin has no Restaurant operational payment override.

## Models
### Order
Payment-related fields:
- `paymentStatus`: `unpaid | pending | paid | failed | refunded`;
- `activePaymentAttemptId`;
- `paymentTransactionId`;
- `paidAt`.

### PaymentAttempt
Stores non-card payment metadata:
- provider/environment;
- Order/Customer/Restaurant references;
- Customer `paymentKey`;
- unique SSLCOMMERZ `transactionId`;
- expected amount/currency;
- state, gateway status and risk state;
- session/validation/bank references as server-only fields;
- callback count and timestamps.

Never store card PAN, CVV/CVC, PIN, gateway Store Password in a PaymentAttempt or Order.

## Initiation
1. Customer owns the Order.
2. Order is in an allowed operational/payment state.
3. Backend reads stored `Order.total` and `Order.currency`.
4. Backend checks BDT and configured amount bounds.
5. Customer has minimum phone/billing contact data.
6. Backend creates/claims one active PaymentAttempt.
7. Backend sends Create Session request to SSLCOMMERZ.
8. Only an HTTPS gateway URL on the configured SSLCOMMERZ host is returned to the frontend.

## Verification
For a success/IPN event:
- find PaymentAttempt by unique `tran_id`;
- call SSLCOMMERZ validation endpoint when a validation ID is available;
- otherwise reconcile through the transaction-query endpoint;
- require accepted gateway status;
- require `tran_id` match;
- require amount match to the PaymentAttempt/Order expected total;
- require BDT currency match;
- compare Order/Customer/PaymentAttempt references when returned;
- treat risk level 1 as a hold, not fulfilment approval;
- update PaymentAttempt + Order atomically/idempotently.

## Failure/cancel/timeout
A fail/cancel browser hint alone does not change financial truth. The backend queries SSLCOMMERZ first. If no gateway transaction exists after the configured grace behavior, the attempt can expire and the Order returns to a retryable unpaid state.

## Idempotency
Two levels exist:
- Customer-supplied opaque `paymentKey` is unique per Customer;
- SSLCOMMERZ `transactionId` is globally unique.

Replayed verified callbacks for the same transaction are harmless. A different successful transaction for an already-paid Order is recorded as `duplicate_paid` for investigation rather than overwriting the original paid transaction.

## Security boundary
Gateway callbacks use a dedicated high-ceiling callback rate limiter separate from the normal API limiter.

Browser mutation routes retain trusted-Origin + `X-ReserveUrTime-Request` protection. Only the four exact gateway callback routes are mounted outside that browser marker, and they are safe only because all financial changes are independently reconciled with SSLCOMMERZ.

## Production requirements
- HTTPS frontend and callback URLs;
- publicly reachable callback backend;
- real SSLCOMMERZ credentials in backend environment only;
- `SSLCOMMERZ_IS_LIVE=true` only after Sandbox acceptance;
- replace development JWT/admin/audit secrets;
- deliberate `TRUST_PROXY` configuration;
- no card/gateway-secret logging;
- dependency audit and production build;
- Sandbox test matrix before live credentials.

## Refund rule
Refund is not a manual state mutation. A paid refund/cancellation feature must be a dedicated gateway-backed flow that initiates/queries the SSLCOMMERZ refund API and only then updates `Order.paymentStatus=refunded`.
