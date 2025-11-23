/**
 * Email Templates
 *
 * Export all email templates for the email service
 */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Import actual templates
export { default as AccountVerificationEmail } from "./account-verification";
export { default as OrderConfirmationEmail } from "./order-confirmation";
export { default as PaymentFailedEmail } from "./payment-failed";

// Placeholder templates - will be expanded later
export const OrderShippedEmail = (data: any) => <div>Order Shipped</div>;
export const OrderDeliveredEmail = (data: any) => <div>Order Delivered</div>;
export const OrderCancelledEmail = (data: any) => <div>Order Cancelled</div>;
export const RefundProcessedEmail = (data: any) => <div>Refund Processed</div>;
export const PasswordResetEmail = (data: any) => <div>Password Reset</div>;
export const WelcomeEmail = (data: any) => <div>Welcome</div>;
export const NewsletterEmail = (data: any) => <div>Newsletter</div>;
export const PromotionEmail = (data: any) => <div>Promotion</div>;
export const ReviewRequestEmail = (data: any) => <div>Review Request</div>;
export const ProductRestockedEmail = (data: any) => <div>Product Restocked</div>;

// Template rendering helpers
export interface EmailTemplateData {
  subject: string;
  html: string;
  text?: string;
}

/**
 * Render React component to HTML string for email
 */
export function renderEmailTemplate(component: React.ReactElement): string {
  return renderToStaticMarkup(component);
}

/**
 * Account Verification Template
 */
export function accountVerificationTemplate(data: {
  customerName: string;
  verificationUrl: string;
  expiresInHours?: number;
}): EmailTemplateData {
  const AccountVerificationEmailComponent = require("./account-verification").default;

  return {
    subject: "Verify Your Email Address - SACRINT Tienda Online",
    html: renderEmailTemplate(
      <AccountVerificationEmailComponent
        customerName={data.customerName}
        verificationUrl={data.verificationUrl}
        expiresInHours={data.expiresInHours || 24}
      />,
    ),
    text: `Hi ${data.customerName},\n\nThank you for signing up! Please verify your email address by clicking the link below:\n\n${data.verificationUrl}\n\nThis link will expire in ${data.expiresInHours || 24} hours.\n\nIf you didn't create an account, you can safely ignore this email.`,
  };
}

/**
 * Order Confirmation Template
 */
export function orderConfirmationTemplate(data: any): EmailTemplateData {
  const OrderConfirmationEmailComponent = require("./order-confirmation").default;

  return {
    subject: `Order Confirmed - ${data.orderNumber}`,
    html: renderEmailTemplate(<OrderConfirmationEmailComponent {...data} />),
    text: `Order ${data.orderNumber} confirmed. Total: $${(data.orderTotal / 100).toFixed(2)}`,
  };
}

/**
 * Order Shipped Template
 */
export function orderShippedTemplate(data: any): EmailTemplateData {
  return {
    subject: `Your order has shipped - ${data.orderNumber}`,
    html: renderEmailTemplate(<OrderShippedEmail {...data} />),
    text: `Your order ${data.orderNumber} has shipped!`,
  };
}

/**
 * Password Reset Template
 */
export function passwordResetTemplate(data: {
  customerName: string;
  resetUrl: string;
}): EmailTemplateData {
  return {
    subject: "Reset Your Password - SACRINT Tienda Online",
    html: renderEmailTemplate(<PasswordResetEmail {...data} />),
    text: `Hi ${data.customerName},\n\nClick the link below to reset your password:\n\n${data.resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
  };
}

/**
 * Welcome Template
 */
export function welcomeTemplate(data: { customerName: string }): EmailTemplateData {
  return {
    subject: "Welcome to SACRINT Tienda Online!",
    html: renderEmailTemplate(<WelcomeEmail {...data} />),
    text: `Hi ${data.customerName},\n\nWelcome to SACRINT Tienda Online! We're excited to have you.`,
  };
}
