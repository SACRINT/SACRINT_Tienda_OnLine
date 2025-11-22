/**
 * Export Utilities
 * Utilidades para exportar datos (CSV, Excel, PDF)
 */

import { logger } from "../monitoring/logger";

/**
 * Convertir array de objetos a CSV
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  columns?: Array<{ key: keyof T; header: string }>,
): string {
  if (data.length === 0) return "";

  // Si no se especifican columnas, usar todas las keys del primer objeto
  const cols =
    columns ||
    (Object.keys(data[0]) as Array<keyof T>).map((key) => ({
      key,
      header: String(key),
    }));

  // Headers
  const headers = cols.map((col) => escapeCSV(col.header)).join(",");

  // Rows
  const rows = data.map((row) =>
    cols
      .map((col) => {
        const value = row[col.key];
        return escapeCSV(formatCSVValue(value));
      })
      .join(","),
  );

  return [headers, ...rows].join("\n");
}

/**
 * Escapar valor para CSV
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Formatear valor para CSV
 */
function formatCSVValue(value: any): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Generar archivo CSV descargable
 */
export function generateCSVDownload(filename: string, csvContent: string): Blob {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  logger.info(
    {
      type: "csv_export",
      filename,
      size: blob.size,
    },
    "CSV file generated",
  );

  return blob;
}

/**
 * Exportar órdenes a CSV
 */
export function exportOrdersToCSV(
  orders: Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    total: number;
    status: string;
    createdAt: Date;
  }>,
): string {
  return arrayToCSV(orders, [
    { key: "id", header: "Order ID" },
    { key: "customerName", header: "Customer Name" },
    { key: "customerEmail", header: "Customer Email" },
    { key: "total", header: "Total" },
    { key: "status", header: "Status" },
    { key: "createdAt", header: "Date" },
  ]);
}

/**
 * Exportar productos a CSV
 */
export function exportProductsToCSV(
  products: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    category: string;
  }>,
): string {
  return arrayToCSV(products, [
    { key: "id", header: "Product ID" },
    { key: "name", header: "Name" },
    { key: "sku", header: "SKU" },
    { key: "price", header: "Price" },
    { key: "stock", header: "Stock" },
    { key: "category", header: "Category" },
  ]);
}

/**
 * Exportar clientes a CSV
 */
export function exportCustomersToCSV(
  customers: Array<{
    id: string;
    name: string;
    email: string;
    totalOrders: number;
    totalSpent: number;
    joinedAt: Date;
  }>,
): string {
  return arrayToCSV(customers, [
    { key: "id", header: "Customer ID" },
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "totalOrders", header: "Total Orders" },
    { key: "totalSpent", header: "Total Spent" },
    { key: "joinedAt", header: "Joined Date" },
  ]);
}

/**
 * Generar reporte de ventas
 */
export function generateSalesReport(data: {
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{ name: string; sold: number; revenue: number }>;
}): string {
  const lines = [
    "SALES REPORT",
    `Period: ${data.startDate.toLocaleDateString()} - ${data.endDate.toLocaleDateString()}`,
    "",
    "SUMMARY",
    `Total Revenue: $${data.totalRevenue.toFixed(2)}`,
    `Total Orders: ${data.totalOrders}`,
    `Average Order Value: $${data.averageOrderValue.toFixed(2)}`,
    "",
    "TOP PRODUCTS",
    ...data.topProducts.map(
      (p, i) => `${i + 1}. ${p.name} - Sold: ${p.sold}, Revenue: $${p.revenue.toFixed(2)}`,
    ),
  ];

  return lines.join("\n");
}

/**
 * Crear trigger de descarga en el navegador
 */
export function triggerDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  logger.info(
    {
      type: "file_download_triggered",
      filename,
      size: blob.size,
    },
    "File download triggered",
  );
}

export default {
  arrayToCSV,
  generateCSVDownload,
  exportOrdersToCSV,
  exportProductsToCSV,
  exportCustomersToCSV,
  generateSalesReport,
  triggerDownload,
};
