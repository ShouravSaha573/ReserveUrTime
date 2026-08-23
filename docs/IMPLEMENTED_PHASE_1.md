# IMPLEMENTED_PHASE_1.md

## Why this phase comes first

The project blueprint explicitly says not to jump to the heavy 3D layer before authentication, data, navigation, and reservation logic are stable.

This phase therefore establishes the foundation that later 3D, cart, payment, and CMS work will depend on.

## User Management — DONE

- Customer registration
- Customer login
- Customer logout
- `/api/auth/me`
- Secure HTTP-only JWT authentication cookie
- bcrypt password hashing
- Customer role forced server-side during registration
- Separate `/admin/login`
- Admin role verified on Express backend
- No public admin registration

## Feature 1 — Restaurant Discovery — DONE

- Public homepage
- Ambient mouse-follow glow
- Restaurant list fetched from MongoDB
- Individual restaurant detail page
- Public access without login
- Hongbao-inspired discovery structure
- Ikoyi-inspired restrained individual restaurant page

## Feature 2 — Table Reservation — DONE

- Customer login required
- Guest redirected to login, then returned to booking
- Date/time/guest validation
- Availability check
- Automatic table selection
- Active slot conflict protection
- Unique booking reference
- My Reservations
- Cancel reservation
- Form draft persistence
- Loading/error/network states

## Separate Admin Authentication — DONE (foundation)

- Admin seed account
- Separate login page
- Admin-only API middleware
- Minimal admin dashboard summary

Full Admin CMS CRUD is intentionally not part of this phase.

## Deferred

- Full real 3D menu
- Menu search/filter
- Favourites
- Cart/orders
- Payment sandbox
- Admin CRUD CMS
