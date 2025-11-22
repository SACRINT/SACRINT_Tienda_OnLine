/**
 * Security Headers
 * Configuración de headers de seguridad
 */

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  frameOptions?: "DENY" | "SAMEORIGIN";
  strictTransportSecurity?: boolean;
  xssProtection?: boolean;
  noSniff?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

/**
 * Generar Content Security Policy
 */
export function generateCSP(config?: {
  allowInlineStyles?: boolean;
  allowInlineScripts?: boolean;
  extraDirectives?: Record<string, string[]>;
}): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-eval'",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://js.stripe.com",
      ...(config?.allowInlineScripts ? ["'unsafe-inline'"] : []),
    ],
    "style-src": [
      "'self'",
      "https://fonts.googleapis.com",
      ...(config?.allowInlineStyles ? ["'unsafe-inline'"] : []),
    ],
    "img-src": ["'self'", "data:", "https:", "blob:"],
    "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
    "connect-src": [
      "'self'",
      "https://www.google-analytics.com",
      "https://api.stripe.com",
      "https://*.sentry.io",
    ],
    "frame-src": ["'self'", "https://js.stripe.com", "https://www.google.com"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": [],
    ...config?.extraDirectives,
  };

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return key + " " + values.join(" ");
    })
    .join("; ");
}

/**
 * Generar Permissions Policy
 */
export function generatePermissionsPolicy(): string {
  const policies = [
    "camera=()",
    "microphone=()",
    "geolocation=(self)",
    "payment=(self)",
    "usb=()",
    "magnetometer=()",
    "gyroscope=()",
    "accelerometer=()",
  ];

  return policies.join(", ");
}

/**
 * Obtener todos los security headers
 */
export function getSecurityHeaders(config?: SecurityHeadersConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  if (config?.contentSecurityPolicy !== false && config?.contentSecurityPolicy !== undefined) {
    headers["Content-Security-Policy"] =
      typeof config.contentSecurityPolicy === "string"
        ? config.contentSecurityPolicy
        : generateCSP();
  } else if (config?.contentSecurityPolicy === undefined) {
    headers["Content-Security-Policy"] = generateCSP();
  }

  headers["X-Frame-Options"] = config?.frameOptions || "DENY";

  if (config?.strictTransportSecurity !== false) {
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
  }

  if (config?.xssProtection !== false) {
    headers["X-XSS-Protection"] = "1; mode=block";
  }

  if (config?.noSniff !== false) {
    headers["X-Content-Type-Options"] = "nosniff";
  }

  headers["Referrer-Policy"] = config?.referrerPolicy || "strict-origin-when-cross-origin";
  headers["Permissions-Policy"] = config?.permissionsPolicy || generatePermissionsPolicy();
  headers["X-DNS-Prefetch-Control"] = "on";

  return headers;
}

/**
 * Middleware para Next.js
 */
export function securityHeadersMiddleware(config?: SecurityHeadersConfig) {
  const headers = getSecurityHeaders(config);

  return (response: Response): Response => {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  };
}

export default {
  generateCSP,
  generatePermissionsPolicy,
  getSecurityHeaders,
  securityHeadersMiddleware,
};
