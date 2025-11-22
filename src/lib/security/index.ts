// Security Module - Barrel Export
// Week 21-22: Centralized security utilities

// Rate Limiting
export {
  rateLimiters,
  getIdentifier,
  createRateLimitHeaders,
  type RateLimitConfig,
  type RateLimitResult,
} from "./rate-limiter";

export {
  withRateLimit,
  checkRateLimit,
} from "./rate-limit-middleware";

// CSRF Protection
export {
  getCsrfToken,
  verifyCsrfToken,
  withCsrfProtection,
  getClientCsrfToken,
  addCsrfHeader,
  csrfFetch,
  useCsrfToken,
} from "./csrf";

// Input Sanitization
export {
  sanitizeHtml,
  sanitizeText,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeFilename,
  sanitizePhone,
  sanitizeSearchQuery,
  sanitizePagination,
  sanitizeObject,
  removeNullBytes,
} from "./sanitization";

// Security Headers
export {
  generateCSP,
  securityHeaders,
  devSecurityHeaders,
  applySecurityHeaders,
  getSecurityHeaders,
} from "./security-headers";

// Audit Logging
export {
  logAuditEvent,
  auditLog,
  getIpAddress,
  queryAuditLogs,
  AuditEventType,
  AuditSeverity,
} from "./audit-logger";
