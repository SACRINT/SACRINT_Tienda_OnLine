/**
 * SMS Service - Tarea 18.3
 * Servicio de SMS con Twilio
 */

import twilio from "twilio";
import { db } from "@/lib/db";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || "test_sid",
  process.env.TWILIO_AUTH_TOKEN || "test_token"
);

export type SMSType = "order_update" | "verification" | "promotion" | "delivery_reminder";

export async function sendSMS(
  phoneNumber: string,
  message: string,
  type: SMSType
): Promise<{ sid: string }> {
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER || "+1234567890",
      to: phoneNumber,
    });

    // Log en base de datos
    await db.smsLog.create({
      data: {
        to: phoneNumber,
        message,
        type,
        messageId: result.sid,
        status: "SENT",
        sentAt: new Date(),
      },
    }).catch(err => console.error("Error logging SMS:", err));

    return { sid: result.sid };
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
}

// Funciones helper para casos comunes
export async function sendOrderShippedSMS(phoneNumber: string, orderNumber: string, trackingNumber: string) {
  return sendSMS(
    phoneNumber,
    `Tu orden #${orderNumber} está en camino. Rastreo: ${trackingNumber}`,
    "order_update"
  );
}

export async function sendDeliveryReminderSMS(phoneNumber: string, orderNumber: string) {
  return sendSMS(
    phoneNumber,
    `¡Tu pedido #${orderNumber} será entregado hoy!`,
    "delivery_reminder"
  );
}

export async function sendVerificationCodeSMS(phoneNumber: string, code: string) {
  return sendSMS(
    phoneNumber,
    `Tu código de verificación es: ${code}`,
    "verification"
  );
}

// Modelo Prisma necesario
// model SMSLog {
//   id        String   @id @default(cuid())
//   to        String
//   message   String
//   type      String
//   messageId String
//   status    String   // SENT, DELIVERED, FAILED
//   sentAt    DateTime @default(now())
//   deliveredAt DateTime?
//   @@index([to, sentAt])
//   @@index([type])
// }
