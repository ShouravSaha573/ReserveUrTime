# DATABASE_SCHEMA.md — Target Schema

## USER
- `_id`, `name`, `email` unique, `passwordHash`
- `role`: `customer | platform_admin | restaurant_admin`
- `restaurantId` nullable; required for restaurant_admin
- `phone`, `isVerified`, `isActive`, timestamps

## RESTAURANT — platform-owned listing identity
- `_id`
- `name`
- `slug` unique
- `listingImageUrl`
- `logoUrl`
- `listingDescription`
- `cuisineSummary`
- `locationSummary`
- `isFeatured`
- `displayOrder`
- `isListed`
- `isActive`
- timestamps

## RESTAURANT_PROFILE — restaurant-owned interior
- `_id`
- `restaurantId` unique
- `about`
- `internalHeroImageUrl`
- `phone`, `email`, `address`
- `openingHours`
- `themeSettings` safe data only
- timestamps

## LISTING_CHANGE_REQUEST
- `_id`, `restaurantId`, `requestedByUserId`
- `requestType: restaurant_name | listing_image`
- current/proposed values/media
- `status`, reviewer/note/timestamps

## SITE_CONTENT / SITE_SETTING
Data-driven homepage/global content owned by Platform Admin.

## MENU_CATEGORY
`_id`, `restaurantId`, `name`, `slug`, `displayOrder`, `isActive`, timestamps.

## MENU_ITEM
- `_id`, `restaurantId`, `categoryId`
- `name`, `slug`, `description`, `ingredients[]`, `price`
- `imageUrl`, `modelUrl`, `modelPosterUrl`
- `modelType`, `modelSize`, `is3DEnabled`
- `explodedViewEnabled`
- `explodedLayers[]`: meshName, label, order, offsetX/Y/Z, rotateX/Y/Z, durationFactor
- `isAvailable`, timestamps

## FAVORITE — Phase 8 implemented
Customer-owned save record:
- `userId`;
- `targetType`: `restaurant` or `menu_item`;
- `restaurantId` for Restaurant favourites;
- `menuItemId` for dish favourites;
- timestamps.

Partial unique indexes enforce one saved copy per Customer/Restaurant and one saved copy per Customer/menu item. The service validates active Restaurant eligibility and active/available dish eligibility before saving.

## CART / CART_ITEM — Phase 9 implemented
`Cart` belongs to exactly one Customer and at most one active Restaurant at a time.
- `userId` unique -> User(Customer)
- `restaurantId` nullable -> Restaurant
- `items[]`: `menuItemId`, `quantity` (1–20)
- timestamps

Cart does **not** trust/store authoritative prices. The service reads current `MenuItem.price` and recalculates unit/line/subtotal values on every public cart response and again at checkout. Invalid/unavailable items are removed from the usable cart state.

## ORDER / ORDER_ITEM — Phase 9 implemented
- `orderNumber` unique public reference
- `checkoutKey` unique idempotency key
- `userId` -> Customer
- `restaurantId` -> Restaurant
- immutable `items[]` snapshots: menuItemId, name, slug, imageUrl, unitPrice, quantity, lineTotal, threeDEnabled
- immutable `customerSnapshot`
- immutable `restaurantSnapshot`
- `subtotal`, `total`, `currency=BDT`
- bounded optional `notes`
- `status`: placed | confirmed | preparing | ready | completed | cancelled
- `paymentStatus`: unpaid | pending | paid | failed | refunded
- `statusHistory[]`
- timestamps

Phase 9 Order creation + Cart clear run inside a MongoDB transaction. Phase 10 now links Orders to dedicated PaymentAttempt records and verified payment state.

## DINING_TABLE
`restaurantId`, `tableNumber`, `capacity`, `area`, `status`, `isActive`.

## RESERVATION
`bookingReference`, `userId`, `restaurantId`, `tableId`, date/time/guest/status, timestamps.

## PAYMENT
Customer/order/reservation reference, gateway, transaction ID unique, amount/currency/status/attempt/paidAt.

## GALLERY_ITEM / REVIEW / CONTACT_MESSAGE / AUDIT_LOG
Restaurant-scoped where applicable. Audit logs include actor role and restaurant scope when relevant.


# Phase 2B schema additions

## SITE_CONTENT / `SiteContent`
```text
_id
siteKey UNIQUE             # "homepage"
brand
  name
  homeLabel
  restaurantsLabel
  customerLoginLabel
  customerRegisterLabel
hero
  enabled
  eyebrow
  title
  titleAccent
  body
  browseCtaLabel
  browseCtaPath
  registerCtaLabel
  registerCtaPath
  searchEnabled
  searchPlaceholder
  mediaUrl
restaurantsSection
  enabled
  eyebrow
  title
  viewAllLabel
  viewAllPath
  featuredLimit
footer
  text
galaxy
  enabled
  density
  movement
  shineIntervalMs
  glowIntensity
sectionOrder[]
updatedBy -> USER
createdAt
updatedAt
```

## AUDIT_LOG / `AuditLog`
```text
_id
actorUserId -> USER
action
entityType
entityId
changes
ipAddress
createdAt
```

## RESTAURANT additions
```text
isFeatured      bool
featuredOrder   number
listingOrder    number
```

Indexing includes public active/listing sort and active/featured sort.

## Phase 3 additions

### RESTAURANT_PROFILE
- restaurantId — FK/unique -> Restaurant
- tagline
- aboutTitle
- aboutBody
- reservationNote
- internalPhone
- internalEmail
- internalOpeningHours
- websiteUrl
- timestamps

### LISTING_CHANGE_REQUEST
- restaurantId — FK -> Restaurant
- requestedBy — FK -> User (Restaurant Admin)
- type — `restaurant_name` | `listing_image`
- currentValue
- proposedValue
- note
- status — `pending` | `approved` | `rejected`
- reviewedBy — FK -> User (Platform Admin)
- reviewedAt
- adminNote
- appliedAt
- timestamps

Only one pending request per Restaurant + type is allowed at one time.

## Phase 4 additions

### MENU_CATEGORY
- restaurantId -> Restaurant, required/indexed
- name
- slug — unique together with restaurantId
- description
- displayOrder
- isActive
- timestamps

### MENU_ITEM — basic pre-3D dish
- restaurantId -> Restaurant, required/indexed
- categoryId -> MenuCategory
- name
- slug — unique together with restaurantId
- description
- ingredients[]
- price
- imageUrl
- displayOrder
- isAvailable
- isActive
- timestamps

Historical Phase 4 note: GLB/GLTF/model/exploded-layer fields were intentionally absent at that checkpoint. Phase 6 has since introduced the structured `threeD` metadata contract described below.

### GALLERY_ITEM
- restaurantId -> Restaurant
- title
- imageUrl
- altText
- caption
- displayOrder
- isPublished
- isActive
- timestamps

### DINING_TABLE operational rule
Restaurant Admin owns scoped CRUD/status. Removal is soft. Tables with upcoming pending/confirmed reservations cannot be disabled/removed until those bookings are resolved.

### RESERVATION operational rule
Restaurant Admin can list only its Restaurant reservations and apply allowed status transitions. Customer reservation records are preserved as history.

## Phase 6/7 3D metadata and Restaurant Admin animation control
Phase 6 introduced `MenuItem.threeD` for real GLB runtime metadata. Phase 7 expands the structured animation configuration so Restaurant Admin can safely edit the exploded behavior of the assigned Restaurant's own dishes.

```text
MENU_ITEM.threeD
  enabled                 bool
  modelUrl                string
  posterUrl               string
  modelScale              number
  cameraPosition          {x,y,z}
  cameraTarget            {x,y,z}
  explodedAnimation
    enabled               bool
    durationMs            bounded number
    staggerMs             bounded number
    easingPreset          allowlisted string
  layers[]
    meshName              stable GLB node name
    label                 string
    participates          bool
    order                 bounded integer
    explodedOffset        {x,y,z} bounded finite numbers
    durationFactor        optional bounded number
    rotationOffset        optional bounded {x,y,z}
```

The GLB stores assembled transforms. MongoDB must not duplicate absolute assembled layer positions. Restaurant Admin may update only validated animation metadata for MenuItems with `restaurantId == req.managedRestaurantId`.


## Phase 7 MenuItem 3D animation schema
`MenuItem.threeD` now includes `animation` with bounded `duration`, `stagger`, allowlisted `easing`, `autoAssemble`, `autoAssembleDelay`, `floatIntensity`, and `rotationIntensity`. Each `threeD.layers[]` entry includes `meshName`, `label`, `enabled`, `sequence`, and `explodedOffset {x,y,z}`. These remain Restaurant-owned internal configuration fields.

## Pre-Phase 10 security schema changes
### USER
- `authVersion: Number` — JWT revocation version; incremented when management credentials/role-critical assignment/active state change.

### RESERVATION
- `customerSlotKey: String` — sparse unique active-slot key preventing one Customer from reserving multiple tables at the same Restaurant/date/time. Removed when reservation is cancelled.

### ORDER
- `checkoutKey` is no longer globally unique by itself.
- unique compound index: `{ userId: 1, checkoutKey: 1 }`.
- `paymentStatus` remains `unpaid|pending|paid|failed|refunded`, but Phase 9 code cannot authoritatively mark paid.

### AUDIT_LOG
- new writes use `ipHash` (keyed hash), not raw `ipAddress`;
- `expiresAt` TTL timestamp (default retention 90 days);
- sensitive audit change keys are redacted before persistence;
- legacy `ipAddress` retained only as hidden compatibility field until `migrate:security` unsets it.

### Phase 10 implemented model
A dedicated `PaymentAttempt` stores non-card gateway transaction/session/verification metadata, expected amount/currency, state and idempotency fields. Never store PAN/CVV.



## PAYMENT_ATTEMPT — Phase 10
Fields:
- `provider = sslcommerz`;
- `environment = sandbox|live`;
- `orderId`, `userId`, `restaurantId`;
- `paymentKey` — Customer idempotency key;
- `transactionId` — globally unique SSLCOMMERZ `tran_id`, max 30 chars;
- `sessionKey` — server-only (`select:false`);
- `gatewayPageUrl` — server-only by default (`select:false`), returned only to owning Customer initiation flow;
- `amount`, `currency=BDT`;
- `status = creating|pending|verified_paid|risk_hold|failed|cancelled|expired|invalid|duplicate_paid`;
- `validationId`, `bankTransactionId` — server-only;
- `gatewayStatus`, `riskLevel`, `riskTitle`;
- `verifiedAt`, `lastNotificationAt`, `callbackCount`, `failureReason`;
- timestamps.

Indexes:
- unique `{ transactionId: 1 }`;
- unique `{ userId: 1, paymentKey: 1 }`;
- `{ orderId: 1, createdAt: -1 }`;
- `{ restaurantId: 1, createdAt: -1 }`;
- `{ status: 1, updatedAt: -1 }`.

### ORDER Phase 10 additions
- `activePaymentAttemptId`;
- `paymentTransactionId`;
- `paidAt`.

Gateway session/validation secrets do not live in Order. Restaurant Admin response serializers do not expose payment transaction secrets/reference internals unnecessarily.

### USER Phase 10 additions
`billingAddress` contains bounded customer-provided addressLine1/addressLine2/city/state/postcode/country fields for hosted payment session creation. It is authenticated Customer profile data and is not a public Restaurant field.


## Phase 11 collections

### REVIEW
- `_id`
- `userId` FK → USER
- `restaurantId` FK → RESTAURANT
- `rating` 1..5
- `title`
- `body`
- `status` = `published|hidden`
- `verifiedExperience`
- `eligibilitySource` = `completed_reservation|completed_paid_order`
- `restaurantReply{body,repliedBy,repliedAt}`
- moderation metadata
- unique `(userId, restaurantId)`

### CONTACT_MESSAGE
- `reference` unique
- `targetType` = `platform|restaurant`
- optional `restaurantId`
- optional `senderUserId`
- bounded sender name/email/subject/body
- `status` = `new|read|resolved`
- `response{body,respondedBy,respondedAt}`
- `expiresAt` TTL (~365 days)

### NOTIFICATION
- `recipientUserId` FK → USER
- optional `restaurantId`
- bounded `type/title/message/href`
- `isRead/readAt`
- TTL on `createdAt` (~180 days)

## MenuItem Photo Explode enhancement
`MenuItem` now also contains structured `photoExplode` metadata: `enabled`, `sourceImageUrl`, `layerCount`, `gap`, `depth`, `tilt`, `duration`, `stagger`, `easing`, `autoPreview`. True `threeD.layers[]` additionally supports `rotationOffset {x,y,z}` and `explodeScale`. All values are bounded by Mongoose/backend validation.



## Legacy MenuItem.categoryId repair rule
`MenuItem.categoryId` is an ObjectId reference to `MenuCategory`. Some earlier development records may contain a legacy string slug. Public reads now tolerate this without `populate()` CastError, while `npm run repair:demo-runtime` converts known demo slug references to the correct ObjectId. New Restaurant Admin writes continue to require valid owned MenuCategory IDs.

## Legacy menu compatibility boundary
Current `MenuItem.categoryId` remains an ObjectId in the canonical schema. Historical development documents may contain old category slugs/strings. Public Restaurant/menu/3D reads therefore use native Mongo collection reads and an explicit safe category join instead of relying on Mongoose hydration/populate. This is read compatibility only; `repair:demo-runtime` normalizes canonical demo data back to real ObjectIds. `MenuItem.threeD` remains the Restaurant Admin-owned choreography metadata, while the bundled GLB is the assembled geometry source of truth.

