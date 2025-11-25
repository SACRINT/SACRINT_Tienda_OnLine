/**
 * Server-side Permission Helpers
 * Semana 9.9: Role-based Permissions
 *
 * Helpers para verificar permisos en API routes y server components
 */

import { auth } from "@/lib/auth/auth";
import { UserRole } from "@/lib/db/enums";
import { hasPermission, canAccess, type Permission } from "./roles";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors/api-errors";

/**
 * Require a specific permission in API routes
 */
export async function requirePermission(permission: Permission) {
  const session = await auth();

  if (!session?.user) {
    throw new UnauthorizedError("No autenticado");
  }

  const role = session.user.role as UserRole;

  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(`Permiso denegado: ${permission}`);
  }

  return session;
}

/**
 * Require access to a specific resource
 */
export async function requireAccess(resource: string) {
  const session = await auth();

  if (!session?.user) {
    throw new UnauthorizedError("No autenticado");
  }

  const role = session.user.role as UserRole;

  if (!canAccess(role, resource)) {
    throw new ForbiddenError(`Acceso denegado: ${resource}`);
  }

  return session;
}

/**
 * Require one of multiple roles
 */
export async function requireRole(...roles: UserRole[]) {
  const session = await auth();

  if (!session?.user) {
    throw new UnauthorizedError("No autenticado");
  }

  const userRole = session.user.role as UserRole;

  if (!roles.includes(userRole)) {
    throw new ForbiddenError(
      `Rol requerido: ${roles.join(" o ")}, tienes: ${userRole}`
    );
  }

  return session;
}

/**
 * Check if current user has permission (non-throwing)
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user) return false;

    const role = session.user.role as UserRole;
    return hasPermission(role, permission);
  } catch {
    return false;
  }
}

/**
 * Get current user's role
 */
export async function getCurrentRole(): Promise<UserRole | null> {
  try {
    const session = await auth();
    return (session?.user?.role as UserRole) ?? null;
  } catch {
    return null;
  }
}
