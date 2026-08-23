import crypto from "crypto";
import { AuditLog } from "../models/AuditLog.js";

const SENSITIVE_AUDIT_KEY =
  /(password|passphrase|secret|token|credential|authorization|cookie|card(number)?|pan|cvv|cvc|storepassword|store_password)/i;

function privacyPreservingIpHash(ip) {
  const value = String(ip || "").trim();
  const secret =
    process.env.AUDIT_HASH_SECRET ||
    process.env.JWT_SECRET ||
    "development-audit-fallback";

  if (!value) return "";
  return crypto
    .createHmac("sha256", secret)
    .update(value)
    .digest("hex")
    .slice(0, 32);
}

function sanitizeAuditValue(value, depth = 0) {
  if (depth > 5) return "[truncated]";
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    return value.length > 1000 ? `${value.slice(0, 1000)}…` : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((entry) => sanitizeAuditValue(entry, depth + 1));
  }

  if (typeof value === "object") {
    const output = {};
    for (const [key, nested] of Object.entries(value).slice(0, 100)) {
      output[key] = SENSITIVE_AUDIT_KEY.test(key)
        ? "[redacted]"
        : sanitizeAuditValue(nested, depth + 1);
    }
    return output;
  }

  return String(value).slice(0, 1000);
}

export async function writeAuditLog(
  req,
  { action, entityType, entityId = "", changes = {} }
) {
  if (!req.user?._id) return;

  try {
    await AuditLog.create({
      actorUserId: req.user._id,
      action,
      entityType,
      entityId: String(entityId || ""),
      changes: sanitizeAuditValue(changes),
      ipHash: privacyPreservingIpHash(req.ip)
    });
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      console.error("Audit log write failed.");
    } else {
      console.error("Audit log write failed:", error.message);
    }
  }
}
