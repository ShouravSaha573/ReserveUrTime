# RESERVATION_SYSTEM.md

## Current State
Already implemented: login gate, availability check, automatic suitable table assignment, conflict protection, booking reference, customer history and cancellation.

## Future Restaurant Admin Extension
Restaurant Admin may manage reservations only for assigned restaurant:
- view schedule;
- confirm/cancel/complete where policy allows;
- manage table status;
- never query/write another restaurant's reservation.

Platform Admin has no reservation write capability.

## Pre-Phase 10 reservation security hardening
- Customer cancellation is a conditional atomic update; stale/concurrent changes return `409`.
- Restaurant Admin status updates are conditional on the previously-read status and Restaurant scope; concurrent change returns `409`.
- active reservations store `reservationKey` for table/date/time uniqueness and `customerSlotKey` for Customer/Restaurant/date/time uniqueness.
- cancellation removes both keys so future valid reservations can use the released slot.
- create flow includes a legacy-row pre-check plus unique-key race protection.

