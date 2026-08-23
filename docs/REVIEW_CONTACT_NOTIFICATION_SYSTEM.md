# Review, Contact & Notification System

## Review flow
```text
Completed reservation OR completed paid Order
                ↓
Customer becomes review-eligible
                ↓
One Review per Customer + Restaurant
                ↓
Published publicly
                ↓
Restaurant Admin may reply
                ↓
Platform Admin may hide/republish
```

### Review ownership
- Customer owns review content.
- Restaurant Admin owns only the Restaurant reply.
- Platform Admin owns moderation visibility.
- Restaurant Admin cannot suppress criticism by changing review status.

## Contact flow
```text
Public / signed-in Customer
          ↓
Choose Platform or Restaurant target
          ↓
ContactMessage
      ↙          ↘
 Platform       Restaurant
 Admin inbox    Admin inbox
```

Signed-in Customer messages are linked to the Customer account and shown in `/dashboard/messages`.
Anonymous messages are not linked to an account. The sender receives a random reference and can check status using reference + email.

## Notification flow
```text
Domain event
   ↓
notificationService
   ↓
Notification(recipientUserId)
   ↓
Customer or Restaurant Admin inbox
```

Current domain events:
- review submitted → Restaurant Admin;
- Restaurant review reply → Customer;
- review moderation → Customer;
- Restaurant contact submitted → Restaurant Admin;
- management contact reply → signed-in Customer;
- Order status changed by Restaurant Admin → Customer;
- Reservation status changed by Restaurant Admin → Customer.

## Privacy rules
- Never put passwords/payment card data/government IDs in ContactMessage.
- Never show Customer email/phone in public reviews.
- Restaurant contact inbox is scoped to `req.managedRestaurantId`.
- Platform inbox never contains Restaurant-targeted messages.
- Notifications never contain payment secrets or detailed personal data.
- Notification `href` must be site-relative.
- Notification TTL: 180 days.
- ContactMessage TTL: 365 days.

## Out of scope in Phase 11
- transactional email/SMS delivery;
- push notifications;
- review images/video;
- public threaded review discussions;
- automated AI moderation;
- refund notifications beyond the future verified refund workflow.
