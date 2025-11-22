// Audit Logger
// Week 21-22: Log security-critical events

import { db } from "@/lib/db";

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",

  // Authorization events
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  PERMISSION_DENIED = "PERMISSION_DENIED",

  // Data events
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  PRODUCT_CREATED = "PRODUCT_CREATED",
  PRODUCT_UPDATED = "PRODUCT_UPDATED",
  PRODUCT_DELETED = "PRODUCT_DELETED",
  ORDER_CREATED = "ORDER_CREATED",
  ORDER_UPDATED = "ORDER_UPDATED",

  // Payment events
  PAYMENT_INITIATED = "PAYMENT_INITIATED",
  PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  REFUND_ISSUED = "REFUND_ISSUED",

  // Security events
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  CSRF_TOKEN_INVALID = "CSRF_TOKEN_INVALID",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",

  // Admin events
  SETTINGS_CHANGED = "SETTINGS_CHANGED",
  ROLE_CHANGED = "ROLE_CHANGED",
}

export enum AuditSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

interface AuditLogParams {
  eventType: AuditEventType;
  severity?: AuditSeverity;
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Log audit event to database
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    // In production, this would write to a dedicated audit log table
    // For now, we'll log to console and optionally to database

    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType: params.eventType,
      severity: params.severity || AuditSeverity.INFO,
      userId: params.userId,
      tenantId: params.tenantId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details,
      metadata: params.metadata,
    };

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("[AUDIT]", JSON.stringify(logEntry, null, 2));
    }

    // In production, write to database
    // TODO: Create AuditLog table in Prisma schema
    // await db.auditLog.create({ data: logEntry });

    // For critical events, could also send alerts
    if (params.severity === AuditSeverity.CRITICAL) {
      await sendSecurityAlert(logEntry);
    }
  } catch (error) {
    // Never throw from audit logger to avoid breaking application flow
    console.error("Audit logging failed:", error);
  }
}

/**
 * Send security alert for critical events
 */
async function sendSecurityAlert(logEntry: any): Promise<void> {
  // TODO: Implement alerting (email, Slack, PagerDuty, etc.)
  console.error("[SECURITY ALERT]", logEntry);
}

/**
 * Extract IP from request
 */
export function getIpAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0] || realIp || "unknown";
}

/**
 * Convenience functions for common audit events
 */
export const auditLog = {
  loginSuccess: (userId: string, request: Request) =>
    logAuditEvent({
      eventType: AuditEventType.LOGIN_SUCCESS,
      severity: AuditSeverity.INFO,
      userId,
      ipAddress: getIpAddress(request),
      userAgent: request.headers.get("user-agent") || undefined,
    }),

  loginFailed: (email: string, request: Request) =>
    logAuditEvent({
      eventType: AuditEventType.LOGIN_FAILED,
      severity: AuditSeverity.WARNING,
      ipAddress: getIpAddress(request),
      userAgent: request.headers.get("user-agent") || undefined,
      details: { email },
    }),

  unauthorizedAccess: (userId: string | undefined, resource: string, request: Request) =>
    logAuditEvent({
      eventType: AuditEventType.UNAUTHORIZED_ACCESS,
      severity: AuditSeverity.WARNING,
      userId,
      resource,
      ipAddress: getIpAddress(request),
      userAgent: request.headers.get("user-agent") || undefined,
    }),

  rateLimitExceeded: (identifier: string, endpoint: string) =>
    logAuditEvent({
      eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
      severity: AuditSeverity.WARNING,
      resource: endpoint,
      details: { identifier },
    }),

  paymentSuccess: (userId: string, orderId: string, amount: number) =>
    logAuditEvent({
      eventType: AuditEventType.PAYMENT_SUCCESS,
      severity: AuditSeverity.INFO,
      userId,
      resourceId: orderId,
      details: { amount },
    }),

  suspiciousActivity: (
    userId: string | undefined,
    reason: string,
    request: Request,
  ) =>
    logAuditEvent({
      eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
      severity: AuditSeverity.CRITICAL,
      userId,
      ipAddress: getIpAddress(request),
      userAgent: request.headers.get("user-agent") || undefined,
      details: { reason },
    }),

  settingsChanged: (
    userId: string,
    tenantId: string,
    changes: Record<string, any>,
  ) =>
    logAuditEvent({
      eventType: AuditEventType.SETTINGS_CHANGED,
      severity: AuditSeverity.INFO,
      userId,
      tenantId,
      details: changes,
    }),
};

/**
 * Query audit logs (for admin dashboard)
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  tenantId?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  // TODO: Implement database query
  // return db.auditLog.findMany({ where: filters });

  return [];
}
