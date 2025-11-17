// @ts-nocheck
'use client'

// Server actions for authentication
// Used by client components to trigger sign-in/sign-out
// Note: @ts-nocheck is needed due to version conflict between @auth/core used by
// @auth/prisma-adapter and the internal @auth/core bundled with next-auth

import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

const { signIn, signOut } = NextAuth(authConfig)

export { signIn, signOut }
