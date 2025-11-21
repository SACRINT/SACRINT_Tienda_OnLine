// Middleware - Internationalization, Route Protection, and Security Headers
// Handles i18n locale routing, protects routes, and adds security headers

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import createIntlMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/request";

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

// Create i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeDetection: true,
});

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get user token for authentication (edge-compatible)
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const isLoggedIn = !!token;

  // Handle security headers FIRST
  const addSecurityHeaders = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", CSP_HEADER);
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()",
    );
    return response;
  };

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
  ];

  // Check if path is public (considering locale prefixes)
  const pathnameWithoutLocale = pathname.replace(/^\/(en|es)/, "") || "/";
  const isPublicPath = publicPaths.some(
    (path) =>
      pathnameWithoutLocale === path ||
      pathnameWithoutLocale.startsWith(`${path}/`),
  );

  // Skip i18n for API routes, static files, and Next.js internals
  const shouldApplyIntl =
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/_vercel") &&
    !pathname.startsWith("/.well-known") &&
    !pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|json|xml|txt)$/);

  // ===== ROUTE PROTECTION CHECKS =====

  // Protect dashboard routes
  if (pathnameWithoutLocale.startsWith("/dashboard") && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // Protect admin routes (STORE_OWNER only)
  if (pathnameWithoutLocale.startsWith("/admin")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    const userRole = token?.role as string | undefined;

    if (userRole !== "STORE_OWNER" && userRole !== "SUPER_ADMIN") {
      return addSecurityHeaders(NextResponse.redirect(new URL("/", req.url)));
    }
  }

  // Protect API routes (except auth endpoints)
  if (
    pathname.startsWith("/api") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/health") &&
    !pathname.startsWith("/api/webhooks")
  ) {
    if (!isLoggedIn) {
      return addSecurityHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }
  }

  // ===== I18N MIDDLEWARE =====
  // TEMPORARY: Disable intlMiddleware to diagnose root cause
  // The middleware is causing 404 errors, so we'll skip it for now
  let response = NextResponse.next();

  // TODO: Re-enable intlMiddleware once we fix the root cause
  // For now, routes are working without i18n routing

  return addSecurityHeaders(response);
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
