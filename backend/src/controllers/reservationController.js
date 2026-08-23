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

export const TIME_SLOTS = [
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30"
];

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

  const tables = await DiningTable.find({
    restaurantId,
    isActive: true,
    status: "available",
    capacity: mongoose.trusted({ $gte: guests })
  })
    .sort({ capacity: 1, tableNumber: 1 })
    .lean();

  if (!tables.length) {
    return { error: "No table can support this guest count." };
  }

  return { restaurant, tables, guests };
}

export const checkAvailability = asyncHandler(async (req, res) => {
  const data = {
    restaurantId: req.params.restaurantId,
    reservationDate: req.query.date,
    timeSlot: req.query.timeSlot,
    guestCount: req.query.guestCount
  };

  const validated = await validateRequestData(data);

  if (validated.error) {
    return res.status(400).json({ message: validated.error });
  }

  await releaseExpiredReservationHolds();

  const tableIds = validated.tables.map((table) => table._id);

  const occupied = await Reservation.find({
    tableId: mongoose.trusted({ $in: tableIds }),
    reservationDate: data.reservationDate,
    timeSlot: data.timeSlot,
    $or: [
      { status: "confirmed" },
      { status: "pending", heldUntil: mongoose.trusted({ $gt: new Date() }) }
    ]
  })
    .select("tableId")
    .lean();

  const occupiedIds = new Set(
    occupied.map((reservation) => reservation.tableId.toString())
  );

  const availableTables = validated.tables.filter(
    (table) => !occupiedIds.has(table._id.toString())
  );

  res.json({
    available: availableTables.length > 0,
    availableTableCount: availableTables.length,
    timeSlot: data.timeSlot
  });
});

export const createReservation = asyncHandler(async (req, res) => {
  const data = {
    restaurantId: req.body.restaurantId,
    reservationDate: req.body.reservationDate,
    timeSlot: req.body.timeSlot,
    guestCount: req.body.guestCount
  };

  const validated = await validateRequestData(data);

  if (validated.error) {
    return res.status(400).json({ message: validated.error });
  }

  await releaseExpiredReservationHolds();

  const existingActiveReservation = await Reservation.exists({
    userId: req.user._id,
    restaurantId: validated.restaurant._id,
    reservationDate: data.reservationDate,
    timeSlot: data.timeSlot,
    status: mongoose.trusted({ $in: ["pending", "confirmed"] })
  });

  if (existingActiveReservation) {
    return res.status(409).json({
      message: "You already have an active reservation for this Restaurant, date and time."
    });
  }

  // Try suitable tables from smallest to largest.
  // The unique reservationKey makes competing requests safe: only one insert wins.
  for (const table of validated.tables) {
    const reservationKey = `${table._id}:${data.reservationDate}:${data.timeSlot}`;

    try {
      const customerSlotKey =
        `${req.user._id}:${validated.restaurant._id}:${data.reservationDate}:${data.timeSlot}`;

      const reservation = await Reservation.create({
        bookingReference: bookingReference(),
        userId: req.user._id,
        restaurantId: validated.restaurant._id,
        tableId: table._id,
        reservationDate: data.reservationDate,
        timeSlot: data.timeSlot,
        guestCount: validated.guests,
        status: "confirmed",
        reservationKey,
        customerSlotKey
      });

      const populated = await Reservation.findById(reservation._id)
        .populate("restaurantId", "name slug location")
        .populate("tableId", "tableNumber capacity area")
        .lean();

      return res.status(201).json({
        message: "Reservation confirmed.",
        reservation: populated
      });
    } catch (error) {
      // Another request may have taken this exact table/date/slot first.
      if (error?.code === 11000) {
        if (error?.keyPattern?.customerSlotKey) {
          return res.status(409).json({
            message: "You already have an active reservation for this Restaurant, date and time."
          });
        }
        continue;
      }
      throw error;
    }
  }

  return res.status(409).json({
    message:
      "That time slot just became unavailable. Please choose another time."
  });
});

export const checkoutReservation = asyncHandler(async (req, res) => {
  const result = await createReservationCheckout(req.body, req.user);
  res.status(result.reused ? 200 : 201).json({
    message: result.reused ? "Existing payment session reused." : "Reservation held for 15 minutes. Complete payment to confirm it.",
    ...result
  });
});

export const myReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ userId: req.user._id })
    .populate("restaurantId", "name slug location")
    .populate("tableId", "tableNumber capacity area")
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
      $unset: { reservationKey: 1, customerSlotKey: 1 }
    },
    { new: true, runValidators: true }
  )
    .populate("restaurantId", "name slug location")
    .populate("tableId", "tableNumber capacity area")
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
