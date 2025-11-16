// Data Access Layer - Users
// Reusable database operations for user management

import { db } from './client'
import { UserRole, Prisma } from '@prisma/client'

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
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  return db.user.findUnique({
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
      role: data.role || UserRole.CUSTOMER,
      image: data.image,
      isActive: true,
    },
  })
}

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  data: Prisma.UserUpdateInput
) {
  return db.user.update({
    where: { id: userId },
    data,
  })
}

/**
 * Delete user (soft delete by setting isActive to false)
 */
export async function deactivateUser(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { isActive: false },
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
      isActive: true,
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
    where: { tenantId, isActive: true },
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
    [UserRole.SUPER_ADMIN]: 3,
    [UserRole.STORE_OWNER]: 2,
    [UserRole.CUSTOMER]: 1,
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
  type: string
  fullName: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
  isDefault?: boolean
}) {
  return db.address.create({
    data,
  })
}
