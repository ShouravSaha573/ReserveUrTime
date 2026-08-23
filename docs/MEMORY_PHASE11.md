# MEMORY_PHASE11

Phase 11 is complete.

Canonical status:
- Reviews are verified-experience only: completed reservation or completed paid Order.
- One Customer review per Restaurant.
- Public reviews hide Customer email/phone and use a privacy-safe display name.
- Restaurant Admin can reply only for the assigned Restaurant and cannot hide/delete reviews.
- Platform Admin can hide/republish reviews with a moderation reason.
- `/contact` supports Platform or Restaurant targeting.
- Restaurant contact messages are Restaurant-scoped; Platform messages are Platform Admin-only.
- Signed-in Customers have `/dashboard/messages`; anonymous users can check a message using reference + email.
- Customer and Restaurant Admin have in-app notification pages with read/unread state.
- Notifications are generated for review/contact replies plus Restaurant Admin Order/Reservation status changes.
- Notification TTL = 180 days; ContactMessage TTL = 365 days.
- No new heavy animation dependency was added in Phase 11.
- Phase 12 is NEXT: cinematic UI/UX polish, responsive/accessibility refinement and motion consistency.


## Post-Phase 11 Motion checkpoint
Phase 11 remains complete. Before Phase 12, Motion for React + Photo Explode and more detailed GLB layer rotation/scale choreography were implemented. See `MEMORY_MOTION_PHOTO_EXPLODE.md`.
