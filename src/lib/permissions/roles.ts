/**
 * Role-Based Access Control (RBAC)
 * Semana 9.9: Role-based Permissions
 *
 * Define permisos granulares para diferentes roles de usuario
 */

import { UserRole } from "@/lib/db/enums";

/**
 * Permissions for each role
 */
export const ROLE_PERMISSIONS = {
  // Super Admin - Full system access
  SUPER_ADMIN: {
    // Store Management
    canEditStore: true,
    canDeleteStore: true,
    canManageUsers: true,
    canManageAllStores: true,

    // Analytics & Reports
    canAccessAnalytics: true,
    canAccessGlobalAnalytics: true,
    canExportData: true,

    // Payments & Financial
    canAccessPayments: true,
    canConfigurePayments: true,
    canProcessRefunds: true,

    // Products & Inventory
    canManageProducts: true,
    canManageCategories: true,
    canManageInventory: true,

    // Orders
    canViewOrders: true,
    canEditOrders: true,
    canCancelOrders: true,
    canProcessOrders: true,

    // Customers
    canViewCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: true,

    // Marketing
    canManageCoupons: true,
    canManageEmailCampaigns: true,
    canManageAutomations: true,

    // System
    canAccessSettings: true,
    canManageRoles: true,
    canViewLogs: true,
  },

  // Store Owner - Full store access
  STORE_OWNER: {
    // Store Management
    canEditStore: true,
    canDeleteStore: false,
    canManageUsers: true,
    canManageAllStores: false,

    // Analytics & Reports
    canAccessAnalytics: true,
    canAccessGlobalAnalytics: false,
    canExportData: true,

    // Payments & Financial
    canAccessPayments: true,
    canConfigurePayments: true,
    canProcessRefunds: true,

    // Products & Inventory
    canManageProducts: true,
    canManageCategories: true,
    canManageInventory: true,

    // Orders
    canViewOrders: true,
    canEditOrders: true,
    canCancelOrders: true,
    canProcessOrders: true,

    // Customers
    canViewCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: false,

    // Marketing
    canManageCoupons: true,
    canManageEmailCampaigns: true,
    canManageAutomations: true,

    // System
    canAccessSettings: true,
    canManageRoles: false,
    canViewLogs: false,
  },

  // Customer - Limited access
  CUSTOMER: {
    // Store Management
    canEditStore: false,
    canDeleteStore: false,
    canManageUsers: false,
    canManageAllStores: false,

    // Analytics & Reports
    canAccessAnalytics: false,
    canAccessGlobalAnalytics: false,
    canExportData: false,

    // Payments & Financial
    canAccessPayments: false,
    canConfigurePayments: false,
    canProcessRefunds: false,

    // Products & Inventory
    canManageProducts: false,
    canManageCategories: false,
    canManageInventory: false,

    // Orders
    canViewOrders: false, // Only their own orders
    canEditOrders: false,
    canCancelOrders: false,
    canProcessOrders: false,

    // Customers
    canViewCustomers: false,
    canEditCustomers: false,
    canDeleteCustomers: false,

    // Marketing
    canManageCoupons: false,
    canManageEmailCampaigns: false,
    canManageAutomations: false,

    // System
    canAccessSettings: false,
    canManageRoles: false,
    canViewLogs: false,
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS.SUPER_ADMIN;

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions[permission] ?? false;
}

/**
 * Check if a role can access a resource
 */
export function canAccess(role: UserRole, resource: string): boolean {
  // Map resources to permissions
  const resourcePermissions: Record<string, Permission> = {
    // Dashboard
    "/dashboard": "canAccessAnalytics",
    "/dashboard/analytics": "canAccessAnalytics",
    "/dashboard/settings": "canAccessSettings",

    // Products
    "/dashboard/products": "canManageProducts",
    "/dashboard/products/new": "canManageProducts",
    "/dashboard/products/edit": "canManageProducts",
    "/dashboard/categories": "canManageCategories",

    // Orders
    "/dashboard/orders": "canViewOrders",
    "/dashboard/orders/edit": "canEditOrders",

    // Customers
    "/dashboard/customers": "canViewCustomers",

    // Marketing
    "/dashboard/coupons": "canManageCoupons",
    "/dashboard/marketing": "canManageEmailCampaigns",

    // Payments
    "/dashboard/payments": "canAccessPayments",
  };

  const permission = resourcePermissions[resource];
  if (!permission) return false;

  return hasPermission(role, permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole) {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.CUSTOMER;
}

/**
 * Check multiple permissions at once
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if all permissions are granted
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Middleware helper to require a permission
 */
export function requirePermission(role: UserRole, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

/**
 * Get human-readable role name
 */
export function getRoleName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    SUPER_ADMIN: "Super Administrador",
    STORE_OWNER: "Dueño de Tienda",
    CUSTOMER: "Cliente",
  };
  return roleNames[role] ?? role;
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    SUPER_ADMIN:
      "Acceso completo al sistema, puede administrar todas las tiendas",
    STORE_OWNER:
      "Acceso completo a su tienda, puede gestionar productos, órdenes y configuración",
    CUSTOMER: "Puede realizar compras y ver su historial de órdenes",
  };
  return descriptions[role] ?? "";
}
