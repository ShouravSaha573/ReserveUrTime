import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: ["restaurant", "menu_item"],
      required: true,
      index: true
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
      index: true
    },
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

favoriteSchema.pre("validate", function enforceTarget(next) {
  const isRestaurant = this.targetType === "restaurant";
  const isMenuItem = this.targetType === "menu_item";

  if (isRestaurant) {
    this.menuItemId = null;
    if (!this.restaurantId) {
      this.invalidate("restaurantId", "Restaurant favourite requires a restaurant.");
    }
  }

  if (isMenuItem) {
    this.restaurantId = null;
    if (!this.menuItemId) {
      this.invalidate("menuItemId", "Dish favourite requires a menu item.");
    }
  }

  next();
});

favoriteSchema.index(
  { userId: 1, restaurantId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      targetType: "restaurant",
      restaurantId: { $type: "objectId" }
    }
  }
);

favoriteSchema.index(
  { userId: 1, menuItemId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      targetType: "menu_item",
      menuItemId: { $type: "objectId" }
    }
  }
);

favoriteSchema.index({ userId: 1, createdAt: -1 });

export const Favorite = mongoose.model("Favorite", favoriteSchema);
