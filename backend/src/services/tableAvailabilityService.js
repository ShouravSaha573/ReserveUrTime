import mongoose from "mongoose";
import { DiningTable } from "../models/DiningTable.js";
import { Reservation } from "../models/Reservation.js";
import { Order } from "../models/Order.js";

export const RESERVATION_TIME_SLOTS = [
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
];

export function requiredTableCount(guestCount) {
  return Math.ceil(Number(guestCount) / 4);
}

function findTableCombination(tables, count, guests) {
  let match = null;
  function visit(start, chosen, capacity) {
    if (match) return;
    if (chosen.length === count) {
      if (capacity >= guests) match = [...chosen];
      return;
    }
    for (let index = start; index < tables.length; index += 1) {
      chosen.push(tables[index]);
      visit(index + 1, chosen, capacity + Number(tables[index].capacity || 0));
      chosen.pop();
      if (match) return;
    }
  }
  visit(0, [], 0);
  return match;
}

function activeReservationQuery(tableIds, date, timeSlot) {
  return {
    restaurantId: undefined,
    reservationDate: date,
    ...(timeSlot ? { timeSlot } : {}),
    $and: [
      { $or: [{ tableId: mongoose.trusted({ $in: tableIds }) }, { tableIds: mongoose.trusted({ $in: tableIds }) }] },
      { $or: [{ status: "confirmed" }, { status: "pending", heldUntil: mongoose.trusted({ $gt: new Date() }) }] }
    ]
  };
}

export async function releaseExpiredReservationLocks({ restaurantId = null, session = null } = {}) {
  const failedOrderQuery = Order.find({
    paymentStatus: "failed",
    ...(restaurantId ? { restaurantId } : {})
  }).select("_id");
  if (session) failedOrderQuery.session(session);
  const failedOrderIds = (await failedOrderQuery.lean()).map((order) => order._id);
  const releasable = [{ heldUntil: mongoose.trusted({ $lte: new Date() }) }];
  if (failedOrderIds.length) releasable.push({ orderId: mongoose.trusted({ $in: failedOrderIds }) });
  const filter = {
    status: "pending",
    ...(restaurantId ? { restaurantId } : {}),
    $or: releasable
  };
  const query = Reservation.updateMany(
    filter,
    {
      $set: { status: "cancelled", paymentStatus: "failed" },
      $unset: { reservationKey: 1, reservationKeys: 1, customerSlotKey: 1 }
    }
  );
  if (session) query.session(session);
  return query;
}

export async function availabilityForDate({ restaurantId, date, guestCount, session = null }) {
  await releaseExpiredReservationLocks({ restaurantId, session });
  const tableQuery = DiningTable.find({ restaurantId, isActive: true, status: "available" })
    .sort({ area: 1, tableNumber: 1 });
  if (session) tableQuery.session(session);
  const tables = await tableQuery.lean();
  const tableIds = tables.map((table) => table._id);
  const reservationQuery = activeReservationQuery(tableIds, date);
  reservationQuery.restaurantId = restaurantId;
  const query = Reservation.find(reservationQuery).select("tableId tableIds timeSlot");
  if (session) query.session(session);
  const reservations = await query.lean();
  const needed = requiredTableCount(guestCount);

  const slots = RESERVATION_TIME_SLOTS.map((timeSlot) => {
    const occupiedIds = new Set();
    for (const reservation of reservations) {
      if (reservation.timeSlot !== timeSlot) continue;
      if (reservation.tableId) occupiedIds.add(String(reservation.tableId));
      for (const tableId of reservation.tableIds || []) occupiedIds.add(String(tableId));
    }
    const availableTables = tables.filter((table) => !occupiedIds.has(String(table._id)));
    const recommended = findTableCombination(availableTables, needed, Number(guestCount));
    return {
      timeSlot,
      available: Boolean(recommended),
      availableTableCount: availableTables.length,
      recommendedTableIds: (recommended || []).map((table) => String(table._id)),
      tables: tables.map((table) => ({
        _id: String(table._id),
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        area: table.area || "Main Dining",
        available: !occupiedIds.has(String(table._id))
      }))
    };
  });

  return { requiredTableCount: needed, slots };
}

export function validateSelectedTables(slot, selectedTableIds, guestCount) {
  const selectedIds = [...new Set((selectedTableIds || []).map(String))];
  const needed = requiredTableCount(guestCount);
  if (selectedIds.length !== needed) {
    return { error: `Choose exactly ${needed} available table${needed === 1 ? "" : "s"}.` };
  }
  const tableById = new Map(slot.tables.map((table) => [String(table._id), table]));
  const selectedTables = selectedIds.map((id) => tableById.get(id));
  if (selectedTables.some((table) => !table || !table.available)) {
    return { error: "One or more selected tables are no longer available." };
  }
  const capacity = selectedTables.reduce((sum, table) => sum + Number(table.capacity || 0), 0);
  if (capacity < Number(guestCount)) {
    return { error: `The selected tables seat ${capacity}, fewer than ${guestCount} guests.` };
  }
  return { selectedIds, selectedTables, capacity };
}
