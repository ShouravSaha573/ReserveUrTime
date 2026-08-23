import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { Reservation } from "../models/Reservation.js";
import { Restaurant } from "../models/Restaurant.js";
import { Review } from "../models/Review.js";
import { createNotification, notifyRestaurantAdmins } from "./notificationService.js";

function objectId(value, label = "record id") {
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error(`Invalid ${label}.`);
    error.status = 400;
    throw error;
  }
}

function reviewPayload(body, { partial = false } = {}) {
  const payload = {};
  if (!partial || Object.prototype.hasOwnProperty.call(body, "rating")) {
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      const error = new Error("Rating must be a whole number from 1 to 5.");
      error.status = 400;
      throw error;
    }
    payload.rating = rating;
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "title")) {
    const title = String(body.title || "").trim();
    if (title.length > 100) {
      const error = new Error("Review title must be 100 characters or fewer.");
      error.status = 400;
      throw error;
    }
    payload.title = title;
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, "body")) {
    const text = String(body.body || "").trim();
    if (text.length < 10 || text.length > 1200) {
      const error = new Error("Review must be between 10 and 1200 characters.");
      error.status = 400;
      throw error;
    }
    payload.body = text;
  }
  return payload;
}

async function eligibility(userId, restaurantId) {
  const [reservation, order] = await Promise.all([
    Reservation.exists({ userId, restaurantId, status: "completed" }),
    Order.exists({ userId, restaurantId, status: "completed", paymentStatus: "paid" })
  ]);
  if (order) return "completed_paid_order";
  if (reservation) return "completed_reservation";
  return null;
}

function publicName(name = "Guest") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Verified guest";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts.at(-1)[0]}.`;
}

export async function listPublicReviewsBySlug(slug) {
  const restaurant = await Restaurant.findOne({ slug, isActive: true }).select("_id name slug").lean();
  if (!restaurant) return null;

  const reviews = await Review.find({ restaurantId: restaurant._id, status: "published" })
    .populate("userId", "name")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const ratings = reviews.map((review) => Number(review.rating || 0));
  const averageRating = ratings.length
    ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) / 10
    : 0;

  return {
    restaurant,
    summary: { averageRating, reviewCount: reviews.length },
    reviews: reviews.map((review) => ({
      _id: review._id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      verifiedExperience: Boolean(review.verifiedExperience),
      author: publicName(review.userId?.name),
      restaurantReply: review.restaurantReply?.body
        ? { body: review.restaurantReply.body, repliedAt: review.restaurantReply.repliedAt }
        : null,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    }))
  };
}

export async function listCustomerReviewEligibility(userId) {
  const [reservations, orders, existing] = await Promise.all([
    Reservation.find({ userId, status: "completed" }).select("restaurantId").lean(),
    Order.find({ userId, status: "completed", paymentStatus: "paid" }).select("restaurantId").lean(),
    Review.find({ userId }).select("restaurantId").lean()
  ]);
  const ids = new Set([...reservations, ...orders].map((item) => String(item.restaurantId)));
  const restaurants = await Restaurant.find({ _id: { $in: [...ids] }, isActive: true })
    .select("_id name slug cuisine location coverImageUrl")
    .sort({ name: 1 })
    .lean();
  const reviewedIds = new Set(existing.map((review) => String(review.restaurantId)));
  return restaurants.map((restaurant) => ({ ...restaurant, hasReview: reviewedIds.has(String(restaurant._id)) }));
}

export async function listCustomerReviews(userId) {
  const reviews = await Review.find({ userId })
    .populate("restaurantId", "name slug cuisine location coverImageUrl isActive")
    .sort({ updatedAt: -1 })
    .lean();
  return reviews.filter((review) => review.restaurantId);
}

export async function createCustomerReview(userId, body) {
  objectId(body.restaurantId, "restaurant id");
  const restaurant = await Restaurant.findOne({ _id: body.restaurantId, isActive: true }).select("_id name slug").lean();
  if (!restaurant) {
    const error = new Error("Restaurant is unavailable.");
    error.status = 404;
    throw error;
  }
  const source = await eligibility(userId, restaurant._id);
  if (!source) {
    const error = new Error("You can review a Restaurant after a completed reservation or completed paid order.");
    error.status = 403;
    throw error;
  }
  const prior = await Review.exists({ userId, restaurantId: restaurant._id });
  if (prior) {
    const error = new Error("You already have a review for this Restaurant. Edit your existing review instead.");
    error.status = 409;
    throw error;
  }
  const review = await Review.create({
    userId,
    restaurantId: restaurant._id,
    ...reviewPayload(body),
    verifiedExperience: true,
    eligibilitySource: source,
    status: "published"
  });
  await notifyRestaurantAdmins(restaurant._id, {
    type: "review_received",
    title: "New verified review",
    message: `A Customer published a review for ${restaurant.name}.`,
    href: "/restaurant-admin/reviews"
  });
  return review;
}

export async function updateCustomerReview(userId, reviewId, body) {
  objectId(reviewId, "review id");
  const review = await Review.findOneAndUpdate(
    { _id: reviewId, userId },
    { $set: reviewPayload(body, { partial: true }) },
    { new: true, runValidators: true }
  );
  if (!review) {
    const error = new Error("Review not found.");
    error.status = 404;
    throw error;
  }
  return review;
}

export async function deleteCustomerReview(userId, reviewId) {
  objectId(reviewId, "review id");
  const deleted = await Review.findOneAndDelete({ _id: reviewId, userId });
  if (!deleted) {
    const error = new Error("Review not found.");
    error.status = 404;
    throw error;
  }
}

export async function listRestaurantReviews(restaurantId) {
  return Review.find({ restaurantId })
    .populate("userId", "name")
    .sort({ createdAt: -1 })
    .limit(250)
    .lean();
}

export async function replyToRestaurantReview(restaurantId, reviewId, actorUserId, body) {
  objectId(reviewId, "review id");
  const reply = String(body || "").trim();
  if (reply.length < 2 || reply.length > 600) {
    const error = new Error("Review reply must be between 2 and 600 characters.");
    error.status = 400;
    throw error;
  }
  const review = await Review.findOneAndUpdate(
    { _id: reviewId, restaurantId },
    { $set: { "restaurantReply.body": reply, "restaurantReply.repliedBy": actorUserId, "restaurantReply.repliedAt": new Date() } },
    { new: true, runValidators: true }
  );
  if (!review) {
    const error = new Error("Review not found for this Restaurant.");
    error.status = 404;
    throw error;
  }
  await createNotification({
    recipientUserId: review.userId,
    restaurantId,
    type: "review_reply",
    title: "Restaurant replied to your review",
    message: "A Restaurant replied to your review.",
    href: "/dashboard/reviews"
  });
  return review;
}

export async function listPlatformReviews({ status = "" } = {}) {
  const query = {};
  if (status) {
    if (!["published", "hidden"].includes(status)) {
      const error = new Error("Invalid review status filter.");
      error.status = 400;
      throw error;
    }
    query.status = status;
  }
  return Review.find(query)
    .populate("userId", "name")
    .populate("restaurantId", "name slug")
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();
}

export async function moderateReview(reviewId, actorUserId, { status, reason = "" }) {
  objectId(reviewId, "review id");
  const nextStatus = String(status || "").trim();
  if (!["published", "hidden"].includes(nextStatus)) {
    const error = new Error("Review status must be published or hidden.");
    error.status = 400;
    throw error;
  }
  const moderationReason = String(reason || "").trim().slice(0, 240);
  const review = await Review.findByIdAndUpdate(
    reviewId,
    { $set: { status: nextStatus, moderatedBy: actorUserId, moderatedAt: new Date(), moderationReason } },
    { new: true, runValidators: true }
  );
  if (!review) {
    const error = new Error("Review not found.");
    error.status = 404;
    throw error;
  }
  await createNotification({
    recipientUserId: review.userId,
    restaurantId: review.restaurantId,
    type: "review_moderated",
    title: nextStatus === "hidden" ? "Review hidden by moderation" : "Review republished",
    message: nextStatus === "hidden" ? "Your review is no longer public." : "Your review is public again.",
    href: "/dashboard/reviews"
  });
  return review;
}
