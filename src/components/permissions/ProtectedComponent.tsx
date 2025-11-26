/**
 * Protected Component
 * Semana 9.9: Role-based Permissions
 *
 * Componente para renderizado condicional basado en permisos
 */

"use client";

import { usePermissions } from "@/lib/permissions/usePermissions";
import { Permission } from "@/lib/permissions/roles";

interface ProtectedComponentProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, requires all permissions. If false (default), requires any.
  fallback?: React.ReactNode;
}

/**
 * Renders children only if user has required permission(s)
 *
 * @example
 * <ProtectedComponent permission="canManageProducts">
 *   <button>Agregar Producto</button>
 * </ProtectedComponent>
 *
 * @example
 * <ProtectedComponent permissions={["canEditOrders", "canCancelOrders"]} requireAll>
 *   <button>Editar y Cancelar</button>
 * </ProtectedComponent>
 */
export function ProtectedComponent({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: ProtectedComponentProps) {
  const perms = usePermissions();

  let hasAccess = false;

  if (permission) {
    hasAccess = perms.hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll
      ? perms.hasAllPermissions(permissions)
      : perms.hasAnyPermission(permissions);
  } else {
    // No permission specified, always render
    hasAccess = true;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
