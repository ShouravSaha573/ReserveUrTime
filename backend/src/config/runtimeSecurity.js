import { validatePaymentRuntimeConfig } from "./paymentConfig.js";

const DEV_JWT_SECRET =
  "ReserveUrTime_Dev_JWT_2026_9f4c7e2b6a1d8c3f5e0a";
const DEV_AUDIT_SECRET =
  "ReserveUrTime_Dev_Audit_2026_c8b2f1976a4d3e50";
const DEV_PLATFORM_PASSWORD = "ReserveUrTime@Admin2026";
const DEV_RESTAURANT_PASSWORD = "EmberManager@2026";

function clean(value) {
  return String(value ?? "").trim();
}

export function getAllowedClientOrigins() {
  const values = [
    clean(process.env.CLIENT_URL),
    ...clean(process.env.CLIENT_URLS).split(",")
  ].filter(Boolean);

  if (!values.length) values.push("http://localhost:5173");

  const origins = new Set();
  for (const value of values) {
    try {
      const url = new URL(value);
      origins.add(url.origin);

      // Local development sometimes opens Vite through the other exact loopback
      // spelling. Trust only the equivalent loopback origin in development so
      // localhost and 127.0.0.1 cannot accidentally break CORS/auth flows.
      if (process.env.NODE_ENV !== "production") {
        if (url.hostname === "localhost") {
          const alias = new URL(url.origin);
          alias.hostname = "127.0.0.1";
          origins.add(alias.origin);
        } else if (url.hostname === "127.0.0.1") {
          const alias = new URL(url.origin);
          alias.hostname = "localhost";
          origins.add(alias.origin);
        }
      }
    } catch {
      throw new Error(`Invalid trusted client URL: ${value}`);
    }
  }
  return [...origins];
}

export function getTrustProxySetting() {
  const raw = clean(process.env.TRUST_PROXY).toLowerCase();
  if (!raw || raw === "false" || raw === "0") return false;
  if (raw === "true") return true;
  if (/^\d+$/.test(raw)) return Number(raw);
  return raw.split(",").map((entry) => entry.trim()).filter(Boolean);
}

export function getCookieSameSite() {
  const configured = clean(process.env.COOKIE_SAME_SITE).toLowerCase();
  const value =
    configured || (process.env.NODE_ENV === "production" ? "none" : "lax");

  if (!["strict", "lax", "none"].includes(value)) {
    throw new Error("COOKIE_SAME_SITE must be strict, lax or none.");
  }
  return value;
}

export function getAuditRetentionDays() {
  const raw = Number.parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || "90", 10);
  if (!Number.isInteger(raw) || raw < 7 || raw > 3650) return 90;
  return raw;
}

export function validateRuntimeSecurityConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  const missing = [];

  for (const key of ["MONGODB_URI", "JWT_SECRET"]) {
    if (!clean(process.env[key])) missing.push(key);
  }

  if (missing.length) {
    throw new Error(`Missing required environment value(s): ${missing.join(", ")}`);
  }

  getAllowedClientOrigins();
  getCookieSameSite();
  validatePaymentRuntimeConfig();

  if (!isProduction) return;

  const jwtSecret = clean(process.env.JWT_SECRET);
  const auditSecret = clean(process.env.AUDIT_HASH_SECRET);
  const platformPassword = String(process.env.PLATFORM_ADMIN_PASSWORD || "");
  const restaurantPassword = String(process.env.RESTAURANT_ADMIN_PASSWORD || "");

  if (jwtSecret.length < 32 || jwtSecret === DEV_JWT_SECRET) {
    throw new Error(
      "Production JWT_SECRET must be a unique secret of at least 32 characters and must not use the development default."
    );
  }

  if (!auditSecret || auditSecret.length < 32 || auditSecret === DEV_AUDIT_SECRET) {
    throw new Error(
      "Production AUDIT_HASH_SECRET must be a unique secret of at least 32 characters."
    );
  }

  if (
    platformPassword === DEV_PLATFORM_PASSWORD ||
    restaurantPassword === DEV_RESTAURANT_PASSWORD
  ) {
    throw new Error(
      "Development admin passwords cannot be used with NODE_ENV=production."
    );
  }

  for (const origin of getAllowedClientOrigins()) {
    if (!origin.startsWith("https://")) {
      throw new Error("Production CLIENT_URL/CLIENT_URLS entries must use HTTPS.");
    }
  }

  if (getCookieSameSite() === "none" && process.env.NODE_ENV !== "production") {
    throw new Error("SameSite=None is reserved for secure production cookies.");
  }
}
