import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listNotifications,
  countUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../services/notificationService.js";

export const unreadNotificationCount = asyncHandler(async (req, res) => {
  res.json({ unreadCount: await countUnreadNotifications(req.user._id) });
});

export const notifications = asyncHandler(async (req, res) => {
  const data = await listNotifications(req.user._id);
  res.json(data);
});

export const readNotification = asyncHandler(async (req, res) => {
  const notification = await markNotificationRead(req.user._id, req.params.notificationId);
  res.json({ message: "Notification marked read.", notification });
});

export const readAllNotifications = asyncHandler(async (req, res) => {
  const data = await markAllNotificationsRead(req.user._id);
  res.json({ message: "All notifications marked read.", ...data });
});
