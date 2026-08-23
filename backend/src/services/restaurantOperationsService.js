import { publicMediaUrl } from "../utils/mediaUrl.js";
import { strictBoolean } from "../utils/validation.js";
import mongoose from "mongoose";
import { MenuCategory } from "../models/MenuCategory.js";

export function cleanText(value, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export function normalizeSlug(value, fallback = "") {
  return cleanText(value || fallback, 180)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function assertObjectId(value, label = "record id") {
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error(`Invalid ${label}.`);
    error.status = 400;
    throw error;
  }
}

export function integerField(value, label, { min = 0, max = 9999, fallback = 999 } = {}) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    const error = new Error(`${label} must be a whole number from ${min} to ${max}.`);
    error.status = 400;
    throw error;
  }
  return parsed;
}

export function priceField(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1000000) {
    const error = new Error("Price must be a valid non-negative number.");
    error.status = 400;
    throw error;
  }
  return Math.round(parsed * 100) / 100;
}

export function ingredientsField(value) {
  const items = Array.isArray(value)
    ? value
    : String(value ?? "")
        .split(",")
        .map((item) => item.trim());

  return [...new Set(items.map((item) => cleanText(item, 80)).filter(Boolean))].slice(0, 30);
}

export function menuCategoryPayload(body, { partial = false } = {}) {
  const payload = {};

  if (!partial || Object.prototype.hasOwnProperty.call(body, "name")) {
    payload.name = cleanText(body.name, 100);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "slug")) {
    payload.slug = normalizeSlug(body.slug, body.name);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "description")) {
    payload.description = cleanText(body.description, 500);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "displayOrder")) {
    payload.displayOrder = integerField(body.displayOrder, "Display order");
  }
  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    payload.isActive = strictBoolean(body.isActive, "Active state");
  } else if (!partial) {
    payload.isActive = true;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "name")) {
    if (!payload.name || payload.name.length < 2) {
      const error = new Error("Category name must be at least 2 characters.");
      error.status = 400;
      throw error;
    }
  }
  if (!partial || Object.prototype.hasOwnProperty.call(payload, "slug")) {
    if (!payload.slug) {
      const error = new Error("Category slug is required.");
      error.status = 400;
      throw error;
    }
  }

  return payload;
}

export function menuItemPayload(body, { partial = false } = {}) {
  const payload = {};

  for (const [field, max] of [
    ["name", 140],
    ["description", 1200],
    ["imageUrl", 1000]
  ]) {
    if (!partial || Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] =
        field === "imageUrl"
          ? publicMediaUrl(body[field], "Dish image", max)
          : cleanText(body[field], max);
    }
  }

  if (!partial || Object.prototype.hasOwnProperty.call(body, "slug")) {
    payload.slug = normalizeSlug(body.slug, body.name);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "ingredients")) {
    payload.ingredients = ingredientsField(body.ingredients);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "price")) {
    payload.price = priceField(body.price);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "displayOrder")) {
    payload.displayOrder = integerField(body.displayOrder, "Display order");
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "categoryId")) {
    assertObjectId(body.categoryId, "category id");
    payload.categoryId = body.categoryId;
  }
  if (Object.prototype.hasOwnProperty.call(body, "isAvailable")) {
    payload.isAvailable = strictBoolean(body.isAvailable, "Dish availability");
  } else if (!partial) {
    payload.isAvailable = true;
  }
  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    payload.isActive = strictBoolean(body.isActive, "Active state");
  } else if (!partial) {
    payload.isActive = true;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "name")) {
    if (!payload.name || payload.name.length < 2) {
      const error = new Error("Dish name must be at least 2 characters.");
      error.status = 400;
      throw error;
    }
  }
  if (!partial || Object.prototype.hasOwnProperty.call(payload, "slug")) {
    if (!payload.slug) {
      const error = new Error("Dish slug is required.");
      error.status = 400;
      throw error;
    }
  }

  return payload;
}

export function diningTablePayload(body, { partial = false } = {}) {
  const payload = {};

  if (!partial || Object.prototype.hasOwnProperty.call(body, "tableNumber")) {
    payload.tableNumber = cleanText(body.tableNumber, 40);
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "capacity")) {
    payload.capacity = integerField(body.capacity, "Capacity", {
      min: 1,
      max: 20,
      fallback: 2
    });
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "area")) {
    payload.area = cleanText(body.area, 100) || "Main Dining";
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "status")) {
    const status = cleanText(body.status, 30) || "available";
    if (!['available', 'maintenance'].includes(status)) {
      const error = new Error("Table status must be available or maintenance.");
      error.status = 400;
      throw error;
    }
    payload.status = status;
  }
  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    payload.isActive = strictBoolean(body.isActive, "Active state");
  } else if (!partial) {
    payload.isActive = true;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "tableNumber")) {
    if (!payload.tableNumber) {
      const error = new Error("Table number is required.");
      error.status = 400;
      throw error;
    }
  }

  return payload;
}

export function galleryItemPayload(body, { partial = false } = {}) {
  const payload = {};

  for (const [field, max] of [
    ["title", 140],
    ["imageUrl", 1000],
    ["altText", 240],
    ["caption", 600]
  ]) {
    if (!partial || Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] =
        field === "imageUrl"
          ? publicMediaUrl(body[field], "Gallery image", max)
          : cleanText(body[field], max);
    }
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "displayOrder")) {
    payload.displayOrder = integerField(body.displayOrder, "Display order");
  }
  if (Object.prototype.hasOwnProperty.call(body, "isPublished")) {
    payload.isPublished = strictBoolean(body.isPublished, "Gallery publish state");
  } else if (!partial) {
    payload.isPublished = true;
  }
  if (Object.prototype.hasOwnProperty.call(body, "isActive")) {
    payload.isActive = strictBoolean(body.isActive, "Active state");
  } else if (!partial) {
    payload.isActive = true;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(payload, "imageUrl")) {
    if (!payload.imageUrl) {
      const error = new Error("Gallery image URL is required.");
      error.status = 400;
      throw error;
    }
  }

  return payload;
}

export async function ensureOwnedCategory(restaurantId, categoryId, { activeOnly = true } = {}) {
  assertObjectId(categoryId, "category id");
  const query = { _id: categoryId, restaurantId };
  if (activeOnly) query.isActive = true;
  const category = await MenuCategory.findOne(query).select("_id name slug isActive");
  if (!category) {
    const error = new Error("Selected menu category is unavailable for this Restaurant.");
    error.status = 400;
    throw error;
  }
  return category;
}
