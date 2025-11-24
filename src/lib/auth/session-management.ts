/**
 * Session Management
 * ✅ SECURITY [P1.5]: Session version control and invalidation
 *
 * Implements session versioning to allow global session invalidation
 * Use cases:
 * - Password change (invalidate all sessions)
 * - Security breach (force logout all devices)
 * - Role/permission changes (require re-authentication)
 */

import { db } from "@/lib/db/client";
import { logger } from "@/lib/monitoring/logger";

/**
 * Invalidate all sessions for a user by incrementing session version
 * Forces all active sessions to be logged out on next token refresh
 */
export async function invalidateAllUserSessions(
  userId: string,
  reason: string = "Manual invalidation",
): Promise<void> {
  try {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        sessionVersion: {
          increment: 1,
        },
      },
      select: {
        id: true,
        email: true,
        sessionVersion: true,
      },
    });

    logger.audit(
      {
        userId: user.id,
        email: user.email,
        newSessionVersion: user.sessionVersion,
        reason,
      },
      "All user sessions invalidated",
    );
  } catch (error) {
    logger.error(
      {
        userId,
        error,
      },
      "Failed to invalidate user sessions",
    );
    throw error;
  }
}

/**
 * Get current session version for a user
 */
export async function getUserSessionVersion(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user.sessionVersion;
}

/**
 * Validate if a session version is still valid
 */
export async function isSessionVersionValid(
  userId: string,
  tokenSessionVersion: number,
): Promise<boolean> {
  const currentVersion = await getUserSessionVersion(userId);
  return tokenSessionVersion === currentVersion;
}

/**
 * Helper to invalidate sessions after password change
 */
export async function invalidateSessionsAfterPasswordChange(userId: string): Promise<void> {
  await invalidateAllUserSessions(userId, "Password changed");
}

/**
 * Helper to invalidate sessions after role change
 */
export async function invalidateSessionsAfterRoleChange(userId: string): Promise<void> {
  await invalidateAllUserSessions(userId, "Role/permissions changed");
}

/**
 * Helper to invalidate sessions for security breach
 */
export async function invalidateSessionsForSecurityBreach(userId: string): Promise<void> {
  await invalidateAllUserSessions(userId, "Security breach detected");
}
