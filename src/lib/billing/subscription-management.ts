/**
 * Subscription Management - Semana 23
 * Gestión de suscripciones y billing
 */
import { db } from "@/lib/db";

export async function createSubscription(tenantId: string, plan: string) {
  return db.subscription.create({
    data: {
      tenantId,
      plan,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return db.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });
}

export async function getBillingHistory(tenantId: string) {
  return db.subscription.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}
