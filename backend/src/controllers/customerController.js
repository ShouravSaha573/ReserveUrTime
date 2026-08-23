import { asyncHandler } from "../utils/asyncHandler.js";
import {
  addCustomerFavorite,
  getCustomerDashboard,
  listCustomerFavorites,
  removeCustomerFavorite,
  updateCustomerProfile
} from "../services/customerAccountService.js";

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId || null,
    phone: user.phone || "",
    billingAddress: {
      addressLine1: user.billingAddress?.addressLine1 || "",
      addressLine2: user.billingAddress?.addressLine2 || "",
      city: user.billingAddress?.city || "",
      state: user.billingAddress?.state || "",
      postcode: user.billingAddress?.postcode || "",
      country: user.billingAddress?.country || "Bangladesh"
    }
  };
}

export const dashboard = asyncHandler(async (req, res) => {
  const data = await getCustomerDashboard(req.user._id);
  res.json(data);
});

export const favorites = asyncHandler(async (req, res) => {
  const data = await listCustomerFavorites(req.user._id);
  res.json(data);
});

export const addFavorite = asyncHandler(async (req, res) => {
  const targetType = String(req.body.targetType || "").trim();
  const targetId = String(req.body.targetId || "").trim();

  await addCustomerFavorite(req.user._id, targetType, targetId);
  const data = await listCustomerFavorites(req.user._id);

  res.status(201).json({
    message: "Saved to favourites.",
    ...data
  });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  await removeCustomerFavorite(
    req.user._id,
    String(req.params.targetType || "").trim(),
    String(req.params.targetId || "").trim()
  );

  const data = await listCustomerFavorites(req.user._id);
  res.json({
    message: "Removed from favourites.",
    ...data
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await updateCustomerProfile(req.user._id, {
    name: req.body.name,
    phone: req.body.phone,
    billingAddress: req.body.billingAddress
  });

  res.json({
    message: "Profile updated.",
    user: publicUser(user)
  });
});
