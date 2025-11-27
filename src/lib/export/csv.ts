/**
 * CSV Export Utilities
 * Generate CSV files from data
 */

export interface CSVExportOptions {
  filename?: string;
  headers?: string[];
  delimiter?: string;
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  options: CSVExportOptions = {},
): string {
  if (!data || data.length === 0) {
    return "";
  }

  const delimiter = options.delimiter || ",";
  const headers = options.headers || Object.keys(data[0]);

  // Escape CSV value
  const escapeValue = (value: any): string => {
    if (value === null || value === undefined) {
      return "";
    }

    const stringValue = String(value);

    // If value contains delimiter, quote, or newline, wrap in quotes and escape quotes
    if (
      stringValue.includes(delimiter) ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  // Create CSV header row
  const headerRow = headers.map(escapeValue).join(delimiter);

  // Create CSV data rows
  const dataRows = data.map((row) => {
    return headers.map((header) => escapeValue(row[header])).join(delimiter);
  });

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Download CSV file in browser
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Create CSV Response for API
 */
export function createCSVResponse(csvContent: string, filename: string): Response {
  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8;",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Export orders to CSV
 */
export function exportOrdersToCSV(
  orders: Array<{
    orderNumber: string;
    createdAt: Date;
    total: number;
    status: string;
    paymentStatus: string;
    user?: { name?: string | null; email: string };
  }>,
): string {
  const data = orders.map((order) => ({
    "Order Number": order.orderNumber,
    Date: new Date(order.createdAt).toLocaleDateString(),
    Customer: order.user?.name || order.user?.email || "N/A",
    Total: `$${Number(order.total).toFixed(2)}`,
    Status: order.status,
    "Payment Status": order.paymentStatus,
  }));

  return arrayToCSV(data);
}

/**
 * Export products to CSV
 */
export function exportProductsToCSV(
  products: Array<{
    name: string;
    sku: string;
    basePrice: number | string;
    stock: number;
    published: boolean;
    category?: { name: string };
  }>,
): string {
  const data = products.map((product) => ({
    Name: product.name,
    SKU: product.sku,
    Price: `$${Number(product.basePrice).toFixed(2)}`,
    Stock: product.stock,
    Category: product.category?.name || "N/A",
    Published: product.published ? "Yes" : "No",
  }));

  return arrayToCSV(data);
}

/**
 * Export customers to CSV
 */
export function exportCustomersToCSV(
  customers: Array<{
    name?: string | null;
    email: string;
    createdAt: Date;
    role: string;
  }>,
): string {
  const data = customers.map((customer) => ({
    Name: customer.name || "N/A",
    Email: customer.email,
    Role: customer.role,
    "Joined Date": new Date(customer.createdAt).toLocaleDateString(),
  }));

  return arrayToCSV(data);
}
