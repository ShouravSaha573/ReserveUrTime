import { RestaurantProfile } from "../models/RestaurantProfile.js";
import { isValidEmail } from "../utils/validation.js";
import { externalWebsiteUrl } from "../utils/mediaUrl.js";

function cleanText(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export async function getOrCreateRestaurantProfile(restaurantId) {
  return RestaurantProfile.findOneAndUpdate(
    { restaurantId },
    { $setOnInsert: { restaurantId } },
    { new: true, upsert: true, runValidators: true }
  );
}

export function buildRestaurantProfileUpdate(body = {}) {
  const payload = {};
  const fields = [
    ["tagline", 180],
    ["aboutTitle", 160],
    ["aboutBody", 2400],
    ["reservationNote", 700],
    ["internalPhone", 60],
    ["internalEmail", 160],
    ["internalOpeningHours", 260],
    ["websiteUrl", 900]
  ];

  for (const [field, maxLength] of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = cleanText(body[field], maxLength);
    }
  }

  if (payload.internalEmail && !isValidEmail(payload.internalEmail)) {
    const error = new Error("Enter a valid public Restaurant contact email or leave it blank.");
    error.status = 400;
    throw error;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "websiteUrl")) {
    payload.websiteUrl = externalWebsiteUrl(payload.websiteUrl, "Website URL", 900);
  }

  return payload;
}
