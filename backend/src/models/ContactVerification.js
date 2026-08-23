import mongoose from "mongoose";

const contactVerificationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true, select: false },
    attemptsRemaining: { type: Number, default: 5, min: 0 },
    draft: {
      targetType: { type: String, enum: ["platform", "restaurant"], default: "platform" },
      restaurantSlug: { type: String, default: "", maxlength: 160 },
      name: { type: String, required: true, maxlength: 80 },
      subject: { type: String, required: true, maxlength: 120 },
      message: { type: String, required: true, maxlength: 1600 }
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

contactVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ContactVerification = mongoose.model("ContactVerification", contactVerificationSchema);
