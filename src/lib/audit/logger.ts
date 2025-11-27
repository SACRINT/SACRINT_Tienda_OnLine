// @ts-nocheck
// Audit Logger
// Track all important actions in the system

import { db } from "@/lib/db";

export type AuditAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "export"
  | "import"
  | "permission_change"
  | "settings_change"
  | "payment"
  | "refund";

export type AuditResource =
  | "user"
  | "product"
  | "order"
  | "customer"
  | "category"
  | "settings"
  | "webhook"
  | "api_key"
  | "report";

export interface AuditEntry {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  details?: Record<string, any>;
  metadata?: {
    ip?: string;
    userAgent?: string;
    sessionId?: string;
  };
  timestamp: Date;
}

export interface AuditOptions {
  resourceId?: string;
  details?: Record<string, any>;
  metadata?: {
    ip?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

// Log an audit entry
export async function logAudit(
  tenantId: string,
  userId: string,
  userEmail: string,
  action: AuditAction,
  resource: AuditResource,
  options?: AuditOptions,
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        tenantId,
        userId,
        userEmail,
        action,
        resource,
        resourceId: options?.resourceId,
        details: options?.details as object,
        ip: options?.metadata?.ip,
        userAgent: options?.metadata?.userAgent,
        sessionId: options?.metadata?.sessionId,
      },
    });
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error("Audit logging failed:", error);
  }
}

// Get audit logs for a tenant
export async function getAuditLogs(
  tenantId: string,
  options?: {
    userId?: string;
    action?: AuditAction;
    resource?: AuditResource;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  },
): Promise<{ entries: AuditEntry[]; total: number }> {
  const where: Record<string, any> = { tenantId };

  if (options?.userId) where.userId = options.userId;
  if (options?.action) where.action = options.action;
  if (options?.resource) where.resource = options.resource;
  if (options?.resourceId) where.resourceId = options.resourceId;

  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options?.startDate) {
      (where.createdAt as Record<string, Date>).gte = options.startDate;
    }
    if (options?.endDate) {
      (where.createdAt as Record<string, Date>).lte = options.endDate;
    }
  }

  const [entries, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    entries: entries.map((e) => ({
      id: e.id,
      tenantId: e.tenantId,
      userId: e.userId,
      userEmail: e.userEmail,
      action: e.action as AuditAction,
      resource: e.resource as AuditResource,
      resourceId: e.resourceId || undefined,
      details: e.details as Record<string, any> | undefined,
      metadata: {
        ip: e.ip || undefined,
        userAgent: e.userAgent || undefined,
        sessionId: e.sessionId || undefined,
      },
      timestamp: e.createdAt,
    })),
    total,
  };
}

// Get audit logs for a specific resource
export async function getResourceAuditLogs(
  tenantId: string,
  resource: AuditResource,
  resourceId: string,
  limit: number = 20,
): Promise<AuditEntry[]> {
  const { entries } = await getAuditLogs(tenantId, {
    resource,
    resourceId,
    limit,
  });
  return entries;
}

// Get user activity
export async function getUserActivity(
  tenantId: string,
  userId: string,
  limit: number = 50,
): Promise<AuditEntry[]> {
  const { entries } = await getAuditLogs(tenantId, {
    userId,
    limit,
  });
  return entries;
}

// Helper for common audit actions
export const audit = {
  userLogin: (
    tenantId: string,
    userId: string,
    email: string,
    metadata?: AuditOptions["metadata"],
  ) => logAudit(tenantId, userId, email, "login", "user", { metadata }),

  userLogout: (tenantId: string, userId: string, email: string) =>
    logAudit(tenantId, userId, email, "logout", "user"),

  productCreated: (
    tenantId: string,
    userId: string,
    email: string,
    productId: string,
    details?: Record<string, any>,
  ) =>
    logAudit(tenantId, userId, email, "create", "product", {
      resourceId: productId,
      details,
    }),

  productUpdated: (
    tenantId: string,
    userId: string,
    email: string,
    productId: string,
    details?: Record<string, any>,
  ) =>
    logAudit(tenantId, userId, email, "update", "product", {
      resourceId: productId,
      details,
    }),

  productDeleted: (tenantId: string, userId: string, email: string, productId: string) =>
    logAudit(tenantId, userId, email, "delete", "product", {
      resourceId: productId,
    }),

  orderCreated: (
    tenantId: string,
    userId: string,
    email: string,
    orderId: string,
    details?: Record<string, any>,
  ) =>
    logAudit(tenantId, userId, email, "create", "order", {
      resourceId: orderId,
      details,
    }),

  orderUpdated: (
    tenantId: string,
    userId: string,
    email: string,
    orderId: string,
    details?: Record<string, any>,
  ) =>
    logAudit(tenantId, userId, email, "update", "order", {
      resourceId: orderId,
      details,
    }),

  settingsChanged: (
    tenantId: string,
    userId: string,
    email: string,
    details?: Record<string, any>,
  ) =>
    logAudit(tenantId, userId, email, "settings_change", "settings", {
      details,
    }),

  dataExported: (
    tenantId: string,
    userId: string,
    email: string,
    resource: AuditResource,
    details?: Record<string, any>,
  ) => logAudit(tenantId, userId, email, "export", resource, { details }),
};
