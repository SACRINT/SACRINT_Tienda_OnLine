/**
 * Resend Email Verification API
 * POST /api/auth/resend-verification
 * Resends verification email
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { z } from "zod";
import crypto from "crypto";
import { applyRateLimit } from "@/lib/security/rate-limiter";
import { logger } from "@/lib/monitoring/logger";

const RESEND_LIMIT = {
  interval: 60 * 60 * 1000, // 1 hour
  limit: 3, // 3 attempts per hour
};

const ResendVerificationSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = applyRateLimit(req, {
    config: RESEND_LIMIT,
  });

  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  try {
    const body = await req.json();
    const validation = ResendVerificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid email",
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

    // Always return success to prevent email enumeration
    if (!user) {
      logger.info("Verification resend requested for non-existent email", {
        email,
      });
      return NextResponse.json({
        message:
          "If the email exists and is not verified, a verification link has been sent.",
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      logger.info("Verification resend requested for already verified email", {
        email,
      });
      return NextResponse.json({
        message: "Email is already verified.",
      });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Token expires in 24 hours
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Delete any existing tokens for this email
    await db.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Create new token
    await db.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires,
      },
    });

    // Generate verification URL
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    logger.info("Email verification token generated", {
      email,
      userId: user.id,
      verifyUrl:
        process.env.NODE_ENV === "development" ? verifyUrl : "[REDACTED]",
    });

    // TODO: Send verification email
    // await sendVerificationEmail(email, verifyUrl, user.name);

    return NextResponse.json({
      message:
        "If the email exists and is not verified, a verification link has been sent.",
    });
  } catch (error) {
    logger.error("Resend verification failed", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
