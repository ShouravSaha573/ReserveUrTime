# ReserveUrTime Memory — Pre-Phase 10 Security Gate

> **Superseded current-state note (2026-08-19):** Phase 10 SSLCOMMERZ Sandbox is now implemented in source. This file preserves the earlier Phase 9/pre-payment checkpoint; use `MEMORY_PHASE10.md` for current state.


Date: 2026-08-19

At this historical checkpoint, Phase 9 was the latest functional phase and Phase 10 payment was not yet implemented. Current state is in `MEMORY_PHASE10.md`.

Security/privacy hardening now includes trusted-origin + mutation-marker protection, environment-controlled proxy trust, production secret/HTTPS startup validation, JWT authVersion revocation, password byte bounds, allowlisted media origins, public-profile privacy labeling, Order PII minimization, keyed/retained/redacted audit logs, minimized production errors, concurrency-safe Order/Reservation transitions, same-Customer same-slot reservation prevention, Customer+checkoutKey idempotency, Vite 8 localhost dev tooling, strict booleans, full Phase8/9 seed reset, no-store sensitive APIs and explicit X-Powered-By disable.

New commands: `test:security`, `test:flows`, `migrate:security`, `audit:data-security`, `audit:deps`.

Before Phase 10, locally back up Atlas, run migration/data audit, dependency audits, Vite 8 production build and critical manual regressions.

Phase 10 rules: SSLCOMMERZ credentials backend-only; server reads Order total/currency; create unique PaymentAttempt/transaction; session initiation server-side; validate IPN/callback with SSLCOMMERZ and match transaction/order/amount/currency before paid; callback replay idempotent; atomic payment state; Restaurant Admin cannot set paid/refund; no PAN/CVV/store-password logging/storage.
