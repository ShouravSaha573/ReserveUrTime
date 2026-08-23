import mongoose from "mongoose";

const diningTableSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true
    },
    tableNumber: {
      type: String,
      required: true,
      trim: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
      index: true
    },
    area: {
      type: String,
      default: "Main Dining"
    },
    status: {
      type: String,
      enum: ["available", "maintenance"],
      default: "available"
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

diningTableSchema.index(
  { restaurantId: 1, tableNumber: 1 },
  { unique: true }
);

export const DiningTable = mongoose.model("DiningTable", diningTableSchema);
