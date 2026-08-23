import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Restaurant } from "../models/Restaurant.js";

function normalized(value) {
  return String(value || "").trim().toLowerCase();
}

async function inspectAccount({ label, email, password, expectedRole, expectedRestaurantSlug = null }) {
  const user = await User.findOne({ email }).select("+passwordHash role restaurantId isActive isVerified email");

  console.log(`\n${label}`);
  console.log(`Email: ${email}`);
  console.log(`Account found: ${Boolean(user)}`);

  if (!user) {
    console.log("Password matches backend/.env: false");
    console.log(`Expected role: ${expectedRole}`);
    return false;
  }

  const passwordMatches = password
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  console.log(`Stored role: ${user.role}`);
  console.log(`Expected role: ${expectedRole}`);
  console.log(`Active: ${user.isActive}`);
  console.log(`Verified: ${user.isVerified}`);
  console.log(`Password matches backend/.env: ${passwordMatches}`);

  let restaurantOk = true;
  if (expectedRestaurantSlug) {
    const restaurant = user.restaurantId
      ? await Restaurant.findById(user.restaurantId).select("slug name isActive")
      : null;

    restaurantOk = Boolean(
      restaurant &&
      restaurant.slug === expectedRestaurantSlug &&
      restaurant.isActive
    );

    console.log(`Restaurant assignment: ${restaurant ? `${restaurant.name} (${restaurant.slug})` : "MISSING"}`);
    console.log(`Expected restaurant slug: ${expectedRestaurantSlug}`);
    console.log(`Restaurant assignment valid: ${restaurantOk}`);
  }

  return Boolean(
    passwordMatches &&
    user.role === expectedRole &&
    user.isActive &&
    restaurantOk
  );
}

async function main() {
  await connectDB();

  try {
    const platformEmail = normalized(process.env.PLATFORM_ADMIN_EMAIL);
    const platformPassword = String(process.env.PLATFORM_ADMIN_PASSWORD || "");
    const restaurantEmail = normalized(process.env.RESTAURANT_ADMIN_EMAIL);
    const restaurantPassword = String(process.env.RESTAURANT_ADMIN_PASSWORD || "");
    const restaurantSlug = normalized(process.env.RESTAURANT_ADMIN_RESTAURANT_SLUG);

    const missing = [];
    if (!platformEmail) missing.push("PLATFORM_ADMIN_EMAIL");
    if (!platformPassword) missing.push("PLATFORM_ADMIN_PASSWORD");
    if (!restaurantEmail) missing.push("RESTAURANT_ADMIN_EMAIL");
    if (!restaurantPassword) missing.push("RESTAURANT_ADMIN_PASSWORD");
    if (!restaurantSlug) missing.push("RESTAURANT_ADMIN_RESTAURANT_SLUG");

    if (missing.length) {
      throw new Error(`Missing backend/.env value(s): ${missing.join(", ")}`);
    }

    const platformOk = await inspectAccount({
      label: "Platform Admin diagnosis",
      email: platformEmail,
      password: platformPassword,
      expectedRole: "platform_admin"
    });

    const restaurantOk = await inspectAccount({
      label: "Restaurant Admin diagnosis",
      email: restaurantEmail,
      password: restaurantPassword,
      expectedRole: "restaurant_admin",
      expectedRestaurantSlug: restaurantSlug
    });

    console.log("\nAuthentication readiness");
    console.log(`Platform Admin ready: ${platformOk}`);
    console.log(`Restaurant Admin ready: ${restaurantOk}`);

    if (!platformOk || !restaurantOk) {
      console.log("\nRun: npm run sync:admin-credentials");
      process.exitCode = 1;
    }
  } finally {
    await mongoose.connection.close();
  }
}

main().catch(async (error) => {
  console.error(`Admin credential diagnosis failed: ${error.message}`);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exitCode = 1;
});
