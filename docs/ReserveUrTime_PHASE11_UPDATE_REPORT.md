# ReserveUrTime — Phase 11 Update Report

Date: 2026-08-19
Base: Phase 10 SSLCOMMERZ Sandbox project
Phase completed: **Phase 11 — Reviews + Contact/Messages + Notifications**

## Reviews
Implemented verified-experience Customer reviews:
- Customer becomes eligible only after a completed reservation or completed+paid Order;
- one review per Customer per Restaurant;
- rating 1–5, bounded title/body;
- public reviews expose a privacy-safe display name only;
- Restaurant Admin can reply only for the assigned Restaurant;
- Restaurant Admin cannot hide/delete reviews;
- Platform Admin can hide/republish reviews with a moderation reason;
- Customer receives in-app notifications for Restaurant replies and moderation changes.

Public API:
```text
GET /api/restaurants/:slug/reviews
```

Customer APIs:
```text
GET    /api/customer/reviews/eligibility
GET    /api/customer/reviews
POST   /api/customer/reviews
PATCH  /api/customer/reviews/:reviewId
DELETE /api/customer/reviews/:reviewId
```

Restaurant Admin:
```text
GET   /api/restaurant-admin/reviews
PATCH /api/restaurant-admin/reviews/:reviewId/reply
```

Platform Admin:
```text
GET   /api/platform-admin/reviews
PATCH /api/platform-admin/reviews/:reviewId/moderate
```

## Contact / Messages
Added `/contact` with explicit destination routing:
- Platform message → Platform Admin inbox only;
- Restaurant message → only the Restaurant Admin assigned to that Restaurant.

Public APIs:
```text
POST /api/contact
POST /api/contact/status
```

Signed-in Customer:
```text
POST /api/customer/contact
GET  /api/customer/messages
```

Restaurant Admin:
```text
GET   /api/restaurant-admin/messages
PATCH /api/restaurant-admin/messages/:messageId
```

Platform Admin:
```text
GET   /api/platform-admin/messages
PATCH /api/platform-admin/messages/:messageId
```

Signed-in Customers can see their own message history at `/dashboard/messages`.
Anonymous senders receive a random high-entropy message reference and may check status using reference + the original email. The public Contact UI explicitly warns users not to submit passwords, payment card data, government IDs or unnecessary sensitive information.

## Notifications
New Customer route:
```text
/dashboard/notifications
```

New Restaurant Admin route:
```text
/restaurant-admin/notifications
```

APIs support list, mark one read and mark all read. Notification events include:
- new verified review → Restaurant Admin;
- new Restaurant-targeted message → Restaurant Admin;
- Restaurant review reply → Customer;
- Platform review moderation → Customer;
- management contact reply → signed-in Customer;
- Restaurant Admin Order status update → Customer;
- Restaurant Admin Reservation status update → Customer.

Notification links are restricted to safe site-relative paths.

## Privacy / security
- Public review payloads do not expose Customer email/phone.
- Restaurant Admin review/message access is derived from `req.managedRestaurantId`.
- Platform Admin cannot read Restaurant-targeted messages through the Platform inbox route.
- Restaurant Admin cannot moderate public review visibility.
- Dedicated Contact limiter: 12 requests per 15 minutes, in addition to the general API limit.
- Existing trusted-Origin + `X-ReserveUrTime-Request: 1` mutation protection remains active.
- `/api/contact` and authenticated/private APIs are `no-store`.
- ContactMessage TTL: 365 days.
- Notification TTL: 180 days.
- Review/Contact text is rendered by React as escaped text; no raw HTML renderer was added.
- No new heavy animation or UI dependency was added.

## New backend files
- `src/models/Review.js`
- `src/models/ContactMessage.js`
- `src/models/Notification.js`
- `src/services/reviewService.js`
- `src/services/contactService.js`
- `src/services/notificationService.js`
- `src/controllers/reviewController.js`
- `src/controllers/contactController.js`
- `src/controllers/notificationController.js`
- `src/routes/contactRoutes.js`
- `src/tests/phase11-reviews-contact-notifications-smoke.js`

## New frontend files
- `src/components/RestaurantReviewsSection.jsx`
- `src/components/NotificationList.jsx`
- `src/pages/ContactPage.jsx`
- `src/pages/CustomerReviewsPage.jsx`
- `src/pages/CustomerMessagesPage.jsx`
- `src/pages/CustomerNotificationsPage.jsx`
- `src/pages/RestaurantAdminReviewsPage.jsx`
- `src/pages/RestaurantAdminMessagesPage.jsx`
- `src/pages/RestaurantAdminNotificationsPage.jsx`
- `src/pages/PlatformAdminReviewsPage.jsx`
- `src/pages/PlatformAdminMessagesPage.jsx`

## Frontend routes
```text
/contact
/dashboard/reviews
/dashboard/messages
/dashboard/notifications
/restaurant-admin/reviews
/restaurant-admin/messages
/restaurant-admin/notifications
/platform-admin/reviews
/platform-admin/messages
```

Public Restaurant detail now includes a Reviews section and a `Message Restaurant` action.

## Database
New collections are created automatically when first used:
- `reviews`
- `contactmessages`
- `notifications`

No Phase 11 migration is required. `SEED_RESET=true` now also clears these development collections.

## Validation performed in artifact environment
Passed:
- syntax check for every backend JS source file;
- TypeScript parser syntax pass across frontend JS/JSX source;
- Phase 2A management smoke test;
- Phase 2B CMS smoke test;
- Phase 3/4/5/6/7/8/9 smoke tests;
- pre-Phase10 security baseline smoke test;
- Phase 10 payment smoke test;
- updated flow/connection smoke test including Phase 11 routes;
- new Phase 11 smoke test.

Not claimed here:
- dependency-backed Vite production build because clean artifact has no `node_modules`;
- live MongoDB Atlas browser E2E because distributed `MONGODB_URI` remains blank;
- real SSLCOMMERZ Sandbox/IPN E2E, which remains part of the existing local Phase 10 gate.

## Local commands
Backend:
```powershell
cd backend
npm install
npm run test:phase11
npm run test:flows
npm run test:security
npm run dev
```

Frontend:
```powershell
cd frontend
npm install
npm run build
npm run dev
```

## Next phase
**Phase 12 — Cinematic UI/UX polish + responsive/accessibility refinement.**

Phase 12 must preserve all Phase 0–11 business logic, RBAC, payment trust, reduced-motion fallback and mobile performance.
