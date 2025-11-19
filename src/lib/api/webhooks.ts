// @ts-nocheck
// Webhook Management
// Send and manage webhooks for external integrations

import { db } from "@/lib/db";
import { createHmac } from "crypto";

export type WebhookEvent =
  | "order.created"
  | "order.updated"
  | "order.completed"
  | "order.cancelled"
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "customer.created"
  | "customer.updated"
  | "inventory.low"
  | "payment.received"
  | "refund.processed";

export interface Webhook {
  id: string;
  tenantId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  createdAt: Date;
  lastDeliveryAt?: Date;
  failureCount: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: unknown;
  response?: {
    status: number;
    body?: string;
  };
  success: boolean;
  attempt: number;
  deliveredAt: Date;
}

// Create webhook
export async function createWebhook(
  tenantId: string,
  url: string,
  events: WebhookEvent[],
): Promise<Webhook> {
  const secret = generateWebhookSecret();

  const record = await db.webhook.create({
    data: {
      tenantId,
      url,
      events,
      secret,
      isActive: true,
      failureCount: 0,
    },
  });

  return {
    id: record.id,
    tenantId: record.tenantId,
    url: record.url,
    events: record.events as WebhookEvent[],
    secret: record.secret,
    isActive: record.isActive,
    createdAt: record.createdAt,
    lastDeliveryAt: record.lastDeliveryAt || undefined,
    failureCount: record.failureCount,
  };
}

// List webhooks
export async function listWebhooks(tenantId: string): Promise<Webhook[]> {
  const records = await db.webhook.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return records.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    url: r.url,
    events: r.events as WebhookEvent[],
    secret: r.secret,
    isActive: r.isActive,
    createdAt: r.createdAt,
    lastDeliveryAt: r.lastDeliveryAt || undefined,
    failureCount: r.failureCount,
  }));
}

// Update webhook
export async function updateWebhook(
  webhookId: string,
  updates: { url?: string; events?: WebhookEvent[]; isActive?: boolean },
): Promise<void> {
  await db.webhook.update({
    where: { id: webhookId },
    data: updates,
  });
}

// Delete webhook
export async function deleteWebhook(webhookId: string): Promise<void> {
  await db.webhook.delete({
    where: { id: webhookId },
  });
}

// Send webhook
export async function sendWebhook(
  tenantId: string,
  event: WebhookEvent,
  payload: unknown,
): Promise<void> {
  // Get active webhooks for this event
  const webhooks = await db.webhook.findMany({
    where: {
      tenantId,
      isActive: true,
      events: { has: event },
    },
  });

  // Send to each webhook
  for (const webhook of webhooks) {
    await deliverWebhook(webhook, event, payload);
  }
}

// Deliver webhook with retries
async function deliverWebhook(
  webhook: { id: string; url: string; secret: string },
  event: WebhookEvent,
  payload: unknown,
  attempt: number = 1,
): Promise<void> {
  const body = JSON.stringify({
    event,
    payload,
    timestamp: Date.now(),
  });

  // Sign payload
  const signature = signWebhookPayload(body, webhook.secret);

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": event,
      },
      body,
    });

    const success = response.ok;

    // Log delivery
    await db.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event,
        payload: payload as object,
        responseStatus: response.status,
        responseBody: await response.text().catch(() => null),
        success,
        attempt,
      },
    });

    // Update webhook
    await db.webhook.update({
      where: { id: webhook.id },
      data: {
        lastDeliveryAt: new Date(),
        failureCount: success ? 0 : { increment: 1 },
      },
    });

    // Retry on failure
    if (!success && attempt < 3) {
      const delay = attempt * 1000; // 1s, 2s, 3s
      setTimeout(() => {
        deliverWebhook(webhook, event, payload, attempt + 1);
      }, delay);
    }
  } catch (error) {
    console.error("Webhook delivery failed:", error);

    // Log failure
    await db.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event,
        payload: payload as object,
        responseStatus: 0,
        responseBody: error instanceof Error ? error.message : "Unknown error",
        success: false,
        attempt,
      },
    });

    // Retry
    if (attempt < 3) {
      const delay = attempt * 1000;
      setTimeout(() => {
        deliverWebhook(webhook, event, payload, attempt + 1);
      }, delay);
    }
  }
}

// Generate webhook secret
function generateWebhookSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Sign webhook payload
function signWebhookPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = signWebhookPayload(payload, secret);
  return signature === expected;
}
