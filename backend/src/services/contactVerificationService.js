import crypto from "crypto";
import { ContactVerification } from "../models/ContactVerification.js";
import { ContactMessage } from "../models/ContactMessage.js";
import { createContactMessage } from "./contactService.js";
import { sendContactVerificationCode, sendPlatformContactEmail } from "./brevoEmailService.js";
import { isValidEmail, normalizeEmail } from "../utils/validation.js";

const clean = (value, max) => String(value || "").trim().slice(0, max);
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
const hashCode = (id, code) => crypto.createHash("sha256").update(`${id}:${code}:${process.env.JWT_SECRET}`).digest("hex");

function validateDraft(body, user) {
  const email = normalizeEmail(body.email);
  const draft = {
    targetType: body.targetType === "restaurant" ? "restaurant" : "platform",
    restaurantSlug: clean(body.restaurantSlug, 160),
    name: clean(body.name, 80),
    subject: clean(body.subject, 120),
    message: clean(body.message, 1600)
  };
  if (!isValidEmail(email)) throw fail("Enter a valid email address.");
  if (draft.name.length < 2) throw fail("Name must be at least 2 characters.");
  if (draft.subject.length < 3) throw fail("Subject must be at least 3 characters.");
  if (draft.message.length < 10) throw fail("Message must be at least 10 characters.");
  return { email, draft };
}

export async function requestContactVerification({ body, user = null }) {
  const { email, draft } = validateDraft(body, user);
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const verification = new ContactVerification({
    email,
    codeHash: "pending",
    draft,
    userId: user?._id || null,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });
  verification.codeHash = hashCode(verification._id, code);
  await verification.save();
  try {
    await sendContactVerificationCode({ email, name: draft.name, code });
  } catch (error) {
    await ContactVerification.deleteOne({ _id: verification._id });
    throw error;
  }
  return { verificationId: verification._id, expiresInSeconds: 600 };
}

export async function verifyAndSendContact({ body, user = null }) {
  const verificationId = clean(body.verificationId, 40);
  const code = clean(body.code, 6);
  if (!/^[a-f\d]{24}$/i.test(verificationId) || !/^\d{6}$/.test(code)) {
    throw fail("Enter the six-digit verification code.");
  }
  const verification = await ContactVerification.findById(verificationId).select("+codeHash");
  if (!verification || verification.expiresAt <= new Date()) throw fail("Verification code expired. Request a new code.", 410);
  if (verification.attemptsRemaining <= 0) throw fail("Too many incorrect attempts. Request a new code.", 429);
  if (user && verification.userId && String(user._id) !== String(verification.userId)) throw fail("Verification request does not belong to this account.", 403);

  const expected = Buffer.from(verification.codeHash, "hex");
  const actual = Buffer.from(hashCode(verification._id, code), "hex");
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    verification.attemptsRemaining -= 1;
    await verification.save();
    throw fail("Incorrect verification code.");
  }

  const payload = {
    ...verification.draft.toObject(),
    email: verification.email
  };
  const result = await createContactMessage({ user, body: payload, verifiedIdentity: true });
  if (verification.draft.targetType === "platform") {
    try {
      await sendPlatformContactEmail({
        senderName: verification.draft.name,
        senderEmail: verification.email,
        subject: verification.draft.subject,
        message: verification.draft.message,
        reference: result.reference
      });
    } catch (error) {
      await ContactMessage.deleteOne({ reference: result.reference });
      throw error;
    }
  }
  await ContactVerification.deleteOne({ _id: verification._id });
  return result;
}
