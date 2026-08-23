import rateLimit from "express-rate-limit";
import { getAllowedClientOrigins } from "../config/runtimeSecurity.js";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Please wait and try again."
  }
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please wait briefly and try again."
  }
});


export const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many messages were submitted. Please wait and try again." }
});

export const paymentCallbackLimiter = rateLimit({
  // Gateway callbacks may originate from shared provider IPs, so do not put them
  // behind the much tighter general per-client API budget. Keep a dedicated
  // high ceiling to absorb legitimate IPN bursts while still bounding abuse.
  windowMs: 60 * 1000,
  limit: 1200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Payment callback rate limit exceeded." }
});

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function requireTrustedOrigin(req, res, next) {
  if (!UNSAFE_METHODS.has(req.method)) return next();

  const requestMarker = req.get("x-reserveurtime-request");
  if (requestMarker !== "1") {
    return res.status(403).json({
      message: "Request verification header is missing."
    });
  }

  const origin = req.get("origin");
  const allowed = new Set(getAllowedClientOrigins());

  if (origin && !allowed.has(origin)) {
    return res.status(403).json({ message: "Untrusted request origin." });
  }

  if (!origin && process.env.NODE_ENV === "production") {
    return res.status(403).json({
      message: "Origin is required for browser mutation requests."
    });
  }

  next();
}

export function noStoreSensitiveResponses(req, res, next) {
  const sensitivePrefixes = [
    "/api/auth",
    "/api/contact",
    "/api/customer",
    "/api/payments",
    "/api/reservations",
    "/api/platform-admin",
    "/api/restaurant-admin"
  ];

  if (sensitivePrefixes.some((prefix) => req.path.startsWith(prefix))) {
    res.set("Cache-Control", "no-store, private");
    res.set("Pragma", "no-cache");
  }
  next();
}
