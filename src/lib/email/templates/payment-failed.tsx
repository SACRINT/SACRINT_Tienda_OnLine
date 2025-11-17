// Payment Failed Email Template
// Sent when payment fails and order is cancelled

import * as React from 'react'

interface PaymentFailedEmailProps {
  orderNumber: string
  customerName: string
  orderTotal: number
  failureReason?: string
  retryUrl: string
}

export const PaymentFailedEmail: React.FC<PaymentFailedEmailProps> = ({
  orderNumber,
  customerName,
  orderTotal,
  failureReason,
  retryUrl,
}) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Payment Failed - {orderNumber}</title>
      </head>
      <body style={bodyStyle}>
        <div style={containerStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <h1 style={headingStyle}>⚠️ Payment Failed</h1>
          </div>

          {/* Content */}
          <div style={contentStyle}>
            <p style={paragraphStyle}>Hi {customerName},</p>

            <p style={paragraphStyle}>
              We&apos;re sorry, but we were unable to process your payment for order <strong>{orderNumber}</strong>.
            </p>

            {/* Order Details Box */}
            <div style={alertBoxStyle}>
              <h2 style={subHeadingStyle}>Order Details</h2>
              <table style={tableStyle}>
                <tbody>
                  <tr>
                    <td style={labelStyle}>Order Number:</td>
                    <td style={valueStyle}><strong>{orderNumber}</strong></td>
                  </tr>
                  <tr>
                    <td style={labelStyle}>Amount:</td>
                    <td style={valueStyle}><strong>${(orderTotal / 100).toFixed(2)}</strong></td>
                  </tr>
                  {failureReason && (
                    <tr>
                      <td style={labelStyle}>Reason:</td>
                      <td style={valueStyle}>{failureReason}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p style={paragraphStyle}>
              Your order has been cancelled and any reserved items have been released back to inventory.
            </p>

            <h2 style={subHeadingStyle}>What Happened?</h2>
            <p style={paragraphStyle}>
              Common reasons for payment failure include:
            </p>
            <ul style={listStyle}>
              <li style={listItemStyle}>Insufficient funds</li>
              <li style={listItemStyle}>Incorrect card details</li>
              <li style={listItemStyle}>Card expired or blocked</li>
              <li style={listItemStyle}>Security verification failed</li>
            </ul>

            <h2 style={subHeadingStyle}>What Can You Do?</h2>
            <p style={paragraphStyle}>
              You can try placing your order again with a different payment method:
            </p>

            {/* Retry Button */}
            <div style={buttonContainerStyle}>
              <a href={retryUrl} style={buttonStyle}>
                Try Again
              </a>
            </div>

            <p style={paragraphStyle}>
              If you continue to experience issues, please contact your bank or try a different payment
              method.
            </p>

            <p style={paragraphStyle}>
              If you need assistance, please don&apos;t hesitate to contact our support team.
            </p>
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            <p style={footerTextStyle}>
              &copy; {new Date().getFullYear()} Your Store. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}

// Styles
const bodyStyle: React.CSSProperties = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  backgroundColor: '#f4f4f4',
  margin: 0,
  padding: '20px',
}

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
}

const headerStyle: React.CSSProperties = {
  backgroundColor: '#dc3545',
  color: '#ffffff',
  padding: '30px 20px',
  textAlign: 'center',
}

const headingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '28px',
  fontWeight: '600',
}

const contentStyle: React.CSSProperties = {
  padding: '30px 20px',
}

const paragraphStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#333333',
}

const subHeadingStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '600',
  margin: '24px 0 12px 0',
  color: '#0A1128',
}

const alertBoxStyle: React.CSSProperties = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffc107',
  borderRadius: '6px',
  padding: '20px',
  marginBottom: '20px',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
}

const labelStyle: React.CSSProperties = {
  paddingRight: '20px',
  paddingBottom: '8px',
  fontSize: '14px',
  color: '#666666',
}

const valueStyle: React.CSSProperties = {
  paddingBottom: '8px',
  fontSize: '14px',
  color: '#333333',
}

const listStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  paddingLeft: '24px',
}

const listItemStyle: React.CSSProperties = {
  margin: '8px 0',
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#333333',
}

const buttonContainerStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const buttonStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#0A1128',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: '600',
}

const footerStyle: React.CSSProperties = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  textAlign: 'center' as const,
}

const footerTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#666666',
}

export default PaymentFailedEmail
