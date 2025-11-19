// Role-Based Access Control (RBAC)
// Permission management system

import { z } from "zod";

// Role definitions
export type Role = "SUPER_ADMIN" | "STORE_OWNER" | "CUSTOMER";

// Permission definitions
export type Permission =
  // Tenant permissions
  | "tenant:read"
  | "tenant:create"
  | "tenant:update"
  | "tenant:delete"
  // User permissions
  | "user:read"
  | "user:create"
  | "user:update"
  | "user:delete"
  | "user:manage_roles"
  // Product permissions
  | "product:read"
  | "product:create"
  | "product:update"
  | "product:delete"
  | "product:publish"
  // Category permissions
  | "category:read"
  | "category:create"
  | "category:update"
  | "category:delete"
  // Order permissions
  | "order:read"
  | "order:create"
  | "order:update"
  | "order:cancel"
  | "order:refund"
  // Customer permissions
  | "customer:read"
  | "customer:update"
  | "customer:delete"
  // Analytics permissions
  | "analytics:read"
  | "analytics:export"
  // Settings permissions
  | "settings:read"
  | "settings:update"
  // Billing permissions
  | "billing:read"
  | "billing:update"
  // API keys
  | "api_key:read"
  | "api_key:create"
  | "api_key:revoke"
  // Audit logs
  | "audit:read";

// Role to permissions mapping
const rolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    // All permissions
    "tenant:read", "tenant:create", "tenant:update", "tenant:delete",
    "user:read", "user:create", "user:update", "user:delete", "user:manage_roles",
    "product:read", "product:create", "product:update", "product:delete", "product:publish",
    "category:read", "category:create", "category:update", "category:delete",
    "order:read", "order:create", "order:update", "order:cancel", "order:refund",
    "customer:read", "customer:update", "customer:delete",
    "analytics:read", "analytics:export",
    "settings:read", "settings:update",
    "billing:read", "billing:update",
    "api_key:read", "api_key:create", "api_key:revoke",
    "audit:read",
  ],
  STORE_OWNER: [
    // Tenant (own)
    "tenant:read", "tenant:update",
    // Users (own store)
    "user:read", "user:create", "user:update",
    // Products
    "product:read", "product:create", "product:update", "product:delete", "product:publish",
    // Categories
    "category:read", "category:create", "category:update", "category:delete",
    // Orders
    "order:read", "order:update", "order:cancel", "order:refund",
    // Customers
    "customer:read",
    // Analytics
    "analytics:read", "analytics:export",
    // Settings
    "settings:read", "settings:update",
    // Billing
    "billing:read", "billing:update",
    // API keys
    "api_key:read", "api_key:create", "api_key:revoke",
  ],
  CUSTOMER: [
    // Own profile
    "user:read", "user:update",
    // Products (public)
    "product:read",
    // Categories (public)
    "category:read",
    // Own orders
    "order:read", "order:create", "order:cancel",
  ],
};

// RBAC service
export class RBACService {
  // Check if role has permission
  hasPermission(role: Role, permission: Permission): boolean {
    const permissions = rolePermissions[role];
    return permissions.includes(permission);
  }

  // Check if role has any of the permissions
  hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some((p) => this.hasPermission(role, p));
  }

  // Check if role has all permissions
  hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every((p) => this.hasPermission(role, p));
  }

  // Get all permissions for a role
  getPermissions(role: Role): Permission[] {
    return [...rolePermissions[role]];
  }

  // Check role hierarchy
  isRoleHigherOrEqual(role: Role, targetRole: Role): boolean {
    const hierarchy: Record<Role, number> = {
      SUPER_ADMIN: 3,
      STORE_OWNER: 2,
      CUSTOMER: 1,
    };

    return hierarchy[role] >= hierarchy[targetRole];
  }
}

// Authorization context
export interface AuthContext {
  userId: string;
  role: Role;
  tenantId?: string;
  permissions?: Permission[];
}

// Authorization error
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public permission?: Permission,
    public role?: Role
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

// Create RBAC service instance
export const rbac = new RBACService();

// Authorization helpers
export function requirePermission(
  context: AuthContext,
  permission: Permission
): void {
  if (!rbac.hasPermission(context.role, permission)) {
    throw new AuthorizationError(
      `Permission denied: ${permission}`,
      permission,
      context.role
    );
  }
}

export function requireAnyPermission(
  context: AuthContext,
  permissions: Permission[]
): void {
  if (!rbac.hasAnyPermission(context.role, permissions)) {
    throw new AuthorizationError(
      `Permission denied: requires one of ${permissions.join(", ")}`,
      undefined,
      context.role
    );
  }
}

export function requireAllPermissions(
  context: AuthContext,
  permissions: Permission[]
): void {
  if (!rbac.hasAllPermissions(context.role, permissions)) {
    throw new AuthorizationError(
      `Permission denied: requires all of ${permissions.join(", ")}`,
      undefined,
      context.role
    );
  }
}

export function requireRole(context: AuthContext, role: Role): void {
  if (!rbac.isRoleHigherOrEqual(context.role, role)) {
    throw new AuthorizationError(
      `Role denied: requires ${role} or higher`,
      undefined,
      context.role
    );
  }
}

// Tenant isolation check
export function requireTenantAccess(
  context: AuthContext,
  targetTenantId: string
): void {
  // Super admin can access any tenant
  if (context.role === "SUPER_ADMIN") {
    return;
  }

  // Others can only access their own tenant
  if (context.tenantId !== targetTenantId) {
    throw new AuthorizationError(
      "Access denied: tenant isolation violation"
    );
  }
}

// Resource ownership check
export function requireOwnership(
  context: AuthContext,
  resourceOwnerId: string
): void {
  // Super admin can access any resource
  if (context.role === "SUPER_ADMIN") {
    return;
  }

  // Others can only access their own resources
  if (context.userId !== resourceOwnerId) {
    throw new AuthorizationError(
      "Access denied: resource ownership required"
    );
  }
}

// Decorator for permission checking (for use with functions)
export function withPermission<T extends (...args: any[]) => any>(
  permission: Permission,
  fn: T,
  getContext: (...args: Parameters<T>) => AuthContext
): T {
  return ((...args: Parameters<T>) => {
    const context = getContext(...args);
    requirePermission(context, permission);
    return fn(...args);
  }) as T;
}

// API route authorization wrapper
export function authorize(
  permission: Permission
): (handler: Function) => Function {
  return (handler: Function) => {
    return async (request: Request, context: any) => {
      // Get auth context from request (would be set by auth middleware)
      const authContext = (request as any).authContext as AuthContext;

      if (!authContext) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      try {
        requirePermission(authContext, permission);
        return handler(request, context);
      } catch (error) {
        if (error instanceof AuthorizationError) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        throw error;
      }
    };
  };
}
