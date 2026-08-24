import mongoose from "mongoose";

const reservationMessageSchema = new mongoose.Schema(
  {
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation", required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    customerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["customer", "restaurant_admin"], required: true },
    body: { type: String, required: true, trim: true, maxlength: 1200 },
    readByCustomerAt: { type: Date, default: null },
    readByRestaurantAt: { type: Date, default: null }
  },
  { timestamps: true }
);

reservationMessageSchema.index({ orderId: 1, createdAt: 1 });
reservationMessageSchema.index({ restaurantId: 1, createdAt: -1 });
reservationMessageSchema.index({ customerUserId: 1, senderRole: 1, readByCustomerAt: 1 });
reservationMessageSchema.index({ restaurantId: 1, senderRole: 1, readByRestaurantAt: 1 });

export const ReservationMessage = mongoose.model("ReservationMessage", reservationMessageSchema);