import jwt from "jsonwebtoken";

export function signAuthToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing.");
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      ver: Number(user.authVersion || 0)
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d"
    }
  );
}
