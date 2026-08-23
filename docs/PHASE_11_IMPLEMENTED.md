# Phase 11 — Reviews + Contact/Messages + Notifications — IMPLEMENTED

Date: 2026-08-19

## Scope delivered
Phase 11 adds three connected communication systems without weakening the Phase 10 payment/security boundary.

### 1. Verified Customer reviews
- Public Restaurant reviews: `GET /api/restaurants/:slug/reviews`.
- Customer dashboard: `/dashboard/reviews`.
- One review per Customer per Restaurant.
- Eligibility requires either:
  - a completed reservation; or
  - a completed, paid Order.
- Rating is 1–5; title/body are bounded and rendered as plain React text.
- Public output exposes a privacy-safe display name only, never Customer email/phone.
- Restaurant Admin can reply only to reviews belonging to the assigned Restaurant.
- Restaurant Admin cannot hide/delete Customer reviews.
- Platform Admin can hide/republish reviews with a moderation reason.
- Customer is notified when the Restaurant replies or Platform Admin changes moderation state.

### 2. Contact / messages
- Public route: `/contact`.
- Public API: `POST /api/contact`.
- Signed-in Customer API: `POST /api/customer/contact`.
- Message target is explicit:
  - `platform`; or
  - one active Restaurant identified by slug.
- Restaurant-targeted messages are visible only to the Restaurant Admin assigned to that Restaurant.
- Platform-targeted messages are visible only to Platform Admin.
- Signed-in Customers can view their message history at `/dashboard/messages`.
- Anonymous users receive a high-entropy message reference and can check status using the same reference + email at `POST /api/contact/status`.
- Management can mark read/resolved and store a bounded response.
- Signed-in Customers receive an in-app notification when management records a reply.
- Contact copy explicitly asks users not to submit passwords, card data, government IDs or unnecessary sensitive information.

### 3. In-app notifications
- Customer page: `/dashboard/notifications`.
- Restaurant Admin page: `/restaurant-admin/notifications`.
- Read-one and mark-all-read actions.
- Notification links are restricted to safe site-relative paths.
- Notification retention: 180 days via TTL.
- Contact-message retention: 365 days via TTL.
- Notification events currently include:
  - Restaurant receives a verified review;
  - Restaurant receives a contact message;
  - Restaurant replies to a Customer review;
  - Platform moderation changes Customer review visibility;
  - management replies to a signed-in Customer contact message;
  - Restaurant Admin changes Order status;
  - Restaurant Admin changes Reservation status.

## New backend source
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

## New frontend source
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

## RBAC boundaries
### Customer
Can create/edit/delete only own reviews, submit messages, view only own signed-in messages and own notifications.

### Restaurant Admin
Can see/reply to reviews for `req.managedRestaurantId`, see/respond to Restaurant-targeted messages for that same Restaurant, and see only own notifications. Restaurant Admin cannot moderate review visibility.

### Platform Admin
Can moderate public review visibility and manage only Platform-targeted contact messages. Platform Admin does not gain Restaurant internal Order/Menu/3D controls.

## Security/privacy controls
- Contact-specific rate limiter: 12 submissions/checks per 15 minutes per client key.
- Existing trusted-Origin + `X-ReserveUrTime-Request` mutation checks remain active.
- Contact and authenticated inbox endpoints use `no-store`.
- Public review output omits Customer email/phone/IDs beyond the review ID itself.
- Contact PII is exposed only to the intended management scope.
- React renders review/contact text as escaped text; no HTML injection path was added.
- No new third-party animation dependency was introduced.
- Notifications use subtle CSS state only and respect reduced motion.

## Manual validation to run locally
1. Complete a reservation or completed+paid Order for a Customer.
2. Submit a review from `/dashboard/reviews`.
3. Confirm it appears on `/restaurant/:slug`.
4. Confirm only the assigned Restaurant Admin sees it and can reply.
5. Confirm Platform Admin can hide/republish it.
6. Submit both Platform and Restaurant contact messages.
7. Verify Restaurant/Platform inbox separation.
8. Verify signed-in message history and reply notifications.
9. Verify anonymous reference+email status lookup.
10. Change an Order/Reservation status and verify Customer notification.

## Next
Phase 12 — Cinematic UI/UX polish, responsive refinement, accessibility and motion-system consistency.
