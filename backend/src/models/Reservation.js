import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiningTable",
      required: true,
      index: true
    },
    tableIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiningTable"
    }],
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true
    },
    reservationDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true
    },
    timeSlot: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}$/
    },
    guestCount: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
      index: true
    },
    heldUntil: {
      type: Date,
      default: null
    },
    guest: {
      name: { type: String, default: "", trim: true, maxlength: 80 },
      email: { type: String, default: "", trim: true, lowercase: true, maxlength: 180 },
      phone: { type: String, default: "", trim: true, maxlength: 30 },
      address: { type: String, default: "", trim: true, maxlength: 180 },
      city: { type: String, default: "", trim: true, maxlength: 80 },
      postcode: { type: String, default: "", trim: true, maxlength: 20 }
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "failed"],
      default: "unpaid",
      index: true
    },
    depositAmount: { type: Number, default: 0, min: 0 },
    paymentTransactionId: { type: String, default: "", maxlength: 30, index: true },
    paidAt: { type: Date, default: null },
    reservationKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    reservationKeys: {
      type: [String],
      default: undefined
    },
    customerSlotKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      maxlength: 220
    }
  },
  {
    timestamps: true
  }
);

reservationSchema.index({ userId: 1, createdAt: -1 });
reservationSchema.index({ reservationKeys: 1 }, { unique: true, sparse: true });
reservationSchema.index({
  restaurantId: 1,
  reservationDate: 1,
  timeSlot: 1,
  status: 1
});

export const Reservation = mongoose.model("Reservation", reservationSchema);
