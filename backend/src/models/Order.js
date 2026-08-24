import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true
    },
    name: { type: String, required: true, maxlength: 140 },
    slug: { type: String, required: true, maxlength: 160 },
    imageUrl: { type: String, default: "", maxlength: 1000 },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 20 },
    lineTotal: { type: Number, required: true, min: 0 },
    threeDEnabled: { type: Boolean, default: false }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["placed", "confirmed", "preparing", "ready", "completed", "cancelled"],
      required: true
    },
    changedAt: { type: Date, default: Date.now },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    changedByRole: {
      type: String,
      enum: ["customer", "restaurant_admin", "system"],
      default: "system"
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      maxlength: 50
    },
    checkoutKey: {
      type: String,
      required: true,
      maxlength: 120
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      default: null,
      index: true
    },
    reservationSnapshot: {
      bookingReference: { type: String, default: "", maxlength: 50 },
      reservationDate: { type: String, default: "", maxlength: 10 },
      timeSlot: { type: String, default: "", maxlength: 5 },
      guestCount: { type: Number, min: 1, max: 12 },
      tableNumber: { type: String, default: "", maxlength: 40 },
      tableArea: { type: String, default: "", maxlength: 80 },
      tableNumbers: { type: [String], default: undefined },
      tableAreas: { type: [String], default: undefined },
      requiredTableCount: { type: Number, min: 1, max: 3 }
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "Order must contain at least one item."
      }
    },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "BDT", enum: ["BDT"] },
    notes: { type: String, default: "", trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ["placed", "confirmed", "preparing", "ready", "completed", "cancelled"],
      default: "placed",
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "failed", "refunded"],
      default: "unpaid",
      index: true
    },
    activePaymentAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentAttempt",
      default: null,
      index: true
    },
    paymentTransactionId: {
      type: String,
      default: "",
      trim: true,
      maxlength: 30,
      index: true
    },
    paidAt: {
      type: Date,
      default: null
    },
    customerSnapshot: {
      name: { type: String, required: true, maxlength: 80 },
      email: { type: String, required: true, maxlength: 180 },
      phone: { type: String, default: "", maxlength: 30 }
    },
    restaurantSnapshot: {
      name: { type: String, required: true, maxlength: 120 },
      slug: { type: String, required: true, maxlength: 160 },
      location: { type: String, default: "", maxlength: 180 }
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    }
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, checkoutKey: 1 }, { unique: true });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);
