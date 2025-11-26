/**
 * GDPR Compliance - Semana 24
 * Cumplimiento GDPR y privacidad
 */
import { db } from "@/lib/db";

export async function exportUserData(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      orders: true,
      reviews: true,
      addresses: true,
    },
  });

  return {
    personalInfo: {
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
    },
    orders: user?.orders,
    reviews: user?.reviews,
    addresses: user?.addresses,
    exportedAt: new Date().toISOString(),
  };
}

export async function deleteUserData(userId: string) {
  // Anonymize instead of delete for order history (set to BLOCKED status per GDPR compliance)
  await db.user.update({
    where: { id: userId },
    data: {
      name: "Usuario Eliminado",
      email: `deleted_${userId}@deleted.com`,
      phone: null,
      status: "BLOCKED",
    },
  });

  // Delete addresses
  await db.address.deleteMany({
    where: { userId },
  });

  console.log(`User ${userId} data deleted/anonymized for GDPR compliance`);
}
