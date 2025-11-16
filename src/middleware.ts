// Middleware - Route Protection and Security Headers
// Protects routes and adds security headers to all responses

import { auth } from '@/app/api/auth/[...nextauth]/route'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
`.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim()

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth?.user

  // Create response
  const response = NextResponse.next()

  // Add security headers to all responses
  response.headers.set('Content-Security-Policy', CSP_HEADER)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // Define public paths that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/shop',
    '/api/health',
    '/api/auth',
  ]

  // Check if path is public
  const isPublicPath = publicPaths.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  )

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect admin routes (STORE_OWNER only)
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const userRole = req.auth?.user?.role

    if (userRole !== 'STORE_OWNER' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Protect API routes (except auth endpoints)
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/health')) {
    if (!isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  return response
})

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
