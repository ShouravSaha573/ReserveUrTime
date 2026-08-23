import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Restaurant } from "../models/Restaurant.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  clearAuthCookie,
  setAuthCookie
} from "../utils/authCookie.js";
import { signAuthToken } from "../utils/token.js";
import {
  isValidEmail,
  normalizeEmail,
  MAX_PASSWORD_BYTES,
  passwordByteLength,
  validatePassword
} from "../utils/validation.js";

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

function roleLabel(role) {
  if (role === "platform_admin") return "Platform Admin";
  if (role === "restaurant_admin") return "Restaurant Admin";
  return "Customer";
}

async function loginByRole(req, res, requiredRole) {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (
    !isValidEmail(email) ||
    !password ||
    passwordByteLength(password) > MAX_PASSWORD_BYTES
  ) {
    return res.status(400).json({
      message: "Enter a valid email and password."
    });
  }

  const user = await User.findOne({ email }).select("+passwordHash +authVersion");

  const passwordMatches =
    user && (await bcrypt.compare(password, user.passwordHash));

  if (!user || !passwordMatches || !user.isActive) {
    return res.status(401).json({
      message: "Invalid email or password."
    });
  }

  if (user.role !== requiredRole) {
    return res.status(403).json({
      message: `Use valid ${roleLabel(requiredRole)} credentials for this login.`
    });
  }

  if (requiredRole === "restaurant_admin") {
    if (!user.restaurantId) {
      return res.status(403).json({
        message: "This Restaurant Admin has no restaurant assignment."
      });
    }

    const restaurantExists = await Restaurant.exists({
      _id: user.restaurantId,
      isActive: true
    });

    if (!restaurantExists) {
      return res.status(403).json({
        message: "The assigned restaurant is unavailable."
      });
    }
  }

  const token = signAuthToken(user);
  setAuthCookie(res, token);

  res.json({
    message: "Login successful.",
    user: publicUser(user)
  });
}

export const registerCustomer = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");
  const phone = String(req.body.phone || "").trim();

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({
      message: "Name must be between 2 and 80 characters."
    });
  }

  if (!isValidEmail(email) || email.length > 50) {
    return res.status(400).json({ message: "Enter a valid email up to 50 characters." });
  }

  if (phone.length > 20) {
    return res.status(400).json({ message: "Phone number must be 20 characters or fewer." });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  const existing = await User.findOne({ email }).select("_id");

  if (existing) {
    return res.status(409).json({
      message: "An account with this email already exists."
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    passwordHash,
    phone,
    role: "customer",
    restaurantId: null
  });

  const token = signAuthToken(user);
  setAuthCookie(res, token);

  res.status(201).json({
    message: "Registration successful.",
    user: publicUser(user)
  });
});

export const customerLogin = asyncHandler(async (req, res) => {
  await loginByRole(req, res, "customer");
});

export const platformAdminLogin = asyncHandler(async (req, res) => {
  await loginByRole(req, res, "platform_admin");
});

export const restaurantAdminLogin = asyncHandler(async (req, res) => {
  await loginByRole(req, res, "restaurant_admin");
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out." });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
