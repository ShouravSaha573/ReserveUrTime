import mongoose from "mongoose";

const adminMessageSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
  senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderRole: { type: String, enum: ["restaurant_admin", "platform_admin"], required: true },
  body: { type: String, required: true, trim: true, maxlength: 2000 },
  readByRestaurantAt: { type: Date, default: null },
  readByPlatformAt: { type: Date, default: null }
}, { timestamps: true });

adminMessageSchema.index({ restaurantId: 1, createdAt: 1 });
adminMessageSchema.index({ restaurantId: 1, senderRole: 1, createdAt: -1 });

export const AdminMessage = mongoose.model("AdminMessage", adminMessageSchema);