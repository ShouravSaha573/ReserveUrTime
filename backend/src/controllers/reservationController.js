import crypto from "crypto";
import mongoose from "mongoose";
import { DiningTable } from "../models/DiningTable.js";
import { Reservation } from "../models/Reservation.js";
import { Restaurant } from "../models/Restaurant.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createReservationCheckout,
  releaseExpiredReservationHolds
} from "../services/reservationPaymentService.js";
import { availabilityForDate, RESERVATION_TIME_SLOTS, validateSelectedTables } from "../services/tableAvailabilityService.js";

export const TIME_SLOTS = RESERVATION_TIME_SLOTS;

function earliestReservationDate() {
  const nowInDhaka = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  const next = new Date(`${nowInDhaka}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

export function bookingReference() {
  return `RSV-${Date.now().toString(36).toUpperCase()}-${crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
}

export async function validateRequestData({
  restaurantId,
  reservationDate,
  timeSlot,
  guestCount
}) {
  if (!mongoose.isValidObjectId(restaurantId)) {
    return { error: "Invalid restaurant." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(reservationDate || ""))) {
    return { error: "Choose a valid reservation date." };
  }

  if (reservationDate < earliestReservationDate()) {
    return { error: "Reservations must be booked at least one day in advance." };
  }

  if (!TIME_SLOTS.includes(timeSlot)) {
    return { error: "Choose one of the available time slots." };
  }

  const guests = Number(guestCount);

  if (!Number.isInteger(guests) || guests < 1 || guests > 12) {
    return { error: "Guest count must be between 1 and 12." };
  }

  const restaurant = await Restaurant.findOne({
    _id: restaurantId,
    isActive: true
  }).select("_id name slug");

  if (!restaurant) {
    return { error: "Restaurant is unavailable." };
  }
  return { restaurant, guests };
}

export const checkAvailability = asyncHandler(async (req, res) => {
  const data = {
    restaurantId: req.params.restaurantId,
    reservationDate: req.query.date,
    timeSlot: req.query.timeSlot,
    guestCount: req.query.guestCount
  };
  const validated = await validateRequestData(data);
  if (validated.error) return res.status(400).json({ message: validated.error });
  await releaseExpiredReservationHolds();
  const availability = await availabilityForDate({
    restaurantId: validated.restaurant._id,
    date: data.reservationDate,
    guestCount: validated.guests
  });
  const selectedSlot = availability.slots.find((slot) => slot.timeSlot === data.timeSlot);
  res.json({ ...availability, ...selectedSlot, guestCount: validated.guests, date: data.reservationDate });
});
export const createReservation = asyncHandler(async (req, res) => {
  const data = {
    restaurantId: req.body.restaurantId,
    reservationDate: req.body.reservationDate,
    timeSlot: req.body.timeSlot,
    guestCount: req.body.guestCount
  };
  const validated = await validateRequestData(data);
  if (validated.error) return res.status(400).json({ message: validated.error });
  await releaseExpiredReservationHolds();
  const existing = await Reservation.exists({ userId: req.user._id, restaurantId: validated.restaurant._id, reservationDate: data.reservationDate, timeSlot: data.timeSlot, status: mongoose.trusted({ $in: ["pending", "confirmed"] }) });
  if (existing) return res.status(409).json({ message: "You already have an active reservation for this Restaurant, date and time." });
  const availability = await availabilityForDate({ restaurantId: validated.restaurant._id, date: data.reservationDate, guestCount: validated.guests });
  const slot = availability.slots.find((entry) => entry.timeSlot === data.timeSlot);
  const selection = validateSelectedTables(slot, req.body.selectedTableIds || slot.recommendedTableIds, validated.guests);
  if (selection.error) return res.status(409).json({ message: selection.error });
  try {
    const reservation = await Reservation.create({
      bookingReference: bookingReference(), userId: req.user._id, restaurantId: validated.restaurant._id,
      tableId: selection.selectedIds[0], tableIds: selection.selectedIds,
      reservationDate: data.reservationDate, timeSlot: data.timeSlot, guestCount: validated.guests, status: "confirmed",
      reservationKey: `${selection.selectedIds[0]}:${data.reservationDate}:${data.timeSlot}`,
      reservationKeys: selection.selectedIds.map((id) => `${id}:${data.reservationDate}:${data.timeSlot}`),
      customerSlotKey: `${req.user._id}:${validated.restaurant._id}:${data.reservationDate}:${data.timeSlot}`
    });
    const populated = await Reservation.findById(reservation._id).populate("restaurantId", "name slug location").populate("tableId", "tableNumber capacity area")
    .populate("tableIds", "tableNumber capacity area").populate("tableIds", "tableNumber capacity area").lean();
    return res.status(201).json({ message: "Reservation confirmed.", reservation: populated });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: "One of those tables was just booked. Choose another available table." });
    throw error;
  }
});
export const checkoutReservation = asyncHandler(async (req, res) => {
  const result = await createReservationCheckout(req.body, req.user);
  res.status(result.reused ? 200 : 201).json({
    message: result.reused ? "Existing payment session reused." : "Reservation held for 3 hours. Complete payment to confirm it.",
    ...result
  });
});

export const myReservations = asyncHandler(async (req, res) => {
  await releaseExpiredReservationHolds();
  const reservations = await Reservation.find({ userId: req.user._id })
    .populate("restaurantId", "name slug location")
    .populate("tableId", "tableNumber capacity area")
    .populate("tableIds", "tableNumber capacity area")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ reservations });
});

export const cancelReservation = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid reservation id." });
  }

  const reservation = await Reservation.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.user._id,
      status: mongoose.trusted({ $in: ["pending", "confirmed"] })
    },
    {
      $set: { status: "cancelled" },
      $unset: { reservationKey: 1, reservationKeys: 1, customerSlotKey: 1 }
    },
    { new: true, runValidators: true }
  )
    .populate("restaurantId", "name slug location")
    .populate("tableId", "tableNumber capacity area")
    .populate("tableIds", "tableNumber capacity area")
    .lean();

  if (!reservation) {
    const exists = await Reservation.exists({
      _id: req.params.id,
      userId: req.user._id
    });

    return res.status(exists ? 409 : 404).json({
      message: exists
        ? "This reservation changed and can no longer be cancelled."
        : "Reservation not found."
    });
  }

  res.json({
    message: "Reservation cancelled.",
    reservation
  });
});
