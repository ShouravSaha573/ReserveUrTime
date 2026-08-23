import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  createCustomerReview,
  deleteCustomerReview,
  listCustomerReviewEligibility,
  listCustomerReviews,
  listPlatformReviews,
  listPublicReviewsBySlug,
  listRestaurantReviews,
  moderateReview,
  replyToRestaurantReview,
  updateCustomerReview
} from "../services/reviewService.js";

export const publicRestaurantReviews = asyncHandler(async (req, res) => {
  const data = await listPublicReviewsBySlug(req.params.slug);
  if (!data) return res.status(404).json({ message: "Restaurant not found." });
  res.json(data);
});

export const customerReviewEligibility = asyncHandler(async (req, res) => {
  const restaurants = await listCustomerReviewEligibility(req.user._id);
  res.json({ restaurants });
});

export const customerReviews = asyncHandler(async (req, res) => {
  const reviews = await listCustomerReviews(req.user._id);
  res.json({ reviews });
});

export const createReview = asyncHandler(async (req, res) => {
  const review = await createCustomerReview(req.user._id, req.body);
  res.status(201).json({ message: "Review published.", review });
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await updateCustomerReview(req.user._id, req.params.reviewId, req.body);
  res.json({ message: "Review updated.", review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  await deleteCustomerReview(req.user._id, req.params.reviewId);
  res.json({ message: "Review deleted." });
});

export const restaurantReviews = asyncHandler(async (req, res) => {
  const reviews = await listRestaurantReviews(req.managedRestaurantId);
  res.json({ reviews });
});

export const replyReview = asyncHandler(async (req, res) => {
  const review = await replyToRestaurantReview(
    req.managedRestaurantId,
    req.params.reviewId,
    req.user._id,
    req.body.body
  );
  await writeAuditLog(req, {
    action: "review.reply",
    entityType: "Review",
    entityId: review._id,
    changes: { replied: true }
  });
  res.json({ message: "Review reply published.", review });
});

export const platformReviews = asyncHandler(async (req, res) => {
  const reviews = await listPlatformReviews({ status: String(req.query.status || "").trim() });
  res.json({ reviews });
});

export const moderatePlatformReview = asyncHandler(async (req, res) => {
  const review = await moderateReview(req.params.reviewId, req.user._id, req.body);
  await writeAuditLog(req, {
    action: "review.moderate",
    entityType: "Review",
    entityId: review._id,
    changes: { status: review.status, moderationReason: review.moderationReason || "" }
  });
  res.json({ message: `Review marked ${review.status}.`, review });
});
