import mongoose from "mongoose";
import { AdminMessage } from "../models/AdminMessage.js";
import { Restaurant } from "../models/Restaurant.js";
import { notifyPlatformAdmins, notifyRestaurantAdmins } from "./notificationService.js";
import { publishAdminMessage } from "../realtime/adminMessageHub.js";

function validId(value, label = "record") {
  if (!mongoose.isValidObjectId(value)) { const error = new Error(`Invalid ${label} id.`); error.status = 400; throw error; }
  return value;
}
function cleanBody(value) {
  const body = String(value || "").trim().replace(/\r\n/g, "\n");
  if (!body) { const error = new Error("Write a message first."); error.status = 400; throw error; }
  if (body.length > 2000) { const error = new Error("Messages may contain up to 2,000 characters."); error.status = 400; throw error; }
  return body;
}
const serialize = (message) => ({ _id: message._id, restaurantId: message.restaurantId, senderUserId: message.senderUserId, senderRole: message.senderRole, senderName: message.senderUserId?.name || (message.senderRole === "platform_admin" ? "Platform Admin" : "Restaurant Admin"), body: message.body, createdAt: message.createdAt });

export async function conversation(restaurantId, viewerRole) {
  validId(restaurantId, "restaurant");
  const restaurant = await Restaurant.findById(restaurantId).select("name slug isActive").lean();
  if (!restaurant) { const error = new Error("Restaurant not found."); error.status = 404; throw error; }
  const readField = viewerRole === "platform_admin" ? "readByPlatformAt" : "readByRestaurantAt";
  const otherRole = viewerRole === "platform_admin" ? "restaurant_admin" : "platform_admin";
  await AdminMessage.updateMany({ restaurantId, senderRole: otherRole, [readField]: null }, { $set: { [readField]: new Date() } });
  const messages = await AdminMessage.find({ restaurantId }).sort({ createdAt: 1 }).limit(500).populate("senderUserId", "name").lean();
  return { restaurant, messages: messages.map(serialize) };
}

export async function platformThreads() {
  const rows = await AdminMessage.aggregate([{ $sort: { createdAt: -1 } }, { $group: { _id: "$restaurantId", lastMessageAt: { $first: "$createdAt" }, lastBody: { $first: "$body" }, unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ["$senderRole", "restaurant_admin"] }, { $eq: ["$readByPlatformAt", null] }] }, 1, 0] } } } }, { $sort: { lastMessageAt: -1 } }]);
  const restaurants = await Restaurant.find({ isActive: true }).select("name slug").sort({ name: 1 }).lean();
  const rowMap = new Map(rows.map((row) => [String(row._id), row]));
  return restaurants.map((restaurant) => {
    const row = rowMap.get(String(restaurant._id));
    return {
      restaurant,
      lastMessageAt: row?.lastMessageAt || null,
      lastBody: row?.lastBody || "No messages yet — start a conversation.",
      unreadCount: row?.unreadCount || 0
    };
  }).sort((a, b) => {
    if (a.lastMessageAt && b.lastMessageAt) return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    return a.restaurant.name.localeCompare(b.restaurant.name);
  });
}


export async function unreadAdminMessageCount(user) {
  const query = user.role === "platform_admin"
    ? { senderRole: "restaurant_admin", readByPlatformAt: null }
    : { restaurantId: user.restaurantId, senderRole: "platform_admin", readByRestaurantAt: null };
  return AdminMessage.countDocuments(query);
}
export async function sendAdminMessage({ user, restaurantId, body }) {
  validId(restaurantId, "restaurant");
  const message = await AdminMessage.create({ restaurantId, senderUserId: user._id, senderRole: user.role, body: cleanBody(body), ...(user.role === "platform_admin" ? { readByPlatformAt: new Date() } : { readByRestaurantAt: new Date() }) });
  await message.populate("senderUserId", "name");
  const plain = serialize(message.toObject());
  publishAdminMessage(plain);
  if (user.role === "restaurant_admin") {
    await notifyPlatformAdmins({ restaurantId, type: "platform_message", title: "Restaurant Admin message", message: `${user.name} sent a support message.`, href: `/platform-admin/admin-messages?restaurantId=${restaurantId}` });
  } else {
    await notifyRestaurantAdmins(restaurantId, { type: "platform_message", title: "Platform Admin message", message: "Platform Admin replied to your support conversation.", href: "/restaurant-admin/admin-messages" });
  }
  return plain;
}