// NextAuth.js v5 API Route Handler
// Handles all authentication requests: signin, signout, callback, etc.

import { handlers } from "@/lib/auth/auth";

export const { GET, POST } = handlers;
