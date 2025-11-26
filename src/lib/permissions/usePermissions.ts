/**
 * usePermissions Hook
 * Semana 9.9: Role-based Permissions
 *
 * React hook para verificar permisos en componentes cliente
 */

"use client";

import { useSession } from "next-auth/react";
import { UserRole } from "@/lib/db/enums";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccess,
  getRolePermissions,
  type Permission,
} from "./roles";

export function usePermissions() {
  const { data: session } = useSession();
  const role = (session?.user?.role as UserRole) ?? "CUSTOMER";

  return {
    role,
    hasPermission: (permission: Permission) => hasPermission(role, permission),
    hasAnyPermission: (permissions: Permission[]) =>
      hasAnyPermission(role, permissions),
    hasAllPermissions: (permissions: Permission[]) =>
      hasAllPermissions(role, permissions),
    canAccess: (resource: string) => canAccess(role, resource),
    permissions: getRolePermissions(role),
  };
}
