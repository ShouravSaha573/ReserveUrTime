import mongoose from "mongoose";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

function safeHref(value = "") {
  const href = String(value || "").trim();
  if (!href) return "";
  if (!href.startsWith("/") || href.startsWith("//") || href.includes("\\")) return "";
  return href.slice(0, 320);
}

export async function createNotification({ recipientUserId, restaurantId = null, type, title, message, href = "" }) {
  if (!recipientUserId) return null;
  return Notification.create({
    recipientUserId,
    restaurantId,
    type,
    title: String(title || "Update").trim().slice(0, 120),
    message: String(message || "").trim().slice(0, 320),
    href: safeHref(href)
  });
}

export async function notifyRestaurantAdmins(restaurantId, payload) {
  const admins = await User.find({
    role: "restaurant_admin",
    restaurantId,
    isActive: true
  }).select("_id").lean();

  if (!admins.length) return [];
  return Notification.insertMany(
    admins.map((admin) => ({
      recipientUserId: admin._id,
      restaurantId,
      type: payload.type,
      title: String(payload.title || "Update").slice(0, 120),
      message: String(payload.message || "").slice(0, 320),
      href: safeHref(payload.href)
    })),
    { ordered: false }
  );
}

export async function notifyPlatformAdmins(payload) {
  const admins = await User.find({ role: "platform_admin", isActive: true }).select("_id").lean();
  if (!admins.length) return [];
  return Notification.insertMany(admins.map((admin) => ({
    recipientUserId: admin._id,
    restaurantId: payload.restaurantId || null,
    type: payload.type,
    title: String(payload.title || "Update").slice(0, 120),
    message: String(payload.message || "").slice(0, 320),
    href: safeHref(payload.href)
  })), { ordered: false });
}

export async function listNotifications(userId, { limit = 60 } = {}) {
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 60));
  const notifications = await Notification.find({ recipientUserId: userId })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();
  const unreadCount = await Notification.countDocuments({ recipientUserId: userId, isRead: false });
  return { notifications, unreadCount };
}

export async function markNotificationRead(userId, notificationId) {
  if (!mongoose.isValidObjectId(notificationId)) {
    const error = new Error("Invalid notification id.");
    error.status = 400;
    throw error;
  }
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientUserId: userId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
  if (!notification) {
    const error = new Error("Notification not found.");
    error.status = 404;
    throw error;
  }
  return notification;
}

export async function markAllNotificationsRead(userId) {
  const now = new Date();
  await Notification.updateMany(
    { recipientUserId: userId, isRead: false },
    { $set: { isRead: true, readAt: now } }
  );
  return listNotifications(userId);
}

export async function countUnreadNotifications(userId) {
  return Notification.countDocuments({ recipientUserId: userId, isRead: false });
}
