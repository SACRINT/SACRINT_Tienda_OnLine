// Centralized NextAuth instance
// This file exports the auth() helper for use in API routes and middleware

import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig)
