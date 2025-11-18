/**
 * Email Service
 *
 * Centralized email sending service using Resend API
 * Supports:
 * - Transactional emails
 * - Email templates with React Email
 * - Email tracking and logging
 * - Retry logic
 */

import { Resend } from "resend";
import { db } from "@/lib/db";
import { EmailTemplate, EmailStatus } from "@/lib/db/enums";

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY!);

export interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
  userId?: string;
  tenantId?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  emailLogId?: string;
}

/**
 * Send an email using a template
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<EmailResult> {
  const {
    to,
    from = process.env.FROM_EMAIL || "noreply@sacrint.com",
    subject,
    template,
    data,
    userId,
    tenantId,
    replyTo,
    cc,
    bcc,
  } = options;

  try {
    // Get the React Email component for this template
    const EmailComponent = await getEmailTemplate(template, data);

    // Send email via Resend
    const result = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      react: EmailComponent,
      replyTo,
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
    });

    // Log the email in database
    const emailLog = await db.emailLog.create({
      data: {
        to: Array.isArray(to) ? to[0] : to,
        from,
        subject,
        template,
        status: EmailStatus.SENT,
        sentAt: new Date(),
        providerMessageId: result.data?.id,
        userId,
        tenantId,
        metadata: {
          cc,
          bcc,
          ...data,
        },
      },
    });

    return {
      success: true,
      messageId: result.data?.id,
      emailLogId: emailLog.id,
    };
  } catch (error: any) {
    console.error("[Email Service] Send error:", error);

    // Log failed email
    try {
      await db.emailLog.create({
        data: {
          to: Array.isArray(to) ? to[0] : to,
          from,
          subject,
          template,
          status: EmailStatus.FAILED,
          error: error.message,
          userId,
          tenantId,
          metadata: data,
        },
      });
    } catch (logError) {
      console.error("[Email Service] Failed to log error:", logError);
    }

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send email with retry logic
 */
export async function sendEmailWithRetry(
  options: SendEmailOptions,
  maxRetries = 3,
  retryDelay = 1000,
): Promise<EmailResult> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendEmail(options);

    if (result.success) {
      return result;
    }

    lastError = result.error;

    // Don't retry on final attempt
    if (attempt < maxRetries) {
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
    }
  }

  return {
    success: false,
    error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`,
  };
}

/**
 * Get React Email component for a template
 */
async function getEmailTemplate(
  template: EmailTemplate,
  data: Record<string, any>,
) {
  // Import all templates from index
  const templates = await import("./templates");

  // Dynamic template selection
  switch (template) {
    case EmailTemplate.ORDER_CONFIRMATION:
      return templates.OrderConfirmationEmail(data as any);
    case EmailTemplate.ORDER_SHIPPED:
      return templates.OrderShippedEmail(data as any);
    case EmailTemplate.ORDER_DELIVERED:
      return templates.OrderDeliveredEmail(data as any);
    case EmailTemplate.ORDER_CANCELLED:
      return templates.OrderCancelledEmail(data as any);
    case EmailTemplate.REFUND_PROCESSED:
      return templates.RefundProcessedEmail(data as any);
    case EmailTemplate.PAYMENT_FAILED:
      return templates.PaymentFailedEmail(data as any);
    case EmailTemplate.ACCOUNT_VERIFICATION:
      return templates.AccountVerificationEmail(data as any);
    case EmailTemplate.PASSWORD_RESET:
      return templates.PasswordResetEmail(data as any);
    case EmailTemplate.WELCOME:
      return templates.WelcomeEmail(data as any);
    case EmailTemplate.NEWSLETTER:
      return templates.NewsletterEmail(data as any);
    case EmailTemplate.PROMOTION:
      return templates.PromotionEmail(data as any);
    case EmailTemplate.REVIEW_REQUEST:
      return templates.ReviewRequestEmail(data as any);
    case EmailTemplate.PRODUCT_RESTOCKED:
      return templates.ProductRestockedEmail(data as any);
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

/**
 * Mark email as delivered (called by webhook)
 */
export async function markEmailDelivered(providerMessageId: string) {
  await db.emailLog.updateMany({
    where: { providerMessageId },
    data: {
      status: EmailStatus.DELIVERED,
      deliveredAt: new Date(),
    },
  });
}

/**
 * Mark email as opened (called by webhook/tracking pixel)
 */
export async function markEmailOpened(providerMessageId: string) {
  await db.emailLog.updateMany({
    where: { providerMessageId },
    data: {
      status: EmailStatus.OPENED,
      openedAt: new Date(),
    },
  });
}

/**
 * Mark email as clicked (called by webhook/link tracking)
 */
export async function markEmailClicked(providerMessageId: string) {
  await db.emailLog.updateMany({
    where: { providerMessageId },
    data: {
      status: EmailStatus.CLICKED,
      clickedAt: new Date(),
    },
  });
}

/**
 * Mark email as bounced (called by webhook)
 */
export async function markEmailBounced(
  providerMessageId: string,
  error: string,
) {
  await db.emailLog.updateMany({
    where: { providerMessageId },
    data: {
      status: EmailStatus.BOUNCED,
      bouncedAt: new Date(),
      error,
    },
  });
}

/**
 * Get email statistics for a user
 */
export async function getEmailStats(userId: string) {
  const [total, sent, delivered, opened, clicked, bounced, failed] =
    await Promise.all([
      db.emailLog.count({ where: { userId } }),
      db.emailLog.count({ where: { userId, status: EmailStatus.SENT } }),
      db.emailLog.count({ where: { userId, status: EmailStatus.DELIVERED } }),
      db.emailLog.count({ where: { userId, status: EmailStatus.OPENED } }),
      db.emailLog.count({ where: { userId, status: EmailStatus.CLICKED } }),
      db.emailLog.count({ where: { userId, status: EmailStatus.BOUNCED } }),
      db.emailLog.count({ where: { userId, status: EmailStatus.FAILED } }),
    ]);

  return {
    total,
    sent,
    delivered,
    opened,
    clicked,
    bounced,
    failed,
    openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
    clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
  };
}
