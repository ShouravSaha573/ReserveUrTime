import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: true,
      maxlength: 1200
    },
    logoUrl: {
      type: String,
      default: ""
    },
    coverImageUrl: {
      type: String,
      default: ""
    },
    cuisine: {
      type: String,
      required: true,
      maxlength: 120
    },
    location: {
      type: String,
      required: true,
      maxlength: 180
    },
    phone: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      default: ""
    },
    openingHours: {
      type: String,
      default: "Daily · 6:00 PM – 11:30 PM"
    },
    theme: {
      type: String,
      default: "charcoal"
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    featuredOrder: {
      type: Number,
      default: 999,
      min: 0,
      max: 9999
    },
    listingOrder: {
      type: Number,
      default: 999,
      min: 0,
      max: 9999,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

restaurantSchema.index({ isActive: 1, listingOrder: 1, name: 1 });
restaurantSchema.index({ isActive: 1, isFeatured: 1, featuredOrder: 1 });

export const Restaurant = mongoose.model("Restaurant", restaurantSchema);
