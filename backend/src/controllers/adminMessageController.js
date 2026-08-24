import { asyncHandler } from "../utils/asyncHandler.js";
import { conversation, platformThreads, sendAdminMessage, unreadAdminMessageCount } from "../services/adminMessageService.js";

export const restaurantAdminConversation = asyncHandler(async (req, res) => res.json(await conversation(req.managedRestaurantId, "restaurant_admin")));
export const sendRestaurantAdminMessage = asyncHandler(async (req, res) => res.status(201).json({ message: await sendAdminMessage({ user: req.user, restaurantId: req.managedRestaurantId, body: req.body?.body }) }));
export const listPlatformAdminThreads = asyncHandler(async (req, res) => res.json({ threads: await platformThreads() }));
export const platformAdminConversation = asyncHandler(async (req, res) => res.json(await conversation(req.params.restaurantId, "platform_admin")));
export const sendPlatformAdminMessage = asyncHandler(async (req, res) => res.status(201).json({ message: await sendAdminMessage({ user: req.user, restaurantId: req.params.restaurantId, body: req.body?.body }) }));
export const adminMessageUnreadCount = asyncHandler(async (req, res) => res.json({ unreadCount: await unreadAdminMessageCount(req.user) }));