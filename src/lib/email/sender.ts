/**
 * Email Sender
 * Sistema de envío de emails con Resend
 */

import { logger } from "../monitoring/logger";
import { trackError } from "../monitoring/metrics";
import type { EmailTemplate } from "./templates";

export interface SendEmailOptions {
  to: string | string[];
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export class EmailSender {
  private apiKey: string;
  private defaultFrom: string;

  constructor(apiKey?: string, defaultFrom?: string) {
    this.apiKey = apiKey || process.env.RESEND_API_KEY || "";
    this.defaultFrom = defaultFrom || process.env.EMAIL_FROM || "noreply@example.com";
  }

  /**
   * Enviar email
   */
  async send(
    template: EmailTemplate,
    options: SendEmailOptions,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.apiKey) {
        logger.warn({ type: "email_no_api_key" }, "Resend API key not configured");
        return { success: false, error: "Email service not configured" };
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: options.from || this.defaultFrom,
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: template.subject,
          html: template.html,
          text: template.text,
          reply_to: options.replyTo,
          cc: options.cc,
          bcc: options.bcc,
          attachments: options.attachments,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error({ type: "email_send_error", error }, "Failed to send email");
        return { success: false, error };
      }

      const result = await response.json();

      logger.info(
        {
          type: "email_sent",
          to: options.to,
          subject: template.subject,
          messageId: result.id,
        },
        "Email sent successfully",
      );

      return { success: true, messageId: result.id };
    } catch (error) {
      trackError("email_send_error", error instanceof Error ? error.message : "Unknown");
      logger.error({ error }, "Email sending failed");
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Enviar email de forma asíncrona (fire and forget)
   */
  async sendAsync(template: EmailTemplate, options: SendEmailOptions): Promise<void> {
    // No esperar resultado
    this.send(template, options).catch((error) => {
      logger.error({ error }, "Async email sending failed");
    });
  }

  /**
   * Enviar múltiples emails
   */
  async sendBatch(
    emails: Array<{ template: EmailTemplate; options: SendEmailOptions }>,
  ): Promise<Array<{ success: boolean; messageId?: string; error?: string }>> {
    return Promise.all(emails.map((email) => this.send(email.template, email.options)));
  }

  /**
   * Validar dirección de email
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Instancia singleton
export const emailSender = new EmailSender();

export default EmailSender;
