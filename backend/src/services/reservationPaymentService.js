import crypto from "crypto";
import mongoose from "mongoose";
import { Reservation } from "../models/Reservation.js";
import { ReservationPaymentAttempt } from "../models/ReservationPaymentAttempt.js";
import { DiningTable } from "../models/DiningTable.js";
import { Restaurant } from "../models/Restaurant.js";
import { getPaymentCallbackBaseUrl, getPaymentClientReturnUrl, getSslcommerzCredentials, getSslcommerzUrls, isSslcommerzEnabled } from "../config/paymentConfig.js";

const good = new Set(["VALID", "VALIDATED"]);
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const clean = (value, max) => String(value || "").trim().slice(0, max);
const money = (value) => Math.round(Number(value) * 100) / 100;
const slots = new Set(["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"]);
const bookingReference = () => `RSV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

export async function releaseExpiredReservationHolds({ session } = {}) {
  const query = Reservation.updateMany(
    {
      status: "pending",
      heldUntil: mongoose.trusted({ $lte: new Date() })
    },
    {
      $set: { status: "cancelled", paymentStatus: "failed" },
      $unset: { reservationKey: 1, reservationKeys: 1, customerSlotKey: 1 }
    }
  );
  if (session) query.session(session);
  return query;
}

async function validateRequestData(body) {
  if (!mongoose.isValidObjectId(body.restaurantId)) return { error: "Invalid restaurant." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.reservationDate || ""))) return { error: "Choose a valid reservation date." };
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const earliest = new Date(`${today}T00:00:00Z`); earliest.setUTCDate(earliest.getUTCDate() + 1);
  if (body.reservationDate < earliest.toISOString().slice(0,10)) return { error: "Reservations must be booked at least one day in advance." };
  if (!slots.has(body.timeSlot)) return { error: "Choose one of the available time slots." };
  const guests = Number(body.guestCount);
  if (!Number.isInteger(guests) || guests < 1 || guests > 12) return { error: "Guest count must be between 1 and 12." };
  const restaurant = await Restaurant.findOne({ _id: body.restaurantId, isActive: true }).select("_id name slug").lean();
  if (!restaurant) return { error: "Restaurant is unavailable." };
  const tables = await DiningTable.find({ restaurantId: body.restaurantId, isActive: true, status: "available", capacity: mongoose.trusted({ $gte: guests }) }).sort({ capacity: 1, tableNumber: 1 }).lean();
  if (!tables.length) return { error: "No table can support this guest count." };
  return { restaurant, tables, guests };
}

async function gatewayFetch(url, options) {
  let response;
  try {
    response = await fetch(url, {
      ...options,
      redirect: "error",
      // Keep this aligned with the Order checkout service. The SSLCOMMERZ
      // sandbox is often slower than live and can legitimately exceed 12s.
      signal: AbortSignal.timeout(30_000)
    });
  }
  catch { throw fail("Payment gateway is temporarily unavailable.", 502); }
  if (!response.ok) throw fail(`Payment gateway returned HTTP ${response.status}.`, 502);
  try { return await response.json(); } catch { throw fail("Payment gateway returned an unreadable response.", 502); }
}

function contact(body, user) {
  const billing = user?.billingAddress || {};
  const value = {
    name: clean(user?.name || body.name, 80), email: clean(user?.email || body.email, 180).toLowerCase(),
    phone: clean(user?.phone || body.phone, 30), address: clean(billing.addressLine1 || body.address, 180),
    city: clean(billing.city || body.city, 80), postcode: clean(billing.postcode || body.postcode, 20)
  };
  if (!value.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) || !value.phone || !value.address || !value.city || !value.postcode) {
    throw fail("Name, valid email, phone, address, city and postcode are required for payment.");
  }
  return value;
}

export async function createReservationCheckout(body, user) {
  if (!isSslcommerzEnabled()) throw fail("Online payment is temporarily disabled.", 503);
  const validated = await validateRequestData(body);
  if (validated.error) throw fail(validated.error);
  const guest = contact(body, user);
  const paymentKey = clean(body.paymentKey, 120);
  if (paymentKey.length < 12 || !/^[A-Za-z0-9._:-]+$/.test(paymentKey)) throw fail("A valid payment key is required.");
  const existing = await ReservationPaymentAttempt.findOne({ paymentKey }).select("+gatewayPageUrl").lean();
  if (existing?.status === "pending" && existing.gatewayPageUrl) return { gatewayUrl: existing.gatewayPageUrl, reused: true };

  const amount = money(process.env.RESERVATION_DEPOSIT_BDT || 100);
  if (amount < 10 || amount > 500000) throw fail("Reservation deposit must be between BDT 10 and 500,000.", 503);
  const session = await mongoose.startSession();
  let reservation;
  try {
    await session.withTransaction(async () => {
      await releaseExpiredReservationHolds({ session });
      const occupied = await Reservation.find({
        tableId: mongoose.trusted({ $in: validated.tables.map((t) => t._id) }), reservationDate: body.reservationDate, timeSlot: body.timeSlot,
        $or: [{ status: "confirmed" }, { status: "pending", heldUntil: mongoose.trusted({ $gt: new Date() }) }]
      }).session(session).select("tableId").lean();
      const used = new Set(occupied.map((r) => String(r.tableId)));
      const table = validated.tables.find((t) => !used.has(String(t._id)));
      if (!table) throw fail("That time slot just became unavailable.", 409);
      reservation = await Reservation.create([{
        bookingReference: bookingReference(), userId: user?._id || null, restaurantId: validated.restaurant._id, tableId: table._id,
        reservationDate: body.reservationDate, timeSlot: body.timeSlot, guestCount: validated.guests, status: "pending",
        heldUntil: new Date(Date.now() + 15 * 60 * 1000), reservationKey: `${table._id}:${body.reservationDate}:${body.timeSlot}`,
        guest, paymentStatus: "pending", depositAmount: amount
      }], { session }).then((rows) => rows[0]);
    });
  } finally { await session.endSession(); }

  const attempt = await ReservationPaymentAttempt.create({ reservationId: reservation._id, transactionId: `RSV${Date.now().toString(36)}${crypto.randomBytes(6).toString("hex")}`.slice(0, 30), paymentKey, amount, status: "creating" });
  const { storeId, storePassword } = getSslcommerzCredentials();
  const base = getPaymentCallbackBaseUrl();
  const payload = new URLSearchParams({
    store_id: storeId, store_passwd: storePassword, total_amount: amount.toFixed(2), currency: "BDT", tran_id: attempt.transactionId,
    success_url: `${base}/api/payments/sslcommerz/success`, fail_url: `${base}/api/payments/sslcommerz/fail`, cancel_url: `${base}/api/payments/sslcommerz/cancel`, ipn_url: `${base}/api/payments/sslcommerz/ipn`,
    shipping_method: "NO", product_name: `Table deposit - ${validated.restaurant.name}`.slice(0,255), product_category: "table-reservation", product_profile: "general",
    cus_name: guest.name.slice(0,50), cus_email: guest.email.slice(0,50), cus_add1: guest.address.slice(0,50), cus_city: guest.city.slice(0,50), cus_state: guest.city.slice(0,50), cus_postcode: guest.postcode.slice(0,30), cus_country: "Bangladesh", cus_phone: guest.phone.slice(0,20),
    value_a: String(reservation._id), value_b: "reservation", value_c: String(attempt._id), value_d: reservation.bookingReference
  });
  try {
    const response = await gatewayFetch(getSslcommerzUrls().session, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: payload });
    const gatewayUrl = clean(response?.GatewayPageURL, 1000);
    const expectedHost = new URL(getSslcommerzUrls().session).hostname;
    if (response?.status !== "SUCCESS" || !gatewayUrl || new URL(gatewayUrl).hostname !== expectedHost) throw fail(clean(response?.failedreason, 240) || "SSLCOMMERZ did not create a payment session.", 502);
    await ReservationPaymentAttempt.updateOne({ _id: attempt._id }, { $set: { status: "pending", gatewayStatus: "SUCCESS", gatewayPageUrl: gatewayUrl } });
    return { gatewayUrl, bookingReference: reservation.bookingReference, amount, currency: "BDT" };
  } catch (error) {
    await Promise.all([
      ReservationPaymentAttempt.updateOne({ _id: attempt._id }, { $set: { status: "failed", failureReason: clean(error.message, 240) } }),
      Reservation.updateOne({ _id: reservation._id }, { $set: { status: "cancelled", paymentStatus: "failed" }, $unset: { reservationKey: 1, reservationKeys: 1, customerSlotKey: 1 } })
    ]);
    throw error;
  }
}

export async function processReservationPayment(payload) {
  const transactionId = clean(payload?.tran_id, 30);
  const attempt = await ReservationPaymentAttempt.findOne({ transactionId }).lean();
  if (!attempt) return null;
  if (attempt.status === "verified_paid") return { outcome: "verified_paid", attempt, reference: (await Reservation.findById(attempt.reservationId).select("bookingReference").lean())?.bookingReference };
  let record;
  const { storeId, storePassword } = getSslcommerzCredentials();
  if (clean(payload?.val_id, 80)) {
    const q = new URLSearchParams({ val_id: clean(payload.val_id,80), store_id: storeId, store_passwd: storePassword, format: "json" });
    record = await gatewayFetch(`${getSslcommerzUrls().validation}?${q}`);
  } else {
    const q = new URLSearchParams({ tran_id: transactionId, store_id: storeId, store_passwd: storePassword, format: "json" });
    const result = await gatewayFetch(`${getSslcommerzUrls().transactionQuery}?${q}`);
    record = (result?.element || []).find((item) => item.tran_id === transactionId);
  }
  const status = clean(record?.status, 40).toUpperCase();
  const valid = record?.tran_id === transactionId && good.has(status) && money(record?.currency_amount || record?.amount) === money(attempt.amount) && clean(record?.currency_type || record?.currency,3).toUpperCase() === "BDT";
  const reservation = await Reservation.findById(attempt.reservationId);
  if (!reservation) throw fail("Reservation not found.", 404);
  if (valid && Number(record?.risk_level || 0) !== 1) {
    await Promise.all([
      ReservationPaymentAttempt.updateOne({ _id: attempt._id }, { $set: { status: "verified_paid", gatewayStatus: status, validationId: clean(record.val_id,80), verifiedAt: new Date() } }),
      Reservation.updateOne({ _id: reservation._id }, { $set: { status: "confirmed", paymentStatus: "paid", paymentTransactionId: transactionId, paidAt: new Date(), heldUntil: null } })
    ]);
    return { outcome: "verified_paid", attempt, reference: reservation.bookingReference };
  }
  const outcome = Number(record?.risk_level || 0) === 1 ? "risk_hold" : "failed";
  await ReservationPaymentAttempt.updateOne({ _id: attempt._id }, { $set: { status: outcome, gatewayStatus: status || "FAILED" } });
  if (outcome === "failed") await Reservation.updateOne({ _id: reservation._id }, { $set: { status: "cancelled", paymentStatus: "failed" }, $unset: { reservationKey: 1, reservationKeys: 1, customerSlotKey: 1 } });
  return { outcome, attempt, reference: reservation.bookingReference };
}

export function reservationPaymentRedirect(outcome, reference) {
  const url = new URL(getPaymentClientReturnUrl());
  url.pathname = "/reservation-result";
  url.search = "";
  url.searchParams.set("payment", outcome === "verified_paid" ? "success" : outcome === "risk_hold" ? "review" : "failed");
  url.searchParams.set("reference", clean(reference, 50));
  return url.toString();
}
