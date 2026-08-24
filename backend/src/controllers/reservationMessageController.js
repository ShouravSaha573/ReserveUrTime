import { asyncHandler } from "../utils/asyncHandler.js";
import {
  customerConversation,
  listRestaurantConversations,
  restaurantConversation,
  sendCustomerReservationMessage,
  sendRestaurantReservationMessage,
  customerReservationUnreadCounts,
  restaurantReservationUnreadCount
} from "../services/reservationMessageService.js";

export const getCustomerReservationConversation = asyncHandler(async (req, res) => {
  res.json(await customerConversation(req.user._id, req.params.orderId));
});
export const createCustomerReservationMessage = asyncHandler(async (req, res) => {
  const message = await sendCustomerReservationMessage(req.user._id, req.params.orderId, req.body.message);
  res.status(201).json({ message });
});
export const getRestaurantReservationConversations = asyncHandler(async (req, res) => {
  res.json({ conversations: await listRestaurantConversations(req.managedRestaurantId) });
});
export const getRestaurantReservationConversation = asyncHandler(async (req, res) => {
  res.json(await restaurantConversation(req.managedRestaurantId, req.params.orderId));
});
export const createRestaurantReservationMessage = asyncHandler(async (req, res) => {
  const message = await sendRestaurantReservationMessage(req.user._id, req.managedRestaurantId, req.params.orderId, req.body.message);
  res.status(201).json({ message });
});
export const getCustomerReservationUnreadCounts = asyncHandler(async (req, res) => res.json({ unreadByOrder: await customerReservationUnreadCounts(req.user._id) }));
export const getRestaurantReservationUnreadCount = asyncHandler(async (req, res) => res.json({ unreadCount: await restaurantReservationUnreadCount(req.managedRestaurantId) }));