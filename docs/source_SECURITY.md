# SECURITY.md

- bcrypt hashes, JWT HTTP-only cookies, HTTPS production.
- Role enum: customer/platform_admin/restaurant_admin.
- Restaurant Admin must have server-enforced `restaurantId` scope.
- Platform Admin internal restaurant write attempts must return 403/route absent.
- Restaurant Admin direct platform identity writes must return 403; request API only.
- Validate uploads/MIME/size and store heavy media outside MongoDB.
- Restrictive CORS, Helmet, rate limiting, validation/sanitization.
- Audit approvals and destructive management actions.
- Never expose secrets in client or repository.


## Phase 7 3D editor security
3D animation write APIs are Restaurant Admin-only, server-scoped to `req.managedRestaurantId`, reject unknown/duplicate mesh names, enforce bounded numeric values and use an easing allowlist. Arbitrary executable animation input is not accepted.

## Pre-Phase 10 canonical security baseline
This supersedes older broad notes where they conflict.

- Browser unsafe API writes: exact trusted Origin + `X-ReserveUrTime-Request: 1`.
- Production cookies: HttpOnly + Secure + validated SameSite; production name `__Host-reserveurtime_session`.
- JWT auth: current User reload + active state + `authVersion` revocation.
- Restaurant Admin: all Restaurant-internal writes scoped from authenticated `req.managedRestaurantId`.
- Mongoose: `sanitizeFilter=true`; source review found no raw `req.body`/`req.query` object passed directly as a Mongo filter.
- Public external media: HTTPS exact-origin allowlist; relative local assets preferred.
- Audit: keyed IP hash, TTL, sensitive-key redaction, no raw-IP list exposure.
- Errors: generic production 500 response/log metadata only.
- Sensitive API responses: `Cache-Control: no-store, private`.
- Order/Reservation state transitions: atomic conditional updates to resist stale concurrent writes.
- Checkout idempotency unique by Customer + checkout key.
- Same-Customer same-slot active reservation blocked.
- Vite 8 localhost-only dev/preview configuration; production headers/CSP in `frontend/vercel.json`.

Phase 10 is now implemented on this baseline. Before claiming local/runtime readiness run `migrate:security`, `audit:data-security`, `test:security`, `test:flows`, `test:phase10`, dependency audits, frontend production build and Sandbox/IPN E2E locally.



## Phase 10 payment security
- SSLCOMMERZ credentials exist only in backend env.
- Customer payment initiation is authenticated and Order-owned.
- Trusted amount/currency come from stored Order, not React.
- Exact IPN/success/fail/cancel routes are a narrow gateway trust boundary with a dedicated high-ceiling callback rate limiter; their body alone cannot set paid.
- Backend calls SSLCOMMERZ validation/transaction-query endpoints and matches transaction, amount, BDT and stored references.
- Verified payment update is atomic/idempotent; risk payments remain on hold.
- Restaurant Admin cannot set paid/refunded and cannot fulfil until verified paid.
- No PAN/CVV/card-secret collection/storage.
- Development `SEED_RESET=true` clears PaymentAttempt with Cart/Order/Favorite data.
- Full IPN testing requires public HTTPS callback URL.


## Phase 11 security additions
Review eligibility/ownership and Restaurant message scope are server-derived. Public reviews omit Customer PII. Contact has a dedicated rate limiter, bounded data, no-store handling, explicit sensitive-data warning and target isolation. Anonymous message lookup requires reference+email. Notifications use safe relative links and 180-day retention; ContactMessage retention is 365 days.

## Dish image upload security
Restaurant Admin uploads accept only one PNG/JPEG/WebP file up to 6 MB and verify file signatures after multipart parsing. SVG is not accepted. The target dish is resolved through `req.managedRestaurantId`. Photo Explode accepts bounded structured numbers and an easing allowlist only; no arbitrary script/style/shader expressions are stored.



## Phase 12 cinematic boundary
Phase 12 adds presentation-only Motion/CSS behavior. It does not change authentication, payment, RBAC, Restaurant scoping or stored 3D configuration. Reduced-motion and coarse-pointer fallbacks prevent hover/continuous effects from becoming required interaction. Phase 13 must profile the new scroll/progress/nav/card effects together with Photo Explode and WebGL/GSAP, remove any unnecessary animation, and verify cleanup/layout-shift/mobile GPU behavior.


## Pre-Phase-13 dependency/runtime patch note
- Mongoose pinned to 8.22.1; Express to 4.22.2; path-to-regexp forced to 0.1.13.
- Multer 2.2.0 upload path additionally limits multipart `fieldNestingDepth` to 1.
- Public menu/3D category joins no longer allow a malformed legacy ObjectId reference to trigger a response-wide CastError.
- React Router DOM updated to 7.18.2; app remains Declarative BrowserRouter SPA mode.
- Local installed-tree audits must be rerun after clean install.

## Frontend development-tool audit remediation
A local high audit finding was traced to the Tailwind CSS 3 development dependency path through Sucrase to the vulnerable `glob` CLI range. The project remains on Tailwind 3 for stability but pins Tailwind 3.4.19/PostCSS 8.5.26/Autoprefixer 10.5.4 and overrides Sucrase 3.35.1 + glob 10.5.0. The patched `glob` boundary addresses GHSA-5j98-mcp5-4vw2. Because `npm audit` evaluates the generated local dependency tree, final zero/high status must be verified after a clean local install. Never use `npm audit fix --force` without reviewing the breaking upgrade graph.

Public 3D reads also bypass Mongoose casting of historical demo category data, preventing malformed legacy records from turning a public read into a CastError response. This is a resilience boundary, not permission bypass; Admin writes remain role/Restaurant scoped and validated.

