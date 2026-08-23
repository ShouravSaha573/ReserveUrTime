import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", default: null, index: true },
    type: {
      type: String,
      enum: [
        "review_received",
        "review_reply",
        "review_moderated",
        "contact_received",
        "contact_reply",
        "order_status",
        "reservation_status"
      ],
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 320 },
    href: { type: String, default: "", trim: true, maxlength: 320 },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

notificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export const Notification = mongoose.model("Notification", notificationSchema);
