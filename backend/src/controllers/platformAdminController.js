import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { User } from "../models/User.js";
import { Restaurant } from "../models/Restaurant.js";
import { Reservation } from "../models/Reservation.js";
import { SiteContent } from "../models/SiteContent.js";
import { AuditLog } from "../models/AuditLog.js";
import { ListingChangeRequest } from "../models/ListingChangeRequest.js";
import { DEFAULT_SITE_CONTENT } from "../config/defaultSiteContent.js";
import { writeAuditLog } from "../services/auditService.js";
import { reviewListingChangeRequest } from "../services/listingChangeService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { publicMediaUrl } from "../utils/mediaUrl.js";
import {
  isValidEmail,
  normalizeEmail,
  strictBoolean,
  validatePassword
} from "../utils/validation.js";

const restaurantFields =
  "name slug description coverImageUrl cuisine location phone email openingHours theme isActive createdAt updatedAt";

function cleanText(value, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeSlug(value) {
  return cleanText(value, 140)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function assertObjectId(value, label) {
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error(`Invalid ${label}.`);
    error.status = 400;
    throw error;
  }
}

async function ensureActiveRestaurant(restaurantId) {
  assertObjectId(restaurantId, "restaurant id");
  const restaurant = await Restaurant.findOne({
    _id: restaurantId,
    isActive: true
  }).select("_id name slug");

  if (!restaurant) {
    const error = new Error("Selected restaurant is unavailable.");
    error.status = 400;
    throw error;
  }

  return restaurant;
}

function restaurantPayload(body, { partial = false } = {}) {
  const payload = {};
  const textFields = [
    ["name", 120],
    ["description", 1200],
    ["coverImageUrl", 800],
    ["cuisine", 120],
    ["location", 180],
    ["phone", 60],
    ["email", 160],
    ["openingHours", 220]
  ];

  for (const [field, max] of textFields) {
    if (!partial || Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = cleanText(body[field], max);
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, "slug")) {
    payload.slug = normalizeSlug(body.slug || body.name);
  }

  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    payload.isActive = strictBoolean(body.isActive, "Restaurant active state");
  } else if (!partial) {
    payload.isActive = true;
  }

  if (!partial) {
    if (!payload.name || payload.name.length < 2) {
      const error = new Error("Restaurant name must be at least 2 characters.");
      error.status = 400;
      throw error;
    }
    if (!payload.slug) {
      const error = new Error("Restaurant slug is required.");
      error.status = 400;
      throw error;
    }
    if (!payload.description) {
      const error = new Error("Restaurant description is required.");
      error.status = 400;
      throw error;
    }
    if (!payload.cuisine) {
      const error = new Error("Cuisine is required.");
      error.status = 400;
      throw error;
    }
    if (!payload.location) {
      const error = new Error("Location is required.");
      error.status = 400;
      throw error;
    }
  }

  for (const [field, label] of [
    ["coverImageUrl", "Restaurant cover image"]
  ]) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      payload[field] = publicMediaUrl(payload[field], label, 800);
    }
  }

  if (payload.email && !isValidEmail(payload.email)) {
    const error = new Error("Enter a valid restaurant email or leave it blank.");
    error.status = 400;
    throw error;
  }

  return payload;
}

export const platformAdminSummary = asyncHandler(async (req, res) => {
  const [customers, restaurantAdmins, restaurants, reservations] =
    await Promise.all([
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "restaurant_admin", isActive: true }),
      Restaurant.countDocuments({ isActive: true }),
      Reservation.countDocuments()
    ]);

  res.json({
    summary: {
      customers,
      restaurantAdmins,
      restaurants,
      reservations
    }
  });
});

export const listManagedRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.find({})
    .select(restaurantFields)
    .sort({ isActive: -1, name: 1 })
    .lean();

  res.json({ restaurants });
});

export const createRestaurant = asyncHandler(async (req, res) => {
  const payload = restaurantPayload(req.body);
  const restaurant = await Restaurant.create(payload);

  await writeAuditLog(req, {
    action: "restaurant.create",
    entityType: "Restaurant",
    entityId: restaurant._id,
    changes: payload
  });

  res.status(201).json({
    message: "Restaurant added to the platform.",
    restaurant
  });
});

export const updateRestaurant = asyncHandler(async (req, res) => {
  assertObjectId(req.params.restaurantId, "restaurant id");
  const payload = restaurantPayload(req.body, { partial: true });

  if (Object.prototype.hasOwnProperty.call(payload, "name") && payload.name.length < 2) {
    return res.status(400).json({
      message: "Restaurant name must be at least 2 characters."
    });
  }

  if (Object.prototype.hasOwnProperty.call(payload, "slug") && !payload.slug) {
    return res.status(400).json({ message: "Restaurant slug is required." });
  }

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.restaurantId,
    { $set: payload },
    { new: true, runValidators: true }
  ).select(restaurantFields);

  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found." });
  }

  await writeAuditLog(req, {
    action: "restaurant.update",
    entityType: "Restaurant",
    entityId: restaurant._id,
    changes: payload
  });

  res.json({
    message: "Restaurant listing updated.",
    restaurant
  });
});

export const removeRestaurant = asyncHandler(async (req, res) => {
  assertObjectId(req.params.restaurantId, "restaurant id");

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.restaurantId,
    { $set: { isActive: false } },
    { new: true, runValidators: true }
  ).select(restaurantFields);

  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found." });
  }

  await writeAuditLog(req, {
    action: "restaurant.remove",
    entityType: "Restaurant",
    entityId: restaurant._id,
    changes: { isActive: false }
  });

  res.json({
    message:
      "Restaurant removed from the public platform. Its internal data was preserved.",
    restaurant
  });
});

export const listRestaurantAdmins = asyncHandler(async (req, res) => {
  const restaurantAdmins = await User.find({ role: "restaurant_admin" })
    .select("_id name email role restaurantId phone isActive createdAt updatedAt")
    .populate("restaurantId", "name slug isActive")
    .sort({ isActive: -1, name: 1 })
    .lean();

  res.json({ restaurantAdmins });
});

export const createRestaurantAdmin = asyncHandler(async (req, res) => {
  const name = cleanText(req.body.name, 80);
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");
  const phone = cleanText(req.body.phone, 30);
  const restaurantId = String(req.body.restaurantId || "");

  if (name.length < 2) {
    return res.status(400).json({ message: "Name must be at least 2 characters." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Enter a valid email." });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  await ensureActiveRestaurant(restaurantId);

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
    role: "restaurant_admin",
    restaurantId,
    isActive: true,
    isVerified: true
  });

  const populated = await User.findById(user._id)
    .select("_id name email role restaurantId phone isActive createdAt updatedAt")
    .populate("restaurantId", "name slug isActive")
    .lean();

  await writeAuditLog(req, {
    action: "restaurant_admin.create",
    entityType: "User",
    entityId: user._id,
    changes: {
      name,
      email,
      phone,
      restaurantId,
      role: "restaurant_admin"
    }
  });

  res.status(201).json({
    message: "Restaurant Admin created.",
    restaurantAdmin: populated
  });
});

export const updateRestaurantAdmin = asyncHandler(async (req, res) => {
  assertObjectId(req.params.userId, "Restaurant Admin id");

  const user = await User.findOne({
    _id: req.params.userId,
    role: "restaurant_admin"
  }).select("+passwordHash +authVersion");

  if (!user) {
    return res.status(404).json({ message: "Restaurant Admin not found." });
  }

  let securityChanged = false;

  if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
    const name = cleanText(req.body.name, 80);
    if (name.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters." });
    }
    user.name = name;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "email")) {
    const email = normalizeEmail(req.body.email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Enter a valid email." });
    }
    const duplicate = await User.exists({ email, _id: { $ne: user._id } });
    if (duplicate) {
      return res.status(409).json({ message: "Another account already uses this email." });
    }
    if (email !== user.email) securityChanged = true;
    user.email = email;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "phone")) {
    user.phone = cleanText(req.body.phone, 30);
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "restaurantId")) {
    const restaurantId = String(req.body.restaurantId || "");
    await ensureActiveRestaurant(restaurantId);
    if (String(user.restaurantId) !== restaurantId) securityChanged = true;
    user.restaurantId = restaurantId;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "isActive")) {
    const nextActive = strictBoolean(req.body.isActive, "Restaurant Admin active state");
    if (nextActive !== user.isActive) securityChanged = true;
    user.isActive = nextActive;
  }

  if (req.body.password) {
    const password = String(req.body.password);
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }
    user.passwordHash = await bcrypt.hash(password, 12);
    securityChanged = true;
  }

  if (securityChanged) {
    user.authVersion = Number(user.authVersion || 0) + 1;
  }

  await user.save();

  const populated = await User.findById(user._id)
    .select("_id name email role restaurantId phone isActive createdAt updatedAt")
    .populate("restaurantId", "name slug isActive")
    .lean();

  await writeAuditLog(req, {
    action: "restaurant_admin.update",
    entityType: "User",
    entityId: user._id,
    changes: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      restaurantId: user.restaurantId,
      isActive: user.isActive,
      passwordChanged: Boolean(req.body.password)
    }
  });

  res.json({
    message: "Restaurant Admin updated.",
    restaurantAdmin: populated
  });
});

export const removeRestaurantAdmin = asyncHandler(async (req, res) => {
  assertObjectId(req.params.userId, "Restaurant Admin id");

  const user = await User.findOneAndDelete({
    _id: req.params.userId,
    role: "restaurant_admin"
  }).select("_id name email");

  if (!user) {
    return res.status(404).json({ message: "Restaurant Admin not found." });
  }

  await writeAuditLog(req, {
    action: "restaurant_admin.remove",
    entityType: "User",
    entityId: user._id,
    changes: { name: user.name, email: user.email }
  });

  res.json({
    message: "Restaurant Admin removed.",
    removed: { id: user._id, name: user.name, email: user.email }
  });
});


const galaxyDensityOptions = ["low", "medium", "high"];
const galaxyMovementOptions = ["subtle", "normal"];
const galaxyGlowOptions = ["low", "medium", "high"];

function safeInternalPath(value, fallback) {
  const path = cleanText(value, 180);
  if (!path) return fallback;
  if (!/^\/[A-Za-z0-9\-_/?.=&%]*$/.test(path)) {
    const error = new Error("Homepage links must use a safe internal path.");
    error.status = 400;
    throw error;
  }
  return path;
}

function enumValue(value, allowed, fallback, label) {
  const next = cleanText(value, 40);
  if (!next) return fallback;
  if (!allowed.includes(next)) {
    const error = new Error(`${label} value is not allowed.`);
    error.status = 400;
    throw error;
  }
  return next;
}

function homepagePayload(body) {
  const source = body || {};
  const brand = source.brand || {};
  const hero = source.hero || {};
  const restaurantsSection = source.restaurantsSection || {};
  const footer = source.footer || {};
  const galaxy = source.galaxy || {};

  const shineIntervalMs = Number.parseInt(
    galaxy.shineIntervalMs ?? DEFAULT_SITE_CONTENT.galaxy.shineIntervalMs,
    10
  );

  if (
    !Number.isFinite(shineIntervalMs) ||
    shineIntervalMs < 1800 ||
    shineIntervalMs > 10000
  ) {
    const error = new Error(
      "Galaxy shine interval must be between 1800 and 10000 milliseconds."
    );
    error.status = 400;
    throw error;
  }

  const featuredLimit = Number.parseInt(
    restaurantsSection.featuredLimit ??
      DEFAULT_SITE_CONTENT.restaurantsSection.featuredLimit,
    10
  );

  if (
    !Number.isFinite(featuredLimit) ||
    featuredLimit < 1 ||
    featuredLimit > 8
  ) {
    const error = new Error("Featured Restaurant limit must be between 1 and 8.");
    error.status = 400;
    throw error;
  }

  const sectionOrder = [...DEFAULT_SITE_CONTENT.sectionOrder];

  return {
    siteKey: "homepage",
    brand: {
      name: cleanText(brand.name, 80) || DEFAULT_SITE_CONTENT.brand.name,
      homeLabel:
        cleanText(brand.homeLabel, 40) || DEFAULT_SITE_CONTENT.brand.homeLabel,
      restaurantsLabel:
        cleanText(brand.restaurantsLabel, 40) ||
        DEFAULT_SITE_CONTENT.brand.restaurantsLabel,
      customerLoginLabel:
        cleanText(brand.customerLoginLabel, 40) ||
        DEFAULT_SITE_CONTENT.brand.customerLoginLabel,
      customerRegisterLabel:
        cleanText(brand.customerRegisterLabel, 40) ||
        DEFAULT_SITE_CONTENT.brand.customerRegisterLabel
    },
    hero: {
      enabled: true,
      eyebrow: cleanText(hero.eyebrow, 120),
      title: cleanText(hero.title, 140),
      titleAccent: cleanText(hero.titleAccent, 140),
      body: cleanText(hero.body, 800),
      browseCtaLabel: cleanText(hero.browseCtaLabel, 80),
      browseCtaPath: DEFAULT_SITE_CONTENT.hero.browseCtaPath,

      registerCtaLabel: cleanText(hero.registerCtaLabel, 80),
      registerCtaPath: DEFAULT_SITE_CONTENT.hero.registerCtaPath,

      searchEnabled:
        typeof hero.searchEnabled === "boolean"
          ? hero.searchEnabled
          : DEFAULT_SITE_CONTENT.hero.searchEnabled,
      searchPlaceholder:
        cleanText(hero.searchPlaceholder, 120) ||
        DEFAULT_SITE_CONTENT.hero.searchPlaceholder,
      mediaUrl: publicMediaUrl(hero.mediaUrl, "Homepage hero media", 900)
    },
    restaurantsSection: {
      enabled:
        typeof restaurantsSection.enabled === "boolean"
          ? restaurantsSection.enabled
          : DEFAULT_SITE_CONTENT.restaurantsSection.enabled,
      eyebrow: cleanText(restaurantsSection.eyebrow, 120),
      title: cleanText(restaurantsSection.title, 140),
      viewAllLabel: cleanText(restaurantsSection.viewAllLabel, 80),
      viewAllPath: DEFAULT_SITE_CONTENT.restaurantsSection.viewAllPath,

      featuredLimit
    },
    footer: {
      text: cleanText(footer.text, 300)
    },
    galaxy: {
      enabled:
        typeof galaxy.enabled === "boolean"
          ? galaxy.enabled
          : DEFAULT_SITE_CONTENT.galaxy.enabled,
      density: enumValue(
        galaxy.density,
        galaxyDensityOptions,
        DEFAULT_SITE_CONTENT.galaxy.density,
        "Galaxy density"
      ),
      movement: enumValue(
        galaxy.movement,
        galaxyMovementOptions,
        DEFAULT_SITE_CONTENT.galaxy.movement,
        "Galaxy movement"
      ),
      shineIntervalMs,
      glowIntensity: enumValue(
        galaxy.glowIntensity,
        galaxyGlowOptions,
        DEFAULT_SITE_CONTENT.galaxy.glowIntensity,
        "Galaxy glow"
      )
    },
    sectionOrder
  };
}

function mergeHomepageDefaults(content) {
  if (!content) return structuredClone(DEFAULT_SITE_CONTENT);

  return {
    ...structuredClone(DEFAULT_SITE_CONTENT),
    ...content,
    brand: { ...DEFAULT_SITE_CONTENT.brand, ...(content.brand || {}) },
    hero: { ...DEFAULT_SITE_CONTENT.hero, ...(content.hero || {}), enabled: true },
    restaurantsSection: {
      ...DEFAULT_SITE_CONTENT.restaurantsSection,
      ...(content.restaurantsSection || {})
    },
    footer: { ...DEFAULT_SITE_CONTENT.footer, ...(content.footer || {}) },
    galaxy: { ...DEFAULT_SITE_CONTENT.galaxy, ...(content.galaxy || {}) },
    sectionOrder: [...DEFAULT_SITE_CONTENT.sectionOrder]
  };
}

export const getHomepageCms = asyncHandler(async (req, res) => {
  const content = await SiteContent.findOne({ siteKey: "homepage" }).lean();
  res.json({ content: mergeHomepageDefaults(content) });
});

export const updateHomepageCms = asyncHandler(async (req, res) => {
  const payload = homepagePayload(req.body);

  const content = await SiteContent.findOneAndUpdate(
    { siteKey: "homepage" },
    {
      $set: {
        ...payload,
        updatedBy: req.user._id
      }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      runValidators: true
    }
  ).lean();

  await writeAuditLog(req, {
    action: "homepage.update",
    entityType: "SiteContent",
    entityId: content._id,
    changes: payload
  });

  res.json({
    message: "Homepage content updated.",
    content: mergeHomepageDefaults(content)
  });
});

export const listAuditLogs = asyncHandler(async (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 20;

  const auditLogs = await AuditLog.find({})
    .select("-ipAddress -ipHash")
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("actorUserId", "name email role")
    .lean();

  res.json({ auditLogs });
});


export const listListingChangeRequests = asyncHandler(async (req, res) => {
  const requestedStatus = cleanText(req.query.status, 30);
  const allowedStatuses = ["pending", "approved", "rejected"];
  const filter = {};

  if (requestedStatus) {
    if (!allowedStatuses.includes(requestedStatus)) {
      return res.status(400).json({ message: "Invalid change request status." });
    }
    filter.status = requestedStatus;
  }

  const requests = await ListingChangeRequest.find(filter)
    .sort({ status: 1, createdAt: -1 })
    .limit(200)
    .populate("restaurantId", "name slug coverImageUrl isActive")
    .populate("requestedBy", "name email restaurantId")
    .populate("reviewedBy", "name email")
    .lean();

  res.json({ requests });
});

export const reviewListingChange = asyncHandler(async (req, res) => {
  const action = cleanText(req.body.action, 20).toLowerCase();
  const adminNote = cleanText(req.body.adminNote, 500);

  const request = await reviewListingChangeRequest({
    requestId: req.params.requestId,
    reviewerId: req.user._id,
    action,
    adminNote
  });

  const populated = await ListingChangeRequest.findById(request._id)
    .populate("restaurantId", "name slug coverImageUrl isActive")
    .populate("requestedBy", "name email")
    .populate("reviewedBy", "name email")
    .lean();

  await writeAuditLog(req, {
    action: action === "approve"
      ? "listing_change.approve"
      : "listing_change.reject",
    entityType: "ListingChangeRequest",
    entityId: request._id,
    changes: {
      restaurantId: request.restaurantId,
      type: request.type,
      currentValue: request.currentValue,
      proposedValue: request.proposedValue,
      status: request.status,
      adminNote
    }
  });

  res.json({
    message:
      action === "approve"
        ? "Change approved and applied to the public Restaurant listing."
        : "Change request rejected.",
    request: populated
  });
});
