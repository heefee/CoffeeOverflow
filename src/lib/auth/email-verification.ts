import { createHmac, randomInt, randomUUID, timingSafeEqual } from "crypto";
import { Resend } from "resend";
import { query } from "@/lib/db";

const CODE_TTL_MINUTES = 10;

interface VerificationRow {
  id: string;
  code_hash: string;
  expires_at: Date;
  consumed_at: Date | null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getEmailSecret(): string {
  const secret = process.env.EMAIL_VERIFICATION_SECRET ?? process.env.APP_SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") {
    return "dev-only-email-verification-secret-change-me";
  }
  throw new Error("EMAIL_VERIFICATION_SECRET or APP_SESSION_SECRET is required");
}

function hashCode(email: string, code: string): string {
  return createHmac("sha256", getEmailSecret())
    .update(`${normalizeEmail(email)}:${code}`)
    .digest("hex");
}

function isSameHash(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is required to send verification emails");
  return new Resend(apiKey);
}

function getFromEmail() {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) throw new Error("RESEND_FROM_EMAIL is required to send verification emails");
  return fromEmail;
}

function getDeliveryEmail(requestedEmail: string) {
  return normalizeEmail(process.env.RESEND_VERIFICATION_TO_EMAIL || requestedEmail);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendVerificationCode(email: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error("Adresa de email nu este validă.");
  }

  const deliveryEmail = getDeliveryEmail(normalizedEmail);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(deliveryEmail)) {
    throw new Error("RESEND_VERIFICATION_TO_EMAIL nu este o adresă de email validă.");
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
  const requestedEmailNote =
    deliveryEmail === normalizedEmail
      ? ""
      : `\nEmail introdus în aplicație: ${normalizedEmail}.`;
  const requestedEmailHtml =
    deliveryEmail === normalizedEmail
      ? ""
      : `<p style="color: #64748b;">Email introdus în aplicație: ${escapeHtml(normalizedEmail)}</p>`;

  await query(
    `
      INSERT INTO email_verification_codes (id, email, code_hash, expires_at)
      VALUES ($1, $2, $3, $4);
    `,
    [randomUUID(), normalizedEmail, hashCode(normalizedEmail, code), expiresAt],
  );

  await getResend().emails.send({
    from: getFromEmail(),
    to: deliveryEmail,
    subject: "Codul tău de verificare eAvizat",
    text: `Codul tău de verificare eAvizat este ${code}. Codul expiră în ${CODE_TTL_MINUTES} minute.${requestedEmailNote}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; color: #0f172a;">
        <p>Codul tău de verificare eAvizat este:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.18em;">${code}</p>
        <p>Codul expiră în ${CODE_TTL_MINUTES} minute.</p>
        ${requestedEmailHtml}
      </div>
    `,
  });

  return { email: normalizedEmail, expiresAt };
}

export async function verifyEmailCode(email: string, code: string): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);
  const result = await query<VerificationRow>(
    `
      SELECT id, code_hash, expires_at, consumed_at
      FROM email_verification_codes
      WHERE email = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `,
    [normalizedEmail],
  );

  const verification = result.rows[0];
  if (!verification || verification.consumed_at) return false;
  if (new Date(verification.expires_at).getTime() < Date.now()) return false;

  const isValid = isSameHash(verification.code_hash, hashCode(normalizedEmail, code.trim()));
  if (!isValid) return false;

  await query(
    `
      UPDATE email_verification_codes
      SET consumed_at = NOW()
      WHERE id = $1;
    `,
    [verification.id],
  );

  return true;
}
