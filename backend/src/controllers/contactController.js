import { asyncHandler } from "../utils/asyncHandler.js";
import { writeAuditLog } from "../services/auditService.js";
import {
  createContactMessage,
  listCustomerContactMessages,
  lookupPublicContactMessage,
  listPlatformContactMessages,
  listRestaurantContactMessages,
  respondPlatformContactMessage,
  respondRestaurantContactMessage
} from "../services/contactService.js";
import {
  requestContactVerification,
  verifyAndSendContact
} from "../services/contactVerificationService.js";

export const requestContactCode = asyncHandler(async (req, res) => {
  const result = await requestContactVerification({ body: req.body, user: req.user });
  res.status(201).json({ message: "Verification code sent to your email.", ...result });
});

export const verifyContactCode = asyncHandler(async (req, res) => {
  const result = await verifyAndSendContact({ body: req.body, user: req.user });
  res.status(201).json({ message: "Verified message emailed to the Platform Admin.", ...result });
});

export const submitPublicContact = asyncHandler(async (req, res) => {
  const result = await createContactMessage({ body: req.body });
  res.status(201).json({ message: "Message received.", ...result });
});

export const submitCustomerContact = asyncHandler(async (req, res) => {
  const result = await createContactMessage({ user: req.user, body: req.body });
  res.status(201).json({ message: "Message received.", ...result });
});

export const publicContactStatus = asyncHandler(async (req, res) => {
  const contactMessage = await lookupPublicContactMessage({ reference: req.body.reference, email: req.body.email });
  res.json({ contactMessage });
});

export const customerContactMessages = asyncHandler(async (req, res) => {
  const messages = await listCustomerContactMessages(req.user._id);
  res.json({ messages });
});

export const platformContactMessages = asyncHandler(async (req, res) => {
  const messages = await listPlatformContactMessages({ status: String(req.query.status || "").trim() });
  res.json({ messages });
});

export const reviewPlatformContactMessage = asyncHandler(async (req, res) => {
  const message = await respondPlatformContactMessage(req.params.messageId, req.user._id, req.body);
  await writeAuditLog(req, {
    action: "contact_message.update",
    entityType: "ContactMessage",
    entityId: message._id,
    changes: { status: message.status, responded: Boolean(message.response?.body) }
  });
  res.json({ message: "Contact message updated.", contactMessage: message });
});

export const restaurantContactMessages = asyncHandler(async (req, res) => {
  const messages = await listRestaurantContactMessages(req.managedRestaurantId, {
    status: String(req.query.status || "").trim()
  });
  res.json({ messages });
});

export const reviewRestaurantContactMessage = asyncHandler(async (req, res) => {
  const message = await respondRestaurantContactMessage(
    req.managedRestaurantId,
    req.params.messageId,
    req.user._id,
    req.body
  );
  await writeAuditLog(req, {
    action: "restaurant_contact_message.update",
    entityType: "ContactMessage",
    entityId: message._id,
    changes: { status: message.status, responded: Boolean(message.response?.body) }
  });
  res.json({ message: "Contact message updated.", contactMessage: message });
});
