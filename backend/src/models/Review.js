import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    body: { type: String, default: "", trim: true, maxlength: 600 },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    repliedAt: { type: Date, default: null }
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "", trim: true, maxlength: 100 },
    body: { type: String, required: true, trim: true, minlength: 10, maxlength: 1200 },
    status: { type: String, enum: ["published", "hidden"], default: "published", index: true },
    verifiedExperience: { type: Boolean, default: true },
    eligibilitySource: {
      type: String,
      enum: ["completed_reservation", "completed_paid_order"],
      required: true
    },
    restaurantReply: { type: replySchema, default: () => ({}) },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    moderatedAt: { type: Date, default: null },
    moderationReason: { type: String, default: "", trim: true, maxlength: 240 }
  },
  { timestamps: true }
);

reviewSchema.index({ userId: 1, restaurantId: 1 }, { unique: true });
reviewSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });

export const Review = mongoose.model("Review", reviewSchema);
