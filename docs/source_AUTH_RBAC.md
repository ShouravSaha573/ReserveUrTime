# AUTH_RBAC.md

## Roles
- `customer`
- `platform_admin`
- `restaurant_admin`
- guest is unauthenticated.

## Login Routes
- `/customer/login`
- `/platform-admin/login`
- `/restaurant-admin/login`

No public Platform Admin or Restaurant Admin registration.

## User fields
Restaurant Admin must have a valid assigned `restaurantId` before restaurant management access is granted.

## Middleware
- `authenticateUser`
- `requireCustomer`
- `requirePlatformAdmin`
- `requireRestaurantAdmin`
- `requireManagedRestaurant` / scoped query helper
- `validateRequest`

## Matrix
| Capability | Guest | Customer | Platform Admin | Restaurant Admin |
|---|---:|---:|---:|---:|
| Browse homepage/restaurants/menu | Yes | Yes | Yes | Yes |
| Book/favourite/checkout | Login | Yes | No customer action by role | No customer action by role |
| Customer dashboard | No | Yes | No | No |
| Platform homepage CMS | No | No | Yes | No |
| Platform restaurant listing CRUD | No | No | Yes | No |
| Create/edit/remove Restaurant Admin accounts | No | No | Yes | No |
| Assign/reassign Restaurant Admin to Restaurant | No | No | Yes | No |
| Approve listing name/image request | No | No | Yes | No |
| Direct platform name/image edit | No | No | Yes | No |
| Submit name/image change request | No | No | No | Yes, own restaurant |
| Internal restaurant menu/3D CRUD | No | No | **No** | Yes, own restaurant |
| Edit per-dish 3D Exploded Layers animation | No | No | **No** | Yes, own restaurant only |
| Tables/reservations/order operations | No | No | **No** | Yes, own restaurant |

## Security Rule
A hidden button is not authorization. Every protected API repeats role + restaurant scope checks on the server.

## Phase 3 ownership rule
Restaurant Admin profile and listing-request APIs derive scope only from the authenticated user's `restaurantId`. A Restaurant Admin cannot choose another Restaurant ID through route/body/query input. Platform Admin owns approval of public Restaurant name/listing image requests.

## Phase 4 operational RBAC
Restaurant Admin operational endpoints are mounted only under `/api/restaurant-admin/*` after `authenticateUser`, `requireRestaurantAdmin`, and `requireManagedRestaurant`.

The effective Restaurant scope comes from the authenticated `User.restaurantId`; operational controllers force writes to `req.managedRestaurantId`.

Platform Admin does not receive Restaurant Menu Category, Dish, Dining Table, operational Reservation or Gallery CRUD endpoints.

## Phase 7 3D animation RBAC rule
The 3D animation editor is Restaurant-internal operational configuration. Every write must pass `authenticateUser` → `requireRestaurantAdmin` → `requireManagedRestaurant`, then query/update the MenuItem with both `_id`/slug and `restaurantId: req.managedRestaurantId`. Platform Admin receives no bypass route.


## Phase 7 3D RBAC
Restaurant Admin 3D-animation routes require `authenticateUser`, `requireRestaurantAdmin`, and `requireManagedRestaurant`. The target `MenuItem` query includes both `_id` and server-derived `restaurantId=req.managedRestaurantId`. Platform Admin has no route to edit Restaurant-internal 3D animation configuration.


## Phase 8 Customer personal-area enforcement
All `/api/customer/*` endpoints use `authenticateUser` + `requireCustomer`. Public browsing remains public, but favourite writes, Customer dashboard data and Customer profile edits require a Customer session. Platform Admin and Restaurant Admin have no Customer-favourite mutation APIs. Unauthenticated Save controls redirect to Customer Login with a safe local `returnTo` path.


## Phase 9 cart/order RBAC
All Customer cart/order endpoints are under `/api/customer/*` after `authenticateUser` + `requireCustomer`; ownership always comes from `req.user._id`. The client cannot submit another Customer ID.

Restaurant Admin order endpoints are under `/api/restaurant-admin/orders*` after `authenticateUser` + `requireRestaurantAdmin` + `requireManagedRestaurant`. Every list/update query includes server-derived `req.managedRestaurantId`. Restaurant Admin cannot query or mutate another Restaurant's Orders and cannot set payment status. Platform Admin has no Restaurant-internal order-management route.

## Pre-Phase 10 authentication/RBAC hardening
- JWT contains `ver=User.authVersion`; authenticated requests reload `+authVersion` and reject stale sessions.
- Platform Admin changes that alter Restaurant Admin email/password/assignment/active state revoke old sessions.
- unsafe browser mutations require the ReserveUrTime request marker plus trusted Origin; this is independent of role authorization.
- production cookie uses `__Host-reserveurtime_session`, HttpOnly and Secure.
- production startup refuses development JWT/admin secrets.
- Restaurant Admin remains scoped from authenticated `restaurantId`; browser-provided Restaurant IDs are not authority.
- Restaurant Admin cannot change Order `paymentStatus` and receives no paid/refund override; Phase 10 keeps gateway state read-only for Restaurant Admin.

SSLCOMMERZ server-to-server callbacks are a separate trust boundary: they must use gateway validation, not a blanket exemption from browser security middleware.



## Phase 10 payment RBAC/trust boundary
### Customer initiation/reconciliation
Routes under `/api/customer/orders/:orderId/payments/sslcommerz*` execute after `authenticateUser + requireCustomer`. Payment services query the Order by both `_id` and authenticated `userId`; the browser cannot nominate another Customer.

### SSLCOMMERZ gateway callbacks
Only these exact unauthenticated gateway routes exist:
- `/api/payments/sslcommerz/ipn`;
- `/api/payments/sslcommerz/success`;
- `/api/payments/sslcommerz/fail`;
- `/api/payments/sslcommerz/cancel`.

They do not use Customer cookies and are mounted before browser Origin-marker enforcement. This is not a payment-auth bypass: the callback payload is only a hint. Backend server-to-server validation/query must match the stored PaymentAttempt/Order/amount/BDT before financial state changes.

### Restaurant Admin
Restaurant Admin order access remains scoped by `req.managedRestaurantId`. Payment status is display-only. Non-cancel fulfilment transitions require `paymentStatus=paid`; unpaid/failed orders can only follow the bounded cancellation rule, pending cannot be fulfilled/cancelled casually, and paid cancellation requires a future verified refund workflow.

### Platform Admin
Platform Admin has no direct Restaurant operational payment-status mutation route.


## Phase 11 RBAC
- Customer: own reviews, own signed-in messages, own notifications only.
- Restaurant Admin: reviews/messages scoped to authenticated `restaurantId`; may reply to reviews but cannot hide/delete Customer reviews.
- Platform Admin: may moderate review visibility and manage Platform-targeted messages; does not gain Restaurant-internal operational controls.
- Anonymous visitor: may submit ContactMessage and check only by matching message reference + original email.

## Restaurant Admin image/animation ownership
Restaurant Admin image upload, Photo Explode GET/PATCH, and existing true-3D animation writes all execute after `authenticateUser + requireRestaurantAdmin + requireManagedRestaurant`. The backend scopes target MenuItems by `_id + req.managedRestaurantId`; a browser-supplied Restaurant ID is not authorization. Platform Admin has no Restaurant-internal Photo Explode or GLB animation editor.

## 3D editor corrective boundary
The legacy-data runtime fix does not weaken ownership. Restaurant Admin 3D/Photo/image writes still derive the Restaurant from authenticated `req.managedRestaurantId`, validate the target MenuItem ID and enforce safe animation/image payload limits. Raw collection access is used only to avoid unrelated Mongoose casting of historical fields; it is not a bypass around role or Restaurant scoping.

