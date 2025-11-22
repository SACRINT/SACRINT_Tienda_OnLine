/**
 * Input Sanitizer
 * Sanitización y validación de inputs
 */

import { logger } from "../monitoring/logger";

/**
 * Sanitizar strings HTML para prevenir XSS
 */
export function sanitizeHTML(input: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return input.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Sanitizar para SQL (aunque Prisma ya previene SQL injection)
 */
export function sanitizeSQL(input: string): string {
  // Remover caracteres peligrosos
  return input.replace(/['";\\]/g, "");
}

/**
 * Sanitizar URLs
 */
export function sanitizeURL(input: string): string | null {
  try {
    const url = new URL(input);

    // Solo permitir http y https
    if (!["http:", "https:"].includes(url.protocol)) {
      logger.warn({ type: "invalid_url_protocol", url: input }, "Invalid URL protocol");
      return null;
    }

    return url.toString();
  } catch {
    logger.warn({ type: "invalid_url", url: input }, "Invalid URL format");
    return null;
  }
}

/**
 * Sanitizar nombres de archivo
 */
export function sanitizeFilename(filename: string): string {
  // Remover path traversal attempts
  let sanitized = filename.replace(/\.\./g, "");

  // Remover caracteres peligrosos
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Limitar longitud
  if (sanitized.length > 255) {
    const ext = sanitized.split(".").pop();
    sanitized = sanitized.substring(0, 255 - (ext ? ext.length + 1 : 0)) + (ext ? `.${ext}` : "");
  }

  return sanitized;
}

/**
 * Validar y sanitizar email
 */
export function sanitizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();

  // Regex básico de validación
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    logger.warn({ type: "invalid_email", email }, "Invalid email format");
    return null;
  }

  return trimmed;
}

/**
 * Sanitizar números de teléfono
 */
export function sanitizePhone(phone: string): string {
  // Remover todo excepto números, +, (, ), -
  return phone.replace(/[^0-9+()-\s]/g, "");
}

/**
 * Detectar patrones sospechosos (posible ataque)
 */
export function detectSuspiciousPatterns(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
    /eval\(/i,
    /expression\(/i,
    /import\s/i,
    /\.\.\//, // Path traversal
    /union\s+select/i, // SQL injection
    /exec\s*\(/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      logger.warn(
        {
          type: "suspicious_input_detected",
          pattern: pattern.source,
          input: input.substring(0, 100),
        },
        "Suspicious input pattern detected",
      );
      return true;
    }
  }

  return false;
}

/**
 * Sanitizar objeto completo recursivamente
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T, depth = 0): T {
  if (depth > 10) {
    logger.warn({ type: "sanitize_max_depth" }, "Max sanitization depth reached");
    return obj;
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      // Detectar patrones sospechosos
      if (detectSuspiciousPatterns(value)) {
        sanitized[key] = sanitizeHTML(value);
      } else {
        sanitized[key] = value;
      }
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => (typeof item === "string" ? sanitizeHTML(item) : item));
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validar longitud de string
 */
export function validateLength(
  input: string,
  min: number,
  max: number,
): { valid: boolean; error?: string } {
  if (input.length < min) {
    return { valid: false, error: `Mínimo ${min} caracteres` };
  }
  if (input.length > max) {
    return { valid: false, error: `Máximo ${max} caracteres` };
  }
  return { valid: true };
}

/**
 * Validar formato UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export default {
  sanitizeHTML,
  sanitizeSQL,
  sanitizeURL,
  sanitizeFilename,
  sanitizeEmail,
  sanitizePhone,
  detectSuspiciousPatterns,
  sanitizeObject,
  validateLength,
  isValidUUID,
};
