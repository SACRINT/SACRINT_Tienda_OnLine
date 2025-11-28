/**
 * Notification Testing - Tarea 18.12
 */
import { sendEmail } from "../email/email-service";
import { sendSMS } from "./sms-service";
import { EmailTemplate } from "@/lib/db/enums";

export async function sendTestEmail(email: string) {
  return sendEmail({
    to: email,
    subject: "Test Email from Tienda Online",
    template: EmailTemplate.ORDER_CONFIRMATION,
    data: { orderNumber: "TEST-001", total: 99.99 },
  });
}

export async function sendTestSMS(phone: string) {
  return sendSMS(phone, "Test SMS from Tienda Online", "verification");
}
