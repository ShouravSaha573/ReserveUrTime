import mongoose from "mongoose";

const menuCategorySchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500
    },
    displayOrder: {
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
  { timestamps: true }
);

menuCategorySchema.index(
  { restaurantId: 1, slug: 1 },
  { unique: true }
);
menuCategorySchema.index({ restaurantId: 1, isActive: 1, displayOrder: 1 });

export const MenuCategory = mongoose.model("MenuCategory", menuCategorySchema);
