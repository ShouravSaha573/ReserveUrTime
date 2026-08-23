import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { Restaurant } from "../models/Restaurant.js";

function normalized(value) {
  return String(value || "").trim().toLowerCase();
}

async function upsertAdminAccount({ email, password, name, role, restaurantId = null }) {
  const passwordHash = await bcrypt.hash(password, 12);
  let user = await User.findOne({ email }).select("+passwordHash +authVersion");

  if (!user) {
    user = new User({
      name,
      email,
      passwordHash,
      role,
      restaurantId,
      isActive: true,
      isVerified: true
    });
  } else {
    user.name = name;
    user.passwordHash = passwordHash;
    user.role = role;
    user.restaurantId = restaurantId;
    user.isActive = true;
    user.isVerified = true;
    user.authVersion = Number(user.authVersion || 0) + 1;
  }

  await user.save();
  return user;
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

    const restaurant = await Restaurant.findOne({ slug: restaurantSlug });
    if (!restaurant) {
      throw new Error(
        `Restaurant '${restaurantSlug}' was not found. Run npm run seed first if the base restaurants have never been created.`
      );
    }

    if (!restaurant.isActive) {
      restaurant.isActive = true;
      await restaurant.save();
    }

    await upsertAdminAccount({
      email: platformEmail,
      password: platformPassword,
      name: "Platform Admin",
      role: "platform_admin",
      restaurantId: null
    });

    await upsertAdminAccount({
      email: restaurantEmail,
      password: restaurantPassword,
      name: `${restaurant.name} Manager`,
      role: "restaurant_admin",
      restaurantId: restaurant._id
    });

    console.log("Admin credentials synchronized successfully.");
    console.log(`Platform Admin: ${platformEmail}`);
    console.log(`Restaurant Admin: ${restaurantEmail} -> ${restaurant.name}`);
    console.log("Passwords were refreshed from backend/.env without printing them.");
  } finally {
    await mongoose.connection.close();
  }
}

main().catch(async (error) => {
  console.error(`Admin credential sync failed: ${error.message}`);
  try {
    await mongoose.connection.close();
  } catch {}
  process.exitCode = 1;
});
