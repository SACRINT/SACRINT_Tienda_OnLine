// Data Access Layer - Users
// Reusable database operations for user management

import { db } from './client'
import { Prisma } from '@prisma/client'
import { USER_ROLES, type UserRole } from '@/lib/types/user-role'

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      tenant: true,
      accounts: true,
    },
  })
}

/**
 * Get user by email (uses findFirst due to composite unique constraint email_tenantId)
 */
export async function getUserByEmail(email: string) {
  return db.user.findFirst({
    where: { email },
    include: {
      tenant: true,
    },
  })
}

/**
 * Create new user
 */
export async function createUser(data: {
  email: string
  name?: string
  password?: string
  tenantId?: string
  role?: UserRole
  image?: string
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
  })
}

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  data: any
) {
  return db.user.update({
    where: { id: userId },
    data,
  })
}

/**
 * Delete user
 */
export async function deleteUser(userId: string) {
  return db.user.delete({
    where: { id: userId },
  })
}

/**
 * Get all users for a tenant
 */
export async function getUsersByTenant(tenantId: string) {
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
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Count users by tenant
 */
export async function countUsersByTenant(tenantId: string) {
  return db.user.count({
    where: { tenantId },
  })
}

/**
 * Update user role (RBAC)
 */
export async function updateUserRole(userId: string, role: UserRole) {
  return db.user.update({
    where: { id: userId },
    data: { role },
  })
}

/**
 * Check if user has permission (RBAC helper)
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [USER_ROLES.SUPER_ADMIN]: 3,
    [USER_ROLES.STORE_OWNER]: 2,
    [USER_ROLES.CUSTOMER]: 1,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Get user addresses
 */
export async function getUserAddresses(userId: string) {
  return db.address.findMany({
    where: { userId },
    orderBy: { isDefault: 'desc' },
  })
}

/**
 * Create user address
 */
export async function createUserAddress(data: {
  userId: string
  fullName: string
  email: string
  street: string
  city: string
  state: string
  postalCode: string
  country?: string
  phone: string
  isDefault?: boolean
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
      country: data.country || 'MX',
      phone: data.phone,
      isDefault: data.isDefault || false,
    },
  })
}
