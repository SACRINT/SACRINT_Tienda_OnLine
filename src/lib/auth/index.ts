// Authentication utilities and exports
// Central export point for authentication-related modules

export { authConfig } from './auth.config'
export { auth, signIn, signOut } from '@/app/api/auth/[...nextauth]/route'

// Auth helpers
export { hasPermission } from '@/lib/db/users'

// Auth constants
export const AUTH_ROUTES = {
  signIn: '/login',
  signUp: '/signup',
  signOut: '/login',
  error: '/login',
  callback: '/api/auth/callback',
}

// Public routes that don't require authentication
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/shop',
  '/api/health',
  '/api/auth',
]

// Protected routes that require authentication
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/admin',
  '/account',
]

// Admin-only routes (STORE_OWNER or SUPER_ADMIN)
export const ADMIN_ROUTES = [
  '/admin',
]
