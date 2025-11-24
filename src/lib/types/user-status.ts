/**
 * User Status Types
 * ✅ SECURITY [P1.2]: Account status management
 */

export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  BLOCKED: "BLOCKED",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

/**
 * Check if user status allows login
 */
export function canUserLogin(status: UserStatus): boolean {
  return status === USER_STATUS.ACTIVE;
}

/**
 * Get human-readable status message
 */
export function getUserStatusMessage(status: UserStatus): string {
  switch (status) {
    case USER_STATUS.ACTIVE:
      return "Account is active";
    case USER_STATUS.SUSPENDED:
      return "Account is temporarily suspended. Please contact support.";
    case USER_STATUS.BLOCKED:
      return "Account has been blocked. Please contact support for more information.";
    default:
      return "Unknown account status";
  }
}

/**
 * Check if status is inactive (suspended or blocked)
 */
export function isUserInactive(status: UserStatus): boolean {
  return status === USER_STATUS.SUSPENDED || status === USER_STATUS.BLOCKED;
}
