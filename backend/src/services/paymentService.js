import crypto from "crypto";
import mongoose from "mongoose";
import { Order } from "../models/Order.js";
import { PaymentAttempt } from "../models/PaymentAttempt.js";
import { User } from "../models/User.js";
import {
  getPaymentCallbackBaseUrl,
  getPaymentClientReturnUrl,
  getSslcommerzCredentials,
  getSslcommerzUrls,
  isSslcommerzEnabled,
  isSslcommerzLive
} from "../config/paymentConfig.js";

const VALID_GATEWAY_STATUSES = new Set(["VALID", "VALIDATED"]);
const PAYMENTABLE_ORDER_STATUSES = new Set(["placed", "confirmed", "preparing", "ready"]);
const TERMINAL_ATTEMPT_STATUSES = new Set([
  "verified_paid",
  "failed",
  "cancelled",
  "expired",
  "invalid",
  "duplicate_paid"
]);

function appError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function money(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function sameMoney(a, b) {
  return Math.round(Number(a || 0) * 100) === Math.round(Number(b || 0) * 100);
}

function objectId(value, label = "record id") {
  if (!mongoose.isValidObjectId(value)) {
    throw appError(`Invalid ${label}.`, 400);
  }
}

function customerOrderFilter(userId, reference) {
  const value = String(reference || "").trim();
  if (mongoose.isValidObjectId(value)) return { _id: value, userId };
  if (/^RUT-[A-Z0-9-]{8,50}$/i.test(value)) return { orderNumber: value.toUpperCase(), userId };
  throw appError("Invalid order reference.", 400);
}

function paymentKeyValue(value) {
  const key = String(value || "").trim();
  if (key.length < 12 || key.length > 120 || !/^[A-Za-z0-9._:-]+$/.test(key)) {
    throw appError("A valid payment key is required.", 400);
  }
  return key;
}

function callbackValue(value, max = 120) {
  return String(value || "").trim().slice(0, max);
}


function gatewayContactValue(value, label, max) {
  const text = String(value || "").trim();
  if (!text) throw appError(`${label} is required before paying.`, 409);
  if (text.length > max) {
    throw appError(`${label} is too long for SSLCOMMERZ (maximum ${max} characters).`, 409);
  }
  return text;
}


function verifiedGatewayPageUrl(value) {
  const raw = callbackValue(value, 1000);
  if (!raw) return "";
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw appError("SSLCOMMERZ returned an invalid gateway URL.", 502);
  }

  const expectedHost = new URL(getSslcommerzUrls().session).hostname;
  if (url.protocol !== "https:" || url.hostname !== expectedHost) {
    throw appError("SSLCOMMERZ returned an unexpected gateway URL.", 502);
  }
  return url.toString();
}

function gatewayTransactionId() {
  // SSLCOMMERZ documents a 30-character maximum for tran_id.
  return `RUT${Date.now().toString(36)}${crypto.randomBytes(6).toString("hex")}`.slice(0, 30);
}

function assertGatewayEnabled() {
  if (!isSslcommerzEnabled()) {
    throw appError("Online payment is temporarily disabled.", 503);
  }
}

function requireBillingContact(user) {
  const billing = user?.billingAddress || {};
  const missing = [];
  if (!String(user?.phone || "").trim()) missing.push("phone");
  if (!String(billing.addressLine1 || "").trim()) missing.push("billing address");
  if (!String(billing.city || "").trim()) missing.push("city");
  if (!String(billing.postcode || "").trim()) missing.push("postcode");
  if (!String(billing.country || "").trim()) missing.push("country");

  if (missing.length && !isSslcommerzLive()) {
    // Sandbox transactions contain no real financial activity. Supplying test
    // contact values keeps old demo Orders payable while live checkout remains
    // strict about collecting the Customer's genuine billing details.
    user.phone = String(user.phone || "01700000000").trim();
    user.billingAddress = {
      ...billing,
      addressLine1: String(billing.addressLine1 || "Sandbox Test Address").trim(),
      city: String(billing.city || "Dhaka").trim(),
      postcode: String(billing.postcode || "1200").trim(),
      country: String(billing.country || "Bangladesh").trim()
    };
    return;
  }

  if (missing.length) {
    const error = appError(
      `Complete your Customer Profile before paying. Missing: ${missing.join(", ")}.`,
      409
    );
    error.code = "PAYMENT_PROFILE_INCOMPLETE";
    throw error;
  }
}

function safeAttempt(attempt) {
  if (!attempt) return null;
  const value = typeof attempt.toObject === "function" ? attempt.toObject() : { ...attempt };
  return {
    id: value._id,
    orderId: value.orderId,
    provider: value.provider,
    environment: value.environment,
    transactionId: value.transactionId,
    amount: value.amount,
    currency: value.currency,
    status: value.status,
    gatewayStatus: value.gatewayStatus || "",
    riskLevel: Number(value.riskLevel || 0),
    riskTitle: value.riskTitle || "",
    verifiedAt: value.verifiedAt || null,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

async function gatewayFetch(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      redirect: "error",
      signal: AbortSignal.timeout(12_000)
    });
  } catch (error) {
    throw appError(
      process.env.NODE_ENV === "production"
        ? "Payment gateway is temporarily unavailable."
        : `Payment gateway request failed: ${error.message}`,
      502
    );
  }

  if (!response.ok) {
    throw appError(`Payment gateway returned HTTP ${response.status}.`, 502);
  }

  try {
    return await response.json();
  } catch {
    throw appError("Payment gateway returned an unreadable response.", 502);
  }
}

function gatewayUrlsForAttempt() {
  const base = getPaymentCallbackBaseUrl();
  return {
    successUrl: `${base}/api/payments/sslcommerz/success`,
    failUrl: `${base}/api/payments/sslcommerz/fail`,
    cancelUrl: `${base}/api/payments/sslcommerz/cancel`,
    ipnUrl: `${base}/api/payments/sslcommerz/ipn`
  };
}

async function createGatewaySession({ order, user, attempt }) {
  const { storeId, storePassword } = getSslcommerzCredentials();
  const urls = getSslcommerzUrls();
  const callbacks = gatewayUrlsForAttempt();
  const billing = user.billingAddress;

  const productName = order.items
    .map((item) => item.name)
    .join(", ")
    .slice(0, 255) || "ReserveUrTime Restaurant Order";

  const body = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePassword,
    total_amount: money(order.total).toFixed(2),
    currency: order.currency,
    tran_id: attempt.transactionId,
    success_url: callbacks.successUrl,
    fail_url: callbacks.failUrl,
    cancel_url: callbacks.cancelUrl,
    ipn_url: callbacks.ipnUrl,
    shipping_method: "NO",
    product_name: productName,
    product_category: "restaurant-food",
    product_profile: "general",
    cus_name: gatewayContactValue(order.customerSnapshot.name || user.name, "Customer name", 50),
    cus_email: gatewayContactValue(order.customerSnapshot.email || user.email, "Customer email", 50),
    cus_add1: gatewayContactValue(billing.addressLine1, "Billing address", 50),
    cus_add2: String(billing.addressLine2 || "").trim().slice(0, 50),
    cus_city: gatewayContactValue(billing.city, "Billing city", 50),
    cus_state: String(billing.state || billing.city).trim().slice(0, 50),
    cus_postcode: gatewayContactValue(billing.postcode, "Billing postcode", 30),
    cus_country: gatewayContactValue(billing.country, "Billing country", 50),
    cus_phone: gatewayContactValue(user.phone, "Customer phone", 20),
    value_a: String(order._id),
    value_b: String(user._id),
    value_c: String(attempt._id),
    value_d: order.orderNumber
  });

  return gatewayFetch(urls.session, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
}

async function validationById(validationId) {
  const { storeId, storePassword } = getSslcommerzCredentials();
  const { validation } = getSslcommerzUrls();
  const query = new URLSearchParams({
    val_id: validationId,
    store_id: storeId,
    store_passwd: storePassword,
    format: "json"
  });
  return gatewayFetch(`${validation}?${query.toString()}`);
}

async function transactionQuery(transactionId) {
  const { storeId, storePassword } = getSslcommerzCredentials();
  const { transactionQuery: endpoint } = getSslcommerzUrls();
  const query = new URLSearchParams({
    tran_id: transactionId,
    store_id: storeId,
    store_passwd: storePassword,
    format: "json"
  });
  return gatewayFetch(`${endpoint}?${query.toString()}`);
}

function validateGatewayRecordAgainstAttempt(record, attempt) {
  const transactionId = callbackValue(record?.tran_id, 30);
  if (!transactionId || transactionId !== attempt.transactionId) {
    throw appError("Gateway transaction ID did not match the PaymentAttempt.", 409);
  }

  const currencyType = callbackValue(record?.currency_type || record?.currency, 3).toUpperCase();
  const gatewayAmount = record?.currency_amount || record?.amount;

  if (currencyType !== attempt.currency) {
    throw appError("Gateway currency did not match the Order currency.", 409);
  }

  if (!sameMoney(gatewayAmount, attempt.amount)) {
    throw appError("Gateway amount did not match the Order total.", 409);
  }

  if (record?.value_a && String(record.value_a) !== String(attempt.orderId)) {
    throw appError("Gateway Order reference did not match.", 409);
  }
  if (record?.value_b && String(record.value_b) !== String(attempt.userId)) {
    throw appError("Gateway Customer reference did not match.", 409);
  }
  if (record?.value_c && String(record.value_c) !== String(attempt._id)) {
    throw appError("Gateway PaymentAttempt reference did not match.", 409);
  }
}

async function markAttemptInvalid(attempt, reason, gatewayStatus = "INVALID") {
  await PaymentAttempt.updateOne(
    { _id: attempt._id, status: mongoose.trusted({ $ne: "verified_paid" }) },
    {
      $set: {
        status: "invalid",
        gatewayStatus: callbackValue(gatewayStatus, 40),
        failureReason: String(reason || "Gateway validation failed.").slice(0, 240),
        lastNotificationAt: new Date()
      }
    }
  );

  await Order.updateOne(
    {
      _id: attempt.orderId,
      activePaymentAttemptId: attempt._id,
      paymentStatus: mongoose.trusted({ $ne: "paid" })
    },
    {
      $set: { paymentStatus: "failed", activePaymentAttemptId: null }
    }
  );
}

async function applyVerifiedGatewayRecord(attempt, record) {
  try {
    validateGatewayRecordAgainstAttempt(record, attempt);
  } catch (error) {
    await markAttemptInvalid(attempt, error.message, record?.status);
    throw error;
  }

  const gatewayStatus = callbackValue(record.status, 40).toUpperCase();
  if (!VALID_GATEWAY_STATUSES.has(gatewayStatus)) {
    await markAttemptInvalid(attempt, "Gateway validation status was not successful.", gatewayStatus);
    throw appError("Payment was not validated as successful by SSLCOMMERZ.", 409);
  }

  const riskLevel = Number(record.risk_level || 0) === 1 ? 1 : 0;
  const riskTitle = callbackValue(record.risk_title, 80);
  const validationId = callbackValue(record.val_id, 80);
  const bankTransactionId = callbackValue(record.bank_tran_id, 120);

  if (riskLevel === 1) {
    await PaymentAttempt.updateOne(
      { _id: attempt._id, status: mongoose.trusted({ $ne: "verified_paid" }) },
      {
        $set: {
          status: "risk_hold",
          gatewayStatus,
          validationId,
          bankTransactionId,
          riskLevel,
          riskTitle,
          lastNotificationAt: new Date()
        }
      }
    );
    await Order.updateOne(
      { _id: attempt.orderId, paymentStatus: mongoose.trusted({ $ne: "paid" }) },
      { $set: { paymentStatus: "pending" } }
    );
    return { outcome: "risk_hold", attempt: await PaymentAttempt.findById(attempt._id).lean() };
  }

  const session = await mongoose.startSession();
  let outcome = "verified_paid";
  try {
    await session.withTransaction(async () => {
      const [freshAttempt, order] = await Promise.all([
        PaymentAttempt.findById(attempt._id).session(session),
        Order.findById(attempt.orderId).session(session)
      ]);

      if (!freshAttempt || !order) {
        throw appError("Payment record could not be reconciled.", 404);
      }

      if (order.paymentStatus === "paid") {
        if (order.paymentTransactionId === freshAttempt.transactionId) {
          freshAttempt.status = "verified_paid";
          freshAttempt.gatewayStatus = gatewayStatus;
          freshAttempt.validationId = validationId;
          freshAttempt.bankTransactionId = bankTransactionId;
          freshAttempt.riskLevel = 0;
          freshAttempt.riskTitle = riskTitle;
          freshAttempt.verifiedAt = freshAttempt.verifiedAt || new Date();
          freshAttempt.lastNotificationAt = new Date();
          await freshAttempt.save({ session });
          outcome = "verified_paid";
          return;
        }

        freshAttempt.status = "duplicate_paid";
        freshAttempt.gatewayStatus = gatewayStatus;
        freshAttempt.validationId = validationId;
        freshAttempt.bankTransactionId = bankTransactionId;
        freshAttempt.riskLevel = 0;
        freshAttempt.riskTitle = riskTitle;
        freshAttempt.verifiedAt = new Date();
        freshAttempt.lastNotificationAt = new Date();
        await freshAttempt.save({ session });
        outcome = "duplicate_paid";
        return;
      }

      freshAttempt.status = "verified_paid";
      freshAttempt.gatewayStatus = gatewayStatus;
      freshAttempt.validationId = validationId;
      freshAttempt.bankTransactionId = bankTransactionId;
      freshAttempt.riskLevel = 0;
      freshAttempt.riskTitle = riskTitle;
      freshAttempt.verifiedAt = new Date();
      freshAttempt.lastNotificationAt = new Date();
      await freshAttempt.save({ session });

      order.paymentStatus = "paid";
      order.paymentTransactionId = freshAttempt.transactionId;
      order.paidAt = order.paidAt || new Date();
      if (String(order.activePaymentAttemptId || "") === String(freshAttempt._id)) {
        order.activePaymentAttemptId = null;
      }
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return { outcome, attempt: await PaymentAttempt.findById(attempt._id).lean() };
}

function pickGatewayQueryRecord(payload, transactionId) {
  const elements = Array.isArray(payload?.element) ? payload.element : [];
  const matching = elements.filter(
    (entry) => callbackValue(entry?.tran_id, 30) === transactionId
  );
  if (!matching.length) return null;

  const successful = matching.find((entry) =>
    VALID_GATEWAY_STATUSES.has(callbackValue(entry.status, 40).toUpperCase())
  );
  return successful || matching[matching.length - 1];
}

async function applyTrustedQueryRecord(attempt, record) {
  if (!record) return { outcome: "pending", attempt };

  const status = callbackValue(record.status, 40).toUpperCase();
  if (VALID_GATEWAY_STATUSES.has(status) && record.val_id) {
    const validated = await validationById(callbackValue(record.val_id, 80));
    return applyVerifiedGatewayRecord(attempt, validated);
  }

  try {
    validateGatewayRecordAgainstAttempt(record, attempt);
  } catch (error) {
    await markAttemptInvalid(attempt, error.message, status);
    throw error;
  }

  if (status === "FAILED") {
    await PaymentAttempt.updateOne(
      { _id: attempt._id, status: mongoose.trusted({ $ne: "verified_paid" }) },
      {
        $set: {
          status: "failed",
          gatewayStatus: status,
          failureReason: callbackValue(record.error, 240),
          lastNotificationAt: new Date()
        }
      }
    );
    await Order.updateOne(
      {
        _id: attempt.orderId,
        activePaymentAttemptId: attempt._id,
        paymentStatus: mongoose.trusted({ $ne: "paid" })
      },
      { $set: { paymentStatus: "failed", activePaymentAttemptId: null } }
    );
    return { outcome: "failed", attempt: await PaymentAttempt.findById(attempt._id).lean() };
  }

  await PaymentAttempt.updateOne(
    { _id: attempt._id, status: mongoose.trusted({ $nin: [...TERMINAL_ATTEMPT_STATUSES] }) },
    {
      $set: {
        status: "pending",
        gatewayStatus: status || "PENDING",
        lastNotificationAt: new Date()
      }
    }
  );
  return { outcome: "pending", attempt: await PaymentAttempt.findById(attempt._id).lean() };
}

async function reconcileAttempt(attempt) {
  assertGatewayEnabled();
  if (!attempt) throw appError("Payment attempt not found.", 404);

  if (attempt.status === "verified_paid") {
    return { outcome: "verified_paid", attempt };
  }
  // A prior risk hold is not treated as permanently terminal. Re-query the
  // gateway so a later verified non-risk response can safely release the hold.
  if (attempt.status === "duplicate_paid") {
    return { outcome: "duplicate_paid", attempt };
  }

  const query = await transactionQuery(attempt.transactionId);
  if (String(query?.APIConnect || "").toUpperCase() !== "DONE") {
    return { outcome: attempt.status === "failed" ? "failed" : "pending", attempt };
  }

  const record = pickGatewayQueryRecord(query, attempt.transactionId);
  if (!record) {
    const ageMs = Date.now() - new Date(attempt.createdAt || 0).getTime();
    if (ageMs >= 30 * 60 * 1000) {
      await PaymentAttempt.updateOne(
        { _id: attempt._id, status: mongoose.trusted({ $nin: [...TERMINAL_ATTEMPT_STATUSES] }) },
        {
          $set: {
            status: "expired",
            gatewayStatus: "NO_RECORD",
            failureReason: "No gateway transaction was found after the payment-session grace period."
          }
        }
      );
      await Order.updateOne(
        {
          _id: attempt.orderId,
          activePaymentAttemptId: attempt._id,
          paymentStatus: mongoose.trusted({ $ne: "paid" })
        },
        { $set: { paymentStatus: "unpaid", activePaymentAttemptId: null } }
      );
      return {
        outcome: "expired",
        attempt: await PaymentAttempt.findById(attempt._id).lean()
      };
    }
  }
  return applyTrustedQueryRecord(attempt, record);
}

export async function initiateCustomerSslcommerzPayment(userId, orderId, paymentKey) {
  assertGatewayEnabled();
  const cleanPaymentKey = paymentKeyValue(paymentKey);

  const order = await Order.findOne(customerOrderFilter(userId, orderId)).lean();
  if (!order) throw appError("Order not found.", 404);

  const prior = await PaymentAttempt.findOne({ userId, paymentKey: cleanPaymentKey })
    .select("+gatewayPageUrl +sessionKey")
    .lean();
  if (prior) {
    if (prior.orderId && String(prior.orderId) !== String(order._id)) {
      throw appError("This payment key is already attached to another Order.", 409);
    }
    if (prior.status === "pending" && prior.gatewayPageUrl) {
      return {
        attempt: safeAttempt(prior),
        gatewayUrl: prior.gatewayPageUrl,
        reused: true
      };
    }
    if (prior.status === "verified_paid") {
      return { attempt: safeAttempt(prior), alreadyPaid: true, reused: true };
    }
  }

  const user = await User.findOne({ _id: userId, role: "customer", isActive: true })
      .select("_id name email phone billingAddress")
      .lean();

  if (!user) throw appError("Customer account is unavailable.", 404);
  if (order.paymentStatus === "paid") {
    throw appError("This Order is already paid.", 409);
  }
  if (!PAYMENTABLE_ORDER_STATUSES.has(order.status)) {
    throw appError("This Order cannot start a payment now.", 409);
  }
  if (order.currency !== "BDT") {
    throw appError("SSLCOMMERZ Phase 10 checkout currently supports BDT Orders only.", 409);
  }
  if (money(order.total) < 10 || money(order.total) > 500000) {
    throw appError("SSLCOMMERZ accepts Order totals from BDT 10.00 to BDT 500,000.00.", 409);
  }

  requireBillingContact(user);

  if (order.activePaymentAttemptId) {
    const active = await PaymentAttempt.findOne({
      _id: order.activePaymentAttemptId,
      orderId: order._id,
      status: mongoose.trusted({ $in: ["creating", "pending", "risk_hold"] })
    })
      .select("+gatewayPageUrl")
      .lean();

    if (active?.status === "pending" && active.gatewayPageUrl) {
      return {
        attempt: safeAttempt(active),
        gatewayUrl: active.gatewayPageUrl,
        reused: true
      };
    }
    if (active?.status === "risk_hold") {
      throw appError(
        "This payment is under gateway risk review. Do not start another payment for this Order.",
        409
      );
    }
    if (active?.status === "creating") {
      throw appError("A payment session is already being created for this Order.", 409);
    }
  }

  const attempt = await PaymentAttempt.create({
    provider: "sslcommerz",
    environment: isSslcommerzLive() ? "live" : "sandbox",
    orderId: order._id,
    userId: user._id,
    restaurantId: order.restaurantId,
    paymentKey: cleanPaymentKey,
    transactionId: gatewayTransactionId(),
    amount: money(order.total),
    currency: order.currency,
    status: "creating"
  });

  const claimed = await Order.findOneAndUpdate(
    {
      _id: order._id,
      userId,
      paymentStatus: mongoose.trusted({ $in: ["unpaid", "failed", "pending"] }),
      // MongoDB's null equality matches both null and an absent field. Avoid an
      // operator object here because sanitizeFilter otherwise tries to cast the
      // nested `$exists` expression as an ObjectId.
      activePaymentAttemptId: null
    },
    {
      $set: {
        activePaymentAttemptId: attempt._id,
        paymentStatus: "pending"
      }
    },
    { new: true }
  ).lean();

  if (!claimed) {
    await PaymentAttempt.deleteOne({ _id: attempt._id, status: "creating" });
    const activeOrder = await Order.findOne({ _id: order._id, userId }).lean();
    if (activeOrder?.paymentStatus === "paid") {
      throw appError("This Order was already paid while checkout was starting.", 409);
    }
    throw appError("Another payment attempt is already active for this Order.", 409);
  }

  try {
    const response = await createGatewaySession({ order: claimed, user, attempt });
    const gatewayStatus = callbackValue(response?.status, 40).toUpperCase();
    const gatewayPageUrl = verifiedGatewayPageUrl(response?.GatewayPageURL);
    const sessionKey = callbackValue(response?.sessionkey, 80);

    if (gatewayStatus !== "SUCCESS" || !gatewayPageUrl || !sessionKey) {
      const reason = callbackValue(response?.failedreason, 240) || "SSLCOMMERZ did not create a payment session.";
      await PaymentAttempt.updateOne(
        { _id: attempt._id },
        {
          $set: {
            status: "failed",
            gatewayStatus: gatewayStatus || "FAILED",
            failureReason: reason
          }
        }
      );
      await Order.updateOne(
        { _id: order._id, activePaymentAttemptId: attempt._id, paymentStatus: mongoose.trusted({ $ne: "paid" }) },
        { $set: { activePaymentAttemptId: null, paymentStatus: "failed" } }
      );
      throw appError(reason, 502);
    }

    await PaymentAttempt.updateOne(
      { _id: attempt._id },
      {
        $set: {
          status: "pending",
          gatewayStatus: gatewayStatus,
          sessionKey,
          gatewayPageUrl
        }
      }
    );

    return {
      attempt: safeAttempt({ ...attempt.toObject(), status: "pending", gatewayStatus }),
      gatewayUrl: gatewayPageUrl,
      reused: false
    };
  } catch (error) {
    if (error.status !== 502 || attempt.status === "creating") {
      await PaymentAttempt.updateOne(
        { _id: attempt._id, status: "creating" },
        {
          $set: {
            status: "failed",
            failureReason: String(error.message || "Payment session failed.").slice(0, 240)
          }
        }
      );
      await Order.updateOne(
        { _id: order._id, activePaymentAttemptId: attempt._id, paymentStatus: mongoose.trusted({ $ne: "paid" }) },
        { $set: { activePaymentAttemptId: null, paymentStatus: "failed" } }
      );
    }
    throw error;
  }
}

export async function listCustomerOrderPaymentAttempts(userId, orderId) {
  const order = await Order.findOne(customerOrderFilter(userId, orderId)).select("_id").lean();
  if (!order) throw appError("Order not found.", 404);

  const attempts = await PaymentAttempt.find({ userId, orderId: order._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return attempts.map(safeAttempt);
}

export async function reconcileCustomerOrderPayment(userId, orderId) {
  const order = await Order.findOne(customerOrderFilter(userId, orderId)).lean();
  if (!order) throw appError("Order not found.", 404);
  if (order.paymentStatus === "paid") {
    return { outcome: "verified_paid", order };
  }

  const attempt = await PaymentAttempt.findOne({ userId, orderId: order._id })
    .sort({ createdAt: -1 })
    .lean();
  if (!attempt) throw appError("No payment attempt exists for this Order.", 404);

  const result = await reconcileAttempt(attempt);
  const freshOrder = await Order.findOne({ _id: order._id, userId }).lean();
  return { outcome: result.outcome, attempt: safeAttempt(result.attempt), order: freshOrder };
}

export async function processSslcommerzNotification(payload, { source = "ipn" } = {}) {
  assertGatewayEnabled();
  const transactionId = callbackValue(payload?.tran_id, 30);
  if (!transactionId) throw appError("Gateway transaction ID is missing.", 400);

  const attempt = await PaymentAttempt.findOne({ transactionId }).lean();
  if (!attempt) throw appError("PaymentAttempt was not found for this transaction.", 404);

  await PaymentAttempt.updateOne(
    { _id: attempt._id },
    {
      $inc: { callbackCount: 1 },
      $set: {
        lastNotificationAt: new Date(),
        gatewayStatus: callbackValue(payload?.status, 40).toUpperCase()
      }
    }
  );

  if (attempt.status === "verified_paid") {
    return { outcome: "verified_paid", attempt: safeAttempt(attempt), source };
  }

  const hintedStatus = callbackValue(payload?.status, 40).toUpperCase();
  const validationId = callbackValue(payload?.val_id, 80);

  if (hintedStatus === "VALID" && validationId) {
    const validated = await validationById(validationId);
    const result = await applyVerifiedGatewayRecord(attempt, validated);
    return { ...result, attempt: safeAttempt(result.attempt), source };
  }

  // FAILED/CANCELLED/EXPIRED browser hints are not trusted by themselves.
  // Query SSLCOMMERZ server-to-server before changing financial state.
  const result = await reconcileAttempt(attempt);
  return { ...result, attempt: safeAttempt(result.attempt), source };
}

export function paymentResultRedirect({ outcome, orderNumber = "" }) {
  const returnUrl = new URL(getPaymentClientReturnUrl());
  const normalized =
    outcome === "verified_paid"
      ? "success"
      : outcome === "failed" || outcome === "invalid"
        ? "failed"
        : outcome === "risk_hold"
          ? "review"
          : outcome === "duplicate_paid"
            ? "duplicate"
            : "pending";

  returnUrl.searchParams.set("payment", normalized);
  if (orderNumber) returnUrl.searchParams.set("order", String(orderNumber).slice(0, 60));
  return returnUrl.toString();
}

export async function getOrderNumberForAttempt(attemptId) {
  if (!attemptId) return "";
  const attempt = await PaymentAttempt.findById(attemptId).select("orderId").lean();
  if (!attempt) return "";
  const order = await Order.findById(attempt.orderId).select("orderNumber").lean();
  return order?.orderNumber || "";
}
