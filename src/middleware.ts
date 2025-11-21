// Middleware - Security Headers and Route Protection
// Compatible with Vercel deployment and next-intl

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  // Allow request to proceed
  const response = NextResponse.next();

  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

// CRITICAL: Matcher must exclude _vercel for Vercel deployment to work
// Reference: https://next-intl.dev/docs/routing/middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next (Next.js internals)
     * - _vercel (Vercel internals) ← CRITICAL for deployment
     * - Files with extensions (images, css, js, etc.)
     */
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
