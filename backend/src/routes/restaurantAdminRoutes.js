import { Router } from "express";
import {
  menuImageUpload,
  uploadRestaurantAdminDishImage,
  uploadRestaurantAdminGalleryImage,
  uploadRestaurantAdminListingImage
} from "../controllers/photoExplodeController.js";
import {
  getManagedRestaurant,
  getRestaurantProfile,
  listOwnListingChangeRequests,
  restaurantAdminSummary,
  submitListingChangeRequest,
  updateRestaurantProfile
} from "../controllers/restaurantAdminController.js";

import {
  createDiningTable,
  createGalleryItem,
  createMenuCategory,
  createMenuItem,
  listDiningTables,
  listGalleryItems,
  listMenuCategories,
  listMenuItems,
  listRestaurantReservations,
  removeDiningTable,
  removeGalleryItem,
  removeMenuCategory,
  removeMenuItem,
  updateDiningTable,
  updateGalleryItem,
  updateMenuCategory,
  updateMenuItem,
  updateRestaurantReservationStatus
} from "../controllers/restaurantOperationsController.js";
import {
  listOwnOrders,
  updateOwnOrderStatus
} from "../controllers/restaurantOrderController.js";
import { replyReview, restaurantReviews } from "../controllers/reviewController.js";
import { restaurantContactMessages, reviewRestaurantContactMessage } from "../controllers/contactController.js";
import { notifications, readAllNotifications, readNotification, unreadNotificationCount } from "../controllers/notificationController.js";
import {
  authenticateUser,
  requireRestaurantAdmin,
  requireManagedRestaurant
} from "../middleware/auth.js";

const router = Router();

router.use(
  authenticateUser,
  requireRestaurantAdmin,
  requireManagedRestaurant
);

router.get("/summary", restaurantAdminSummary);
router.get("/me/restaurant", getManagedRestaurant);
router.get("/profile", getRestaurantProfile);
router.patch("/profile", updateRestaurantProfile);
router.get("/listing-change-requests", listOwnListingChangeRequests);
router.post("/listing-change-requests", submitListingChangeRequest);
router.post(
  "/listing-change-requests/image",
  menuImageUpload.single("image"),
  uploadRestaurantAdminListingImage
);


router.get("/menu/categories", listMenuCategories);
router.post("/menu/categories", createMenuCategory);
router.patch("/menu/categories/:categoryId", updateMenuCategory);
router.delete("/menu/categories/:categoryId", removeMenuCategory);

router.get("/menu/items", listMenuItems);
router.post("/menu/items", createMenuItem);
router.patch("/menu/items/:itemId", updateMenuItem);
router.delete("/menu/items/:itemId", removeMenuItem);
router.post(
  "/menu/items/:itemId/image",
  menuImageUpload.single("image"),
  uploadRestaurantAdminDishImage
);

router.get("/tables", listDiningTables);
router.post("/tables", createDiningTable);
router.patch("/tables/:tableId", updateDiningTable);
router.delete("/tables/:tableId", removeDiningTable);

router.get("/reviews", restaurantReviews);
router.patch("/reviews/:reviewId/reply", replyReview);

router.get("/messages", restaurantContactMessages);
router.patch("/messages/:messageId", reviewRestaurantContactMessage);

router.get("/notifications", notifications);
router.get("/notifications/unread-count", unreadNotificationCount);
router.patch("/notifications/read-all", readAllNotifications);
router.patch("/notifications/:notificationId/read", readNotification);

router.get("/orders", listOwnOrders);
router.patch("/orders/:orderId/status", updateOwnOrderStatus);

router.get("/reservations", listRestaurantReservations);
router.patch("/reservations/:reservationId/status", updateRestaurantReservationStatus);

router.get("/gallery", listGalleryItems);
router.post("/gallery/image", menuImageUpload.single("image"), uploadRestaurantAdminGalleryImage);
router.post("/gallery", createGalleryItem);
router.patch("/gallery/:galleryItemId", updateGalleryItem);
router.delete("/gallery/:galleryItemId", removeGalleryItem);

export default router;
