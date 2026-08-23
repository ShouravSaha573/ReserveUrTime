# ReserveUrTime — Pre-Phase 10 Security & Privacy Audit

Date: 2026-08-19
Status: **Security hardening code complete; local dependency/build + live Atlas migration/data audit remain required before Phase 10 coding.**

## Scope
This audit reviewed the Phase 9 source tree before adding payment code. The review covered frontend/backend separation, route/RBAC boundaries, authentication cookies/JWT lifecycle, CSRF/cross-origin mutations, MongoDB query/input handling, Restaurant scoping, cart/order/reservation concurrency, 3D editor input safety, privacy/logging, external media URLs, dependency versions, deployment headers, seed/reset behavior, and Phase 10 payment trust boundaries.

This artifact does not contain the user's MongoDB Atlas URI and therefore did not execute live database migrations or end-to-end requests against the user's Atlas data. Dependency installation also could not complete in the sandbox network, so the final transitive `npm audit` and Vite production build are local gates.

## Confirmed findings fixed

### 1. Browser mutation/CSRF hardening gap — fixed
Before this audit, an unsafe request without an `Origin` could pass the origin middleware. CORS is not authorization, so state-changing browser APIs now require both:
- exact trusted Origin when one is present;
- `X-ReserveUrTime-Request: 1` on POST/PUT/PATCH/DELETE.

The frontend API helper adds that header automatically. In production, originless browser mutations are rejected.

**Phase 10 rule:** SSLCOMMERZ IPN/callback traffic will not be treated as browser traffic. Do not weaken the global browser-CSRF middleware. Mount a dedicated gateway callback route with SSLCOMMERZ validation instead.

### 2. Proxy trust was unconditional — fixed
`trust proxy` is no longer hard-coded to `1`. It is controlled by `TRUST_PROXY`; local development defaults to `false`. Production must set the value deliberately to match the hosting proxy topology.

### 3. Production could start with development secrets/defaults — fixed
Startup validation now rejects production use of:
- development JWT secret;
- development Platform Admin password;
- development Restaurant Admin password;
- missing/weak development audit hashing secret;
- non-HTTPS frontend origins.

Production auth cookie is renamed to `__Host-reserveurtime_session`, is HttpOnly, Secure, and uses the configured SameSite policy.

### 4. Admin/session revocation after credential or assignment changes — fixed
`User.authVersion` is embedded into JWTs. Password changes, active-state changes, Restaurant reassignment, and explicit credential synchronization increment the version. Old sessions are rejected and must sign in again.

### 5. bcrypt long-password ambiguity — fixed
Passwords are restricted to at most 72 UTF-8 bytes and new passwords require at least 10 characters with a letter and number. Login rejects overlong values generically.

### 6. Arbitrary public media URL privacy/tracking risk — fixed for new writes
Restaurant/gallery/dish/listing/homepage media writes now accept:
- safe site-relative paths; or
- HTTPS origins explicitly listed in `MEDIA_ALLOWED_ORIGINS`.

This prevents a Restaurant Admin from silently publishing an arbitrary tracking-pixel origin by default. A database audit command reports legacy values that pre-date this rule.

### 7. Restaurant profile privacy ambiguity — fixed
Fields historically named `internalPhone`, `internalEmail` and `internalOpeningHours` are public Restaurant-profile fields in the existing schema. The Restaurant Admin UI now labels them **Public contact/opening hours** and warns not to enter staff-only/private information.

### 8. Order response leaked unnecessary actor/customer data — fixed
Order status history no longer populates actor email/name for Customer responses. Restaurant Admin order responses expose only the Customer name/phone needed for Restaurant fulfilment, not the Customer login email. Internal user IDs are removed from public Customer/Restaurant Admin order payloads.

### 9. Raw audit IP retention — fixed
New audit events store only a keyed privacy-preserving network hash, not the raw IP. Audit logs have configurable retention (default 90 days) through a TTL timestamp. Platform Admin audit-list responses exclude both legacy raw IP and IP hashes.

Audit changes are recursively sanitized so password/token/secret/credential/card/CVV-like keys are redacted before storage. This is especially important before payment integration.

### 10. Production error-log PII risk — fixed
Production request errors log only coarse metadata (error category/code, method, path), not request bodies, full exception messages, credentials or customer payloads. Client 500 responses are generic.

### 11. Order status race — fixed
Customer cancellation and Restaurant Admin status transitions now use conditional atomic updates. A stale concurrent update receives `409` rather than overwriting a newer order/payment state.

### 12. Reservation status race — fixed
Customer and Restaurant Admin reservation cancellation/status changes use conditional atomic updates and return `409` on concurrent state change.

### 13. Same-Customer slot exhaustion — fixed
A Customer can no longer hold multiple active tables for the same Restaurant/date/time. `customerSlotKey` plus a pre-check covers existing data and the unique key protects the true race.

### 14. Checkout idempotency index mismatch — fixed
`checkoutKey` is now unique per Customer (`userId + checkoutKey`), matching the service logic. A migration safely replaces the old global checkout-key index.

### 15. Vulnerable/outdated Vite 5.4.14 — fixed in package/config
Frontend tooling is updated to Vite `8.2.1` + `@vitejs/plugin-react` `6.0.5`; the dev/preview server binds to `127.0.0.1`, uses strict ports and strict filesystem rules. The user's Node 26.7.0 satisfies the configured Vite 8 Node engine floor.

A local `npm install && npm run build` is still mandatory because the sandbox could not download the new dependency graph.

### 16. Weak boolean coercion — fixed
Sensitive active/featured/published/availability/3D enabled states now require real JSON booleans. Strings such as `"false"` can no longer become truthy through `Boolean("false")`.

### 17. `SEED_RESET=true` left new Phase 8/9 records behind — fixed
The reset path now also clears Favorites, Carts and Orders, preventing stale/dangling user/order data after an intentional development reset.

### 18. Order-note privacy wording — fixed
The UI no longer prompts specifically for allergy/health information. It explains that the note is shared with the Restaurant and should not contain passwords, card details, government IDs or unrelated sensitive information.

### 19. Sensitive browser API responses could be cached — fixed
Auth, Customer, Reservation, Platform Admin and Restaurant Admin API responses use `Cache-Control: no-store, private` and `Pragma: no-cache`.

### 20. Server fingerprinting — hardened
`X-Powered-By` is explicitly disabled in addition to Helmet.

## Existing controls verified
- Helmet is active.
- CORS uses exact configured frontend origins with credentials.
- JSON body size is limited.
- API/auth rate limits exist.
- Mongoose `sanitizeFilter` is enabled.
- Auth uses HttpOnly cookies; frontend does not store JWTs in localStorage.
- Authentication reloads the current active User from MongoDB.
- Customer, Platform Admin and Restaurant Admin routes have role guards.
- Restaurant Admin operations derive Restaurant scope from `req.managedRestaurantId`.
- Platform Admin has no Restaurant-internal Menu/3D/Table/Order/Reservation/Gallery CRUD routes.
- Public text search escapes regular-expression metacharacters and caps query/result sizes.
- No runtime `eval`, `new Function`, `dangerouslySetInnerHTML`, client cookie access, shell/child-process execution or server-side fetch of user-supplied URLs was found.
- Cart/order prices are recalculated from MongoDB, not trusted from the browser.
- Checkout creates Order + clears Cart inside a MongoDB transaction.
- Restaurant Admin 3D configuration uses known mesh names, bounded values and an easing allowlist; arbitrary JavaScript/CSS/shaders are not accepted.
- Phase 5 DOM menu remains a non-WebGL fallback.

## Dependency review
- Mongoose remains pinned to `8.9.5`, which is the patched boundary for CVE-2025-23061 affecting earlier 8.x versions.
- Vite was moved away from vulnerable `5.4.14` to `8.2.1`.
- `bcryptjs` updated to `3.0.3`.
- `jsonwebtoken` updated to `9.0.3`.

Because the clean artifact has no installed dependency tree and the sandbox registry timed out, a full transitive audit was **not** claimed. Run the local dependency gate below.

## Static/connection validation completed
Passed in the artifact environment:
- `node --check` for every backend JavaScript source file;
- Platform Admin management smoke test;
- Phase 2B CMS smoke test;
- Phase 3 smoke test;
- Phase 4 smoke test;
- Phase 5 smoke test;
- Phase 6 smoke test;
- Phase 7 smoke test;
- Phase 8 smoke test;
- Phase 9 smoke test;
- new security baseline smoke test;
- new route/flow connection smoke test;
- relative-import graph scan: no missing local imports;
- frontend JS/JSX parser pass.

The flow test deliberately asserts that no Phase 10 payment route is mounted yet.

## Required one-time local security migration
Back up the Atlas database first, stop the backend, fill `MONGODB_URI`, then run:

```powershell
cd backend
npm install
npm run migrate:security
npm run audit:data-security
```

`migrate:security`:
- backfills missing `authVersion`;
- removes legacy raw audit IP fields;
- backfills audit expiry timestamps;
- replaces the legacy global checkout-key unique index with the per-Customer compound unique index.

It does not intentionally delete Restaurant/Menu/Order/Reservation business records.

`audit:data-security` is read-only and reports legacy public media/model URLs that do not satisfy the new allowlist rules.

## Required local pre-Phase 10 gate
Backend:

```powershell
cd backend
npm install
npm run test:security
npm run test:flows
npm run test:phase9
npm run audit:deps
```

Frontend:

```powershell
cd frontend
npm install
npm run build
npm audit --audit-level=high
```

Then run frontend/backend separately and exercise the manual flow matrix in `PHASE10_PAYMENT_SECURITY_GATE.md`.

## Conclusion
No claim of “zero vulnerabilities” is made. The confirmed source-level security/privacy issues found in this review were hardened in the project. The remaining gates are environment-dependent: live Atlas migration/data audit, transitive dependency audit, Vite 8 production build, browser/CORS/cookie tests, and then Phase 10 gateway sandbox tests.

## Phase 10 follow-up — 2026-08-19
Phase 10 was implemented on top of this hardened checkpoint. The new payment-specific source smoke test and updated flow/security tests pass in the artifact environment. The original local Atlas migration, dependency audits, production Vite build and live Sandbox/IPN E2E remain environment-dependent gates and are not silently claimed as complete.


> Superseding dependency note (2026-08-19): the later pre-Phase-13 corrective checkpoint upgraded Mongoose from 8.9.5 to 8.22.1 due to the subsequently disclosed 2026 `sanitizeFilter` `$nor` bypass advisory, and upgraded Express 4.x/path-to-regexp accordingly. Treat the package versions in this older pre-Phase-10 document as historical.
