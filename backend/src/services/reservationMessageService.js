import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Reservation } from "../models/Reservation.js";
import { ReservationMessage } from "../models/ReservationMessage.js";
import { createNotification, notifyRestaurantAdmins } from "./notificationService.js";

function appError(message, status) {
  return Object.assign(new Error(message), { status });
}

function validId(value) {
  if (!mongoose.isValidObjectId(value)) throw appError("Invalid order id.", 400);
}

function cleanBody(value) {
  const body = String(value || "").trim();
  if (body.length < 1 || body.length > 1200) throw appError("Message must be between 1 and 1200 characters.", 400);
  return body;
}

export function reservationExpiry(reservation) {
  return new Date(Date.parse(String(reservation.reservationDate) + "T" + String(reservation.timeSlot) + ":00+06:00"));
}

function conversationState(reservation) {
  const expiresAt = reservationExpiry(reservation);
  return {
    expiresAt,
    canMessage: ["pending", "confirmed"].includes(reservation.status) && Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() > Date.now()
  };
}

async function contextForOrder(orderId, scope) {
  validId(orderId);
  const query = { _id: orderId, reservationId: mongoose.trusted({ $ne: null }) };
  if (scope.customerUserId) query.userId = scope.customerUserId;
  if (scope.restaurantId) query.restaurantId = scope.restaurantId;
  const order = await Order.findOne(query).select("_id userId restaurantId reservationId orderNumber restaurantSnapshot customerSnapshot").lean();
  if (!order) throw appError("Reservation order not found.", 404);
  const reservation = await Reservation.findOne({ _id: order.reservationId, orderId: order._id }).lean();
  if (!reservation) throw appError("Reservation not found.", 404);
  return { order, reservation, ...conversationState(reservation) };
}

async function messagesFor(orderId) {
  return ReservationMessage.find({ orderId })
    .sort({ createdAt: 1 })
    .select("_id senderRole body createdAt")
    .lean();
}

export async function customerConversation(userId, orderId) {
  const context = await contextForOrder(orderId, { customerUserId: userId });
  await ReservationMessage.updateMany({ orderId: context.order._id, senderRole: "restaurant_admin", readByCustomerAt: null }, { $set: { readByCustomerAt: new Date() } });
  return { orderId: context.order._id, orderNumber: context.order.orderNumber, messages: await messagesFor(orderId), expiresAt: context.expiresAt, canMessage: context.canMessage };
}

export async function sendCustomerReservationMessage(userId, orderId, value) {
  const context = await contextForOrder(orderId, { customerUserId: userId });
  if (!context.canMessage) throw appError("Messaging closed when the reservation time expired or the reservation became inactive.", 409);
  const message = await ReservationMessage.create({
    reservationId: context.reservation._id,
    orderId: context.order._id,
    restaurantId: context.order.restaurantId,
    customerUserId: userId,
    senderUserId: userId,
    senderRole: "customer",
    body: cleanBody(value),
    readByCustomerAt: new Date()
  });
  await notifyRestaurantAdmins(context.order.restaurantId, {
    type: "reservation_message",
    title: "New reservation message",
    message: (context.order.customerSnapshot?.name || "A guest") + " sent a message for " + context.order.orderNumber + ".",
    href: "/restaurant-admin/reservation-messages"
  });
  return message;
}

export async function listRestaurantConversations(restaurantId) {
  await ReservationMessage.updateMany({ restaurantId, senderRole: "customer", readByRestaurantAt: null }, { $set: { readByRestaurantAt: new Date() } });
  const rows = await ReservationMessage.aggregate([
    { $match: { restaurantId: new mongoose.Types.ObjectId(String(restaurantId)) } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$orderId", lastMessageAt: { $first: "$createdAt" } } },
    { $sort: { lastMessageAt: -1 } },
    { $limit: 100 }
  ]);
  if (!rows.length) return [];

  const orders = await Order.find({ _id: mongoose.trusted({ $in: rows.map((row) => row._id) }), restaurantId })
    .select("_id orderNumber reservationId customerSnapshot reservationSnapshot")
    .lean();
  if (!orders.length) return [];

  const orderMap = new Map(orders.map((order) => [String(order._id), order]));
  const reservations = await Reservation.find({ _id: mongoose.trusted({ $in: orders.map((order) => order.reservationId).filter(Boolean) }) }).lean();
  const reservationMap = new Map(reservations.map((reservation) => [String(reservation._id), reservation]));
  return Promise.all(rows.flatMap((row) => {
    const order = orderMap.get(String(row._id));
    if (!order) return [];
    const reservation = reservationMap.get(String(order.reservationId));
    if (!reservation) return [];
    const state = conversationState(reservation);
    return [Promise.resolve(messagesFor(order._id)).then((messages) => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      guestName: order.customerSnapshot?.name || "Guest",
      reservation: order.reservationSnapshot,
      lastMessageAt: row.lastMessageAt,
      expiresAt: state.expiresAt,
      canMessage: state.canMessage,
      messages
    }))];
  }));
}

export async function restaurantConversation(restaurantId, orderId) {
  const context = await contextForOrder(orderId, { restaurantId });
  return { orderId: context.order._id, messages: await messagesFor(orderId), expiresAt: context.expiresAt, canMessage: context.canMessage };
}

export async function sendRestaurantReservationMessage(adminUserId, restaurantId, orderId, value) {
  const context = await contextForOrder(orderId, { restaurantId });
  if (!context.canMessage) throw appError("Messaging closed when the reservation time expired or the reservation became inactive.", 409);
  const message = await ReservationMessage.create({
    reservationId: context.reservation._id,
    orderId: context.order._id,
    restaurantId,
    customerUserId: context.order.userId,
    senderUserId: adminUserId,
    senderRole: "restaurant_admin",
    body: cleanBody(value),
    readByRestaurantAt: new Date()
  });
  await createNotification({
    recipientUserId: context.order.userId,
    restaurantId,
    type: "reservation_message",
    title: "Restaurant replied",
    message: (context.order.restaurantSnapshot?.name || "Your restaurant") + " replied about " + context.order.orderNumber + ".",
    href: "/dashboard/orders"
  });
  return message;
}
export async function customerReservationUnreadCounts(userId) {
  const rows = await ReservationMessage.aggregate([
    { $match: { customerUserId: new mongoose.Types.ObjectId(String(userId)), senderRole: "restaurant_admin", readByCustomerAt: null } },
    { $group: { _id: "$orderId", count: { $sum: 1 } } }
  ]);
  return Object.fromEntries(rows.map((row) => [String(row._id), row.count]));
}

export async function restaurantReservationUnreadCount(restaurantId) {
  return ReservationMessage.countDocuments({ restaurantId, senderRole: "customer", readByRestaurantAt: null });
}