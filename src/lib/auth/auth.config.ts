// NextAuth.js v5 Configuration
// Multi-tenant E-commerce Platform with Google OAuth and Credentials
// ✅ SECURITY [P1.7]: Strong password validation implemented

import { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db/client";
import bcrypt from "bcryptjs";
import { USER_ROLES, type UserRole } from "@/lib/types/user-role";
import { logger } from "@/lib/monitoring/logger";
import { loginSchema } from "@/lib/validations/auth";

export const authConfig = {
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      // ✅ SECURITY [P0.2]: Disabled dangerous auto-linking to prevent account takeover
      // Users must verify email ownership before linking OAuth accounts
      allowDangerousEmailAccountLinking: false,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      profile: async (profile) => {
        logger.debug({ email: profile.email }, "Google profile received");

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
          logger.info(
            {
              tenantId: tenant.id,
              email: profile.email,
            },
            "Created new tenant for Google user",
          );
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
        logger.debug({ email: credentials?.email }, "Credentials login attempt");

        const validation = loginSchema.safeParse(credentials);

        if (!validation.success) {
          logger.warn(
            {
              issues: validation.error.issues,
            },
            "Auth validation failed",
          );
          return null;
        }

        const { email, password } = validation.data;

        const user = await db.user.findFirst({
          where: { email },
        });

        if (!user) {
          logger.warn({ email }, "User not found during login");
          return null;
        }

        if (!user.password) {
          logger.warn({ email }, "No password set for user");
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          logger.warn({ email }, "Invalid password attempt");
          return null;
        }

        logger.info({ email, userId: user.id }, "Login successful");

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
      const { user, account } = params;

      // ✅ SECURITY [P1.1]: Block login if email not verified
      // Only enforce for credentials login (not OAuth)
      if (account?.provider === "credentials") {
        // Check if email is verified
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { emailVerified: true, email: true },
        });

        if (!dbUser?.emailVerified) {
          logger.warn({ email: dbUser?.email }, "Login blocked: email not verified");
          // Return false to block sign in
          // NextAuth will redirect to error page
          return false;
        }
      }

      // OAuth providers (Google) have email verified by default
      // Allow all OAuth sign ins
      return true;
    },
  },
  events: {
    async signIn({ user, isNewUser }: any) {
      logger.audit({ email: user.email, isNewUser, userId: user.id }, "User signed in");

      if (isNewUser) {
        // TODO: Send welcome email
        logger.info(
          {
            email: user.email,
          },
          "New user registered - welcome email to be sent",
        );
      }
    },
    async signOut({ session, token }: any) {
      logger.audit({ email: session?.user?.email || token?.email }, "User signed out");
    },
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days (reduced from 30 for security - P1.4)
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
