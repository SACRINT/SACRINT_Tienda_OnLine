// @ts-nocheck
// Compliance Utilities
// GDPR, CCPA, and other compliance features

import { db } from "@/lib/db";

export interface DataSubjectRequest {
  id: string;
  type: "access" | "deletion" | "portability" | "rectification";
  userId: string;
  email: string;
  status: "pending" | "processing" | "completed" | "rejected";
  requestedAt: Date;
  completedAt?: Date;
  notes?: string;
}

export interface ConsentRecord {
  userId: string;
  type: string;
  granted: boolean;
  timestamp: Date;
  version: string;
  ipAddress?: string;
}

// Export user data (GDPR data portability)
export async function exportUserData(userId: string): Promise<{
  user: object;
  orders: object[];
  reviews: object[];
  addresses: object[];
}> {
  const [user, orders, reviews, addresses] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.order.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            quantity: true,
            price: true,
          },
        },
      },
    }),
    db.review.findMany({
      where: { userId },
      select: {
        id: true,
        productId: true,
        rating: true,
        title: true,
        content: true,
        createdAt: true,
      },
    }),
    db.address.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        street: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        phone: true,
      },
    }),
  ]);

  return {
    user: user || {},
    orders,
    reviews,
    addresses,
  };
}

// Delete user data (GDPR right to be forgotten)
export async function deleteUserData(
  userId: string,
  options?: { keepOrders?: boolean },
): Promise<{ deleted: string[]; anonymized: string[] }> {
  const deleted: string[] = [];
  const anonymized: string[] = [];

  await db.$transaction(async (tx) => {
    // Delete reviews
    await tx.review.deleteMany({ where: { userId } });
    deleted.push("reviews");

    // Delete addresses
    await tx.address.deleteMany({ where: { userId } });
    deleted.push("addresses");

    // Delete cart
    await tx.cart.deleteMany({ where: { userId } });
    deleted.push("cart");

    if (options?.keepOrders) {
      // Anonymize orders (keep for financial records)
      await tx.order.updateMany({
        where: { userId },
        data: {
          // Keep order but remove personal data link
          shippingAddress: {},
          billingAddress: {},
        },
      });
      anonymized.push("orders");
    } else {
      // Delete orders
      await tx.order.deleteMany({ where: { userId } });
      deleted.push("orders");
    }

    // Delete user
    await tx.user.delete({ where: { id: userId } });
    deleted.push("user");
  });

  return { deleted, anonymized };
}

// Record consent
export async function recordConsent(
  userId: string,
  consentType: string,
  granted: boolean,
  version: string,
  ipAddress?: string,
): Promise<void> {
  await db.consent.create({
    data: {
      userId,
      type: consentType,
      granted,
      version,
      ipAddress,
    },
  });
}

// Get consent status
export async function getConsentStatus(
  userId: string,
  consentType: string,
): Promise<ConsentRecord | null> {
  const consent = await db.consent.findFirst({
    where: { userId, type: consentType },
    orderBy: { createdAt: "desc" },
  });

  if (!consent) return null;

  return {
    userId: consent.userId,
    type: consent.type,
    granted: consent.granted,
    timestamp: consent.createdAt,
    version: consent.version,
    ipAddress: consent.ipAddress || undefined,
  };
}

// Get all user consents
export async function getUserConsents(
  userId: string,
): Promise<ConsentRecord[]> {
  const consents = await db.consent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    distinct: ["type"],
  });

  return consents.map((c) => ({
    userId: c.userId,
    type: c.type,
    granted: c.granted,
    timestamp: c.createdAt,
    version: c.version,
    ipAddress: c.ipAddress || undefined,
  }));
}

// Anonymize old data (data minimization)
export async function anonymizeOldData(
  tenantId: string,
  olderThanDays: number,
): Promise<{ anonymizedCount: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  // Anonymize old completed orders
  const result = await db.order.updateMany({
    where: {
      tenantId,
      status: { in: ["COMPLETED", "DELIVERED"] },
      createdAt: { lt: cutoffDate },
      // Only if not already anonymized
      user: { email: { not: { contains: "@anonymized" } } },
    },
    data: {
      shippingAddress: {},
      billingAddress: {},
    },
  });

  return { anonymizedCount: result.count };
}

// Check data retention compliance
export async function checkDataRetention(tenantId: string): Promise<{
  compliant: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  // Check for old data that should be deleted
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const oldSessions = await db.session.count({
    where: {
      expires: { lt: twoYearsAgo },
    },
  });

  if (oldSessions > 0) {
    issues.push(
      "Found " + oldSessions + " expired sessions older than 2 years",
    );
  }

  return {
    compliant: issues.length === 0,
    issues,
  };
}
