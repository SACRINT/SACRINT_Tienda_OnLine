// Input Sanitization
// Week 21-22: Prevent XSS, SQL injection, and other attacks

/**
 * Sanitize HTML content to prevent XSS
 * Note: Install isomorphic-dompurify for production use
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization (for production, use DOMPurify)
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

/**
 * Sanitize plain text (remove all HTML)
 */
export function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    return parsed.toString();
  } catch {
    return "";
  }
}

/**
 * Remove null bytes (prevent null byte injection)
 */
export function removeNullBytes(str: string): string {
  return str.replace(/\0/g, "");
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let clean = filename.replace(/\.\./g, "");

  // Remove special characters
  clean = clean.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Limit length
  if (clean.length > 255) {
    const ext = clean.split(".").pop() || "";
    const name = clean.substring(0, 255 - ext.length - 1);
    clean = `${name}.${ext}`;
  }

  return clean;
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  // Remove all non-digit characters except +
  return phone.replace(/[^\d+]/g, "");
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  // Remove special regex characters
  return query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").trim();
}

/**
 * Validate and sanitize pagination params
 */
export function sanitizePagination(params: {
  page?: string | number;
  limit?: string | number;
  maxLimit?: number;
}): { page: number; limit: number } {
  const maxLimit = params.maxLimit || 100;

  let page = typeof params.page === "string" ? parseInt(params.page) : params.page || 1;
  let limit = typeof params.limit === "string" ? parseInt(params.limit) : params.limit || 10;

  // Validate
  page = Math.max(1, Math.floor(page));
  limit = Math.max(1, Math.min(maxLimit, Math.floor(limit)));

  return { page, limit };
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    removeNullBytes?: boolean;
  } = {},
): T {
  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      result[key] = value;
      continue;
    }

    if (typeof value === "string") {
      let sanitized = value;

      if (options.removeNullBytes !== false) {
        sanitized = removeNullBytes(sanitized);
      }

      result[key] = sanitized;
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "object" ? sanitizeObject(item, options) : item,
      );
    } else if (typeof value === "object") {
      result[key] = sanitizeObject(value, options);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
