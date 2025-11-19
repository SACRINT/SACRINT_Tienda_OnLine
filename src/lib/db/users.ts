// Data Access Layer - Users
// Reusable database operations for user management

import { db } from "./client";
import { Prisma } from "@prisma/client";
import { USER_ROLES, type UserRole } from "@/lib/types/user-role";
import { ensureTenantAccess } from "./tenant";

/**
 * Get user by ID with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param userId - User ID to retrieve
 */
export async function getUserById(tenantId: string, userId: string) {
  await ensureTenantAccess(tenantId);

  return db.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
    include: {
      tenant: true,
      accounts: true,
    },
  });
}

/**
 * Get user by email within tenant (uses findFirst due to composite unique constraint email_tenantId)
 * @param tenantId - Tenant ID to validate access
 * @param email - User email to search
 */
export async function getUserByEmail(tenantId: string, email: string) {
  await ensureTenantAccess(tenantId);

  return db.user.findFirst({
    where: {
      email,
      tenantId,
    },
    include: {
      tenant: true,
    },
  });
}

/**
 * Create new user
 */
export async function createUser(data: {
  email: string;
  name?: string;
  password?: string;
  tenantId?: string;
  role?: UserRole;
  image?: string;
}) {
  return db.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: data.password,
      tenantId: data.tenantId,
      role: data.role || USER_ROLES.CUSTOMER,
      image: data.image,
    },
  });
}

/**
 * Update user with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param userId - User ID to update
 * @param data - Update data
 */
export async function updateUser(tenantId: string, userId: string, data: any) {
  await ensureTenantAccess(tenantId);

  // Verify user belongs to tenant before updating
  const user = await db.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
  });

  if (!user) {
    throw new Error("User not found or does not belong to tenant");
  }

  return db.user.update({
    where: { id: userId },
    data,
  });
}

/**
 * Delete user with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param userId - User ID to delete
 */
export async function deleteUser(tenantId: string, userId: string) {
  await ensureTenantAccess(tenantId);

  // Verify user belongs to tenant before deleting
  const user = await db.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
  });

  if (!user) {
    throw new Error("User not found or does not belong to tenant");
  }

  return db.user.delete({
    where: { id: userId },
  });
}

/**
 * Get all users for a tenant
 * @param tenantId - Tenant ID to validate access
 */
export async function getUsersByTenant(tenantId: string) {
  await ensureTenantAccess(tenantId);

  return db.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Count users by tenant
 * @param tenantId - Tenant ID to validate access
 */
export async function countUsersByTenant(tenantId: string) {
  await ensureTenantAccess(tenantId);

  return db.user.count({
    where: { tenantId },
  });
}

/**
 * Update user role (RBAC) with tenant validation
 * @param tenantId - Tenant ID to validate access
 * @param userId - User ID to update role
 * @param role - New role to assign
 */
export async function updateUserRole(
  tenantId: string,
  userId: string,
  role: UserRole,
) {
  await ensureTenantAccess(tenantId);

  // Verify user belongs to tenant before updating role
  const user = await db.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
  });

  if (!user) {
    throw new Error("User not found or does not belong to tenant");
  }

  return db.user.update({
    where: { id: userId },
    data: { role },
  });
}

/**
 * Check if user has permission (RBAC helper)
 */
export function hasPermission(
  userRole: UserRole,
  requiredRole: UserRole,
): boolean {
  const roleHierarchy = {
    [USER_ROLES.SUPER_ADMIN]: 3,
    [USER_ROLES.STORE_OWNER]: 2,
    [USER_ROLES.CUSTOMER]: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Get user addresses
 */
export async function getUserAddresses(userId: string) {
  return db.address.findMany({
    where: { userId },
    orderBy: { isDefault: "desc" },
  });
}

/**
 * Create user address
 */
export async function createUserAddress(data: {
  userId: string;
  fullName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone: string;
  isDefault?: boolean;
}) {
  return db.address.create({
    data: {
      userId: data.userId,
      name: data.fullName,
      email: data.email,
      street: data.street,
      city: data.city,
      state: data.state,
      postalCode: data.postalCode,
      country: data.country || "MX",
      phone: data.phone,
      isDefault: data.isDefault || false,
    },
  });
}
