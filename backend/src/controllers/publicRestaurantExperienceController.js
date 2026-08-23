import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getPublicDish3D,
  getPublicExperience,
  getPublicMenu,
  getPublicThreeDMenu
} from "../services/publicRestaurantExperienceService.js";

export const getRestaurantExperience = asyncHandler(async (req, res) => {
  const experience = await getPublicExperience(req.params.slug);

  if (!experience) {
    return res.status(404).json({ message: "Restaurant not found." });
  }

  res.json(experience);
});

export const getRestaurantMenu = asyncHandler(async (req, res) => {
  const menu = await getPublicMenu({
    slug: req.params.slug,
    rawQuery: req.query.q,
    rawCategory: req.query.category
  });

  if (!menu) {
    return res.status(404).json({ message: "Restaurant not found." });
  }

  res.json(menu);
});

export const getRestaurantDish3D = asyncHandler(async (req, res) => {
  const payload = await getPublicDish3D({
    restaurantSlug: req.params.slug,
    dishSlug: req.params.dishSlug
  });

  if (!payload) {
    return res.status(404).json({ message: "Restaurant not found." });
  }

  if (!payload.item) {
    return res.status(404).json({ message: "3D dish prototype not found." });
  }

  res.json(payload);
});

export const getRestaurantThreeDMenu = asyncHandler(async (req, res) => {
  const payload = await getPublicThreeDMenu({ restaurantSlug: req.params.slug });
  if (!payload) {
    return res.status(404).json({ message: "Restaurant not found." });
  }
  res.json(payload);
});
