// Order Confirmation Email Template
// Sent when payment is successful and order is confirmed

import * as React from "react";

interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  orderTotal: number;
  orderDate: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  trackingUrl?: string;
}

export const OrderConfirmationEmail: React.FC<OrderConfirmationEmailProps> = ({
  orderNumber,
  customerName,
  orderTotal,
  orderDate,
  items,
  shippingAddress,
  trackingUrl,
}) => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Order Confirmation - {orderNumber}</title>
      </head>
      <body style={bodyStyle}>
        <div style={containerStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <h1 style={headingStyle}>✅ Order Confirmed!</h1>
          </div>

          {/* Content */}
          <div style={contentStyle}>
            <p style={paragraphStyle}>Hi {customerName},</p>

            <p style={paragraphStyle}>
              Thank you for your order! We&apos;re processing it now and will
              ship it soon.
            </p>

            {/* Order Details Box */}
            <div style={orderBoxStyle}>
              <h2 style={subHeadingStyle}>Order Details</h2>
              <table style={tableStyle}>
                <tbody>
                  <tr>
                    <td style={labelStyle}>Order Number:</td>
                    <td style={valueStyle}>
                      <strong>{orderNumber}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style={labelStyle}>Order Date:</td>
                    <td style={valueStyle}>{orderDate}</td>
                  </tr>
                  <tr>
                    <td style={labelStyle}>Total:</td>
                    <td style={valueStyle}>
                      <strong>${(orderTotal / 100).toFixed(2)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Items */}
            <h2 style={subHeadingStyle}>Items Ordered</h2>
            <table style={itemsTableStyle}>
              <thead>
                <tr style={itemsHeaderRowStyle}>
                  <th style={itemsHeaderCellStyle}>Product</th>
                  <th style={itemsHeaderCellStyle}>Quantity</th>
                  <th style={itemsHeaderCellStyle}>Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} style={itemsRowStyle}>
                    <td style={itemsCellStyle}>{item.name}</td>
                    <td style={itemsCellStyle}>{item.quantity}</td>
                    <td style={itemsCellStyle}>
                      ${(item.price / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Shipping Address */}
            <h2 style={subHeadingStyle}>Shipping Address</h2>
            <div style={addressBoxStyle}>
              <p style={addressLineStyle}>{shippingAddress.street}</p>
              <p style={addressLineStyle}>
                {shippingAddress.city}, {shippingAddress.state}{" "}
                {shippingAddress.postalCode}
              </p>
              <p style={addressLineStyle}>{shippingAddress.country}</p>
            </div>

            {/* Tracking URL */}
            {trackingUrl && (
              <div style={buttonContainerStyle}>
                <a href={trackingUrl} style={buttonStyle}>
                  Track Your Order
                </a>
              </div>
            )}

            <p style={paragraphStyle}>
              We&apos;ll send you a shipping confirmation email with tracking
              information once your order ships.
            </p>

            <p style={paragraphStyle}>
              If you have any questions, please don&apos;t hesitate to contact
              our support team.
            </p>

            <p style={paragraphStyle}>Thank you for shopping with us!</p>
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

const subHeadingStyle: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "600",
  margin: "24px 0 12px 0",
  color: "#0A1128",
};

const orderBoxStyle: React.CSSProperties = {
  backgroundColor: "#f8f9fa",
  borderRadius: "6px",
  padding: "20px",
  marginBottom: "20px",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  paddingRight: "20px",
  paddingBottom: "8px",
  fontSize: "14px",
  color: "#666666",
};

const valueStyle: React.CSSProperties = {
  paddingBottom: "8px",
  fontSize: "14px",
  color: "#333333",
};

const itemsTableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse" as const,
  marginBottom: "20px",
};

const itemsHeaderRowStyle: React.CSSProperties = {
  backgroundColor: "#f8f9fa",
};

const itemsHeaderCellStyle: React.CSSProperties = {
  padding: "12px",
  textAlign: "left" as const,
  fontSize: "14px",
  fontWeight: "600",
  color: "#0A1128",
  borderBottom: "2px solid #dee2e6",
};

const itemsRowStyle: React.CSSProperties = {
  borderBottom: "1px solid #dee2e6",
};

const itemsCellStyle: React.CSSProperties = {
  padding: "12px",
  fontSize: "14px",
  color: "#333333",
};

const addressBoxStyle: React.CSSProperties = {
  backgroundColor: "#f8f9fa",
  borderRadius: "6px",
  padding: "16px",
  marginBottom: "20px",
};

const addressLineStyle: React.CSSProperties = {
  margin: "4px 0",
  fontSize: "14px",
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

const footerStyle: React.CSSProperties = {
  backgroundColor: "#f8f9fa",
  padding: "20px",
  textAlign: "center" as const,
};

const footerTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "12px",
  color: "#666666",
};

export default OrderConfirmationEmail;
