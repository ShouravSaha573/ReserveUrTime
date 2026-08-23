import { Router } from "express";
import {
  customerLogin,
  logout,
  me,
  platformAdminLogin,
  registerCustomer,
  restaurantAdminLogin
} from "../controllers/authController.js";
import { authenticateUser } from "../middleware/auth.js";
import { authLimiter } from "../middleware/security.js";

const router = Router();

router.post("/customer/register", authLimiter, registerCustomer);
router.post("/customer/login", authLimiter, customerLogin);
router.post("/platform-admin/login", authLimiter, platformAdminLogin);
router.post("/restaurant-admin/login", authLimiter, restaurantAdminLogin);
router.post("/logout", logout);
router.get("/me", authenticateUser, me);

export default router;
