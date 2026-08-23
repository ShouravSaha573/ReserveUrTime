# ReserveUrTime — Memory after Phase 10

- Phase 0–10 are complete in source.
- Phase 10 provider: SSLCOMMERZ Hosted Checkout, Sandbox by default.
- Payment credentials are backend-only; no `VITE_*` payment secret.
- `PaymentAttempt` is the gateway transaction model; Order keeps only payment linkage/status fields.
- Customer payment APIs are under `/api/customer/orders/:orderId/payments/sslcommerz*` and require authenticated Customer ownership.
- Public gateway callbacks are only `/api/payments/sslcommerz/{ipn,success,fail,cancel}`.
- Callback bodies/browser redirects never prove payment; backend validates/queries SSLCOMMERZ and checks transaction, amount, BDT currency and stored references before paid.
- Verified payment + Order paid update is atomic/idempotent; duplicate successful transaction becomes `duplicate_paid`.
- `risk_level=1` => `risk_hold`; Restaurant fulfilment remains blocked. Customer reconciliation can re-query later.
- Restaurant Admin can read payment status but cannot mark paid/refunded or edit gateway values; fulfilment transitions require `paymentStatus=paid`.
- Customer cancellation is allowed only while Order is `placed` and payment is `unpaid|failed`.
- Customer Profile includes bounded billing contact fields used for session initiation; ReserveUrTime never collects/stores PAN/CVV.
- Local demo env includes SSLCOMMERZ `testbox/qwerty` documentation values; replace with assigned Sandbox credentials if needed. `MONGODB_URI` remains the only intentionally blank/personal local value.
- Full IPN testing needs public HTTPS `PAYMENT_CALLBACK_BASE_URL`; localhost is not reachable by gateway servers.
- Local security migration/dependency audit/Vite build/live Sandbox flow still must be run in the user's Windows/Node 26.7.0 environment.
- Phase 11 has since been completed. Phase 12 is NEXT: Cinematic UI/UX polish + responsive/accessibility refinement.
