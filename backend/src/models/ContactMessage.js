import mongoose from "mongoose";

const responseSchema = new mongoose.Schema(
  {
    body: { type: String, default: "", trim: true, maxlength: 1200 },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    respondedAt: { type: Date, default: null }
  },
  { _id: false }
);

const contactMessageSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true, index: true, maxlength: 40 },
    targetType: { type: String, enum: ["platform", "restaurant"], required: true, index: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", default: null, index: true },
    senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    senderName: { type: String, required: true, trim: true, maxlength: 80 },
    senderEmail: { type: String, required: true, lowercase: true, trim: true, maxlength: 180 },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    body: { type: String, required: true, trim: true, minlength: 10, maxlength: 1600 },
    status: { type: String, enum: ["new", "read", "resolved"], default: "new", index: true },
    response: { type: responseSchema, default: () => ({}) },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
  },
  { timestamps: true }
);

contactMessageSchema.pre("validate", function enforceTarget(next) {
  if (this.targetType === "restaurant" && !this.restaurantId) {
    this.invalidate("restaurantId", "Restaurant contact must have a Restaurant target.");
  }
  if (this.targetType === "platform") this.restaurantId = null;
  next();
});

contactMessageSchema.index({ targetType: 1, restaurantId: 1, status: 1, createdAt: -1 });
contactMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);
