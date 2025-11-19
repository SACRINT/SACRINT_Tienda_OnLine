// Email Service Integration
// Email sending with Resend

import { z } from "zod";

// Email schemas
export const EmailRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export const EmailSchema = z.object({
  to: z.union([EmailRecipientSchema, z.array(EmailRecipientSchema)]),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  from: z.string().optional(),
  replyTo: z.string().email().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string(), // base64
      }),
    )
    .optional(),
});

export type EmailRecipient = z.infer<typeof EmailRecipientSchema>;
export type Email = z.infer<typeof EmailSchema>;

// Email templates
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
}

// Email service interface
export interface EmailService {
  send(email: Email): Promise<{ id: string }>;
  sendTemplate(
    templateId: string,
    to: EmailRecipient | EmailRecipient[],
    variables: Record<string, string>,
  ): Promise<{ id: string }>;
}

// Resend implementation
export class ResendEmailService implements EmailService {
  private apiKey: string;
  private defaultFrom: string;
  private baseUrl = "https://api.resend.com";

  constructor(apiKey: string, defaultFrom: string) {
    this.apiKey = apiKey;
    this.defaultFrom = defaultFrom;
  }

  async send(email: Email): Promise<{ id: string }> {
    const validated = EmailSchema.parse(email);

    const response = await fetch(`${this.baseUrl}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: validated.from || this.defaultFrom,
        to: Array.isArray(validated.to)
          ? validated.to.map((r) => r.email)
          : validated.to.email,
        subject: validated.subject,
        html: validated.html,
        text: validated.text,
        reply_to: validated.replyTo,
        attachments: validated.attachments,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Email failed: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    return { id: result.id };
  }

  async sendTemplate(
    templateId: string,
    to: EmailRecipient | EmailRecipient[],
    variables: Record<string, string>,
  ): Promise<{ id: string }> {
    // Get template
    const template = await this.getTemplate(templateId);

    // Replace variables
    let html = template.html;
    let subject = template.subject;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      html = html.replace(new RegExp(placeholder, "g"), value);
      subject = subject.replace(new RegExp(placeholder, "g"), value);
    }

    return this.send({
      to,
      subject,
      html,
    });
  }

  private async getTemplate(templateId: string): Promise<EmailTemplate> {
    // In production, fetch from database
    const templates: Record<string, EmailTemplate> = {
      welcome: {
        id: "welcome",
        name: "Welcome Email",
        subject: "Welcome to {{storeName}}!",
        html: `
          <h1>Welcome, {{customerName}}!</h1>
          <p>Thank you for joining {{storeName}}. We're excited to have you!</p>
          <p>Start shopping now and discover our amazing products.</p>
          <a href="{{storeUrl}}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Shop Now
          </a>
        `,
      },
      order_confirmation: {
        id: "order_confirmation",
        name: "Order Confirmation",
        subject: "Order Confirmed - {{orderNumber}}",
        html: `
          <h1>Thank you for your order!</h1>
          <p>Hi {{customerName}},</p>
          <p>Your order <strong>{{orderNumber}}</strong> has been confirmed.</p>
          <p><strong>Total:</strong> {{total}}</p>
          <p>We'll send you another email when your order ships.</p>
          <a href="{{orderUrl}}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            View Order
          </a>
        `,
      },
      shipping_update: {
        id: "shipping_update",
        name: "Shipping Update",
        subject: "Your order has shipped - {{orderNumber}}",
        html: `
          <h1>Your order is on its way!</h1>
          <p>Hi {{customerName}},</p>
          <p>Great news! Your order <strong>{{orderNumber}}</strong> has shipped.</p>
          <p><strong>Tracking Number:</strong> {{trackingNumber}}</p>
          <p><strong>Carrier:</strong> {{carrier}}</p>
          <a href="{{trackingUrl}}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Track Package
          </a>
        `,
      },
      password_reset: {
        id: "password_reset",
        name: "Password Reset",
        subject: "Reset your password",
        html: `
          <h1>Reset Your Password</h1>
          <p>Hi {{customerName}},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="{{resetUrl}}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
          <p style="margin-top: 20px; color: #666;">
            If you didn't request this, you can safely ignore this email.
          </p>
        `,
      },
    };

    const template = templates[templateId];
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return template;
  }
}

// Create email service instance
export function createEmailService(): EmailService {
  const apiKey = process.env.RESEND_API_KEY;
  const defaultFrom = process.env.EMAIL_FROM || "noreply@example.com";

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set, using mock email service");
    return new MockEmailService();
  }

  return new ResendEmailService(apiKey, defaultFrom);
}

// Mock service for development
class MockEmailService implements EmailService {
  async send(email: Email): Promise<{ id: string }> {
    console.log("Mock email sent:", {
      to: email.to,
      subject: email.subject,
    });
    return { id: `mock_${Date.now()}` };
  }

  async sendTemplate(
    templateId: string,
    to: EmailRecipient | EmailRecipient[],
    variables: Record<string, string>,
  ): Promise<{ id: string }> {
    console.log("Mock template email sent:", {
      templateId,
      to,
      variables,
    });
    return { id: `mock_${Date.now()}` };
  }
}

export const emailService = createEmailService();
