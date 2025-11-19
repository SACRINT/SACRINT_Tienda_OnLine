// Role-Based Access Control
// Advanced permissions system

export type Permission =
  | "products.read"
  | "products.create"
  | "products.update"
  | "products.delete"
  | "orders.read"
  | "orders.update"
  | "orders.cancel"
  | "orders.refund"
  | "customers.read"
  | "customers.update"
  | "customers.delete"
  | "analytics.read"
  | "analytics.export"
  | "settings.read"
  | "settings.update"
  | "users.read"
  | "users.create"
  | "users.update"
  | "users.delete"
  | "billing.read"
  | "billing.manage"
  | "api.access"
  | "webhooks.manage";

export type Role =
  | "SUPER_ADMIN"
  | "STORE_OWNER"
  | "MANAGER"
  | "STAFF"
  | "CUSTOMER";

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "products.read",
    "products.create",
    "products.update",
    "products.delete",
    "orders.read",
    "orders.update",
    "orders.cancel",
    "orders.refund",
    "customers.read",
    "customers.update",
    "customers.delete",
    "analytics.read",
    "analytics.export",
    "settings.read",
    "settings.update",
    "users.read",
    "users.create",
    "users.update",
    "users.delete",
    "billing.read",
    "billing.manage",
    "api.access",
    "webhooks.manage",
  ],
  STORE_OWNER: [
    "products.read",
    "products.create",
    "products.update",
    "products.delete",
    "orders.read",
    "orders.update",
    "orders.cancel",
    "orders.refund",
    "customers.read",
    "customers.update",
    "analytics.read",
    "analytics.export",
    "settings.read",
    "settings.update",
    "users.read",
    "users.create",
    "users.update",
    "billing.read",
    "billing.manage",
    "api.access",
    "webhooks.manage",
  ],
  MANAGER: [
    "products.read",
    "products.create",
    "products.update",
    "orders.read",
    "orders.update",
    "orders.cancel",
    "customers.read",
    "customers.update",
    "analytics.read",
    "users.read",
  ],
  STAFF: ["products.read", "orders.read", "orders.update", "customers.read"],
  CUSTOMER: [],
};

// Check if role has permission
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

// Check if role has any of the permissions
export function hasAnyPermission(
  role: Role,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

// Check if role has all permissions
export function hasAllPermissions(
  role: Role,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

// Get all permissions for a role
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Permission guard for API routes
export function requirePermission(
  userRole: Role,
  requiredPermission: Permission,
): void {
  if (!hasPermission(userRole, requiredPermission)) {
    throw new Error("Forbidden: Missing permission " + requiredPermission);
  }
}

// Permission descriptions
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  "products.read": "Ver productos",
  "products.create": "Crear productos",
  "products.update": "Editar productos",
  "products.delete": "Eliminar productos",
  "orders.read": "Ver órdenes",
  "orders.update": "Actualizar órdenes",
  "orders.cancel": "Cancelar órdenes",
  "orders.refund": "Reembolsar órdenes",
  "customers.read": "Ver clientes",
  "customers.update": "Editar clientes",
  "customers.delete": "Eliminar clientes",
  "analytics.read": "Ver analytics",
  "analytics.export": "Exportar analytics",
  "settings.read": "Ver configuración",
  "settings.update": "Editar configuración",
  "users.read": "Ver usuarios",
  "users.create": "Crear usuarios",
  "users.update": "Editar usuarios",
  "users.delete": "Eliminar usuarios",
  "billing.read": "Ver facturación",
  "billing.manage": "Gestionar facturación",
  "api.access": "Acceso a API",
  "webhooks.manage": "Gestionar webhooks",
};

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<
  Role,
  { name: string; description: string }
> = {
  SUPER_ADMIN: {
    name: "Super Administrador",
    description: "Acceso completo al sistema",
  },
  STORE_OWNER: {
    name: "Dueño de Tienda",
    description: "Gestión completa de la tienda",
  },
  MANAGER: {
    name: "Gerente",
    description: "Gestión de productos, órdenes y clientes",
  },
  STAFF: {
    name: "Empleado",
    description: "Acceso básico de operaciones",
  },
  CUSTOMER: {
    name: "Cliente",
    description: "Usuario de la tienda",
  },
};
