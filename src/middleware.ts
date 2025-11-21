// Middleware - TEMPORARY MINIMAL VERSION
// TODO: Re-enable authentication and route protection once 404 issue is resolved

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  // Just pass through - no authentication, no redirects, no nothing
  // This ensures the app loads while we debug the 404 issue
  const response = NextResponse.next();

  // Add basic security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

// Minimal matcher - only run on HTML pages
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - API routes (let them handle their own auth)
     * - Static files
     * - Next.js internals
     */
    "/((?!api|_next/static|_next/image|favicon|public).*)",
  ],
};
