import mongoose from "mongoose";

const schema = new mongoose.Schema({
  reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation", required: true, index: true },
  transactionId: { type: String, required: true, unique: true, maxlength: 30, index: true },
  paymentKey: { type: String, required: true, unique: true, maxlength: 120 },
  amount: { type: Number, required: true, min: 10, max: 500000 },
  currency: { type: String, enum: ["BDT"], default: "BDT" },
  status: { type: String, enum: ["creating", "pending", "verified_paid", "risk_hold", "failed", "cancelled", "invalid"], default: "creating", index: true },
  gatewayPageUrl: { type: String, default: "", maxlength: 1000, select: false },
  validationId: { type: String, default: "", maxlength: 80, select: false },
  gatewayStatus: { type: String, default: "", maxlength: 40 },
  verifiedAt: { type: Date, default: null },
  failureReason: { type: String, default: "", maxlength: 240 }
}, { timestamps: true });

export const ReservationPaymentAttempt = mongoose.model("ReservationPaymentAttempt", schema);
