import mongoose from "mongoose";

const restaurantProfileSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      unique: true,
      index: true
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: 180,
      default: ""
    },
    aboutTitle: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "Our story"
    },
    aboutBody: {
      type: String,
      trim: true,
      maxlength: 2400,
      default: ""
    },
    reservationNote: {
      type: String,
      trim: true,
      maxlength: 700,
      default: ""
    },
    internalPhone: {
      type: String,
      trim: true,
      maxlength: 60,
      default: ""
    },
    internalEmail: {
      type: String,
      trim: true,
      maxlength: 160,
      default: ""
    },
    internalOpeningHours: {
      type: String,
      trim: true,
      maxlength: 260,
      default: ""
    },
    websiteUrl: {
      type: String,
      trim: true,
      maxlength: 900,
      default: ""
    }
  },
  { timestamps: true }
);

export const RestaurantProfile = mongoose.model(
  "RestaurantProfile",
  restaurantProfileSchema
);
