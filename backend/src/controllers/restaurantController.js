import mongoose from "mongoose";
import { MenuCategory } from "../models/MenuCategory.js";
import { MenuItem } from "../models/MenuItem.js";
import { Restaurant } from "../models/Restaurant.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const publicFields =
  "name slug description coverImageUrl cuisine location phone email openingHours theme";

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
    const [itemRestaurantIds, categoryRestaurantIds] = await Promise.all([
      MenuItem.distinct("restaurantId", {
        isActive: true,
        isAvailable: true,
        $or: [
          { name: matcher },
          { description: matcher },
          { ingredients: matcher }
        ]
      }),
      MenuCategory.distinct("restaurantId", {
        isActive: true,
        $or: [
          { name: matcher },
          { description: matcher }
        ]
      })
    ]);

    const menuRestaurantIds = [...new Set([
      ...itemRestaurantIds.map(String),
      ...categoryRestaurantIds.map(String)
    ])]
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    filter.$or = [
      { name: matcher },
      { cuisine: matcher },
      { location: matcher },
      { description: matcher }
    ];

    if (menuRestaurantIds.length) {
      filter.$or.push({ _id: mongoose.trusted({ $in: menuRestaurantIds }) });
    }
  }

  const restaurants = await Restaurant.find(filter)
    .select(publicFields)
    .sort({ name: 1 })
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
