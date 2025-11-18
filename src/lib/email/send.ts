// Email Sending Functions
// High-level functions to send transactional emails using Resend

import { resend, EMAIL_CONFIG, isEmailEnabled } from "./client";
import { OrderConfirmationEmail } from "./templates/order-confirmation";
import { PaymentFailedEmail } from "./templates/payment-failed";
import { render } from "@react-email/components";

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderTotal: number;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  trackingUrl?: string;
}

export interface PaymentFailedEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderTotal: number;
  failureReason?: string;
  retryUrl: string;
}

/**
 * Sends order confirmation email after successful payment
 * @param data Order and customer information
 * @returns Email send result or null if email is disabled
 */
export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  if (!isEmailEnabled()) {
    console.warn(
      "[EMAIL] Email functionality is disabled. Skipping order confirmation email.",
    );
    return null;
  }

  try {
    const emailHtml = await render(
      OrderConfirmationEmail({
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        orderTotal: data.orderTotal,
        orderDate: data.orderDate,
        items: data.items,
        shippingAddress: data.shippingAddress,
        trackingUrl: data.trackingUrl,
      }),
    );

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.fromEmail,
      to: data.customerEmail,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: emailHtml,
      tags: [
        { name: "type", value: "order-confirmation" },
        { name: "order-number", value: data.orderNumber },
      ],
    });

    console.log(
      `[EMAIL] Order confirmation sent to ${data.customerEmail} for order ${data.orderNumber}`,
    );

    return result;
  } catch (error) {
    console.error("[EMAIL] Error sending order confirmation email:", error);
    throw error;
  }
}

/**
 * Sends payment failed notification email
 * @param data Order and failure information
 * @returns Email send result or null if email is disabled
 */
export async function sendPaymentFailedEmail(data: PaymentFailedEmailData) {
  if (!isEmailEnabled()) {
    console.warn(
      "[EMAIL] Email functionality is disabled. Skipping payment failed email.",
    );
    return null;
  }

  try {
    const emailHtml = await render(
      PaymentFailedEmail({
        orderNumber: data.orderNumber,
        customerName: data.customerName,
        orderTotal: data.orderTotal,
        failureReason: data.failureReason,
        retryUrl: data.retryUrl,
      }),
    );

    const result = await resend.emails.send({
      from: EMAIL_CONFIG.fromEmail,
      to: data.customerEmail,
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `Payment Failed - ${data.orderNumber}`,
      html: emailHtml,
      tags: [
        { name: "type", value: "payment-failed" },
        { name: "order-number", value: data.orderNumber },
      ],
    });

    console.log(
      `[EMAIL] Payment failed notification sent to ${data.customerEmail} for order ${data.orderNumber}`,
    );

    return result;
  } catch (error) {
    console.error("[EMAIL] Error sending payment failed email:", error);
    throw error;
  }
}

/**
 * Sends a simple text email (for testing or basic notifications)
 * @param to Recipient email
 * @param subject Email subject
 * @param text Plain text content
 * @param html HTML content (optional)
 * @returns Email send result or null if email is disabled
 */
export async function sendSimpleEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
) {
  if (!isEmailEnabled()) {
    console.warn(
      "[EMAIL] Email functionality is disabled. Skipping simple email.",
    );
    return null;
  }

  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.fromEmail,
      to,
      replyTo: EMAIL_CONFIG.replyTo,
      subject,
      text,
      html,
    });

    console.log(`[EMAIL] Simple email sent to ${to}`);

    return result;
  } catch (error) {
    console.error("[EMAIL] Error sending simple email:", error);
    throw error;
  }
}
