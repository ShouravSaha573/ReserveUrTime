import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getOrderNumberForAttempt,
  initiateCustomerSslcommerzPayment,
  listCustomerOrderPaymentAttempts,
  paymentResultRedirect,
  processSslcommerzNotification,
  reconcileCustomerOrderPayment
} from "../services/paymentService.js";
import { processReservationPayment, reservationPaymentRedirect } from "../services/reservationPaymentService.js";

export const initiateSslcommerz = asyncHandler(async (req, res) => {
  const result = await initiateCustomerSslcommerzPayment(
    req.user._id,
    req.params.orderId,
    req.body.paymentKey
  );

  res.status(result.reused ? 200 : 201).json({
    message: result.alreadyPaid
      ? "Order is already paid."
      : result.reused
        ? "Existing SSLCOMMERZ payment session reused."
        : "SSLCOMMERZ payment session created.",
    ...result
  });
});

export const listSslcommerzAttempts = asyncHandler(async (req, res) => {
  const attempts = await listCustomerOrderPaymentAttempts(
    req.user._id,
    req.params.orderId
  );
  res.json({ attempts });
});

export const reconcileSslcommerz = asyncHandler(async (req, res) => {
  const result = await reconcileCustomerOrderPayment(req.user._id, req.params.orderId);
  res.json({ message: "Payment status reconciled with SSLCOMMERZ.", ...result });
});

export const sslcommerzIpn = asyncHandler(async (req, res) => {
  const reservationResult = await processReservationPayment(req.body);
  if (!reservationResult) await processSslcommerzNotification(req.body, { source: "ipn" });
  res.status(200).type("text/plain").send("OK");
});

async function browserCallback(req, res, source) {
  let outcome = "pending";
  let attemptId = "";

  try {
    const reservationResult = await processReservationPayment(req.body);
    if (reservationResult) {
      return res.redirect(303, reservationPaymentRedirect(reservationResult.outcome, reservationResult.reference));
    }
    const result = await processSslcommerzNotification(req.body, { source });
    outcome = result.outcome;
    attemptId = result.attempt?.id || result.attempt?._id || "";
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`SSLCOMMERZ ${source} callback reconciliation failed:`, error.message);
    }
  }

  const orderNumber = await getOrderNumberForAttempt(attemptId);
  res.redirect(303, paymentResultRedirect({ outcome, orderNumber }));
}

export const sslcommerzSuccess = asyncHandler(async (req, res) => {
  await browserCallback(req, res, "success");
});

export const sslcommerzFail = asyncHandler(async (req, res) => {
  await browserCallback(req, res, "fail");
});

export const sslcommerzCancel = asyncHandler(async (req, res) => {
  await browserCallback(req, res, "cancel");
});
