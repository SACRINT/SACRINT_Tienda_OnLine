// NextAuth.js v5 API Route Handler
// Handles all authentication requests: signin, signout, callback, etc.

import { handlers } from "@/lib/auth/auth";

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

export const { GET, POST } = handlers;
