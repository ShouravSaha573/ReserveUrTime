import mongoose from "mongoose";

const galleryItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true
    },
    title: {
      type: String,
      default: "",
      trim: true,
      maxlength: 140
    },
    imageUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    altText: {
      type: String,
      default: "",
      trim: true,
      maxlength: 240
    },
    caption: {
      type: String,
      default: "",
      trim: true,
      maxlength: 600
    },
    displayOrder: {
      type: Number,
      default: 999,
      min: 0,
      max: 9999,
      index: true
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

galleryItemSchema.index({ restaurantId: 1, isActive: 1, displayOrder: 1 });

export const GalleryItem = mongoose.model("GalleryItem", galleryItemSchema);
