import { Router } from "express";
import {
  getRestaurantById,
  getRestaurantBySlug,
  listRestaurants
} from "../controllers/restaurantController.js";
import { checkAvailability } from "../controllers/reservationController.js";
import {
  getRestaurantExperience,
  getRestaurantMenu
} from "../controllers/publicRestaurantExperienceController.js";
import { publicRestaurantReviews } from "../controllers/reviewController.js";

const router = Router();

router.get("/", listRestaurants);
router.get("/id/:id", getRestaurantById);
router.get("/:restaurantId/availability", checkAvailability);
router.get("/:slug/experience", getRestaurantExperience);
router.get("/:slug/reviews", publicRestaurantReviews);
router.get("/:slug/menu", getRestaurantMenu);
router.get("/:slug", getRestaurantBySlug);

export default router;
