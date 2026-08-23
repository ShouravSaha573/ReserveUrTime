import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ["customer", "platform_admin", "restaurant_admin"],
      default: "customer",
      index: true
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30
    },
    billingAddress: {
      addressLine1: { type: String, default: "", trim: true, maxlength: 120 },
      addressLine2: { type: String, default: "", trim: true, maxlength: 120 },
      city: { type: String, default: "", trim: true, maxlength: 80 },
      state: { type: String, default: "", trim: true, maxlength: 80 },
      postcode: { type: String, default: "", trim: true, maxlength: 20 },
      country: { type: String, default: "Bangladesh", trim: true, maxlength: 80 }
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    authVersion: {
      type: Number,
      default: 0,
      min: 0,
      select: false
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("validate", function enforceRestaurantAdminScope(next) {
  if (this.role === "restaurant_admin" && !this.restaurantId) {
    this.invalidate(
      "restaurantId",
      "Restaurant Admin must be assigned to a restaurant."
    );
  }

  if (this.role !== "restaurant_admin") {
    this.restaurantId = null;
  }

  next();
});

export const User = mongoose.model("User", userSchema);
