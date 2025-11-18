// Security Headers Configuration
// Implements security best practices for HTTP headers

import { NextResponse } from "next/server";

/**
 * Security headers to add to all responses
 * Follows OWASP recommendations
 */
export const SECURITY_HEADERS = {
  // Prevent clickjacking attacks
  "X-Frame-Options": "DENY",

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Enable XSS protection (legacy browsers)
  "X-XSS-Protection": "1; mode=block",

  // Referrer policy - don't leak info
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions policy - restrict features
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",

  // Strict-Transport-Security (HSTS) - Force HTTPS
  // Only enable in production with HTTPS
  // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

/**
 * Content Security Policy (CSP)
 * Prevents XSS, clickjacking, and other code injection attacks
 *
 * Customize based on your needs:
 * - 'self' allows resources from same origin
 * - 'unsafe-inline' should be avoided but may be needed for some frameworks
 * - Add specific domains for external resources (CDNs, analytics, etc.)
 */
export const CONTENT_SECURITY_POLICY = {
  // Default fallback
  "default-src": ["'self'"],

  // Scripts
  "script-src": [
    "'self'",
    "'unsafe-eval'", // Needed for Next.js dev mode
    "'unsafe-inline'", // Try to avoid this in production
    "https://js.stripe.com", // Stripe
    "https://vercel.live", // Vercel analytics
  ],

  // Styles
  "style-src": [
    "'self'",
    "'unsafe-inline'", // Needed for styled-components/CSS-in-JS
    "https://fonts.googleapis.com",
  ],

  // Images
  "img-src": [
    "'self'",
    "data:", // Base64 images
    "https:", // Allow all HTTPS images
    "blob:", // For image uploads
    "https://lh3.googleusercontent.com", // Google profile images
    "https://*.vercel-storage.com", // Vercel Blob Storage
  ],

  // Fonts
  "font-src": ["'self'", "https://fonts.gstatic.com"],

  // Connect (AJAX, WebSockets, etc.)
  "connect-src": [
    "'self'",
    "https://api.stripe.com", // Stripe API
    "https://*.vercel.app", // Vercel deployments
    "wss://*.vercel.app", // WebSockets
  ],

  // Frames
  "frame-src": [
    "'self'",
    "https://js.stripe.com", // Stripe checkout
    "https://hooks.stripe.com", // Stripe webhooks
  ],

  // Objects (Flash, etc.) - block all
  "object-src": ["'none'"],

  // Base URI - prevent base tag injection
  "base-uri": ["'self'"],

  // Form actions - where forms can submit
  "form-action": ["'self'", "https://api.stripe.com"],

  // Upgrade insecure requests
  "upgrade-insecure-requests": [],
};

/**
 * Generate CSP header string from policy object
 */
export function generateCSPHeader(
  policy: typeof CONTENT_SECURITY_POLICY,
): string {
  return Object.entries(policy)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(" ")}`;
    })
    .join("; ");
}

/**
 * Get CSP header for development vs production
 */
export function getCSPHeader(isDevelopment: boolean = false): string {
  if (isDevelopment) {
    // Relaxed CSP for development
    const devPolicy = {
      ...CONTENT_SECURITY_POLICY,
      "script-src": [
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
        "https://js.stripe.com",
        "https://vercel.live",
      ],
    };
    return generateCSPHeader(devPolicy);
  }

  return generateCSPHeader(CONTENT_SECURITY_POLICY);
}

/**
 * Apply security headers to a NextResponse
 */
export function applySecurityHeaders(
  response: NextResponse,
  options: {
    includeCsp?: boolean;
    includeHsts?: boolean;
    isDevelopment?: boolean;
  } = {},
): NextResponse {
  const {
    includeCsp = true,
    includeHsts = false,
    isDevelopment = false,
  } = options;

  // Apply basic security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add HSTS in production with HTTPS
  if (includeHsts) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  // Add CSP
  if (includeCsp) {
    response.headers.set(
      "Content-Security-Policy",
      getCSPHeader(isDevelopment),
    );
  }

  return response;
}

/**
 * CORS configuration for API endpoints
 */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // Update to specific domains in production
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400", // 24 hours
};

/**
 * Apply CORS headers to response
 */
export function applyCORSHeaders(
  response: NextResponse,
  allowedOrigins: string[] = ["*"],
): NextResponse {
  // In production, check origin against allowedOrigins
  const origin = allowedOrigins.includes("*") ? "*" : allowedOrigins[0];

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set(
    "Access-Control-Allow-Methods",
    CORS_HEADERS["Access-Control-Allow-Methods"],
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    CORS_HEADERS["Access-Control-Allow-Headers"],
  );
  response.headers.set(
    "Access-Control-Max-Age",
    CORS_HEADERS["Access-Control-Max-Age"],
  );

  return response;
}

/**
 * Handle preflight OPTIONS requests
 */
export function handlePreflight(): NextResponse {
  const response = NextResponse.json({}, { status: 200 });
  return applyCORSHeaders(response);
}

/**
 * Security headers for file downloads
 * Prevents browsers from executing downloaded files
 */
export function applyDownloadHeaders(
  response: NextResponse,
  filename: string,
): NextResponse {
  response.headers.set(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Content-Type", "application/octet-stream");

  return response;
}

/**
 * Example usage in middleware:
 *
 * import { NextResponse } from 'next/server'
 * import type { NextRequest } from 'next/server'
 * import { applySecurityHeaders } from '@/lib/security/headers'
 *
 * export function middleware(request: NextRequest) {
 *   const response = NextResponse.next()
 *
 *   return applySecurityHeaders(response, {
 *     includeCsp: true,
 *     includeHsts: process.env.NODE_ENV === 'production',
 *     isDevelopment: process.env.NODE_ENV === 'development',
 *   })
 * }
 */
