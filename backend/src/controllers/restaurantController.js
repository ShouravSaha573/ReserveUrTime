import mongoose from "mongoose";
import { Restaurant } from "../models/Restaurant.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const publicFields =
  "name slug description logoUrl coverImageUrl cuisine location phone email openingHours theme isFeatured featuredOrder listingOrder";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const listRestaurants = asyncHandler(async (req, res) => {
  const rawQuery = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const query = rawQuery.slice(0, 80);
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 50)
    : 50;

  const filter = { isActive: true };

  if (query) {
    const matcher = new RegExp(escapeRegExp(query), "i");
    filter.$or = [
      { name: matcher },
      { cuisine: matcher }
    ];
  }

  if (String(req.query.featured).toLowerCase() === "true") {
    filter.isFeatured = true;
  }

  const restaurants = await Restaurant.find(filter)
    .select(publicFields)
    .sort(
      filter.isFeatured
        ? { featuredOrder: 1, listingOrder: 1, name: 1 }
        : { listingOrder: 1, name: 1 }
    )
    .limit(limit)
    .lean();

  res.json({
    restaurants,
    search: query || null
  });
});

export const getRestaurantBySlug = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({
    slug: req.params.slug,
    isActive: true
  })
    .select(publicFields)
    .lean();

  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found." });
  }

  res.json({ restaurant });
});

export const getRestaurantById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid restaurant id." });
  }

  const restaurant = await Restaurant.findOne({
    _id: req.params.id,
    isActive: true
  })
    .select(publicFields)
    .lean();

  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found." });
  }

  res.json({ restaurant });
});
