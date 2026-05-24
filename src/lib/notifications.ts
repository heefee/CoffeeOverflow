import { randomUUID } from "crypto";
import { Resend } from "resend";
import { query } from "@/lib/db";
import type { Authorization, PropertyRecord } from "@/types";
import type { AuthUser } from "./auth/session";

export interface PropertySubscriptionRow {
  id: string;
  user_id: string;
  property_ref: string;
  property_label: string;
  property_address: string;
  created_at: Date;
}

export interface PropertyNotificationRow {
  id: string;
  user_id: string;
  property_ref: string;
  authorization_id: string;
  title: string;
  message: string;
  expires_at: Date;
  notify_at: Date;
  email_sent_at: Date | null;
  read_at: Date | null;
  created_at: Date;
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is required to send notifications");
  return new Resend(apiKey);
}

function getFromEmail() {
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) throw new Error("RESEND_FROM_EMAIL is required to send notifications");
  return fromEmail;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getDeliveryEmail(requestedEmail: string) {
  return normalizeEmail(process.env.RESEND_VERIFICATION_TO_EMAIL || requestedEmail);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium" }).format(date);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function getSubscription(userId: string, propertyRef: string) {
  const result = await query<PropertySubscriptionRow>(
    `
      SELECT id, user_id, property_ref, property_label, property_address, created_at
      FROM property_subscriptions
      WHERE user_id = $1 AND property_ref = $2
      LIMIT 1;
    `,
    [userId, propertyRef],
  );
  return result.rows[0] ?? null;
}

export async function upsertSubscription({
  user,
  propertyRef,
  propertyLabel,
  propertyAddress,
}: {
  user: AuthUser;
  propertyRef: string;
  propertyLabel: string;
  propertyAddress: string;
}) {
  const result = await query<PropertySubscriptionRow>(
    `
      INSERT INTO property_subscriptions
        (id, user_id, property_ref, property_label, property_address)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, property_ref) DO UPDATE
      SET property_label = EXCLUDED.property_label,
          property_address = EXCLUDED.property_address
      RETURNING id, user_id, property_ref, property_label, property_address, created_at;
    `,
    [randomUUID(), user.sub, propertyRef, propertyLabel, propertyAddress],
  );
  return result.rows[0];
}

export async function deleteSubscription(userId: string, propertyRef: string) {
  await query(
    `
      DELETE FROM property_subscriptions
      WHERE user_id = $1 AND property_ref = $2;
    `,
    [userId, propertyRef],
  );
}

export async function listNotifications(userId: string) {
  const result = await query<PropertyNotificationRow>(
    `
      SELECT id, user_id, property_ref, authorization_id, title, message, expires_at,
             notify_at, email_sent_at, read_at, created_at
      FROM property_notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20;
    `,
    [userId],
  );
  return result.rows;
}

export async function markNotificationRead(userId: string, notificationId: string) {
  await query(
    `
      UPDATE property_notifications
      SET read_at = NOW()
      WHERE user_id = $1 AND id = $2;
    `,
    [userId, notificationId],
  );
}

export function pickAuthorizationForDemo(property: PropertyRecord): Authorization | null {
  return (
    property.authorizations.existing.find((authorization) => authorization.status === "active") ??
    property.authorizations.existing[0] ??
    null
  );
}

export async function createExpirationNotification({
  user,
  property,
  authorization,
  expiresAt = addDays(new Date(), 30),
}: {
  user: AuthUser;
  property: PropertyRecord;
  authorization: Authorization;
  expiresAt?: Date;
}) {
  const notifyAt = addDays(expiresAt, -30);
  const title = `Autorizație aproape de expirare: ${authorization.type}`;
  const message = `${authorization.type}${
    authorization.number ? ` nr. ${authorization.number}` : ""
  } pentru ${property.address} expiră la ${formatDate(expiresAt)}.`;

  const result = await query<PropertyNotificationRow>(
    `
      INSERT INTO property_notifications
        (id, user_id, property_ref, authorization_id, title, message, expires_at, notify_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id, property_ref, authorization_id, expires_at) DO UPDATE
      SET title = EXCLUDED.title,
          message = EXCLUDED.message,
          notify_at = EXCLUDED.notify_at
      RETURNING id, user_id, property_ref, authorization_id, title, message, expires_at,
                notify_at, email_sent_at, read_at, created_at;
    `,
    [
      randomUUID(),
      user.sub,
      property.cadastralRef,
      authorization.id,
      title,
      message,
      expiresAt,
      notifyAt,
    ],
  );

  const notification = result.rows[0];
  const emailDelivery = await sendExpirationEmail(user.email, notification, property);
  if (emailDelivery.sent) {
    await query(
      `
        UPDATE property_notifications
        SET email_sent_at = NOW()
        WHERE id = $1;
      `,
      [notification.id],
    );
  }

  return {
    notification: {
      ...notification,
      email_sent_at: emailDelivery.sent ? new Date() : notification.email_sent_at,
    },
    emailDelivery,
  };
}

async function sendExpirationEmail(
  email: string,
  notification: PropertyNotificationRow,
  property: PropertyRecord,
) {
  const deliveryEmail = getDeliveryEmail(email);
  const requestedEmailNote =
    deliveryEmail === normalizeEmail(email) ? "" : `\nEmail cont utilizator: ${email}.`;
  const requestedEmailHtml =
    deliveryEmail === normalizeEmail(email)
      ? ""
      : `<p style="color: #64748b;">Email cont utilizator: ${email}</p>`;

  try {
    await getResend().emails.send({
      from: getFromEmail(),
      to: deliveryEmail,
      subject: notification.title,
      text: `${notification.message}\n\nImobil: ${property.cadastralRef}\nAdresa: ${property.address}${requestedEmailNote}`,
      html: `
        <div style="font-family: Inter, Arial, sans-serif; color: #0f172a;">
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          <p><strong>Imobil:</strong> ${property.cadastralRef}</p>
          <p><strong>Adresă:</strong> ${property.address}</p>
          ${requestedEmailHtml}
        </div>
      `,
    });
    return { sent: true, to: deliveryEmail };
  } catch (error) {
    console.error("Expiration notification email error:", error);
    return {
      sent: false,
      to: deliveryEmail,
      error: error instanceof Error ? error.message : "Nu am putut trimite emailul.",
    };
  }
}
