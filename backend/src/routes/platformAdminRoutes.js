import { Router } from "express";
import {
  createRestaurant,
  createRestaurantAdmin,
  listManagedRestaurants,
  listRestaurantAdmins,
  platformAdminSummary,
  removeRestaurant,
  removeRestaurantAdmin,
  updateRestaurant,
  updateRestaurantAdmin,
  getHomepageCms,
  updateHomepageCms,
  listAuditLogs,
  listListingChangeRequests,
  reviewListingChange
} from "../controllers/platformAdminController.js";
import { moderatePlatformReview, platformReviews } from "../controllers/reviewController.js";
import { platformContactMessages, reviewPlatformContactMessage } from "../controllers/contactController.js";
import {
  authenticateUser,
  requirePlatformAdmin
} from "../middleware/auth.js";

const router = Router();

router.use(authenticateUser, requirePlatformAdmin);

router.get("/summary", platformAdminSummary);

router.get("/reviews", platformReviews);
router.patch("/reviews/:reviewId/moderate", moderatePlatformReview);
router.get("/messages", platformContactMessages);
router.patch("/messages/:messageId", reviewPlatformContactMessage);

router.get("/homepage", getHomepageCms);
router.patch("/homepage", updateHomepageCms);
router.get("/audit-logs", listAuditLogs);

router.get("/listing-change-requests", listListingChangeRequests);
router.patch("/listing-change-requests/:requestId/review", reviewListingChange);

router.get("/restaurants", listManagedRestaurants);
router.post("/restaurants", createRestaurant);
router.patch("/restaurants/:restaurantId", updateRestaurant);
router.delete("/restaurants/:restaurantId", removeRestaurant);

router.get("/restaurant-admins", listRestaurantAdmins);
router.post("/restaurant-admins", createRestaurantAdmin);
router.patch("/restaurant-admins/:userId", updateRestaurantAdmin);
router.delete("/restaurant-admins/:userId", removeRestaurantAdmin);

export default router;
