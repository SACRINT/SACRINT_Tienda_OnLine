// Input Sanitization Utilities

// HTML entities to escape
const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

// Escape HTML to prevent XSS
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char]);
}

// Unescape HTML
export function unescapeHtml(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#x60;/g, "`")
    .replace(/&#x3D;/g, "=");
}

// Strip HTML tags
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

// Sanitize for SQL (basic protection, use parameterized queries instead)
export function sanitizeSql(str: string): string {
  return str.replace(/'/g, "''").replace(/\\/g, "\\\\");
}

// Sanitize filename
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  const cleaned = filename
    .replace(/\.\./g, "")
    .replace(/[/\\]/g, "")
    // Remove special characters except dots, dashes, underscores
    .replace(/[^a-zA-Z0-9.-_]/g, "_")
    // Remove multiple dots
    .replace(/\.+/g, ".")
    // Remove leading/trailing dots
    .replace(/^\.+|\.+$/g, "")
    // Limit length
    .slice(0, 255);

  // Ensure there's a valid filename
  return cleaned || "unnamed";
}

// Sanitize URL
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http(s) protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

// Sanitize redirect URL (prevent open redirect)
export function sanitizeRedirectUrl(url: string, allowedHosts?: string[]): string {
  // Handle relative URLs
  if (url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; // ✅ ENV [P1.8]: Consolidated URL variable
    const siteHost = new URL(siteUrl).host;

    const hosts = [siteHost, ...(allowedHosts || [])];

    if (hosts.includes(parsed.host)) {
      return url;
    }

    // Return home if not allowed
    return "/";
  } catch {
    return "/";
  }
}

// Sanitize user input (general purpose)
export function sanitizeInput(
  input: string,
  options?: {
    maxLength?: number;
    allowHtml?: boolean;
    trim?: boolean;
  },
): string {
  let sanitized = input;

  // Trim whitespace
  if (options?.trim !== false) {
    sanitized = sanitized.trim();
  }

  // Limit length
  if (options?.maxLength) {
    sanitized = sanitized.slice(0, options.maxLength);
  }

  // Escape HTML unless explicitly allowed
  if (!options?.allowHtml) {
    sanitized = escapeHtml(sanitized);
  }

  return sanitized;
}

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options?: {
    maxLength?: number;
    allowHtml?: boolean;
  },
): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      (sanitized as Record<string, unknown>)[key] = sanitizeInput(value, options);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>,
        options,
      );
    } else if (Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeInput(item, options)
          : item && typeof item === "object"
            ? sanitizeObject(item as Record<string, unknown>, options)
            : item,
      );
    } else {
      (sanitized as Record<string, unknown>)[key] = value;
    }
  }

  return sanitized;
}

// Validate and sanitize email
export function sanitizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return "";
  }

  return trimmed;
}

// Validate and sanitize phone (Mexican format)
export function sanitizePhone(phone: string): string {
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, "");

  // Mexican phone: 10 digits
  if (digits.length === 10) {
    return digits;
  }

  // With country code: 12-13 digits (52 or +52)
  if (digits.length >= 12 && digits.startsWith("52")) {
    return digits.slice(-10);
  }

  return "";
}

// Sanitize search query
export function sanitizeSearchQuery(query: string): string {
  return (
    query
      .trim()
      // Remove special regex characters
      .replace(/[.*+?^${}()|[\]\\]/g, "")
      // Remove SQL injection attempts
      .replace(/(['";]|--)/g, "")
      // Limit length
      .slice(0, 100)
  );
}

// Sanitize JSON string
export function sanitizeJson(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed === "object" && parsed !== null) {
      return JSON.stringify(sanitizeObject(parsed));
    }
    return jsonString;
  } catch {
    return "";
  }
}

// Validate content type
export function validateContentType(contentType: string | null, allowed: string[]): boolean {
  if (!contentType) return false;

  const type = contentType.split(";")[0].trim();
  return allowed.includes(type);
}

// Validate file type by extension
export function validateFileExtension(filename: string, allowed: string[]): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return allowed.includes(ext);
}

// Common allowed file types
export const allowedImageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "avif"];
export const allowedDocumentExtensions = ["pdf", "doc", "docx", "txt"];
export const allowedImageMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
];
