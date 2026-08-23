import express, { Router } from "express";
import {
  sslcommerzCancel,
  sslcommerzFail,
  sslcommerzIpn,
  sslcommerzSuccess
} from "../controllers/paymentController.js";

const router = Router();
const gatewayForm = express.urlencoded({ extended: false, limit: "32kb" });

// These exact routes are gateway/browser callbacks. They intentionally do not use
// Customer cookies or the browser mutation marker; financial state is changed only
// after SSLCOMMERZ server-to-server validation/query inside paymentService.
router.post("/sslcommerz/ipn", gatewayForm, sslcommerzIpn);
router.post("/sslcommerz/success", gatewayForm, sslcommerzSuccess);
router.post("/sslcommerz/fail", gatewayForm, sslcommerzFail);
router.post("/sslcommerz/cancel", gatewayForm, sslcommerzCancel);

export default router;
