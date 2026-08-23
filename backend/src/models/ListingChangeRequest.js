import mongoose from "mongoose";

const listingChangeRequestSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["restaurant_name", "listing_image"],
      required: true,
      index: true
    },
    currentValue: {
      type: String,
      required: true,
      maxlength: 1200
    },
    proposedValue: {
      type: String,
      required: true,
      maxlength: 1200
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    appliedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

listingChangeRequestSchema.index({
  restaurantId: 1,
  status: 1,
  createdAt: -1
});

listingChangeRequestSchema.index(
  { restaurantId: 1, type: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
    name: "one_pending_listing_change_per_type"
  }
);

export const ListingChangeRequest = mongoose.model(
  "ListingChangeRequest",
  listingChangeRequestSchema
);
