// Resend Email Client
// Configuration and initialization for Resend email service

import { Resend } from 'resend'

// Initialize Resend with API key from environment
if (!process.env.RESEND_API_KEY) {
  console.warn('[EMAIL] RESEND_API_KEY is not defined. Email functionality will be disabled.')
}

export const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key')

// Default sender email (must be verified in Resend dashboard)
export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@yourdomain.com'

// Email configuration
export const EMAIL_CONFIG = {
  fromEmail: FROM_EMAIL,
  replyTo: process.env.REPLY_TO_EMAIL || FROM_EMAIL,
  supportEmail: process.env.SUPPORT_EMAIL || 'support@yourdomain.com',
}

/**
 * Checks if email functionality is enabled
 * @returns true if Resend API key is configured
 */
export function isEmailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY
}
