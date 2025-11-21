// Middleware - Internationalization, Route Protection, and Security Headers
// Handles i18n locale routing, protects routes, and adds security headers

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// CSP Header
const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://api.stripe.com https://*.googleapis.com;
  frame-src https://js.stripe.com;
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`
  .replace(/\n/g, " ")
  .replace(/\s{2,}/g, " ")
  .trim();

export default async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;

    // Handle security headers
    const addSecurityHeaders = (response: NextResponse) => {
      response.headers.set("Content-Security-Policy", CSP_HEADER);
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("X-XSS-Protection", "1; mode=block");
      response.headers.set(
        "Referrer-Policy",
        "strict-origin-when-cross-origin",
      );
      response.headers.set(
        "Permissions-Policy",
        "geolocation=(), microphone=(), camera=()",
      );
      return response;
    };

    // Get auth token with error handling
    let isLoggedIn = false;
    let userRole: string | undefined;

    try {
      // Only try to get token if NEXTAUTH_SECRET is available
      if (process.env.NEXTAUTH_SECRET) {
        const { getToken } = await import("next-auth/jwt");
        const token = await getToken({
          req,
          secret: process.env.NEXTAUTH_SECRET,
        });
        isLoggedIn = !!token;
        userRole = token?.role as string | undefined;
      }
    } catch (error) {
      // Silently fail auth check - allow public access but block protected routes
      console.error("Auth token error:", error);
    }

    // Define public paths that don't require authentication
    const publicPaths = [
      "/",
      "/login",
      "/signup",
      "/shop",
      "/forgot-password",
      "/reset-password",
      "/verify-email",
      "/api/health",
      "/api/auth",
      "/products",
      "/categories",
      "/cart",
      "/checkout",
    ];

    // Check if path is public (considering locale prefixes)
    const pathnameWithoutLocale = pathname.replace(/^\/(en|es)/, "") || "/";
    const isPublicPath = publicPaths.some(
      (path) =>
        pathnameWithoutLocale === path ||
        pathnameWithoutLocale.startsWith(`${path}/`),
    );

    // ===== ROUTE PROTECTION CHECKS =====

    // Protect dashboard routes
    if (pathnameWithoutLocale.startsWith("/dashboard")) {
      if (!isLoggedIn) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return addSecurityHeaders(NextResponse.redirect(loginUrl));
      }
    }

    // Protect admin routes (STORE_OWNER only)
    if (pathnameWithoutLocale.startsWith("/admin")) {
      if (!isLoggedIn) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return addSecurityHeaders(NextResponse.redirect(loginUrl));
      }

      if (userRole !== "STORE_OWNER" && userRole !== "SUPER_ADMIN") {
        return addSecurityHeaders(NextResponse.redirect(new URL("/", req.url)));
      }
    }

    // Protect API routes (except auth and public endpoints)
    if (
      pathname.startsWith("/api") &&
      !pathname.startsWith("/api/auth") &&
      !pathname.startsWith("/api/health") &&
      !pathname.startsWith("/api/webhooks") &&
      !pathname.startsWith("/api/products") &&
      !pathname.startsWith("/api/search")
    ) {
      if (!isLoggedIn) {
        return addSecurityHeaders(
          NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        );
      }
    }

    // Allow request to proceed
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  } catch (error) {
    // Critical error handler - always return a valid response
    console.error("Middleware critical error:", error);
    const response = NextResponse.next();
    return response;
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - .well-known (for SSL/security)
     */
    "/((?!_next/static|_next/image|favicon|public|\\.well-known).*)",
  ],
};
