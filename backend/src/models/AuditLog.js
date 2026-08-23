import mongoose from "mongoose";

const retentionDays = Number.parseInt(
  process.env.AUDIT_LOG_RETENTION_DAYS || "90",
  10
);
const retentionMs =
  (Number.isInteger(retentionDays) && retentionDays >= 7 ? retentionDays : 90) *
  24 *
  60 *
  60 *
  1000;

const auditLogSchema = new mongoose.Schema(
  {
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      index: true
    },
    entityId: {
      type: String,
      default: "",
      maxlength: 120
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: "",
      maxlength: 100,
      select: false
    },
    ipHash: {
      type: String,
      default: "",
      maxlength: 64,
      select: false
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + retentionMs)
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
