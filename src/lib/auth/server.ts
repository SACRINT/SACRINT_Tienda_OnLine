// @ts-nocheck
// Server-side auth utilities
// This file creates a separate NextAuth instance for server-side use
// The route handler has its own instance
// Note: @ts-nocheck is needed due to version conflict between @auth/core used by
// @auth/prisma-adapter and the internal @auth/core bundled with next-auth

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth, signIn, signOut } = NextAuth(authConfig);

export { auth, signIn, signOut };
