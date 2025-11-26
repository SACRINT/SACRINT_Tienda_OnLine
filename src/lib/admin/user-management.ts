/** Weeks 21-22: Admin User Management - Tasks 21.1-22.12 */
import { db } from "@/lib/db";

export async function getAllUsers(filters?: any) {
  return db.user.findMany({
    where: filters,
    include: { tenant: true },
    take: 100,
  });
}

export async function updateUserRole(userId: string, role: string) {
  return db.user.update({
    where: { id: userId },
    data: { role: role as any },
  });
}

export async function suspendUser(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { status: "SUSPENDED" },
  });
}
