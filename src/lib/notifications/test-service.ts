/**
 * Notification Testing - Tarea 18.12
 */
import { sendEmail } from "../email/email-service";
import { sendSMS } from "./sms-service";
import { OrderConfirmationTemplate } from "../email/templates";

export async function sendTestEmail(email: string) {
  return sendEmail({
    to: email,
    subject: "Test Email from Tienda Online",
    react: OrderConfirmationTemplate({ orderNumber: "TEST-001", total: 99.99 }),
  });
}

export async function sendTestSMS(phone: string) {
  return sendSMS(phone, "Test SMS from Tienda Online", "verification");
}
