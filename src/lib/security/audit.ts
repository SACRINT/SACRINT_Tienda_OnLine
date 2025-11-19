// Security Audit Utilities

export type SecurityEventType =
  | "auth_success"
  | "auth_failure"
  | "password_change"
  | "password_reset_request"
  | "session_created"
  | "session_destroyed"
  | "permission_denied"
  | "rate_limit_exceeded"
  | "suspicious_activity"
  | "data_export"
  | "admin_action"
  | "payment_attempt"
  | "payment_success"
  | "payment_failure"

export interface SecurityEvent {
  id: string
  type: SecurityEventType
  userId?: string
  tenantId?: string
  ipAddress: string
  userAgent: string
  timestamp: Date
  details: Record<string, unknown>
  severity: "low" | "medium" | "high" | "critical"
}

// In-memory store for audit logs (use database in production)
const auditLogs: SecurityEvent[] = []

// Generate event ID
function generateEventId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Log security event
export function logSecurityEvent(
  event: Omit<SecurityEvent, "id" | "timestamp">
): SecurityEvent {
  const fullEvent: SecurityEvent = {
    ...event,
    id: generateEventId(),
    timestamp: new Date(),
  }

  auditLogs.push(fullEvent)

  // Keep only last 1000 events in memory
  if (auditLogs.length > 1000) {
    auditLogs.shift()
  }

  // Log critical events to console
  if (event.severity === "critical" || event.severity === "high") {
    console.warn("[SECURITY]", fullEvent)
  }

  return fullEvent
}

// Get audit logs
export function getAuditLogs(options?: {
  userId?: string
  tenantId?: string
  type?: SecurityEventType
  severity?: SecurityEvent["severity"]
  limit?: number
  startDate?: Date
  endDate?: Date
}): SecurityEvent[] {
  let filtered = [...auditLogs]

  if (options?.userId) {
    filtered = filtered.filter((e) => e.userId === options.userId)
  }

  if (options?.tenantId) {
    filtered = filtered.filter((e) => e.tenantId === options.tenantId)
  }

  if (options?.type) {
    filtered = filtered.filter((e) => e.type === options.type)
  }

  if (options?.severity) {
    filtered = filtered.filter((e) => e.severity === options.severity)
  }

  if (options?.startDate) {
    filtered = filtered.filter((e) => e.timestamp >= options.startDate!)
  }

  if (options?.endDate) {
    filtered = filtered.filter((e) => e.timestamp <= options.endDate!)
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  // Apply limit
  if (options?.limit) {
    filtered = filtered.slice(0, options.limit)
  }

  return filtered
}

// Helper to extract request info
export function getRequestInfo(request: Request): {
  ipAddress: string
  userAgent: string
} {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const cfConnectingIp = request.headers.get("cf-connecting-ip")

  const ipAddress =
    cfConnectingIp ||
    realIp ||
    forwarded?.split(",")[0].trim() ||
    "unknown"

  const userAgent = request.headers.get("user-agent") || "unknown"

  return { ipAddress, userAgent }
}

// Pre-built event loggers
export const securityAudit = {
  authSuccess: (
    request: Request,
    userId: string,
    details?: Record<string, unknown>
  ) => {
    const { ipAddress, userAgent } = getRequestInfo(request)
    return logSecurityEvent({
      type: "auth_success",
      userId,
      ipAddress,
      userAgent,
      severity: "low",
      details: { ...details },
    })
  },

  authFailure: (
    request: Request,
    email: string,
    reason: string
  ) => {
    const { ipAddress, userAgent } = getRequestInfo(request)
    return logSecurityEvent({
      type: "auth_failure",
      ipAddress,
      userAgent,
      severity: "medium",
      details: { email, reason },
    })
  },

  passwordChange: (
    request: Request,
    userId: string
  ) => {
    const { ipAddress, userAgent } = getRequestInfo(request)
    return logSecurityEvent({
      type: "password_change",
      userId,
      ipAddress,
      userAgent,
      severity: "medium",
      details: {},
    })
  },

  permissionDenied: (
    request: Request,
    userId: string | undefined,
    resource: string,
    action: string
  ) => {
    const { ipAddress, userAgent } = getRequestInfo(request)
    return logSecurityEvent({
      type: "permission_denied",
      userId,
      ipAddress,
      userAgent,
      severity: "high",
      details: { resource, action },
    })
  },

  rateLimitExceeded: (
    request: Request,
    identifier: string
  ) => {
    const { ipAddress, userAgent } = getRequestInfo(request)
    return logSecurityEvent({
      type: "rate_limit_exceeded",
      ipAddress,
      userAgent,
      severity: "medium",
      details: { identifier },
    })
  },

  suspiciousActivity: (
    request: Request,
    description: string,
    details?: Record<string, unknown>
  ) => {
    const { ipAddress, userAgent } = getRequestInfo(request)
    return logSecurityEvent({
      type: "suspicious_activity",
      ipAddress,
      userAgent,
      severity: "high",
      details: { description, ...details },
    })
  },

  paymentAttempt: (
    request: Request,
    userId: string,
    amount: number,
    method: string
  ) => {
    const { ipAddress, userAgent } = getRequestInfo(request)
    return logSecurityEvent({
      type: "payment_attempt",
      userId,
      ipAddress,
      userAgent,
      severity: "low",
      details: { amount, method },
    })
  },

  paymentSuccess: (
    request: Request,
    userId: string,
    orderId: string,
    amount: number
  ) => {
    const { ipAddress, userAgent } = getRequestInfo(request)
    return logSecurityEvent({
      type: "payment_success",
      userId,
      ipAddress,
      userAgent,
      severity: "low",
      details: { orderId, amount },
    })
  },

  paymentFailure: (
    request: Request,
    userId: string,
    reason: string,
    amount: number
  ) => {
    const { ipAddress, userAgent } = getRequestInfo(request)
    return logSecurityEvent({
      type: "payment_failure",
      userId,
      ipAddress,
      userAgent,
      severity: "medium",
      details: { reason, amount },
    })
  },

  adminAction: (
    request: Request,
    userId: string,
    action: string,
    target: string
  ) => {
    const { ipAddress, userAgent } = getRequestInfo(request)
    return logSecurityEvent({
      type: "admin_action",
      userId,
      ipAddress,
      userAgent,
      severity: "medium",
      details: { action, target },
    })
  },

  dataExport: (
    request: Request,
    userId: string,
    dataType: string
  ) => {
    const { ipAddress, userAgent } = getRequestInfo(request)
    return logSecurityEvent({
      type: "data_export",
      userId,
      ipAddress,
      userAgent,
      severity: "medium",
      details: { dataType },
    })
  },
}

// Clear audit logs (for testing)
export function clearAuditLogs(): void {
  auditLogs.length = 0
}

// Export logs for analysis
export function exportAuditLogs(): SecurityEvent[] {
  return [...auditLogs]
}

// Detect suspicious patterns
export function detectSuspiciousPatterns(
  ipAddress: string,
  windowMs = 5 * 60 * 1000 // 5 minutes
): {
  authFailures: number
  rateLimitHits: number
  isSuspicious: boolean
} {
  const now = new Date()
  const cutoff = new Date(now.getTime() - windowMs)

  const recentEvents = auditLogs.filter(
    (e) => e.ipAddress === ipAddress && e.timestamp >= cutoff
  )

  const authFailures = recentEvents.filter(
    (e) => e.type === "auth_failure"
  ).length

  const rateLimitHits = recentEvents.filter(
    (e) => e.type === "rate_limit_exceeded"
  ).length

  // Consider suspicious if too many failures
  const isSuspicious = authFailures >= 5 || rateLimitHits >= 10

  return { authFailures, rateLimitHits, isSuspicious }
}
