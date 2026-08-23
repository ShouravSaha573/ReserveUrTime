import { publicMediaUrl } from "../utils/mediaUrl.js";
import mongoose from "mongoose";
import { ListingChangeRequest } from "../models/ListingChangeRequest.js";
import { Restaurant } from "../models/Restaurant.js";

function cleanText(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export const LISTING_CHANGE_TYPES = ["restaurant_name", "listing_image"];

export function validateListingChangeInput(body = {}) {
  const type = cleanText(body.type, 40);
  const proposedValue = cleanText(body.proposedValue, 1200);
  const note = cleanText(body.note, 500);

  if (!LISTING_CHANGE_TYPES.includes(type)) {
    const error = new Error("Choose a supported Restaurant listing change type.");
    error.status = 400;
    throw error;
  }

  if (!proposedValue) {
    const error = new Error("Proposed value is required.");
    error.status = 400;
    throw error;
  }

  if (type === "restaurant_name" && proposedValue.length < 2) {
    const error = new Error("Restaurant name must be at least 2 characters.");
    error.status = 400;
    throw error;
  }

  const safeProposedValue =
    type === "listing_image"
      ? publicMediaUrl(proposedValue, "Listing image", 1200)
      : proposedValue;

  return { type, proposedValue: safeProposedValue, note };
}

export function currentListingValue(restaurant, type) {
  return type === "restaurant_name"
    ? restaurant.name
    : restaurant.coverImageUrl || "";
}

export async function createListingChangeRequest({
  restaurantId,
  requestedBy,
  type,
  proposedValue,
  note
}) {
  const restaurant = await Restaurant.findOne({
    _id: restaurantId,
    isActive: true
  }).select("_id name coverImageUrl");

  if (!restaurant) {
    const error = new Error("Assigned restaurant is unavailable.");
    error.status = 404;
    throw error;
  }

  const currentValue = currentListingValue(restaurant, type);
  if (currentValue.trim() === proposedValue.trim()) {
    const error = new Error("The proposed value is already live on the platform.");
    error.status = 400;
    throw error;
  }

  try {
    return await ListingChangeRequest.create({
      restaurantId,
      requestedBy,
      type,
      currentValue,
      proposedValue,
      note
    });
  } catch (error) {
    if (error?.code === 11000) {
      const conflict = new Error(
        "A pending request of this type already exists. Wait for Platform Admin review before sending another."
      );
      conflict.status = 409;
      throw conflict;
    }
    throw error;
  }
}

export async function reviewListingChangeRequest({
  requestId,
  reviewerId,
  action,
  adminNote = ""
}) {
  if (!mongoose.isValidObjectId(requestId)) {
    const error = new Error("Invalid listing change request id.");
    error.status = 400;
    throw error;
  }

  if (!["approve", "reject"].includes(action)) {
    const error = new Error("Review action must be approve or reject.");
    error.status = 400;
    throw error;
  }

  const session = await mongoose.startSession();
  let reviewedRequest = null;

  try {
    await session.withTransaction(async () => {
      const request = await ListingChangeRequest.findOne({
        _id: requestId,
        status: "pending"
      }).session(session);

      if (!request) {
        const existing = await ListingChangeRequest.findById(requestId)
          .select("_id status")
          .session(session);
        const error = new Error(
          existing
            ? "This request has already been reviewed."
            : "Listing change request not found."
        );
        error.status = existing ? 409 : 404;
        throw error;
      }

      if (action === "approve") {
        const update =
          request.type === "restaurant_name"
            ? { name: request.proposedValue }
            : { coverImageUrl: request.proposedValue };

        const restaurant = await Restaurant.findByIdAndUpdate(
          request.restaurantId,
          { $set: update },
          { new: true, runValidators: true, session }
        ).select("_id name slug coverImageUrl isActive");

        if (!restaurant) {
          const error = new Error("Restaurant not found while applying the request.");
          error.status = 404;
          throw error;
        }

        request.status = "approved";
        request.appliedAt = new Date();
      } else {
        request.status = "rejected";
      }

      request.reviewedBy = reviewerId;
      request.reviewedAt = new Date();
      request.adminNote = cleanText(adminNote, 500);
      await request.save({ session });
      reviewedRequest = request;
    });

    return reviewedRequest;
  } finally {
    await session.endSession();
  }
}
