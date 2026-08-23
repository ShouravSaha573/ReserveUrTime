import mongoose from "mongoose";

const vector3Schema = new mongoose.Schema(
  {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 }
  },
  { _id: false }
);

const explodedLayerSchema = new mongoose.Schema(
  {
    meshName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    label: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120
    },
    enabled: {
      type: Boolean,
      default: true
    },
    sequence: {
      type: Number,
      default: 0,
      min: 0,
      max: 99
    },
    explodedOffset: {
      type: vector3Schema,
      default: () => ({ x: 0, y: 0, z: 0 })
    },
    rotationOffset: {
      type: vector3Schema,
      default: () => ({ x: 0, y: 0, z: 0 })
    },
    explodeScale: {
      type: Number,
      default: 1,
      min: 0.8,
      max: 1.25
    }
  },
  { _id: false }
);


const threeDAnimationSchema = new mongoose.Schema(
  {
    duration: { type: Number, default: 1.15, min: 0.2, max: 4 },
    stagger: { type: Number, default: 0.075, min: 0, max: 0.5 },
    easing: {
      type: String,
      enum: ["power1.inOut", "power2.inOut", "power3.inOut", "sine.inOut", "expo.inOut"],
      default: "power3.inOut"
    },
    autoAssemble: { type: Boolean, default: true },
    autoAssembleDelay: { type: Number, default: 650, min: 0, max: 5000 },
    floatIntensity: { type: Number, default: 0.1, min: 0, max: 0.5 },
    rotationIntensity: { type: Number, default: 0.06, min: 0, max: 0.5 }
  },
  { _id: false }
);

const threeDAssetSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
      index: true
    },
    modelUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000
    },
    posterUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000
    },
    modelScale: {
      type: Number,
      default: 1,
      min: 0.05,
      max: 20
    },
    cameraPosition: {
      type: vector3Schema,
      default: () => ({ x: 4.8, y: 3.8, z: 5.8 })
    },
    cameraTarget: {
      type: vector3Schema,
      default: () => ({ x: 0, y: 0, z: 0.5 })
    },
    animation: {
      type: threeDAnimationSchema,
      default: () => ({})
    },
    layers: {
      type: [explodedLayerSchema],
      default: []
    }
  },
  { _id: false }
);


const photoExplodeSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false, index: true },
    sourceImageUrl: { type: String, default: "", trim: true, maxlength: 1000 },
    layerCount: { type: Number, default: 8, min: 4, max: 16 },
    gap: { type: Number, default: 18, min: 4, max: 48 },
    depth: { type: Number, default: 36, min: 0, max: 90 },
    tilt: { type: Number, default: 2.5, min: 0, max: 12 },
    duration: { type: Number, default: 0.9, min: 0.25, max: 2.5 },
    stagger: { type: Number, default: 0.04, min: 0, max: 0.15 },
    easing: {
      type: String,
      enum: ["cinematic", "soft", "snappy", "spring"],
      default: "cinematic"
    },
    autoPreview: { type: Boolean, default: false }
  },
  { _id: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuCategory",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 160
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1200
    },
    ingredients: {
      type: [String],
      default: []
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      max: 1000000
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000
    },
    displayOrder: {
      type: Number,
      default: 999,
      min: 0,
      max: 9999,
      index: true
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    threeD: {
      type: threeDAssetSchema,
      default: () => ({})
    },
    photoExplode: {
      type: photoExplodeSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

menuItemSchema.index(
  { restaurantId: 1, slug: 1 },
  { unique: true }
);
menuItemSchema.index({
  restaurantId: 1,
  categoryId: 1,
  isActive: 1,
  displayOrder: 1
});

export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
