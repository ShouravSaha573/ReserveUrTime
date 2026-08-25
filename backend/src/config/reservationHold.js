export const RESERVATION_PAYMENT_HOLD_HOURS = 3;
export const RESERVATION_PAYMENT_HOLD_MS =
  RESERVATION_PAYMENT_HOLD_HOURS * 60 * 60 * 1000;

export function reservationHoldDeadline(now = Date.now()) {
  return new Date(now + RESERVATION_PAYMENT_HOLD_MS);
}
