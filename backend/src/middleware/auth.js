import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { COOKIE_NAME } from "../utils/authCookie.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticateUser = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Session expired or invalid." });
  }

  const user = await User.findById(payload.sub).select(
    "_id name email role restaurantId phone billingAddress isVerified isActive +authVersion"
  );

  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Account is unavailable." });
  }

  if (Number(payload.ver) !== Number(user.authVersion || 0)) {
    return res.status(401).json({
      message: "Session was revoked. Please sign in again."
    });
  }

  req.user = user;
  next();
});

export const optionalAuthenticateUser = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select(
      "_id name email role phone billingAddress isActive +authVersion"
    );
    if (user?.isActive && user.role === "customer" && Number(payload.ver) === Number(user.authVersion || 0)) {
      req.user = user;
    }
  } catch { /* Guests may continue without a valid session cookie. */ }
  next();
});

export function requireCustomer(req, res, next) {
  if (req.user?.role !== "customer") {
    return res.status(403).json({ message: "Customer access required." });
  }
  next();
}

export function requirePlatformAdmin(req, res, next) {
  if (req.user?.role !== "platform_admin") {
    return res.status(403).json({
      message: "Platform Admin access required."
    });
  }
  next();
}

export function requireRestaurantAdmin(req, res, next) {
  if (req.user?.role !== "restaurant_admin") {
    return res.status(403).json({
      message: "Restaurant Admin access required."
    });
  }

  if (!req.user.restaurantId) {
    return res.status(403).json({
      message: "This Restaurant Admin is not assigned to a restaurant."
    });
  }

  req.managedRestaurantId = req.user.restaurantId;
  next();
}

export function requireManagedRestaurant(req, res, next) {
  if (req.user?.role !== "restaurant_admin" || !req.user.restaurantId) {
    return res.status(403).json({
      message: "Restaurant Admin restaurant scope is required."
    });
  }

  const assignedId = String(req.user.restaurantId);
  const requestedId =
    req.params.restaurantId || req.body?.restaurantId || req.query?.restaurantId;

  if (requestedId && String(requestedId) !== assignedId) {
    return res.status(403).json({
      message: "You can manage only your assigned restaurant."
    });
  }

  req.managedRestaurantId = req.user.restaurantId;
  next();
}
