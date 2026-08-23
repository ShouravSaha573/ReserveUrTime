import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import platformAdminRoutes from "./routes/platformAdminRoutes.js";
import restaurantAdminRoutes from "./routes/restaurantAdminRoutes.js";
import siteRoutes from "./routes/siteRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

import {
  apiLimiter,
  noStoreSensitiveResponses,
  paymentCallbackLimiter,
  requireTrustedOrigin
} from "./middleware/security.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import {
  getAllowedClientOrigins,
  getTrustProxySetting
} from "./config/runtimeSecurity.js";

export const app = express();

app.disable("x-powered-by");

app.set("trust proxy", getTrustProxySetting());

const allowedOrigins = new Set(getAllowedClientOrigins());
function isSslcommerzOrigin(origin) {
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" &&
      (url.hostname === "sslcommerz.com" || url.hostname.endsWith(".sslcommerz.com"));
  } catch {
    return false;
  }
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// Gateway callbacks are top-level form POST navigations, not browser API calls.
// Mount them before CORS so SSLCOMMERZ can always return the Customer to the
// application. Payment state is still accepted only after server-side gateway
// validation in paymentService.
app.use("/api/payments", paymentCallbackLimiter, paymentRoutes);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || isSslcommerzOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true
  })
);

app.use(express.json({ limit: "200kb" }));
app.use(cookieParser());
app.use(noStoreSensitiveResponses);

app.use(apiLimiter);
app.use(requireTrustedOrigin);

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "reserveurtime-api",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/site", siteRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/platform-admin", platformAdminRoutes);
app.use("/api/restaurant-admin", restaurantAdminRoutes);

app.use(notFound);
app.use(errorHandler);
