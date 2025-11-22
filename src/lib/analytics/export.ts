// @ts-nocheck
// Analytics Export Utilities
// CSV and data export functions for analytics reports

import type {
  OverviewMetrics,
  SalesMetrics,
  CustomerMetrics,
  Metric,
} from "./types";
import type { RFMScore, RFMSegmentSummary } from "./rfm";
import type { CohortData } from "./cohort";

/**
 * Convert data to CSV format
 */
export function convertToCSV(
  data: Record<string, any>[],
  headers?: string[],
): string {
  if (data.length === 0) return "";

  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0]);

  // Create header row
  const headerRow = csvHeaders.join(",");

  // Create data rows
  const dataRows = data.map((row) => {
    return csvHeaders
      .map((header) => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (typeof value === "string") {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? "";
      })
      .join(",");
  });

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export Overview Metrics to CSV
 */
export function exportOverviewMetricsCSV(
  metrics: OverviewMetrics,
  filename = "overview-metrics.csv",
): void {
  const data = [
    {
      Metric: "Revenue",
      Current: metrics.revenue.value,
      Previous: metrics.revenue.previousValue,
      Change: `${metrics.revenue.change}%`,
      Trend: metrics.revenue.trend,
    },
    {
      Metric: "Orders",
      Current: metrics.orders.value,
      Previous: metrics.orders.previousValue,
      Change: `${metrics.orders.change}%`,
      Trend: metrics.orders.trend,
    },
    {
      Metric: "Customers",
      Current: metrics.customers.value,
      Previous: metrics.customers.previousValue,
      Change: `${metrics.customers.change}%`,
      Trend: metrics.customers.trend,
    },
    {
      Metric: "Avg Order Value",
      Current: metrics.avgOrderValue.value,
      Previous: metrics.avgOrderValue.previousValue,
      Change: `${metrics.avgOrderValue.change}%`,
      Trend: metrics.avgOrderValue.trend,
    },
  ];

  const csv = convertToCSV(data);
  downloadCSV(csv, filename);
}

/**
 * Export Sales Metrics to CSV
 */
export function exportSalesMetricsCSV(
  metrics: SalesMetrics,
  filename = "sales-metrics.csv",
): void {
  // Combine all sales data
  const dailyData = metrics.revenueByDay.map((d) => ({
    Type: "Daily Revenue",
    Date: d.date,
    Revenue: d.revenue,
    Orders: d.orders,
    AvgOrderValue: d.avgOrderValue,
  }));

  const categoryData = metrics.revenueByCategory.map((c) => ({
    Type: "Category Revenue",
    Category: c.categoryName,
    Revenue: c.revenue,
    Orders: c.orders,
    Percentage: `${c.percentage.toFixed(2)}%`,
  }));

  const productData = metrics.topProducts.map((p) => ({
    Type: "Top Product",
    Product: p.productName,
    Quantity: p.quantitySold,
    Revenue: p.revenue,
    AvgPrice: p.avgPrice,
  }));

  const csv = convertToCSV([...dailyData, ...categoryData, ...productData]);
  downloadCSV(csv, filename);
}

/**
 * Export Customer Metrics to CSV
 */
export function exportCustomerMetricsCSV(
  metrics: CustomerMetrics,
  filename = "customer-metrics.csv",
): void {
  const summaryData = [
    { Metric: "Total Customers", Value: metrics.totalCustomers },
    { Metric: "New Customers", Value: metrics.newCustomers },
    { Metric: "Returning Customers", Value: metrics.returningCustomers },
    { Metric: "Avg Lifetime Value", Value: metrics.avgLifetimeValue },
    {
      Metric: "Avg Purchase Frequency",
      Value: metrics.avgPurchaseFrequency,
    },
  ];

  const topCustomersData = metrics.topCustomers.map((c) => ({
    Name: c.userName,
    Email: c.email,
    TotalOrders: c.totalOrders,
    TotalRevenue: c.totalRevenue,
    AvgOrderValue: c.avgOrderValue,
    LastOrder: c.lastOrderDate,
  }));

  const csv =
    "Summary Metrics\n" +
    convertToCSV(summaryData) +
    "\n\nTop Customers\n" +
    convertToCSV(topCustomersData);

  downloadCSV(csv, filename);
}

/**
 * Export RFM Scores to CSV
 */
export function exportRFMScoresCSV(
  scores: RFMScore[],
  filename = "rfm-scores.csv",
): void {
  const data = scores.map((score) => ({
    Customer: score.customerName,
    Email: score.customerEmail,
    Segment: score.segment,
    RecencyScore: score.recencyScore,
    FrequencyScore: score.frequencyScore,
    MonetaryScore: score.monetaryScore,
    TotalScore: score.totalScore,
    RecencyDays: score.recencyDays,
    Frequency: score.frequency,
    MonetaryValue: score.monetaryValue,
    LastOrderDate: score.lastOrderDate.toISOString().split("T")[0],
  }));

  const csv = convertToCSV(data);
  downloadCSV(csv, filename);
}

/**
 * Export RFM Segment Summary to CSV
 */
export function exportRFMSegmentSummaryCSV(
  segments: RFMSegmentSummary[],
  filename = "rfm-segments.csv",
): void {
  const data = segments.map((seg) => ({
    Segment: seg.segment,
    CustomerCount: seg.count,
    TotalRevenue: seg.totalRevenue,
    AvgRecency: seg.avgRecency.toFixed(1),
    AvgFrequency: seg.avgFrequency.toFixed(2),
    AvgMonetary: seg.avgMonetary.toFixed(2),
    Percentage: `${seg.percentage.toFixed(2)}%`,
  }));

  const csv = convertToCSV(data);
  downloadCSV(csv, filename);
}

/**
 * Export Cohort Retention to CSV
 */
export function exportCohortRetentionCSV(
  cohorts: CohortData[],
  filename = "cohort-retention.csv",
): void {
  if (cohorts.length === 0) return;

  // Find max retention periods
  const maxPeriods = Math.max(...cohorts.map((c) => c.retention.length));

  // Create header
  const headers = [
    "Cohort Month",
    "Cohort Size",
    ...Array.from({ length: maxPeriods }, (_, i) => `Month ${i} Retention`),
    ...Array.from({ length: maxPeriods }, (_, i) => `Month ${i} Revenue`),
  ];

  // Create data rows
  const data = cohorts.map((cohort) => {
    const row: Record<string, any> = {
      "Cohort Month": cohort.cohortDate,
      "Cohort Size": cohort.cohortSize,
    };

    // Add retention percentages
    for (let i = 0; i < maxPeriods; i++) {
      row[`Month ${i} Retention`] =
        cohort.retention[i] !== undefined
          ? `${cohort.retention[i].toFixed(1)}%`
          : "";
    }

    // Add revenue values
    for (let i = 0; i < maxPeriods; i++) {
      row[`Month ${i} Revenue`] =
        cohort.revenue[i] !== undefined ? cohort.revenue[i].toFixed(2) : "";
    }

    return row;
  });

  const csv = convertToCSV(data, headers);
  downloadCSV(csv, filename);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(baseName: string, extension: string): string {
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  return `${baseName}_${timestamp}.${extension}`;
}

/**
 * Format data for export (helper function)
 */
export function formatDataForExport(
  data: any[],
  formatters: Record<string, (value: any) => string> = {},
): Record<string, any>[] {
  return data.map((item) => {
    const formatted: Record<string, any> = {};
    for (const [key, value] of Object.entries(item)) {
      if (formatters[key]) {
        formatted[key] = formatters[key](value);
      } else {
        formatted[key] = value;
      }
    }
    return formatted;
  });
}
