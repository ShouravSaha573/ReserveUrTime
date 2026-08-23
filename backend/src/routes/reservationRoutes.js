import { Router } from "express";
import {
  cancelReservation,
  checkoutReservation,
  createReservation,
  myReservations
} from "../controllers/reservationController.js";
import {
  authenticateUser,
  optionalAuthenticateUser,
  requireCustomer
} from "../middleware/auth.js";

const router = Router();

router.post("/checkout", optionalAuthenticateUser, checkoutReservation);

router.use(authenticateUser, requireCustomer);

router.get("/mine", myReservations);
router.post("/", createReservation);
router.patch("/:id/cancel", cancelReservation);

export default router;
