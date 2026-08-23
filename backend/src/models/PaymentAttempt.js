import mongoose from "mongoose";

const paymentAttemptSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["sslcommerz"],
      default: "sslcommerz",
      index: true
    },
    environment: {
      type: String,
      enum: ["sandbox", "live"],
      required: true,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
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
    paymentKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 30,
      index: true
    },
    sessionKey: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
      select: false
    },
    gatewayPageUrl: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
      select: false
    },
    amount: {
      type: Number,
      required: true,
      min: 10,
      max: 500000
    },
    currency: {
      type: String,
      enum: ["BDT"],
      default: "BDT"
    },
    status: {
      type: String,
      enum: [
        "creating",
        "pending",
        "verified_paid",
        "risk_hold",
        "failed",
        "cancelled",
        "expired",
        "invalid",
        "duplicate_paid"
      ],
      default: "creating",
      index: true
    },
    validationId: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
      select: false
    },
    bankTransactionId: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
      select: false
    },
    gatewayStatus: {
      type: String,
      default: "",
      trim: true,
      maxlength: 40
    },
    riskLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    riskTitle: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    lastNotificationAt: {
      type: Date,
      default: null
    },
    callbackCount: {
      type: Number,
      default: 0,
      min: 0
    },
    failureReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 240
    }
  },
  { timestamps: true }
);

paymentAttemptSchema.index({ userId: 1, paymentKey: 1 }, { unique: true });
paymentAttemptSchema.index({ orderId: 1, createdAt: -1 });
paymentAttemptSchema.index({ orderId: 1, status: 1, createdAt: -1 });
paymentAttemptSchema.index({ restaurantId: 1, createdAt: -1 });
paymentAttemptSchema.index({ status: 1, updatedAt: -1 });

export const PaymentAttempt = mongoose.model("PaymentAttempt", paymentAttemptSchema);
