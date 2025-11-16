// NextAuth.js v5 API Route Handler
// Handles all authentication requests: signin, signout, callback, etc.

import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth/auth.config'

const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

export const { GET, POST } = handlers

// Export auth helpers for use in other parts of the app
export { auth, signIn, signOut }
