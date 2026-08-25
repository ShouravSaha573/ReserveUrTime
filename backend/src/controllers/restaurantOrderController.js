import { writeAuditLog } from "../services/auditService.js";
import {
  listRestaurantOrders,
  updateRestaurantOrderStatus
} from "../services/orderService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listOwnOrders = asyncHandler(async (req, res) => {
  const orders = await listRestaurantOrders(req.managedRestaurantId, {
    filter: String(req.query.filter || "").trim().toLowerCase()
  });
  res.json({ orders });
});

export const updateOwnOrderStatus = asyncHandler(async (req, res) => {
  const order = await updateRestaurantOrderStatus({
    restaurantId: req.managedRestaurantId,
    orderId: req.params.orderId,
    nextStatus: req.body.status,
    actorUserId: req.user._id
  });

  await writeAuditLog(req, {
    action: "order.status_update",
    entityType: "Order",
    entityId: order._id,
    changes: { status: order.status }
  });

  res.json({ message: `Order marked ${order.status}.`, order });
});
