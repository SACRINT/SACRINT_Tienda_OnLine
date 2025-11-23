// Account Verification Email Template
// Sent when user signs up to verify their email address
// ✅ SECURITY [P1.1]: Email verification required for account security

import * as React from "react";

interface AccountVerificationEmailProps {
  customerName: string;
  verificationUrl: string;
  expiresInHours?: number;
}

export const AccountVerificationEmail: React.FC<AccountVerificationEmailProps> = ({
  customerName,
  verificationUrl,
  expiresInHours = 24,
}) => {
  return (
    <html>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Verify Your Email Address</title>
      </head>
      <body style={bodyStyle}>
        <div style={containerStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <h1 style={headingStyle}>📧 Verify Your Email</h1>
          </div>

          {/* Content */}
          <div style={contentStyle}>
            <p style={paragraphStyle}>Hi {customerName},</p>

            <p style={paragraphStyle}>
              Thank you for signing up! To complete your registration and start using your account,
              please verify your email address.
            </p>

            <p style={paragraphStyle}>Click the button below to verify your email address:</p>

            {/* Verification Button */}
            <div style={buttonContainerStyle}>
              <a href={verificationUrl} style={buttonStyle}>
                Verify Email Address
              </a>
            </div>

            {/* Alternative Link */}
            <div style={alternativeLinkBoxStyle}>
              <p style={smallTextStyle}>Or copy and paste this link into your browser:</p>
              <p style={linkTextStyle}>{verificationUrl}</p>
            </div>

            {/* Expiration Notice */}
            <div style={noticeBoxStyle}>
              <p style={noticeTextStyle}>
                ⏰ This verification link will expire in {expiresInHours} hours for security
                reasons.
              </p>
            </div>

            <p style={paragraphStyle}>
              If you didn&apos;t create an account, you can safely ignore this email.
            </p>

            <p style={paragraphStyle}>Need help? Contact our support team at any time.</p>
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            <p style={footerTextStyle}>
              &copy; {new Date().getFullYear()} SACRINT Tienda Online. All rights reserved.
            </p>
            <p style={footerTextStyle}>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};

// Styles
const bodyStyle: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  backgroundColor: "#f4f4f4",
  margin: 0,
  padding: "20px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
};

const headerStyle: React.CSSProperties = {
  backgroundColor: "#0A1128",
  color: "#ffffff",
  padding: "30px 20px",
  textAlign: "center",
};

const headingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "28px",
  fontWeight: "600",
};

const contentStyle: React.CSSProperties = {
  padding: "30px 20px",
};

const paragraphStyle: React.CSSProperties = {
  margin: "0 0 16px 0",
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#333333",
};

const buttonContainerStyle: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#0A1128",
  color: "#ffffff",
  padding: "14px 28px",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "16px",
  fontWeight: "600",
};

const alternativeLinkBoxStyle: React.CSSProperties = {
  backgroundColor: "#f8f9fa",
  borderRadius: "6px",
  padding: "16px",
  marginBottom: "20px",
  textAlign: "center" as const,
};

const smallTextStyle: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "12px",
  color: "#666666",
};

const linkTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "12px",
  color: "#0A1128",
  wordBreak: "break-all" as const,
};

const noticeBoxStyle: React.CSSProperties = {
  backgroundColor: "#fff3cd",
  border: "1px solid #ffc107",
  borderRadius: "6px",
  padding: "12px 16px",
  marginBottom: "20px",
};

const noticeTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  color: "#856404",
};

const footerStyle: React.CSSProperties = {
  backgroundColor: "#f8f9fa",
  padding: "20px",
  textAlign: "center" as const,
};

const footerTextStyle: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "12px",
  color: "#666666",
};

export default AccountVerificationEmail;
