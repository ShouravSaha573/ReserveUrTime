import { Router } from "express";
import {
  addFavorite,
  dashboard,
  favorites,
  removeFavorite,
  updateProfile
} from "../controllers/customerController.js";
import { authenticateUser, requireCustomer } from "../middleware/auth.js";
import {
  initiateSslcommerz,
  listSslcommerzAttempts,
  reconcileSslcommerz
} from "../controllers/paymentController.js";
import {
  addCartItem,
  cancelOrder,
  clearCart,
  createOrder,
  customerOrders,
  getCart,
  removeCartItem,
  updateCartItem
} from "../controllers/customerOrderController.js";
import {
  createReview,
  customerReviewEligibility,
  customerReviews,
  deleteReview,
  updateReview
} from "../controllers/reviewController.js";
import { customerContactMessages, requestContactCode, verifyContactCode } from "../controllers/contactController.js";
import { notifications, readAllNotifications, readNotification, unreadNotificationCount } from "../controllers/notificationController.js";
import { contactLimiter } from "../middleware/security.js";

const router = Router();

router.use(authenticateUser, requireCustomer);

router.get("/dashboard", dashboard);
router.get("/favorites", favorites);
router.post("/favorites", addFavorite);
router.delete("/favorites/:targetType/:targetId", removeFavorite);
router.patch("/profile", updateProfile);

router.get("/reviews/eligibility", customerReviewEligibility);
router.get("/reviews", customerReviews);
router.post("/reviews", createReview);
router.patch("/reviews/:reviewId", updateReview);
router.delete("/reviews/:reviewId", deleteReview);
router.post("/contact", contactLimiter, requestContactCode);
router.post("/contact/verify", contactLimiter, verifyContactCode);
router.get("/messages", customerContactMessages);

router.get("/notifications", notifications);
router.get("/notifications/unread-count", unreadNotificationCount);
router.patch("/notifications/read-all", readAllNotifications);
router.patch("/notifications/:notificationId/read", readNotification);

router.get("/cart", getCart);
router.post("/cart/items", addCartItem);
router.patch("/cart/items/:menuItemId", updateCartItem);
router.delete("/cart/items/:menuItemId", removeCartItem);
router.delete("/cart", clearCart);

router.get("/orders", customerOrders);
router.post("/orders", createOrder);
router.patch("/orders/:orderId/cancel", cancelOrder);

router.post("/orders/:orderId/payments/sslcommerz", initiateSslcommerz);
router.get("/orders/:orderId/payments/sslcommerz", listSslcommerzAttempts);
router.post("/orders/:orderId/payments/sslcommerz/reconcile", reconcileSslcommerz);

export default router;
