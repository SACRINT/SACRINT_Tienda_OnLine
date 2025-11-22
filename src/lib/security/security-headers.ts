// Security Headers
// Week 21-22: Configure security headers for production

import { NextResponse } from "next/server";

/**
 * Generate Content Security Policy header
 */
export function generateCSP(nonce?: string): string {
  const policies = [
    "default-src 'self'",
    `script-src 'self' ${nonce ? `'nonce-${nonce}'` : ""} 'strict-dynamic' https://js.stripe.com https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://*.vercel-insights.com",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];

  return policies.join("; ");
}

/**
 * Security headers configuration
 */
export const securityHeaders = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",

  // Enable XSS protection (legacy but still useful)
  "X-XSS-Protection": "1; mode=block",

  // Referrer policy
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Permissions policy (formerly Feature-Policy)
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",

  // Strict Transport Security (HTTPS only)
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",

  // Content Security Policy
  "Content-Security-Policy": generateCSP(),
};

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Security headers for development environment
 */
export const devSecurityHeaders = {
  ...securityHeaders,
  // More lenient CSP for development
  "Content-Security-Policy": "default-src 'self' 'unsafe-eval' 'unsafe-inline' *",
};

/**
 * Get appropriate headers based on environment
 */
export function getSecurityHeaders(): Record<string, string> {
  return process.env.NODE_ENV === "production"
    ? securityHeaders
    : devSecurityHeaders;
}
