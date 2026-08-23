function clean(value) {
  return String(value ?? "").trim();
}

export function isSslcommerzEnabled() {
  return clean(process.env.SSLCOMMERZ_ENABLED || "true").toLowerCase() !== "false";
}

export function isSslcommerzLive() {
  return clean(process.env.SSLCOMMERZ_IS_LIVE || "false").toLowerCase() === "true";
}

export function getSslcommerzBaseUrl() {
  return isSslcommerzLive()
    ? "https://securepay.sslcommerz.com"
    : "https://sandbox.sslcommerz.com";
}

export function getSslcommerzCredentials() {
  const storeId = clean(process.env.SSLCOMMERZ_STORE_ID);
  const storePassword = clean(process.env.SSLCOMMERZ_STORE_PASSWORD);

  if (!storeId || !storePassword) {
    const error = new Error(
      "SSLCOMMERZ sandbox credentials are not configured on the backend."
    );
    error.status = 503;
    throw error;
  }

  return { storeId, storePassword };
}

export function getPaymentCallbackBaseUrl() {
  const configured = clean(process.env.PAYMENT_CALLBACK_BASE_URL);
  const fallback = `http://localhost:${Number(process.env.PORT || 5000)}`;
  const value = configured || fallback;

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("PAYMENT_CALLBACK_BASE_URL must be a valid absolute URL.");
  }

  return url.origin;
}

export function getPaymentClientReturnUrl() {
  const configured = clean(process.env.PAYMENT_CLIENT_RETURN_URL);
  const fallback = clean(process.env.CLIENT_URL) || "http://localhost:5173";
  const value = configured || `${new URL(fallback).origin}/dashboard/orders`;

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("PAYMENT_CLIENT_RETURN_URL must be a valid absolute URL.");
  }

  if (url.username || url.password) {
    throw new Error("PAYMENT_CLIENT_RETURN_URL must not contain URL credentials.");
  }

  const allowedOrigins = [clean(process.env.CLIENT_URL), ...clean(process.env.CLIENT_URLS).split(",")]
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      try {
        return new URL(entry).origin;
      } catch {
        return "";
      }
    })
    .filter(Boolean);

  if (allowedOrigins.length && !allowedOrigins.includes(url.origin)) {
    throw new Error("PAYMENT_CLIENT_RETURN_URL must use an allowlisted frontend origin.");
  }

  return url.toString();
}

export function getSslcommerzUrls() {
  const base = getSslcommerzBaseUrl();
  return {
    session: `${base}/gwprocess/v4/api.php`,
    validation: `${base}/validator/api/validationserverAPI.php`,
    transactionQuery: `${base}/validator/api/merchantTransIDvalidationAPI.php`
  };
}

export function validatePaymentRuntimeConfig() {
  if (!isSslcommerzEnabled()) return;

  const { storeId, storePassword } = getSslcommerzCredentials();
  const callbackBase = getPaymentCallbackBaseUrl();
  const returnUrl = getPaymentClientReturnUrl();

  if (process.env.NODE_ENV === "production") {
    if (!callbackBase.startsWith("https://")) {
      throw new Error("Production PAYMENT_CALLBACK_BASE_URL must use HTTPS.");
    }
    const callbackHost = new URL(callbackBase).hostname.toLowerCase();
    if (["localhost", "127.0.0.1", "::1"].includes(callbackHost)) {
      throw new Error("Production PAYMENT_CALLBACK_BASE_URL must be publicly reachable.");
    }
    if (!returnUrl.startsWith("https://")) {
      throw new Error("Production PAYMENT_CLIENT_RETURN_URL must use HTTPS.");
    }
    if (isSslcommerzLive() && (storeId === "testbox" || storePassword === "qwerty")) {
      throw new Error("Public SSLCOMMERZ sandbox demo credentials cannot be used in live mode.");
    }
  }
}
