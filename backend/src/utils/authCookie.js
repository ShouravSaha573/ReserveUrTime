import { getCookieSameSite } from "../config/runtimeSecurity.js";

export const COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-reserveurtime_session"
    : "restaurant_token";

function cookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: getCookieSameSite(),
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

export function clearAuthCookie(res) {
  const options = cookieOptions();
  delete options.maxAge;
  res.clearCookie(COOKIE_NAME, options);
}
