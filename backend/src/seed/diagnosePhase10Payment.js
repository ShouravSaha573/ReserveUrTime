import "dotenv/config";
import {
  getPaymentCallbackBaseUrl,
  getPaymentClientReturnUrl,
  getSslcommerzBaseUrl,
  getSslcommerzCredentials,
  isSslcommerzEnabled,
  isSslcommerzLive,
  validatePaymentRuntimeConfig
} from "../config/paymentConfig.js";

try {
  validatePaymentRuntimeConfig();
  const enabled = isSslcommerzEnabled();
  const live = isSslcommerzLive();
  const credentials = enabled ? getSslcommerzCredentials() : { storeId: "", storePassword: "" };
  console.log("Phase 10 payment configuration");
  console.log(`Enabled: ${enabled}`);
  console.log(`Environment: ${live ? "LIVE" : "SANDBOX"}`);
  console.log(`Gateway base: ${enabled ? getSslcommerzBaseUrl() : "disabled"}`);
  console.log(`Store ID: ${credentials.storeId || "MISSING"}`);
  console.log(`Store password: ${credentials.storePassword ? "configured (hidden)" : "MISSING"}`);
  console.log(`Callback base: ${enabled ? getPaymentCallbackBaseUrl() : "disabled"}`);
  console.log(`Customer return: ${enabled ? getPaymentClientReturnUrl() : "disabled"}`);
  if (!live && getPaymentCallbackBaseUrl().includes("localhost")) {
    console.log("IPN note: SSLCOMMERZ servers cannot reach localhost. Use a public HTTPS tunnel/backend URL for full IPN testing.");
  }
} catch (error) {
  console.error(`Phase 10 payment configuration error: ${error.message}`);
  process.exit(1);
}
