export const MAX_PASSWORD_BYTES = 72;

export function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase().slice(0, 180);
}

export function isValidEmail(email) {
  return (
    typeof email === "string" &&
    email.length <= 180 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

export function passwordByteLength(password) {
  return Buffer.byteLength(String(password || ""), "utf8");
}

export function validatePassword(password) {
  if (typeof password !== "string" || password.length < 10) {
    return "Password must be at least 10 characters.";
  }

  if (passwordByteLength(password) > MAX_PASSWORD_BYTES) {
    return "Password is too long. Use at most 72 UTF-8 bytes.";
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must contain at least one letter and one number.";
  }

  return null;
}

export function strictBoolean(value, label = "Boolean field") {
  if (typeof value !== "boolean") {
    const error = new Error(`${label} must be true or false.`);
    error.status = 400;
    throw error;
  }
  return value;
}
