/**
 * Email Verification API
 * GET /api/auth/verify-email?token=xxx&email=xxx
 * Verifies user email with token
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import crypto from "crypto";
import { logger } from "@/lib/monitoring/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json({ error: "Missing token or email" }, { status: 400 });
    }

    // Hash the provided token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find the verification token
    const verificationToken = await db.verificationToken.findFirst({
      where: {
        identifier: email,
        token: hashedToken,
      },
    });

    if (!verificationToken) {
      logger.warn({ email }, "Invalid email verification token");
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
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

      logger.warn({ email }, "Expired email verification token");
      return NextResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Find user and verify email
    const user = await db.user.findFirst({
      where: { email },
    });

    if (!user) {
      logger.warn({ email }, "User not found during email verification");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user email verification status
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    // Delete the verification token
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    logger.audit("Email verified successfully", { email, userId: user.id });

    return NextResponse.json({
      message: "Email verified successfully! You can now log in.",
      verified: true,
    });
  } catch (error) {
    logger.error({ error: error }, "Email verification failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
