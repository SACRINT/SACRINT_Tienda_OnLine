/**
 * PDF Export Utilities
 * Generate PDF files from data
 * Note: For production, install jspdf and jspdf-autotable:
 * npm install jspdf jspdf-autotable @types/jspdf
 */

export interface PDFExportOptions {
  title?: string;
  orientation?: "portrait" | "landscape";
  format?: "a4" | "letter";
}

/**
 * Generate PDF invoice (simplified version)
 * In production, use jsPDF library
 */
export async function generateInvoicePDF(
  order: {
    orderNumber: string;
    createdAt: Date;
    total: number;
    subtotal: number;
    tax: number;
    shipping: number;
    user: { name?: string | null; email: string };
    shippingAddress?: {
      line1: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    items: Array<{
      name: string;
      quantity: number;
      priceAtPurchase: number;
    }>;
  }
): Promise<string> {
  // This is a placeholder. In production, use jsPDF:
  /*
  const { jsPDF } = await import('jspdf');
  require('jspdf-autotable');

  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.text('INVOICE', 14, 20);

  // Add order info
  doc.setFontSize(10);
  doc.text(`Order #${order.orderNumber}`, 14, 30);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 35);

  // Add customer info
  doc.text('Bill To:', 14, 45);
  doc.text(order.user.name || order.user.email, 14, 50);

  if (order.shippingAddress) {
    doc.text('Ship To:', 14, 60);
    doc.text(order.shippingAddress.line1, 14, 65);
    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`, 14, 70);
  }

  // Add items table
  const tableData = order.items.map(item => [
    item.name,
    item.quantity,
    `$${Number(item.priceAtPurchase).toFixed(2)}`,
    `$${(item.quantity * Number(item.priceAtPurchase)).toFixed(2)}`
  ]);

  doc.autoTable({
    startY: 80,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: tableData,
  });

  // Add totals
  const finalY = doc.lastAutoTable.finalY || 100;
  doc.text(`Subtotal: $${Number(order.subtotal).toFixed(2)}`, 150, finalY + 10);
  doc.text(`Tax: $${Number(order.tax).toFixed(2)}`, 150, finalY + 15);
  doc.text(`Shipping: $${Number(order.shipping).toFixed(2)}`, 150, finalY + 20);
  doc.setFontSize(12);
  doc.text(`TOTAL: $${Number(order.total).toFixed(2)}`, 150, finalY + 30);

  return doc.output('dataurlstring');
  */

  // Placeholder HTML-to-PDF approach
  return generateHTMLInvoice(order);
}

/**
 * Generate HTML invoice (for server-side PDF generation)
 */
function generateHTMLInvoice(order: {
  orderNumber: string;
  createdAt: Date;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  user: { name?: string | null; email: string };
  shippingAddress?: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    priceAtPurchase: number;
  }>;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${order.orderNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { color: #0A1128; }
    .info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .info-section h3 { margin-top: 0; color: #0A1128; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #0A1128; color: white; }
    .totals { text-align: right; margin-top: 20px; }
    .totals div { margin: 5px 0; }
    .totals .total { font-size: 1.2em; font-weight: bold; color: #0A1128; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INVOICE</h1>
    <p>Order #${order.orderNumber}</p>
    <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
  </div>

  <div class="info">
    <div class="info-section">
      <h3>Bill To:</h3>
      <p>${order.user.name || order.user.email}</p>
    </div>

    ${order.shippingAddress ? `
    <div class="info-section">
      <h3>Ship To:</h3>
      <p>${order.shippingAddress.line1}</p>
      <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
      <p>${order.shippingAddress.country}</p>
    </div>
    ` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>Quantity</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>$${Number(item.priceAtPurchase).toFixed(2)}</td>
          <td>$${(item.quantity * Number(item.priceAtPurchase)).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div>Subtotal: $${Number(order.subtotal).toFixed(2)}</div>
    <div>Tax: $${Number(order.tax).toFixed(2)}</div>
    <div>Shipping: $${Number(order.shipping).toFixed(2)}</div>
    <div class="total">TOTAL: $${Number(order.total).toFixed(2)}</div>
  </div>
</body>
</html>
  `;
}

/**
 * Download PDF (client-side)
 */
export function downloadPDF(pdfData: string, filename: string): void {
  const link = document.createElement("a");
  link.href = pdfData;
  link.download = filename;
  link.click();
}

/**
 * Create PDF Response for API
 * For server-side, use puppeteer or similar to convert HTML to PDF
 */
export function createPDFResponse(htmlContent: string, filename: string): Response {
  // This would require server-side HTML-to-PDF conversion
  // For now, return HTML that can be printed
  return new Response(htmlContent, {
    headers: {
      "Content-Type": "text/html;charset=utf-8;",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
