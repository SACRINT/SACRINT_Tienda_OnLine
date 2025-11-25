/**
 * Permissions Module
 * Semana 9.9: Role-based Permissions
 *
 * Exports centralizados para el sistema de permisos
 */

// Core permissions (NEW - Week 9)
export {
  ROLE_PERMISSIONS,
  hasPermission,
  canAccess,
  getRolePermissions,
  hasAnyPermission,
  hasAllPermissions,
  requirePermission as requirePermissionSync,
  getRoleName,
  getRoleDescription,
  type Permission,
} from "./roles";

// Client-side (React hooks)
export { usePermissions } from "./usePermissions";

// Server-side (API routes & server components)
export {
  requirePermission,
  requireAccess,
  requireRole,
  checkPermission,
  getCurrentRole,
} from "./server";

// Legacy RBAC (existing)
export * from "./rbac";
