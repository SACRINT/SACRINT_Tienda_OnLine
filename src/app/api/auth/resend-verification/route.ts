/**
 * Resend Email Verification Endpoint
 * POST /api/auth/resend-verification
 * ✅ SECURITY [P1.1]: Resend verification email
 *
 * Allows users to request a new verification email
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { z } from "zod";
import {
  createVerificationToken,
  generateVerificationUrl,
  hasPendingVerificationToken,
} from "@/lib/auth/verification-tokens";
import { sendEmail } from "@/lib/email/email-service";
import { EmailTemplate } from "@/lib/db/enums";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security/rate-limiter";
import { logger } from "@/lib/monitoring/logger";

// Validation schema
const ResendVerificationSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Apply rate limiting - prevent spam
  const rateLimitResult = await applyRateLimit(req, {
    limiter: RATE_LIMITS.ANONYMOUS,
  });

  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  try {
    const body = await req.json();

    // Validate input
    const validation = ResendVerificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid data",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { email } = validation.data;

    // Find user
    const user = await db.user.findFirst({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not (security)
      logger.warn({ email }, "Resend verification requested for non-existent user");

      return NextResponse.json(
        {
          message:
            "If the email exists and is not verified, a new verification email has been sent.",
        },
        { status: 200 },
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      logger.info({ email, userId: user.id }, "Resend verification for already verified user");

      return NextResponse.json(
        {
          message: "This email is already verified. You can log in now.",
          alreadyVerified: true,
        },
        { status: 200 },
      );
    }

    // Check if there's a pending token (rate limiting)
    const hasPending = await hasPendingVerificationToken(email);

    if (hasPending) {
      logger.warn({ email, userId: user.id }, "Resend verification blocked: pending token exists");

      return NextResponse.json(
        {
          message:
            "A verification email was recently sent. Please check your inbox and spam folder. You can request a new one in a few minutes.",
        },
        { status: 429 },
      );
    }

    // Create new verification token
    const { token } = await createVerificationToken(email);
    const verificationUrl = generateVerificationUrl(token);

    // Send verification email
    await sendEmail({
      to: email,
      subject: "Verify Your Email Address",
      template: EmailTemplate.ACCOUNT_VERIFICATION,
      data: {
        customerName: user.name || "User",
        verificationUrl,
        expiresInHours: 24,
      },
      userId: user.id,
      tenantId: user.tenantId ?? undefined,
    });

    logger.info({ email, userId: user.id }, "Verification email resent successfully");

    return NextResponse.json(
      {
        message: "A new verification email has been sent. Please check your inbox and spam folder.",
      },
      { status: 200 },
    );
  } catch (error) {
    logger.error({ error }, "Resend verification error");

    return NextResponse.json(
      { error: "Failed to resend verification email. Please try again later." },
      { status: 500 },
    );
  }
}
