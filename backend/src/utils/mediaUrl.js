function clean(value, maxLength = 1000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function badRelativePath(value) {
  if (!value.startsWith("/") || value.startsWith("//")) return true;
  if (/[\u0000-\u001F\u007F\\]/.test(value)) return true;

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.split("/").some((part) => part === "..")) return true;
  } catch {
    return true;
  }
  return false;
}

function allowedMediaOrigins() {
  return new Set(
    String(process.env.MEDIA_ALLOWED_ORIGINS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => {
        try {
          return new URL(value).origin;
        } catch {
          return "";
        }
      })
      .filter(Boolean)
  );
}

export function publicMediaUrl(value, label = "Media URL", maxLength = 1000) {
  const candidate = clean(value, maxLength);
  if (!candidate) return "";

  if (candidate.startsWith("/")) {
    if (badRelativePath(candidate)) {
      const error = new Error(`${label} contains an unsafe site-relative path.`);
      error.status = 400;
      throw error;
    }
    return candidate;
  }

  let url;
  try {
    url = new URL(candidate);
  } catch {
    const error = new Error(
      `${label} must be a safe site-relative path or an allowlisted HTTPS URL.`
    );
    error.status = 400;
    throw error;
  }

  if (url.protocol !== "https:" || url.username || url.password) {
    const error = new Error(`${label} must use HTTPS without embedded credentials.`);
    error.status = 400;
    throw error;
  }

  if (!allowedMediaOrigins().has(url.origin)) {
    const error = new Error(
      `${label} uses an external origin that is not listed in MEDIA_ALLOWED_ORIGINS.`
    );
    error.status = 400;
    throw error;
  }

  return url.toString();
}

export function externalWebsiteUrl(value, label = "Website URL", maxLength = 900) {
  const candidate = clean(value, maxLength);
  if (!candidate) return "";

  let url;
  try {
    url = new URL(candidate);
  } catch {
    const error = new Error(`${label} must be a valid HTTPS URL.`);
    error.status = 400;
    throw error;
  }

  const localDev =
    process.env.NODE_ENV !== "production" &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);

  if ((url.protocol !== "https:" && !localDev) || url.username || url.password) {
    const error = new Error(`${label} must use HTTPS without embedded credentials.`);
    error.status = 400;
    throw error;
  }

  return url.toString();
}
