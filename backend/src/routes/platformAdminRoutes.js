import { Router } from "express";
import { listPlatformAdminThreads, platformAdminConversation, sendPlatformAdminMessage, adminMessageUnreadCount } from "../controllers/adminMessageController.js";
import { notifications, readAllNotifications, readNotification, unreadNotificationCount } from "../controllers/notificationController.js";
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
import {
  menuImageUpload,
  uploadPlatformAdminRestaurantImage
} from "../controllers/photoExplodeController.js";
import { moderatePlatformReview, platformReviews } from "../controllers/reviewController.js";
import { platformContactMessages, reviewPlatformContactMessage } from "../controllers/contactController.js";
import {
  authenticateUser,
  requirePlatformAdmin
} from "../middleware/auth.js";

const router = Router();

router.use(authenticateUser, requirePlatformAdmin);

router.get("/summary", platformAdminSummary);
router.get("/admin-messages/unread-count", adminMessageUnreadCount);
router.get("/admin-messages", listPlatformAdminThreads);
router.get("/admin-messages/:restaurantId", platformAdminConversation);
router.post("/admin-messages/:restaurantId", sendPlatformAdminMessage);


router.get("/notifications", notifications);
router.get("/notifications/unread-count", unreadNotificationCount);
router.patch("/notifications/read-all", readAllNotifications);
router.patch("/notifications/:notificationId/read", readNotification);

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
router.post("/restaurant-images", menuImageUpload.single("image"), uploadPlatformAdminRestaurantImage);
router.post("/restaurants", createRestaurant);
router.patch("/restaurants/:restaurantId", updateRestaurant);
router.delete("/restaurants/:restaurantId", removeRestaurant);

router.get("/restaurant-admins", listRestaurantAdmins);
router.post("/restaurant-admins", createRestaurantAdmin);
router.patch("/restaurant-admins/:userId", updateRestaurantAdmin);
router.delete("/restaurant-admins/:userId", removeRestaurantAdmin);

export default router;
