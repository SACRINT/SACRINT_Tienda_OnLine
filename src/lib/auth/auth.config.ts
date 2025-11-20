// NextAuth.js v5 Configuration
// Multi-tenant E-commerce Platform with Google OAuth and Credentials

import { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { USER_ROLES, type UserRole } from "@/lib/types/user-role";
import { logger } from "@/lib/monitoring/logger";

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const authConfig = {
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      profile: async (profile) => {
        logger.debug("Google profile received", { email: profile.email });

        // Check if user already exists
        let user = await db.user.findFirst({
          where: { email: profile.email },
          include: { tenant: true },
        });

        let tenantId: string | null = null;

        if (!user) {
          // New user - create tenant automatically
          const tenantSlug = profile.email
            .split("@")[0]
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-");

          const tenant = await db.tenant.create({
            data: {
              name: profile.name || "Mi Tienda",
              slug: `${tenantSlug}-${Date.now()}`, // Ensure uniqueness
            },
          });

          tenantId = tenant.id;
          logger.info("Created new tenant for Google user", { tenantId: tenant.id, email: profile.email });
        } else {
          tenantId = user.tenantId;
        }

        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: new Date(),
          tenantId,
          role: USER_ROLES.CUSTOMER,
        };
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        logger.debug("Credentials login attempt", { email: credentials?.email });

        const validation = LoginSchema.safeParse(credentials);

        if (!validation.success) {
          logger.warn("Auth validation failed", { issues: validation.error.issues });
          return null;
        }

        const { email, password } = validation.data;

        const user = await db.user.findFirst({
          where: { email },
        });

        if (!user) {
          logger.warn("User not found during login", { email });
          return null;
        }

        if (!user.password) {
          logger.warn("No password set for user", { email });
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          logger.warn("Invalid password attempt", { email });
          return null;
        }

        logger.info("Login successful", { email, userId: user.id });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          tenantId: user.tenantId,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
    verifyRequest: "/login",
  },
  callbacks: {
    // CRITICAL: Pass role and tenantId to token and session
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        // Initial sign in
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, tenantId: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.tenantId = dbUser.tenantId;
        }
      }

      // Handle session updates
      if (trigger === "update" && session) {
        token.role = session.role;
        token.tenantId = session.tenantId;
      }

      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.tenantId = token.tenantId as string | null;
      }
      return session;
    },
    async signIn(params: any) {
      // Allow all sign ins (can add additional checks here if needed)
      return true;
    },
  },
  events: {
    async signIn({ user, isNewUser }: any) {
      logger.audit("User signed in", { email: user.email, isNewUser, userId: user.id });

      if (isNewUser) {
        // TODO: Send welcome email
        logger.info("New user registered - welcome email to be sent", { email: user.email });
      }
    },
    async signOut({ session, token }: any) {
      logger.audit("User signed out", { email: session?.user?.email || token?.email });
    },
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 1 day
  },
  debug: process.env.NODE_ENV === "development",
};

// Type augmentation for NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      tenantId: string | null;
    };
  }

  interface User {
    role?: UserRole;
    tenantId?: string | null;
  }
}
