import mongoose from "mongoose";

const siteContentSchema = new mongoose.Schema(
  {
    siteKey: {
      type: String,
      required: true,
      unique: true,
      default: "homepage",
      trim: true,
      index: true
    },
    brand: {
      name: { type: String, default: "ReserveUrTime", maxlength: 80 },
      homeLabel: { type: String, default: "Home", maxlength: 40 },
      restaurantsLabel: { type: String, default: "Restaurants", maxlength: 40 },
      customerLoginLabel: { type: String, default: "Login", maxlength: 40 },
      customerRegisterLabel: { type: String, default: "Register", maxlength: 40 }
    },
    hero: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, default: "", maxlength: 120 },
      title: { type: String, default: "", maxlength: 140 },
      titleAccent: { type: String, default: "", maxlength: 140 },
      body: { type: String, default: "", maxlength: 800 },
      browseCtaLabel: { type: String, default: "", maxlength: 80 },
      browseCtaPath: { type: String, default: "/restaurants", maxlength: 180 },
      registerCtaLabel: { type: String, default: "", maxlength: 80 },
      registerCtaPath: { type: String, default: "/customer/register", maxlength: 180 },
      searchEnabled: { type: Boolean, default: true },
      searchPlaceholder: { type: String, default: "Search a restaurant or cuisine...", maxlength: 120 },
      mediaUrl: { type: String, default: "", maxlength: 900 }
    },
    restaurantsSection: {
      enabled: { type: Boolean, default: true },
      eyebrow: { type: String, default: "", maxlength: 120 },
      title: { type: String, default: "", maxlength: 140 },
      viewAllLabel: { type: String, default: "View all →", maxlength: 80 },
      viewAllPath: { type: String, default: "/restaurants", maxlength: 180 },
      featuredLimit: { type: Number, default: 3, min: 1, max: 8 }
    },
    footer: {
      text: { type: String, default: "", maxlength: 300 }
    },
    galaxy: {
      enabled: { type: Boolean, default: true },
      density: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
      },
      movement: {
        type: String,
        enum: ["subtle", "normal"],
        default: "subtle"
      },
      shineIntervalMs: {
        type: Number,
        default: 3000,
        min: 1800,
        max: 10000
      },
      glowIntensity: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
      }
    },
    sectionOrder: {
      type: [String],
      default: ["hero", "restaurants"],
      validate: {
        validator(value) {
          const allowed = new Set(["hero", "restaurants"]);
          return (
            Array.isArray(value) &&
            value.length === 2 &&
            new Set(value).size === 2 &&
            value.every((item) => allowed.has(item))
          );
        },
        message: "Homepage section order is invalid."
      }
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

export const SiteContent = mongoose.model("SiteContent", siteContentSchema);
