# RESTAURANT_SYSTEM.md

## Two-layer Restaurant Model
### RESTAURANT — Platform-owned public listing identity
Contains fields used by homepage/Restaurants tab such as name, slug, listing image, short listing description, featured/listed state and ordering.

### RESTAURANT_PROFILE — Restaurant-managed interior
Contains about text, internal hero media, detailed contact/hours and other restaurant-page interior content that Restaurant Admin may edit directly.

This separation prevents Platform Admin from accidentally becoming an operational restaurant admin and prevents Restaurant Admin from bypassing listing approval.

## Public Restaurant Page
Ikoyi-inspired restrained presentation:
Hero → About → 3D Menu → Gallery → Reviews → Reservation → Location/Hours.

## Scope Rule
Every internal resource has `restaurantId`, and backend queries derive/verify restaurant scope.


## Public directory search
The platform-level Restaurant directory supports public search across approved/active Restaurant `name` and `cuisine`. This is Platform directory data and does not grant Platform Admin access to Restaurant-internal menu data.

## Phase 3 split
- Platform listing identity remains in `Restaurant`.
- Restaurant-owned internal profile lives in `RestaurantProfile`.
- Public name and listing image requested by Restaurant Admin use `ListingChangeRequest` and Platform Admin approval.
- Approval changes only the requested field. Restaurant slug remains stable when the public name changes.

## Phase 4 Restaurant Internal Operations
Restaurant Admin now owns Restaurant-scoped operational CRUD for:
- Menu Categories;
- basic Dishes;
- Dining Tables;
- reservation schedule/status;
- internal Gallery.

Every operational query/write uses the authenticated `req.managedRestaurantId`. No Restaurant ID selector is accepted as authority from the browser.

Soft removal preserves Restaurant operational/history data. Platform Admin receives no equivalent operational CRUD routes.

## Restaurant Admin 3D animation configuration
Beginning in Phase 7, a Restaurant Admin must be able to edit the exploded-layer animation of 3D-enabled MenuItems in the assigned Restaurant.

Per-dish controls are structured and bounded: participating mesh names, exploded XYZ offsets, layer order, duration, stagger/delay, allowlisted easing, preview and reset. The server derives Restaurant scope from authentication and rejects arbitrary executable animation code. Platform Admin receives no equivalent editor.


## Phase 7 Restaurant-owned 3D behavior
The full public 3D menu reads Restaurant Admin-owned dish 3D configuration. Restaurant Admin can change only animation metadata for existing 3D-enabled dishes in the assigned Restaurant: participating named layers, order, XYZ offsets, timing/easing and bounded idle presentation. Public users receive only active+available+3D-enabled dishes.


## Phase 9 Restaurant order ownership
An Order belongs to one Restaurant. Customer cart cannot mix Restaurants. At checkout the backend snapshots Restaurant identity and all order item values. Restaurant Admin order list/update queries always include `restaurantId=req.managedRestaurantId`; Platform Admin does not manage Restaurant-internal order operations.

## Pre-Phase 10 Restaurant/privacy hardening
- Restaurant public media writes use safe relative paths or exact HTTPS origins from `MEDIA_ALLOWED_ORIGINS`; arbitrary tracking-pixel origins are rejected by default.
- legacy `RestaurantProfile.internalPhone/internalEmail/internalOpeningHours` storage names are compatibility fields but their product meaning is public customer-facing contact/hours. The Restaurant Admin UI now states this explicitly.
- Restaurant Admin Order responses are minimized to operational Customer name/phone; Customer login email and status-history actor identity are not returned.
- Restaurant Admin order status writes are Restaurant-scoped and concurrency-safe; payment state remains outside Restaurant Admin authority.



## Phase 10 Restaurant order/payment boundary
Restaurant Admin still owns only Restaurant-scoped fulfilment operations. Payment truth is owned by the gateway-backed PaymentAttempt/Order payment service. Restaurant Admin can view `paymentStatus` but cannot set it. Non-cancel fulfilment transitions require `paymentStatus=paid`; pending payment cannot be casually cancelled/fulfilled; paid cancellation/refund requires a future verified gateway refund workflow.


## Phase 11 Restaurant communication
Restaurant Admin now owns communication operations for the assigned Restaurant only:
- view verified Customer reviews;
- publish/edit the Restaurant reply;
- view/respond to Restaurant-targeted ContactMessages;
- view/read own in-app notifications.

Restaurant Admin cannot hide/delete Customer reviews and cannot read Platform-targeted messages. Platform Admin owns review visibility moderation and Platform messages.

## Dish image animation ownership
Restaurant Admin can upload/manage a dish image and tune that own Restaurant dish's Photo Explode settings. A qualifying normal image becomes a public 2.5D Motion layered animation. True ingredient-separated GLB animation remains separately configurable in the 3D Animation Editor.



## Phase 12 cinematic UX
Completed: Motion/CSS shared cinematic chrome, accessible mobile navigation, skip-to-content/route announcements, Restaurant-card reveal/perspective/sheen, focus/touch/mobile navigation refinements and reduced-motion/transparency fallbacks. No business/RBAC/payment/Restaurant ownership behavior changed. Phase 13 is NEXT.

## Signature 3D runtime guarantee
For the canonical Ember House demo set, ReserveUrTime treats the bundled Phase 7 GLB manifest as the minimum runtime definition of the signature exploded experience. A stale old Atlas record may override known safe values through Restaurant Admin settings, but missing legacy metadata must not remove the canonical model/layer set. Public reads merge canonical named meshes with valid stored overrides; demo repair remains available to normalize the database.

