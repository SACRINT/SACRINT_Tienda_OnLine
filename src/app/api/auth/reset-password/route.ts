/**
 * Reset Password API Endpoint
 * POST /api/auth/reset-password
 * Resets password using token from email
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { applyRateLimit } from "@/lib/security/rate-limiter";
import { logger } from "@/lib/monitoring/logger";

// Rate limit config
const RESET_PASSWORD_LIMIT = {
  interval: 60 * 60 * 1000, // 1 hour
  limit: 5, // 5 attempts per hour
};

// Validation schema
const ResetPasswordSchema = z
  .object({
    email: z.string().email("Invalid email format"),
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = applyRateLimit(req, {
    config: RESET_PASSWORD_LIMIT,
  });

  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  try {
    const body = await req.json();
    const validation = ResetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid data",
          issues: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const { email, token, password } = validation.data;

    // Hash the provided token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find the token in database
    const verificationToken = await db.verificationToken.findFirst({
      where: {
        identifier: email,
        token: hashedToken,
      },
    });

    if (!verificationToken) {
      logger.warn("Invalid password reset token", { email });
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      });

      logger.warn("Expired password reset token used", { email });
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Find user
    const user = await db.user.findFirst({
      where: { email },
    });

    if (!user) {
      logger.warn("User not found during password reset", { email });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    // Delete all other tokens for this user (invalidate old reset links)
    await db.verificationToken.deleteMany({
      where: { identifier: email },
    });

    logger.audit("Password reset successful", { email, userId: user.id });

    // TODO: Send confirmation email
    // await sendPasswordChangedEmail(email, user.name);

    return NextResponse.json({
      message:
        "Password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    logger.error("Password reset failed", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
