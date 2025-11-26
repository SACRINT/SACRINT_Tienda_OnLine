/**
 * User Management - Semana 21
 * Administración de usuarios y roles
 */
import { db } from "@/lib/db";

export async function getAllUsers(tenantId: string) {
  return db.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function updateUserRole(userId: string, role: string) {
  return db.user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function suspendUser(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { status: "SUSPENDED" },
  });
}
