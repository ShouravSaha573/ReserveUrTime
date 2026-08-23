import { writeAuditLog } from "../services/auditService.js";
import {
  getOwnedThreeDAnimation,
  updateOwnedThreeDAnimation
} from "../services/threeDAnimationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getRestaurantAdminThreeDAnimation = asyncHandler(async (req, res) => {
  const payload = await getOwnedThreeDAnimation(req.managedRestaurantId, req.params.itemId);
  if (!payload) {
    return res.status(404).json({ message: "Dish not found." });
  }
  res.json(payload);
});

export const updateRestaurantAdminThreeDAnimation = asyncHandler(async (req, res) => {
  const payload = await updateOwnedThreeDAnimation(
    req.managedRestaurantId,
    req.params.itemId,
    req.body || {}
  );

  if (!payload) {
    return res.status(404).json({ message: "Dish not found." });
  }

  await writeAuditLog(req, {
    action: "menu_item.3d_animation_update",
    entityType: "MenuItem",
    entityId: payload.item._id,
    changes: {
      animation: payload.animation
    }
  });

  res.json({
    message: "3D exploded-layer animation saved.",
    ...payload
  });
});
