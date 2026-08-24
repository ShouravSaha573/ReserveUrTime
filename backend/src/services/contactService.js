import crypto from "crypto";
import mongoose from "mongoose";
import { ContactMessage } from "../models/ContactMessage.js";
import { Restaurant } from "../models/Restaurant.js";
import { createNotification, notifyPlatformAdmins, notifyRestaurantAdmins } from "./notificationService.js";
import { isValidEmail, normalizeEmail } from "../utils/validation.js";

function reference() {
  return `RUT-MSG-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

function clean(value, max) {
  return String(value || "").trim().slice(0, max);
}

export async function createContactMessage({ user = null, body, verifiedIdentity = false }) {
  const targetType = body.targetType === "restaurant" ? "restaurant" : "platform";
  let restaurant = null;
  if (targetType === "restaurant") {
    const slug = clean(body.restaurantSlug, 160);
    restaurant = await Restaurant.findOne({ slug, isActive: true }).select("_id name slug").lean();
    if (!restaurant) {
      const error = new Error("Restaurant contact target is unavailable.");
      error.status = 404;
      throw error;
    }
  }

  const senderName = clean(verifiedIdentity ? body.name : user?.name || body.name, 80);
  const senderEmail = normalizeEmail(verifiedIdentity ? body.email : user?.email || body.email);
  const subject = clean(body.subject, 120);
  const messageBody = clean(body.message, 1600);

  if (senderName.length < 2) {
    const error = new Error("Name must be at least 2 characters.");
    error.status = 400;
    throw error;
  }
  if (!isValidEmail(senderEmail)) {
    const error = new Error("Enter a valid email address.");
    error.status = 400;
    throw error;
  }
  if (subject.length < 3) {
    const error = new Error("Subject must be at least 3 characters.");
    error.status = 400;
    throw error;
  }
  if (messageBody.length < 10) {
    const error = new Error("Message must be at least 10 characters.");
    error.status = 400;
    throw error;
  }

  const message = await ContactMessage.create({
    reference: reference(),
    targetType,
    restaurantId: restaurant?._id || null,
    senderUserId: user?.role === "customer" ? user._id : null,
    senderName,
    senderEmail,
    subject,
    body: messageBody
  });

  if (restaurant) {
    await notifyRestaurantAdmins(restaurant._id, {
      type: "contact_received",
      title: "New Customer message",
      message: `A new message was sent to ${restaurant.name}.`,
      href: "/restaurant-admin/messages"
    });
  } else {
    await notifyPlatformAdmins({
      type: "platform_message",
      title: "New platform message",
      message: "A new message was sent to Platform Admin.",
      href: "/platform-admin/messages"
    });
  }

  return { reference: message.reference, targetType, restaurant: restaurant ? { name: restaurant.name, slug: restaurant.slug } : null };
}


export async function listCustomerContactMessages(userId) {
  return ContactMessage.find({ senderUserId: userId })
    .select("reference targetType restaurantId subject body status response createdAt updatedAt")
    .populate("restaurantId", "name slug")
    .sort({ createdAt: -1 })
    .limit(150)
    .lean();
}

export async function lookupPublicContactMessage({ reference: rawReference, email: rawEmail }) {
  const ref = clean(rawReference, 60).toUpperCase();
  const email = normalizeEmail(rawEmail);
  if (!/^RUT-MSG-[A-Z0-9]+-[A-F0-9]{12}$/.test(ref) || !isValidEmail(email)) {
    const error = new Error("Enter a valid message reference and email.");
    error.status = 400;
    throw error;
  }
  const message = await ContactMessage.findOne({ reference: ref, senderEmail: email })
    .select("reference targetType restaurantId subject status response createdAt updatedAt")
    .populate("restaurantId", "name slug")
    .lean();
  if (!message) {
    const error = new Error("Message not found for that reference and email.");
    error.status = 404;
    throw error;
  }
  return message;
}

export async function listPlatformContactMessages({ status = "" } = {}) {
  const query = { targetType: "platform" };
  if (status) query.status = status;
  return ContactMessage.find(query).sort({ createdAt: -1 }).limit(300).lean();
}

export async function listRestaurantContactMessages(restaurantId, { status = "" } = {}) {
  const query = { targetType: "restaurant", restaurantId };
  if (status) query.status = status;
  return ContactMessage.find(query).sort({ createdAt: -1 }).limit(300).lean();
}

async function respondToMessage(query, actorUserId, { status, response }) {
  const nextStatus = String(status || "").trim();
  if (!["read", "resolved"].includes(nextStatus)) {
    const error = new Error("Message status must be read or resolved.");
    error.status = 400;
    throw error;
  }
  const reply = clean(response, 1200);
  const update = { status: nextStatus };
  if (reply) {
    update["response.body"] = reply;
    update["response.respondedBy"] = actorUserId;
    update["response.respondedAt"] = new Date();
  }
  const message = await ContactMessage.findOneAndUpdate(query, { $set: update }, { new: true, runValidators: true });
  if (!message) {
    const error = new Error("Contact message not found.");
    error.status = 404;
    throw error;
  }
  if (reply && message.senderUserId) {
    await createNotification({
      recipientUserId: message.senderUserId,
      restaurantId: message.restaurantId,
      type: "contact_reply",
      title: "Reply to your message",
      message: `A reply is available for message ${message.reference}.`,
      href: "/dashboard/messages"
    });
  }
  return message;
}

export async function respondPlatformContactMessage(messageId, actorUserId, payload) {
  if (!mongoose.isValidObjectId(messageId)) {
    const error = new Error("Invalid message id.");
    error.status = 400;
    throw error;
  }
  return respondToMessage({ _id: messageId, targetType: "platform" }, actorUserId, payload);
}

export async function respondRestaurantContactMessage(restaurantId, messageId, actorUserId, payload) {
  if (!mongoose.isValidObjectId(messageId)) {
    const error = new Error("Invalid message id.");
    error.status = 400;
    throw error;
  }
  return respondToMessage({ _id: messageId, targetType: "restaurant", restaurantId }, actorUserId, payload);
}
