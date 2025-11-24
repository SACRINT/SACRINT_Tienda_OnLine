/**
 * Email Verification Token Management
 * ✅ SECURITY [P1.1]: Secure token generation and validation
 *
 * Uses NextAuth's VerificationToken model for token storage
 */

import { db } from "@/lib/db/client";
import crypto from "crypto";

const TOKEN_EXPIRATION_HOURS = 24; // 24 hours
const TOKEN_LENGTH = 32; // 32 bytes = 64 hex characters

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}

/**
 * Create a verification token for an email address
 */
export async function createVerificationToken(
  email: string,
): Promise<{ token: string; expires: Date }> {
  // Generate secure token
  const token = generateSecureToken();

  // Calculate expiration (24 hours from now)
  const expires = new Date();
  expires.setHours(expires.getHours() + TOKEN_EXPIRATION_HOURS);

  // Delete any existing tokens for this email
  await db.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // Create new token
  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return { token, expires };
}

/**
 * Verify a token and return the associated email
 * Returns null if token is invalid or expired
 */
export async function verifyToken(token: string): Promise<string | null> {
  // Find token in database
  const verificationToken = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return null;
  }

  // Check if token is expired
  if (verificationToken.expires < new Date()) {
    // Delete expired token
    await db.verificationToken.delete({
      where: { token },
    });
    return null;
  }

  return verificationToken.identifier;
}

/**
 * Delete a verification token (after successful verification)
 */
export async function deleteVerificationToken(token: string): Promise<void> {
  await db.verificationToken.delete({
    where: { token },
  });
}

/**
 * Delete all verification tokens for an email address
 */
export async function deleteAllVerificationTokens(email: string): Promise<void> {
  await db.verificationToken.deleteMany({
    where: { identifier: email },
  });
}

/**
 * Check if a user has a pending verification token
 */
export async function hasPendingVerificationToken(email: string): Promise<boolean> {
  const count = await db.verificationToken.count({
    where: {
      identifier: email,
      expires: {
        gt: new Date(),
      },
    },
  });

  return count > 0;
}

/**
 * Generate verification URL for email
 */
export function generateVerificationUrl(token: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${baseUrl}/api/auth/verify-email/${token}`;
}
