// User Registration Endpoint
// POST /api/auth/signup
// Creates new user with email/password and automatically creates a tenant
// ✅ SECURITY [P1.1]: Sends email verification

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { USER_ROLES } from "@/lib/types/user-role";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { createVerificationToken, generateVerificationUrl } from "@/lib/auth/verification-tokens";
import { sendEmail } from "@/lib/email/email-service";
import { EmailTemplate } from "@/lib/db/enums";
import { logger } from "@/lib/monitoring/logger";

// Validation schema
const SignupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  storeName: z.string().min(3, "Store name must be at least 3 characters").max(100).optional(),
});

// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Apply rate limiting - 10 attempts per minute for anonymous users
  const rateLimitResult = await applyRateLimit(req, {
    limiter: RATE_LIMITS.ANONYMOUS,
  });

  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  try {
    const body = await req.json();

    // Validate input
    const validation = SignupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid data",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { email, password, name, storeName } = validation.data;

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique tenant slug
    const baseSlug = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
    const tenantSlug = `${baseSlug}-${Date.now()}`;

    // Create tenant and user in a transaction
    const result = await db.$transaction(async (tx: any) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: storeName || `${name}'s Store`,
          slug: tenantSlug,
        },
      });

      // Create user (emailVerified = null until verification)
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          tenantId: tenant.id,
          role: USER_ROLES.STORE_OWNER, // First user becomes STORE_OWNER
          emailVerified: null, // ✅ SECURITY [P1.1]: Require email verification
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tenantId: true,
          createdAt: true,
        },
      });

      return { user, tenant };
    });

    logger.info(
      {
        userId: result.user.id,
        tenantId: result.tenant.id,
        email: result.user.email,
      },
      "User and tenant created, sending verification email",
    );

    // ✅ SECURITY [P1.1]: Create verification token and send email
    try {
      const { token } = await createVerificationToken(email);
      const verificationUrl = generateVerificationUrl(token);

      await sendEmail({
        to: email,
        subject: "Verify Your Email Address",
        template: EmailTemplate.ACCOUNT_VERIFICATION,
        data: {
          customerName: name,
          verificationUrl,
          expiresInHours: 24,
        },
        userId: result.user.id,
        tenantId: result.tenant.id,
      });

      logger.info({ email, userId: result.user.id }, "Verification email sent successfully");
    } catch (emailError) {
      // Log error but don't fail registration
      logger.error({ error: emailError, email }, "Failed to send verification email");
      // User can request resend later
    }

    return NextResponse.json(
      {
        message: "User created successfully. Please check your email to verify your account.",
        user: result.user,
        tenant: {
          id: result.tenant.id,
          name: result.tenant.slug,
        },
        requiresEmailVerification: true,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[SIGNUP] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
