import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Restaurant } from "../models/Restaurant.js";

async function run() {
  try {
    await connectDB();

    const [total, active, featured, activeRestaurants] = await Promise.all([
      Restaurant.countDocuments({}),
      Restaurant.countDocuments({ isActive: true }),
      Restaurant.countDocuments({ isActive: true, isFeatured: true }),
      Restaurant.find({ isActive: true })
        .select("name slug isFeatured featuredOrder listingOrder")
        .sort({ listingOrder: 1, name: 1 })
        .lean()
    ]);

    console.log("\nReserveUrTime local Restaurant diagnosis");
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Total Restaurants: ${total}`);
    console.log(`Active Restaurants: ${active}`);
    console.log(`Active + featured Restaurants: ${featured}`);

    if (activeRestaurants.length) {
      console.log("\nActive Restaurant records:");
      for (const restaurant of activeRestaurants) {
        console.log(
          `- ${restaurant.name} (${restaurant.slug}) | featured=${Boolean(
            restaurant.isFeatured
          )} | featuredOrder=${restaurant.featuredOrder ?? "-"} | listingOrder=${
            restaurant.listingOrder ?? "-"
          }`
        );
      }
    } else {
      console.log("\nNo active Restaurant records were found.");
      console.log("For the course demo database, run `npm run seed` once with SEED_RESET=false.");
    }
  } catch (error) {
    console.error("Local Restaurant diagnosis failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

run();
