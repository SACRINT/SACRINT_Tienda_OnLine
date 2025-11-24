/**
 * Email Verification Endpoint
 * GET /api/auth/verify-email/[token]
 * ✅ SECURITY [P1.1]: Verify user email address
 *
 * Verifies the token and marks the user's email as verified
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { verifyToken, deleteVerificationToken } from "@/lib/auth/verification-tokens";
import { logger } from "@/lib/monitoring/logger";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    // Verify the token and get the associated email
    const email = await verifyToken(token);

    if (!email) {
      logger.warn({ token }, "Invalid or expired verification token");

      // Redirect to error page with message
      return NextResponse.redirect(
        new URL(
          `/login?error=verification_failed&message=${encodeURIComponent("Verification link is invalid or expired. Please request a new one.")}`,
          req.url,
        ),
      );
    }

    // Find user by email
    const user = await db.user.findFirst({
      where: { email },
    });

    if (!user) {
      logger.warn({ email }, "User not found for verification");

      return NextResponse.redirect(
        new URL(
          `/login?error=user_not_found&message=${encodeURIComponent("User not found. Please sign up again.")}`,
          req.url,
        ),
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      logger.info({ email, userId: user.id }, "Email already verified");

      return NextResponse.redirect(
        new URL(
          `/login?success=already_verified&message=${encodeURIComponent("Email already verified. You can now log in.")}`,
          req.url,
        ),
      );
    }

    // Mark email as verified
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
      },
    });

    // Delete the verification token
    await deleteVerificationToken(token);

    logger.audit({ email, userId: user.id }, "Email verified successfully");

    // Redirect to login with success message
    return NextResponse.redirect(
      new URL(
        `/login?success=verified&message=${encodeURIComponent("Email verified successfully! You can now log in.")}`,
        req.url,
      ),
    );
  } catch (error) {
    logger.error({ error }, "Email verification error");

    return NextResponse.redirect(
      new URL(
        `/login?error=server_error&message=${encodeURIComponent("An error occurred during verification. Please try again.")}`,
        req.url,
      ),
    );
  }
}
