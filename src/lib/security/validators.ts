// Additional Security Validators
// Common security validations beyond Zod schemas

import { z } from "zod";

/**
 * Sanitize user input to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 */
export function sanitizeHTML(input: string): string {
  // Remove script tags
  let sanitized = input.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, "");

  return sanitized;
}

/**
 * Validate file upload security
 */
export function validateFileUpload(file: {
  type: string;
  size: number;
  name: string;
}): { valid: boolean; error?: string } {
  // Check file extension matches MIME type
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  const validMimeTypes: Record<string, string[]> = {
    jpg: ["image/jpeg", "image/jpg"],
    jpeg: ["image/jpeg", "image/jpg"],
    png: ["image/png"],
    webp: ["image/webp"],
    gif: ["image/gif"],
  };

  if (!extension || !validMimeTypes[extension]) {
    return {
      valid: false,
      error: "Invalid file extension",
    };
  }

  if (!validMimeTypes[extension].includes(mimeType)) {
    return {
      valid: false,
      error:
        "File extension does not match content type (possible file upload attack)",
    };
  }

  // Check for double extensions (e.g., image.jpg.exe)
  const parts = file.name.split(".");
  if (parts.length > 2) {
    return {
      valid: false,
      error: "File has multiple extensions (possible security risk)",
    };
  }

  // Check filename for suspicious characters
  if (/[<>:"|?*\x00-\x1f]/.test(file.name)) {
    return {
      valid: false,
      error: "Filename contains invalid characters",
    };
  }

  return { valid: true };
}

/**
 * Validate URL is safe (no javascript:, data:, etc.)
 */
export function validateSafeURL(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    // Prevent SSRF attacks - block internal IPs
    const hostname = parsed.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.")
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validate credit card number (basic Luhn algorithm)
 * For PCI compliance, never store raw credit card numbers
 */
export function validateCreditCard(cardNumber: string): boolean {
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, "");

  // Check if it's all digits
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }

  // Check length (13-19 digits for most cards)
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate phone number format
 * Accepts international formats
 */
export const PhoneNumberSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format (E.164)");

/**
 * Validate strong password
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const StrongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

/**
 * Validate email with additional security checks
 */
export function validateEmailSecurity(email: string): {
  valid: boolean;
  error?: string;
} {
  // Basic email validation
  const emailSchema = z.string().email();
  const basicValidation = emailSchema.safeParse(email);

  if (!basicValidation.success) {
    return { valid: false, error: "Invalid email format" };
  }

  // Check for suspicious patterns
  const lowercaseEmail = email.toLowerCase();

  // Prevent disposable email domains (basic list)
  const disposableDomains = [
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "throwaway.email",
  ];

  const domain = lowercaseEmail.split("@")[1];
  if (disposableDomains.includes(domain)) {
    return {
      valid: false,
      error: "Disposable email addresses are not allowed",
    };
  }

  // Check for plus addressing abuse (e.g., user+spam@example.com)
  // This is legitimate but can be restricted based on business rules
  const localPart = lowercaseEmail.split("@")[0];
  const plusCount = (localPart.match(/\+/g) || []).length;
  if (plusCount > 1) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true };
}

/**
 * Prevent SQL injection in raw queries
 * This should never be needed if using Prisma correctly
 * but included for completeness
 */
export function escapeSQLIdentifier(identifier: string): string {
  // Only allow alphanumeric and underscore
  if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
    throw new Error("Invalid SQL identifier");
  }
  return identifier;
}

/**
 * Validate JSON input size to prevent DoS
 */
export function validateJSONSize(
  json: string,
  maxSizeKB: number = 100,
): boolean {
  const sizeKB = new Blob([json]).size / 1024;
  return sizeKB <= maxSizeKB;
}

/**
 * Rate limit key generator for specific resources
 */
export function generateRateLimitKey(
  resource: string,
  identifier: string,
  action?: string,
): string {
  const parts = [resource, identifier];
  if (action) {
    parts.push(action);
  }
  return parts.join(":");
}

/**
 * Check if request is from a bot (basic check)
 */
export function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}

/**
 * Validate content length to prevent large payload attacks
 */
export function validateContentLength(
  contentLength: string | null,
  maxMB: number = 10,
): boolean {
  if (!contentLength) return true; // No content-length header

  const lengthBytes = parseInt(contentLength, 10);
  const maxBytes = maxMB * 1024 * 1024;

  return lengthBytes <= maxBytes;
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  // Use crypto for secure randomness
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }

  return result;
}

/**
 * Hash sensitive data (for logging, etc.)
 */
export async function hashSensitiveData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
