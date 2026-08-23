const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

function configuredValue(name, max = 240) {
  return String(process.env[name] || "").trim().slice(0, max);
}

function emailError(message, status = 503) {
  return Object.assign(new Error(message), { status });
}

export function assertBrevoConfigured() {
  const apiKey = configuredValue("BREVO_API_KEY", 500);
  const senderEmail = configuredValue("BREVO_SENDER_EMAIL", 180).toLowerCase();
  const adminEmail = configuredValue("PLATFORM_CONTACT_EMAIL", 180).toLowerCase();
  if (!apiKey || !senderEmail || !adminEmail) {
    throw emailError("Contact email is not configured. Add a Brevo API key and verified sender email.");
  }
  return {
    apiKey,
    senderEmail,
    senderName: configuredValue("BREVO_SENDER_NAME", 70) || "ReserveUrTime",
    adminEmail
  };
}

export async function sendBrevoEmail({ to, toName = "", subject, textContent, replyTo, tags = [] }) {
  const config = assertBrevoConfigured();
  let response;
  try {
    response = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": config.apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { email: config.senderEmail, name: config.senderName },
        to: [{ email: to, ...(toName ? { name: toName } : {}) }],
        subject,
        textContent,
        ...(replyTo ? { replyTo } : {}),
        ...(tags.length ? { tags } : {})
      }),
      signal: AbortSignal.timeout(12000)
    });
  } catch {
    throw emailError("The verification email service is temporarily unavailable.", 502);
  }

  if (!response.ok) {
    if (process.env.NODE_ENV !== "production") {
      const detail = (await response.text()).slice(0, 300);
      console.error(`Brevo email rejected (${response.status}): ${detail}`);
    }
    throw emailError("The email service could not send this message.", 502);
  }

  return response.json().catch(() => ({}));
}

export async function sendContactVerificationCode({ email, name, code }) {
  return sendBrevoEmail({
    to: email,
    toName: name,
    subject: "Verify your ReserveUrTime contact message",
    textContent: `Your ReserveUrTime verification code is ${code}. It expires in 10 minutes. If you did not request this code, ignore this email.`,
    tags: ["contact-verification"]
  });
}

export async function sendPlatformContactEmail({ senderName, senderEmail, subject, message, reference }) {
  const { adminEmail } = assertBrevoConfigured();
  return sendBrevoEmail({
    to: adminEmail,
    toName: "ReserveUrTime Platform Admin",
    subject: `[ReserveUrTime] ${subject}`,
    textContent: `Verified sender: ${senderName} <${senderEmail}>\nReference: ${reference}\n\n${message}`,
    replyTo: { email: senderEmail, name: senderName },
    tags: ["platform-contact"]
  });
}
