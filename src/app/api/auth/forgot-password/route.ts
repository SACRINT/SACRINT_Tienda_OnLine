/**
 * Forgot Password API Endpoint
 * POST /api/auth/forgot-password
 * Sends password reset email with token
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { z } from "zod";
import crypto from "crypto";
import { applyRateLimit } from "@/lib/security/rate-limiter";
import { logger } from "@/lib/monitoring/logger";

// Rate limit config for password reset (very strict)
const PASSWORD_RESET_LIMIT = {
  interval: 60 * 60 * 1000, // 1 hour
  limit: 3, // 3 attempts per hour
};

// Validation schema
const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Apply strict rate limiting
  const rateLimitResult = applyRateLimit(req, {
    config: PASSWORD_RESET_LIMIT,
  });

  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  try {
    const body = await req.json();
    const validation = ForgotPasswordSchema.safeParse(body);

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

    // Check if user exists
    const user = await db.user.findFirst({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      logger.info("Password reset requested for non-existent email", { email });
      return NextResponse.json({
        message: "If the email exists, a password reset link has been sent.",
      });
    }

    // Check if user has a password (not OAuth-only)
    if (!user.password) {
      logger.info("Password reset requested for OAuth-only user", { email });
      return NextResponse.json({
        message: "If the email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Token expires in 1 hour
    const expires = new Date(Date.now() + 60 * 60 * 1000);

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

    // Generate reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // TODO: Send email with reset link
    // For now, log the URL (in production, use email service)
    logger.info("Password reset token generated", {
      email,
      userId: user.id,
      resetUrl:
        process.env.NODE_ENV === "development" ? resetUrl : "[REDACTED]",
    });

    // In production, send email:
    // await sendPasswordResetEmail(email, resetUrl, user.name);

    return NextResponse.json({
      message: "If the email exists, a password reset link has been sent.",
    });
  } catch (error) {
    logger.error("Password reset request failed", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
