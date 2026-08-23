# SECURITY_PERFORMANCE_RELIABILITY.md

## Purpose

This file is a permanent source of truth for the Restaurant Website & Table Reservation System.

Every future build, modification, optimization, deployment, or debugging task must preserve these goals:

**Secure + Fast + Smooth + Optimized + Low-Congestion + Reliable + Connection-Resilient**

Read this file before changing authentication, cookies, APIs, database queries, 3D models, payments, reservations, carts/orders, admin features, deployment, or any performance-sensitive UI.

---

# 1. Non-Negotiable Global Rules

1. Never trust frontend-only security.
2. Every protected action must be validated again in Express/Node.js.
3. Never expose secrets, database URLs, private API keys, payment secrets, or admin credentials in React code.
4. Never store plaintext passwords.
5. Never store payment card details.
6. Never allow public users to choose an admin role.
7. Keep the public homepage and restaurant browsing available without login.
8. Require Customer Login for booking, favourites, checkout, order history, and customer dashboard.
9. Admin must use a separate admin login and admin-protected routes.
10. Keep the UI responsive even when the network is slow.
11. Avoid loading unnecessary 3D models, images, or API data.
12. Avoid duplicate API requests.
13. Use retries only where safe.
14. Never create retry loops that can overload the backend.
15. Keep forms safe from accidental data loss.
16. Every important request must have loading, success, empty, and error states.
17. Production errors must fail gracefully instead of crashing the whole website.
18. Performance must be checked on both desktop and mobile.

---

# 2. Authentication Architecture

Recommended:

- Node.js + Express
- MongoDB + Mongoose
- bcrypt password hashing
- JWT-based authentication
- Secure HTTP-only cookies where practical
- Role-Based Access Control

Roles:

```text
Guest
  -> Public pages only

Customer
  -> Public pages
  -> Booking
  -> Favourites
  -> Cart / Checkout
  -> Orders
  -> Customer Dashboard

Admin
  -> Separate Admin Login
  -> Admin Dashboard
  -> Full website management
```

The backend must check the role on every admin request.

Frontend hiding is not security.

---

# 3. Password Security

Passwords must:

- Be hashed with bcrypt before database storage.
- Never be logged.
- Never be returned from APIs.
- Never be stored in localStorage.
- Never be stored as plain text.

MongoDB stores:

```text
passwordHash
```

not:

```text
password
```

---

# 4. Cookie Rules

If cookies are used for authentication, use secure cookie settings.

Recommended production settings:

```text
HttpOnly: true
Secure: true
SameSite: Lax or Strict depending on flow
Path: /
```

Use HTTPS in production.

Do not put passwords, payment secrets, or private API keys inside browser cookies.

If refresh tokens are used:

- Keep them in an HTTP-only secure cookie.
- Rotate/revoke them when appropriate.
- Invalidate them on logout.

---

# 5. CSRF Protection

If authentication relies on cookies for state-changing requests, protect against CSRF.

Use as appropriate:

- SameSite cookie policy
- CSRF tokens
- Origin/Referer checks
- Restrictive CORS

Protect state-changing actions such as:

```text
POST
PUT
PATCH
DELETE
```

Examples:
- Booking
- Add/Edit/Delete Restaurant
- Add/Edit/Delete Food
- Upload GLB
- Payment creation
- Review submission

---

# 6. CORS Rules

Do not use unrestricted production CORS for authenticated/private APIs.

Production should allow only approved frontend origins.

Development may allow localhost.

---

# 7. Admin Security

Admin area:

```text
/admin/login
/admin/*
```

Rules:

- No public admin registration.
- Admin role is created by a trusted seed/manual process or existing authorized admin.
- Admin APIs require authentication.
- Admin APIs require `role === "admin"`.
- Important admin changes should be recorded in `AUDIT_LOG`.
- File uploads must be validated.
- Deleting important records should require confirmation.
- Destructive actions must not use GET requests.

Recommended audit fields:

```text
actorUserId
action
entityType
entityId
changes
ipAddress
createdAt
```

---

# 8. Input Validation and Sanitization

Validate all inputs on the backend.

Examples:

- Email format
- Password rules
- Reservation date
- Time slot
- Guest count
- Price
- Food availability
- MongoDB IDs
- Payment amount
- Uploaded file type
- Uploaded file size

Never trust values sent from React.

Protect against malformed payloads, NoSQL injection attempts, unexpected fields, and excessively large requests.

---

# 9. Rate Limiting / Anti-Abuse

Apply stricter rate limits to:

- Customer login
- Admin login
- Register
- Contact forms
- Review submission
- Payment creation
- Password reset if added later

General APIs can use less strict limits.

Goal:

```text
Stop abuse
without
slowing normal users
```

---

# 10. Secure Headers

Use secure HTTP headers in production.

Recommended Express middleware:

```text
Helmet
```

Important protections include:

- Content Security Policy when configured properly
- X-Content-Type-Options
- Referrer Policy
- Frame protection
- HSTS on HTTPS production deployments

Test CSP carefully because Three.js, Cloudinary, model storage, and payment gateways may require approved external origins.

---

# 11. Payment Security

Payment options:

- SSLCOMMERZ Sandbox
- bKash Sandbox

Rules:

1. Never trust payment success only because React redirects to a success page.
2. Verify payment server-side with the gateway.
3. Match transaction ID, expected amount, currency, and order/reservation.
4. Prevent duplicate payment processing.
5. Store payment status.
6. Handle success, failure, cancel, and invalid states.
7. Never store users' card details.
8. Never expose private gateway credentials to the frontend.

Flow:

```text
Customer
  ->
Backend creates payment request
  ->
Gateway Sandbox
  ->
Gateway callback/result
  ->
Backend validates transaction
  ->
MongoDB payment updated
  ->
Order/Reservation updated
```

---

# 12. Reservation Concurrency Safety

Two customers must not accidentally reserve the same table/time slot.

Before confirming, backend must recheck:

```text
Restaurant
Date
Time slot
Table
Active reservation
```

Where necessary use:

- Unique indexes
- Atomic update logic
- MongoDB transaction/session logic

Do not rely only on a stale availability screen.

---

# 13. Database Performance

Index frequently searched fields.

Likely indexes:

```text
USER.email
RESTAURANT.slug
MENU_CATEGORY.restaurantId
MENU_ITEM.restaurantId
MENU_ITEM.categoryId
MENU_ITEM.slug
RESERVATION.userId
RESERVATION.restaurantId
RESERVATION.reservationDate
RESERVATION.tableId
ORDER.userId
ORDER.restaurantId
PAYMENT.transactionId
FAVORITE.userId + menuItemId
```

Avoid:

- Full collection scans
- Returning huge documents
- Unnecessary populate calls
- Loading all records when pagination is enough

Use:

- Pagination
- Projection/select
- Lean reads where useful
- Compound indexes for common combined queries

---

# 14. No-Congestion API Rules

The website must not flood the backend.

Use:

- Debounce for search
- Throttle where appropriate
- Pagination
- Request cancellation
- Request deduplication
- Client caching
- Lazy fetching
- Avoid polling unless genuinely needed

Example:

Bad:

```text
p -> API
pa -> API
pas -> API
past -> API
pasta -> API
```

Good:

```text
User types
  ->
Wait about 250-400ms
  ->
Send one useful request
```

---

# 15. Request Cancellation

If the user changes page/filter/search before a request finishes:

- Cancel or ignore the old request.
- Prevent an old response from overwriting new state.

Use:

```text
AbortController
```

or equivalent library cancellation.

---

# 16. Retry Rules

Retries improve reliability, but uncontrolled retries create congestion.

Safe retry candidates:

- GET requests
- Temporary network failures
- Selected idempotent requests

Avoid automatic retry for:

- Payment creation
- Order placement
- Reservation confirmation
- Destructive admin actions

unless the operation has a proper idempotency strategy.

Use limited retries with exponential backoff and small jitter.

Never infinite-retry.

---

# 17. Idempotency

Critical operations must avoid duplicates.

Especially:

- Payment
- Order creation
- Reservation confirmation

Use:

- Unique transaction IDs
- Booking references
- Order references
- Idempotency keys where useful
- Backend duplicate checks

Example:

```text
User double-clicks Pay
```

must not create two paid orders.

---

# 18. Connection-Loss Resilience

No website can guarantee that the user's internet connection will never be lost.

Our goal is:

**Detect + Preserve + Recover + Retry Safely + Verify Critical State**

Required behavior:

```text
Connection Lost
  ->
Show clear non-blocking status
  ->
Keep current UI where possible
  ->
Preserve safe unsent form state
  ->
Reconnect
  ->
Retry safe reads
  ->
Refresh important server state
```

Do not show a blank page because one API request failed.

---

# 19. Preserve Form Data

For longer forms such as:

- Reservation
- Checkout
- Contact form
- Admin food editor
- Admin restaurant editor

prevent accidental data loss.

Possible approach:

- Keep form state in React.
- Optionally persist non-sensitive drafts in sessionStorage/localStorage.
- Never persist passwords or payment secrets.

---

# 20. Network Status UX

When offline:

```text
Connection lost. Your current changes are preserved.
```

When restored:

```text
Connection restored.
```

Do not repeatedly show intrusive popups.

For critical actions, clearly state whether the operation succeeded, failed, or is still pending.

Never guess payment/reservation success.

---

# 21. API Timeout Rules

Requests must not wait forever.

Use reasonable:

- Frontend request timeout
- Backend upstream timeout
- Payment gateway timeout handling
- Cloud upload timeout handling

On timeout:

- Show retry option.
- Preserve safe user state.
- Do not duplicate critical requests automatically.

---

# 22. Server Reliability

Backend should have:

- Centralized error handler
- Graceful async error handling
- Health endpoint
- Structured logging
- Database connection monitoring
- Hosting-provider restart support

Recommended:

```text
GET /api/health
```

Never expose secrets or sensitive diagnostics publicly.

---

# 23. MongoDB Connection Reliability

Goals:

- Connect once.
- Reuse the database connection.
- Detect failures.
- Avoid opening a new connection per request.
- Handle database unavailability gracefully.

---

# 24. Frontend Error Boundaries

Heavy 3D/WebGL sections should be isolated where appropriate.

If the 3D model fails:

```text
Show dish poster image
+
Dish details
+
Add to Cart
```

instead of crashing the whole restaurant page.

---

# 25. 3D Model Loading Strategy

Never load every 3D dish simultaneously.

Preferred:

```text
Previous dish -> available if needed
Current dish  -> loaded
Next dish     -> preloaded
Others        -> lazy
```

When navigating:

```text
Current
  ->
Next becomes current
  ->
New next preloads
```

This is a permanent rule.

---

# 26. 3D Optimization

Use:

- GLB/GLTF
- Draco or Meshopt compression where appropriate
- Compressed textures
- Reasonable polygon counts
- Texture resizing
- Instancing where useful
- Lazy loading
- Caching
- LOD if needed

Avoid enormous 3D models.

---

# 27. 3D Fallback

Every 3D dish should have:

```text
modelPosterUrl
```

If:

- WebGL unsupported
- Model fails
- Connection too slow
- Low-power device requires fallback

show the poster image and keep:

- Dish name
- Ingredients
- Price
- Add to Cart
- Previous/Next

Functional features must not depend on 3D rendering success.

---

# 28. Device-Adaptive Quality

Desktop:

- Richer lighting
- Stronger depth
- More particles
- Higher-quality model

Mobile:

- Reduced particle count
- Lower texture resolution
- Reduced postprocessing
- Simplified shadows
- Lighter animation

Never make mobile download desktop-grade assets unnecessarily.

---

# 29. Image Optimization

Use:

- WebP/AVIF where supported
- Responsive image sizes
- Lazy loading
- Cloudinary transformations
- Sensible compression

Do not display huge source images where smaller versions are enough.

---

# 30. Lazy Loading

Lazy-load:

- Restaurant galleries
- Offscreen 3D models
- Secondary sections
- Dashboard modules
- Large admin pages

Load critical above-the-fold content first.

---

# 31. Code Splitting

Code-split React routes where useful.

Heavy Three.js code should not unnecessarily block:

- Login
- Admin login
- Customer dashboard
- Simple text pages

Keep the 3D bundle isolated as much as practical.

---

# 32. Smooth Animation Rules

Use:

- Transforms
- Opacity
- GSAP timelines
- GPU-friendly properties

Avoid excessive animation of:

- width
- height
- top
- left

when transforms can do the same job.

---

# 33. Animation Performance

Do not run:

- Dozens of unnecessary GSAP timelines
- Hidden animations
- Expensive uncontrolled scroll listeners
- Unthrottled pointer handlers

Pause/kill animations when:

- Section is offscreen
- Component unmounts
- Page changes

Clean up:

- Event listeners
- GSAP contexts
- Timers
- Three.js resources

---

# 34. Memory Leak Prevention

Always clean up:

- Event listeners
- Intervals
- Timeouts
- Animation frames
- Observers
- GSAP animations
- WebGL resources
- Textures
- Geometries
- Materials
- Aborted requests

Long browsing sessions must not continually increase memory usage.

---

# 35. Search Performance

Food search should use:

- Debounce
- Indexed backend queries
- Useful filtering
- Pagination for large datasets

Do not download the entire database simply to search on the client.

---

# 36. Caching Strategy

Possible caching layers:

```text
Browser Cache
CDN
Cloudinary
Frontend query cache
Backend cache where justified
MongoDB indexes
```

Good cache candidates:

- Restaurant public information
- Menu categories
- Menu items
- Gallery
- Site settings

Use shorter/no cache for:

- Cart
- Booking availability
- Payment status
- Admin-sensitive data

---

# 37. Cache Invalidation

When Admin changes:

- Price
- Availability
- Restaurant data
- Gallery
- Menu

the public website must receive fresh data within an appropriate time.

Do not keep stale menu pricing indefinitely.

---

# 38. Compression

Enable server compression where appropriate.

Compress:

- JSON
- Text
- CSS
- JS

Use already-compressed formats for:

- Images
- GLB assets

---

# 39. CDN / Static Asset Delivery

Prefer CDN-backed delivery for:

- Images
- 3D model assets where available
- Static frontend assets

Keep heavy files away from dynamic API endpoints.

---

# 40. Loading States

Every async section should provide feedback.

Examples:

```text
Loading restaurant...
Loading 3D dish...
Checking table availability...
Processing payment...
```

Prefer subtle loaders/skeletons over blocking the entire page.

---

# 41. Error States

Provide meaningful errors.

For dish loading:

```text
We could not load this dish.
Try again
```

For booking:

```text
That table is no longer available.
Please choose another time.
```

Never expose server stack traces to users.

---

# 42. Payment / Booking Pending State

If a critical network request becomes uncertain:

- Do not immediately assume failure.
- Check the transaction/reference status.
- Fetch the latest server state.
- Confirm the outcome.

This helps prevent duplicate bookings and payments.

---

# 43. Cart Reliability

Cart should survive normal page navigation.

For logged-in users:

- Server-side cart is preferred for persistence.

Optional:

- Temporary local cart before login.
- Merge carefully after login.

Never lose the cart just because the customer enters the Login page.

---

# 44. Session Expiry

When authentication expires:

```text
Protected action
  ->
401 / expired
  ->
Attempt secure refresh if implemented
  ->
Otherwise redirect to login
```

Preserve intended destination.

Example:

```text
Book Table
  ->
Session expired
  ->
Login
  ->
Return to Booking
```

---

# 45. Prevent Duplicate Submissions

Disable/lock buttons while critical requests are processing.

Examples:

- Pay
- Confirm Reservation
- Place Order
- Save Admin Changes

Also use server-side duplicate protection.

Frontend disabling alone is not enough.

---

# 46. File Upload Security

For images and GLB uploads validate:

- MIME type
- Extension
- Size
- Filename
- Allowed asset type

Do not allow arbitrary executable uploads.

Use generated safe filenames/IDs.

Never trust the original filename.

---

# 47. Admin 3D Upload Performance

Large 3D uploads should:

- Show upload progress
- Reject files above configured limits
- Validate type
- Avoid freezing the UI
- Be optimized before public use where possible

Admin status:

```text
Uploading...
Optimizing...
Ready
```

---

# 48. Logging

Log important backend events:

- Login failures
- Admin login
- Admin changes
- Payment events
- Reservation errors
- Unexpected server errors

Do not log:

- Passwords
- Tokens
- Payment secrets
- Private credentials

---

# 49. Monitoring

Production should monitor:

- Frontend errors
- Backend errors
- API latency
- Database failures
- 3D asset failures
- Payment callback errors

Use hosting logs and, if added later, a suitable error monitoring service.

---

# 50. Performance Goals

Targets are goals, not guarantees.

Aim for:

- Public homepage becomes usable quickly.
- Basic content appears before heavy 3D finishes.
- No huge blocking model downloads.
- Smooth menu interaction.
- No unnecessary full page reloads.
- Fast search/filter.
- Admin actions provide clear feedback.
- Mobile remains usable on mid-range devices.

---

# 51. Accessibility and Reduced Motion

Respect:

```text
prefers-reduced-motion
```

When enabled:

- Reduce camera movement.
- Reduce parallax.
- Reduce floating particles.
- Simplify transitions.

Accessibility is part of reliability.

---

# 52. Browser Compatibility

Test at minimum:

- Chrome desktop
- Edge desktop
- Chrome Android
- Safari iPhone where possible

If WebGL is unavailable:

- Show static fallback.
- Do not block menu usage.

---

# 53. Deployment Reliability

Frontend:

```text
Vercel
```

Backend:

```text
Render
```

Database:

```text
MongoDB Atlas
```

Media:

```text
Cloudinary
```

Before production verify:

- CORS
- Environment variables
- HTTPS
- Cookie settings
- Sandbox/live payment separation
- Error logging
- Health checks

---

# 54. Environment Separation

Maintain:

```text
Development
Test / Sandbox
Production
```

Never accidentally use live payment credentials during development.

---

# 55. Secret Management

Secrets belong in:

```text
.env
hosting environment variables
```

Never commit:

```text
MONGO_URI
JWT_SECRET
CLOUDINARY_API_SECRET
SSLCOMMERZ_STORE_PASSWORD
BKASH_APP_SECRET
```

`.env.example` contains safe local-development defaults. The downloadable local package also includes `.env` for convenience, with `MONGODB_URI` intentionally blank. Real MongoDB credentials must never be committed or shared; change seeded passwords/JWT secret before public deployment.

---

# 56. Git Safety

Before major changes:

- Commit working state.
- Create a feature branch where useful.
- Update CHANGELOG.
- Avoid mixing unrelated changes.

Before deployment:

- Test build.
- Test environment variables.
- Test auth.
- Test admin access.
- Test booking.
- Test payment sandbox.
- Test 3D fallback.

---

# 57. Mandatory Performance Review Before Adding a Feature

Ask:

```text
Does this add a new API request?
Does this load a heavy asset?
Does it need authentication?
Does it need caching?
Does it need pagination?
Can it create duplicate actions?
What happens if the connection drops?
What happens on mobile?
What happens if 3D/WebGL fails?
Does Admin need control of it?
```

---

# 58. Mandatory Security Review Before Adding a Feature

Ask:

```text
Who can use it?
Who can modify it?
Is backend authorization required?
What data is accepted?
Is the input validated?
Does it expose private data?
Does it require rate limiting?
Could it be submitted twice?
Could an attacker upload a dangerous file?
Does it involve payments?
Should it be logged?
```

---

# 59. Mandatory Reliability Review

For every important operation define:

```text
Loading
Success
Failure
Timeout
Offline
Retry
Duplicate
Expired Session
Server Error
```

If one is missing, the feature is incomplete.

---

# 60. Golden Rule for Connection Safety

Never promise:

```text
Connection can never be lost
```

Instead build:

```text
Detect loss
+
Preserve safe state
+
Recover cleanly
+
Retry safely
+
Verify critical actions
+
Never duplicate payments/orders/bookings
```

This is the project's definition of connection-resilient behavior.

---

# 61. Golden Rule for Smoothness

A feature is not complete if it:

- Freezes the UI.
- Causes large layout jumps.
- Repeatedly reloads the same assets.
- Sends unnecessary API requests.
- Loads all 3D models together.
- Blocks mobile interaction.
- Leaks WebGL memory.
- Makes navigation confusing.

---

# 62. Golden Rule for Security

A feature is not secure because the UI hides it.

Security must be enforced in:

```text
Frontend UX
+
Backend Authentication
+
Backend Authorization
+
Database Rules
+
Validation
+
Secure Deployment
```

---

# 63. Golden Rule for Admin Editing

Admin editing should not require source-code changes for ordinary website content.

Whenever reasonable:

```text
Admin Dashboard
  ->
API
  ->
MongoDB / Media Storage
  ->
Public Website
```

This includes:

- Text
- Images
- Restaurant details
- Menu items
- Prices
- 3D model links/files
- Availability
- Gallery
- Contact information

---

# 64. Release Checklist

## Security

- [ ] Passwords hashed
- [ ] Admin routes backend-protected
- [ ] Customer routes backend-protected
- [ ] Production CORS restricted
- [ ] Secure cookie settings
- [ ] Secrets not exposed
- [ ] Rate limits enabled
- [ ] Inputs validated
- [ ] Uploads validated
- [ ] Payment server-side verified

## Performance

- [ ] Images optimized
- [ ] 3D models optimized
- [ ] Only needed 3D models loaded
- [ ] Lazy loading enabled
- [ ] Search debounced
- [ ] Pagination used where needed
- [ ] API calls deduplicated
- [ ] Heavy routes code-split

## Reliability

- [ ] Loading states
- [ ] Error states
- [ ] Request timeouts
- [ ] Safe retry rules
- [ ] Duplicate submission protection
- [ ] Connection-loss handling
- [ ] Form state preservation where needed
- [ ] Payment status revalidation
- [ ] Reservation availability recheck
- [ ] 3D fallback poster

## Mobile

- [ ] Swipe works
- [ ] Reduced 3D quality where needed
- [ ] No heavy unnecessary downloads
- [ ] Touch targets usable
- [ ] Forms work on mobile

---

# 65. Files That Must Be Checked Together

Before security/performance/reliability changes, read:

1. `MEMORY.md`
2. `PRD.md`
3. `FEATURES.md`
4. `ARCHITECTURE.md`
5. `AUTH_RBAC.md`
6. `SECURITY_PERFORMANCE_RELIABILITY.md`
7. `3D_SYSTEM.md` if 3D is involved
8. `PAYMENT_SYSTEM.md` if payment is involved
9. `RESERVATION_SYSTEM.md` if booking is involved
10. `CHANGELOG.md`

---

# 66. Final Permanent Principle

The website should always aim to be:

> **Visually cinematic without becoming heavy, secure without becoming difficult to use, and resilient without generating unnecessary network traffic.**

Permanent quality target:

```text
SECURITY
+
PERFORMANCE
+
SMOOTHNESS
+
RELIABILITY
+
RECOVERY
+
MAINTAINABILITY
```

No future visual feature should be allowed to break these rules.


---

# 67. Third-Party Animation and Motion Governance

Before using Vengeance UI, Skiper UI, Animmaster Lib, Aceternity UI, 21st.dev, OriginKit, Casberry Particles, useAnimations, Lottieflow, GetLayers or any other external animation source:

1. Record the exact source/component/asset.
2. Verify its licence, commercial-use terms and attribution requirements.
3. Do not use paid/pro source without a valid project licence.
4. Prefer a small local component over installing a full visual framework.
5. Do not introduce multiple libraries that solve the same animation job.
6. Measure bundle size and runtime/GPU cost.
7. Require cleanup of RAF loops, timers, listeners and WebGL resources.
8. Provide `prefers-reduced-motion` behavior.
9. Provide keyboard/touch alternatives to hover/cursor-only interactions.
10. Preserve loading, error and static fallback states.

## 3D-specific budget rule
- The dish canvas has first priority over particles, shaders and decorative canvases.
- Avoid multiple simultaneous WebGL canvases where one composed canvas can solve the scene.
- Load current dish first; preload only the next/previous assets required by the active interaction.
- Pause/suspend offscreen/hidden animation where practical.
- Mobile quality and DPR must be capped/reduced when needed.
- A decorative particle system is optional and can be removed without affecting the core experience.

## Lottie/icon rule
- Animated icons are for state communication, not decoration everywhere.
- Lazy-load JSON/runtime when possible.
- Always have a static accessible label/icon fallback.

## Payment/auth/admin rule
Payment, authentication and destructive admin actions must use clarity-first motion only. No cinematic transition may hide a confirmation, error, amount, authentication state or destructive consequence.

## Phase 6 3D runtime rules — implemented
- 3D is progressive enhancement; the Phase 5 DOM menu remains a permanent functional fallback.
- Public 3D metadata is returned only for active + available + `threeD.enabled` dishes.
- 3D binary asset URLs are stored as metadata; binary GLB data is not stored inside MongoDB documents.
- The dedicated 3D page is lazy-loaded to keep Three/R3F/Drei/GSAP out of ordinary page execution until requested.
- One Canvas / one model only in Phase 6; full multi-model menu is deferred.
- Canvas DPR is capped to reduce GPU load.
- `prefers-reduced-motion` skips cinematic auto assembly/idle motion.
- WebGL capability and runtime model failures fall back to poster + normal menu.
- GSAP timelines/tweens and timers must be killed on unmount.
- Production Phase 7 must preload only current/previous/next models, never the whole menu.
- Production 3D upload/storage must validate extension/MIME/size server-side and use object storage/CDN rather than MongoDB binary fields.

## Restaurant Admin 3D animation editor security rules
Restaurant Admin 3D animation controls are treated as untrusted admin input even though the user is authenticated.

Required rules:
- derive Restaurant scope from the authenticated account; never trust a submitted Restaurant ID;
- update only MenuItems owned by `req.managedRestaurantId`;
- accept structured JSON fields only;
- never accept/evaluate arbitrary JS, CSS, HTML, GLSL/shader source, function bodies, expressions or URLs as executable animation logic;
- validate every numeric value with finite checks and server-side min/max bounds;
- limit layer count and payload size;
- require/verify expected named mesh/node identifiers;
- use an allowlist for easing presets rather than accepting GSAP expression strings;
- clamp/validate duration, stagger, offsets, optional rotations and duration factors;
- preview is convenience only; server validation remains authoritative;
- provide reset-to-default/recommended configuration;
- preserve the DOM/poster fallback if a saved configuration is invalid or a model layer is missing;
- test extreme values, malformed arrays, unknown mesh names and cross-Restaurant IDs in Phase 13.

Performance rule: Restaurant Admin configuration may change timing/offsets but must not be able to remove global DPR/model-loading/mobile/reduced-motion safety limits.


## Phase 7 3D editor + full-menu controls
- Never trust Restaurant IDs from 3D animation request bodies; use `req.managedRestaurantId`.
- Reject unknown/duplicate mesh names and non-allowlisted easing values.
- Bound XYZ offsets to -5…5, duration to 0.2…4s, stagger to 0…0.5s, delay to 0…5000ms and float/rotation to 0…0.5.
- No arbitrary JS/CSS/HTML/shader/expression field is accepted.
- Public 3D menu returns only active, available, enabled 3D dishes.
- Preload only current/previous/next GLB assets; do not eagerly download the whole menu.
- Keep DPR capped and reduced-motion/WebGL/poster/DOM fallbacks.
- Animation editor preview changes remain local until explicit save.


## Phase 8 favourites/customer-dashboard rules
- Require `authenticateUser` + `requireCustomer` for every `/api/customer/*` endpoint.
- Never trust client-supplied ownership; Customer ownership comes from `req.user._id`.
- Validate favourite target IDs server-side.
- Restaurant favourites require `Restaurant.isActive=true`.
- Dish favourites require `MenuItem.isActive=true`, `isAvailable=true`, and an active Restaurant.
- Enforce duplicate-save protection with database unique indexes, not UI state only.
- Optimistic save/remove UI must roll back to the previous state after failed writes.
- Clear favourite state after logout/non-Customer auth changes.
- Profile editing in Phase 8 is limited to bounded name/phone fields; login email is read-only until a dedicated verified email-change flow exists.
- Do not add heavy animation/3D dependencies for dashboard save feedback; CSS micro-feedback must respect `prefers-reduced-motion`.


## Phase 9 cart/order security + reliability rules
- Cart/order Customer ownership comes only from authenticated `req.user._id`.
- Restaurant Admin Order ownership comes only from `req.managedRestaurantId`.
- Never accept client-calculated prices/totals as authoritative.
- Revalidate Restaurant active state and every MenuItem active/available state during checkout.
- One Restaurant per cart prevents ambiguous Restaurant ownership and future gateway settlement.
- Quantity is bounded server-side.
- Checkout requires unique `checkoutKey` for duplicate-submission protection.
- Order-create + Cart-clear use a MongoDB transaction.
- Order item/Customer/Restaurant snapshots are immutable historical records; do not rebuild old orders from current menu data.
- Customer cancellation is limited to `placed + unpaid`.
- Restaurant Admin status changes follow a server allowlist transition graph; payment status is not an admin-editable field.
- Paid cancellation must route through Phase 10 refund/payment handling rather than silently changing order state.
- Phase 10 payment initiation/callbacks use server-stored Order total and idempotent gateway transaction identifiers.

## Pre-Phase 10 security hardening checkpoint — 2026-08-19
### Browser/API trust boundary
- CORS remains an exact-origin browser response policy, not authorization.
- Every unsafe browser mutation requires `X-ReserveUrTime-Request: 1` and a trusted Origin when present.
- Production rejects originless unsafe browser mutation requests.
- SSLCOMMERZ IPN/callback endpoints now use a narrow exact-route gateway-specific path; browser protection remains enabled globally elsewhere.

### Session/authentication
- JWT cookie is HttpOnly and Secure in production; production cookie name uses the `__Host-` prefix.
- `authVersion` is verified on every authenticated request, allowing credential/assignment/account changes to revoke prior JWTs.
- New passwords: >=10 characters, contain a letter and number, <=72 UTF-8 bytes.
- Auth/API rate limits remain enabled.

### Privacy/data minimization
- New audit events store keyed network hashes rather than raw IPs, have retention TTL, and recursively redact password/token/secret/credential/card/CVV-like fields.
- Production error logs exclude request payloads and detailed customer/credential values.
- Restaurant Admin Order responses receive only Customer name/phone needed for fulfilment, not Customer login email or status-history actor PII.
- Sensitive authenticated API responses are marked `no-store`.
- Order-note UI warns that notes are shared with the Restaurant and should not contain credentials/card/government-ID data.

### Input/data integrity
- Public media writes accept safe site-relative paths or HTTPS origins in `MEDIA_ALLOWED_ORIGINS` only.
- State booleans require actual JSON booleans.
- Order/Reservation status writes use conditional atomic filters to reject stale concurrent state changes.
- `Reservation.customerSlotKey` prevents a Customer from holding multiple active tables for the same Restaurant/date/time.
- Order idempotency is unique by `userId + checkoutKey`.

### Dependency/dev-server posture
- Mongoose is now pinned to 8.22.1, the patched 8.x boundary for the 2026 `$nor` `sanitizeFilter` bypass advisory; `sanitizeFilter` remains enabled and application code still whitelists query fields instead of passing raw request filters.
- Frontend tooling moved from Vite 5.4.14 to Vite 8.2.1 and plugin-react 6.0.5.
- Vite dev/preview bind to `localhost` with strict port/fs settings; local `/api` is proxied only to `http://localhost:5000`. Do not expose local dev servers to the LAN/public Internet.
- Preserve generated lockfiles after local `npm install`, and run `npm audit --audit-level=high` before Phase 10 and deployment.

### Phase 10 payment rules
- Gateway secrets backend-only.
- Order amount/currency server-authoritative.
- SSLCOMMERZ session creation happens server-side.
- Success/fail/cancel browser redirect alone is never proof of payment.
- IPN/callback must be validated with SSLCOMMERZ and matched to transaction/order/amount/currency before marking paid.
- Duplicate callbacks are idempotent.
- Restaurant Admin cannot set paid/refunded states.
- Payment/refund state changes use atomic conditional updates and dedicated PaymentAttempt records.
- Never log card PAN/CVV, gateway Store Password or raw sensitive gateway payloads.



## Phase 10 implemented payment-security checkpoint — 2026-08-19
- SSLCOMMERZ credentials are backend-only; frontend env contains no gateway secret.
- Session creation is server-side and uses stored Order total + BDT.
- `tran_id` is unique/server-generated and kept within the documented 30-character maximum.
- Customer `paymentKey` adds retry/double-click idempotency.
- Only the exact SSLCOMMERZ callback routes bypass the browser mutation marker; no broad `/api` exemption exists. A dedicated high-ceiling callback rate limiter is used instead of the tighter normal browser API limit.
- Callback payload status is not accepted as financial truth. Backend calls SSLCOMMERZ Validation API or Transaction Query API first.
- Verified record must match transaction, expected amount and currency; Order/Customer/attempt references are matched when the gateway returns them.
- GatewayPageURL must be HTTPS and on the expected Sandbox/live SSLCOMMERZ host before browser navigation.
- `risk_level=1` is a hold; fulfilment remains blocked and later Customer reconciliation can re-query gateway state.
- PaymentAttempt + Order paid state are committed in a MongoDB transaction; replay of the same successful transaction is idempotent.
- A second different successful transaction against an already-paid Order is recorded as `duplicate_paid` rather than overwriting original payment truth.
- Restaurant Admin cannot edit gateway state and cannot advance unpaid/pending Orders through fulfilment.
- Sensitive payment APIs are no-store; PaymentAttempt session/validation/bank references are not exposed by default.
- No PAN/CVV collection/storage was added.
- Development `SEED_RESET=true` also clears PaymentAttempt before/with Phase 9 Order data so reset does not leave dangling payment records. Gateway Store Password is never logged or sent to React.
- Production callback URL must be HTTPS and publicly reachable; frontend return URL must use an allowlisted frontend origin.
- Full IPN/Sandbox E2E, dependency audit, Vite 8 build and live Atlas security migration remain required local validation before deployment.
- Paid refund is intentionally not a manual status override; future refund handling must use verified gateway refund APIs.


# Phase 11 Review / Contact / Notification Security

- Review eligibility is derived server-side from completed Reservations or completed+paid Orders.
- One Review per Customer+Restaurant is enforced by a unique MongoDB index.
- Public Review output never exposes Customer email, phone or internal user metadata.
- Restaurant Admin review queries/replies are constrained by `req.managedRestaurantId`; Restaurant Admin cannot change review visibility.
- Platform Admin moderation changes only `published|hidden` status plus a bounded reason.
- Contact submission has a dedicated 12-per-15-minute limiter in addition to general API limits.
- Unsafe Contact/Review/Notification mutations retain trusted Origin + `X-ReserveUrTime-Request` checks.
- Platform messages and Restaurant-targeted messages are stored separately and queried by explicit scope.
- Anonymous message status requires both a high-entropy reference and the original normalized email.
- Contact UI explicitly warns against passwords, card data and government IDs.
- Contact responses are cached `no-store`; signed-in Contact messages are visible only to the owning Customer.
- Notifications accept only safe site-relative links and retain no financial secrets.
- Notification TTL is 180 days; ContactMessage TTL is 365 days to reduce unnecessary PII retention.
- React renders Review/Contact content as escaped text; no raw HTML renderer was introduced.
- No new Phase 11 runtime animation dependency was added.

## Motion + dish-image upload hardening
- Image upload is Restaurant Admin-only and Restaurant-scoped.
- Multipart upload limit: one file, ≤6 MB.
- Accepted runtime upload formats: PNG, JPEG and WebP only; file content is checked by magic bytes, not just browser MIME.
- SVG is rejected from upload to avoid active-content/image-script ambiguity.
- Runtime upload directory is gitignored and is not considered production storage.
- Photo Explode layer count is capped at 16 and numeric controls are bounded.
- `useReducedMotion` removes displacement-heavy image animation for users requesting reduced motion.
- Photo Explode uses DOM/CSS transforms, not an additional WebGL canvas.
- True 3D remains lazy-loaded and keeps adjacent-model preload limits.
- Phase 13 must profile Motion + GSAP + R3F together for CPU/GPU/memory regressions.



## Phase 12 cinematic boundary
Phase 12 adds presentation-only Motion/CSS behavior. It does not change authentication, payment, RBAC, Restaurant scoping or stored 3D configuration. Reduced-motion and coarse-pointer fallbacks prevent hover/continuous effects from becoming required interaction. Phase 13 must profile the new scroll/progress/nav/card effects together with Photo Explode and WebGL/GSAP, remove any unnecessary animation, and verify cleanup/layout-shift/mobile GPU behavior.


## 3D/runtime dependency hardening checkpoint
- Public menu/3D endpoints no longer `populate()` the legacy-sensitive `categoryId` path; category metadata is joined from an explicit active-category query.
- Canonical demo data has a non-destructive repair/diagnostic path rather than requiring destructive seed reset.
- Express 4.22.2 is used for the maintained 4.x line; Mongoose 8.22.1 addresses the 2026 `sanitizeFilter` advisory; path-to-regexp is forced to 0.1.13; Multer remains 2.2.0 with `fieldNestingDepth: 1`.
- Frontend is aligned to React 19.2.8/R3F 9.7.0/Drei 10.7.8/Three 0.185.1, replacing the older Drei 9 transitive path that emitted the local `three-mesh-bvh@0.7.8` deprecation warning.
- React Router DOM 7.18.2 replaces the older v6 line so the current navigation-security fixes are available while the app remains in Declarative BrowserRouter mode.
- Final `npm audit` results are environment-specific to the generated lockfile and remain a Phase 13/local gate. Never auto-apply `--force` without reviewing breaking changes.
- The large Three.js cost remains isolated behind lazy 3D routes; build chunking separates Three core, R3F and Drei. Phase 13 must profile transfer, parse/execute, GPU, memory and model decode costs rather than hiding them by only increasing warning limits.

## Exploded 3D core corrective security/reliability gate
- Public Restaurant/menu/full-3D reads use native collection reads end-to-end so historical category/foreign-key shapes cannot trigger Mongoose CastError before WebGL.
- Categories are joined explicitly by current ObjectId or legacy slug.
- Canonical Ember Phase 7 GLB metadata supplies missing demo model/layer runtime fields while matching valid Restaurant Admin overrides remain authoritative.
- Restaurant Admin 3D/Photo/image paths remain Restaurant-scoped and validated while avoiding unrelated legacy category hydration failures.
- Frontend development-tool audit path is pinned to Tailwind 3.4.19 + Sucrase 3.35.1 + glob 10.5.0. Verify the exact generated Windows lock tree locally.
- The 3D vendor graph is split for profiling; Phase 13 must test transfer/parse/GPU/memory rather than hide chunk warnings.

