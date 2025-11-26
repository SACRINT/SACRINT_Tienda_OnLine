/**
 * Auth Requirement Helpers
 * Re-exports authentication helpers for backward compatibility
 *
 * These functions are used to protect routes and verify user permissions
 */

export {
  requireAuth,
  requireStoreOwner,
  getStoreOrThrow,
  hasStoreAccess,
  getUserStores,
  ForbiddenError,
  NotFoundError,
} from "./dashboard";

/**
 * Require a specific role
 * @param role - The required role
 * @throws ForbiddenError if user doesn't have the required role
 */
export async function requireRole(role: string) {
  const { requireAuth } = await import("./dashboard");
  const session = await requireAuth();

  if (session.user?.role !== role) {
    const { ForbiddenError } = await import("./dashboard");
    throw new ForbiddenError(`Se requiere el rol: ${role}`);
  }

  return session;
}

/**
 * Require a specific permission
 * Note: This is a placeholder for future RBAC implementation
 * @param permission - The required permission
 * @throws ForbiddenError if user doesn't have the required permission
 */
export async function requirePermission(permission: string) {
  const { requireAuth } = await import("./dashboard");
  const session = await requireAuth();

  // TODO: Implement permission checking logic when RBAC is fully implemented
  // For now, just verify the user is authenticated

  return session;
}
