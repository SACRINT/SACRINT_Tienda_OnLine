// Types para Analytics & Reports
// Semana 9-10: Sistema completo de analytics

import { z } from "zod";

// ============================================
// ENUMS Y CONSTANTES
// ============================================

export const DATE_PERIODS = [
  "today",
  "yesterday",
  "last7days",
  "last30days",
  "last90days",
  "custom",
] as const;
export type DatePeriod = (typeof DATE_PERIODS)[number];

export const REPORT_TYPES = [
  "sales",
  "customers",
  "products",
  "coupons",
  "tax-shipping",
] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

// ============================================
// METRICS TYPES
// ============================================

export interface Metric {
  value: number;
  previousValue: number;
  change: number; // Porcentaje de cambio
  trend: "up" | "down" | "neutral";
}

export interface OverviewMetrics {
  revenue: Metric;
  orders: Metric;
  customers: Metric;
  avgOrderValue: Metric;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueByDay: DailyRevenue[];
  revenueByCategory: CategoryRevenue[];
  topProducts: ProductSales[];
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  avgLifetimeValue: number;
  avgPurchaseFrequency: number;
  customersBySegment: CustomerSegment[];
  topCustomers: TopCustomer[];
}

export interface PerformanceMetrics {
  conversionRate: number;
  cartAbandonmentRate: number;
  avgSessionDuration: number;
  pageViews: number;
  bounceRate: number;
}

// ============================================
// DATA TYPES
// ============================================

export interface DailyRevenue {
  date: string; // ISO date string
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

export interface CategoryRevenue {
  categoryId: string;
  categoryName: string;
  revenue: number;
  orders: number;
  percentage: number; // % del total
}

export interface ProductSales {
  productId: string;
  productName: string;
  productImage?: string;
  quantitySold: number;
  revenue: number;
  avgPrice: number;
}

export interface CustomerSegment {
  segment: "new" | "returning" | "vip" | "at-risk";
  count: number;
  revenue: number;
  percentage: number;
}

export interface TopCustomer {
  userId: string;
  userName: string;
  email: string;
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  lastOrderDate: string;
}

export interface CouponUsage {
  couponId: string;
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  timesUsed: number;
  totalDiscount: number;
  revenueImpact: number;
  roi: number; // Return on investment
}

export interface TaxReport {
  state: string;
  totalTax: number;
  orders: number;
  taxRate: number;
}

export interface ShippingReport {
  method: string;
  timesUsed: number;
  totalCost: number;
  avgCost: number;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export const AnalyticsRequestSchema = z.object({
  tenantId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  period: z.enum(DATE_PERIODS).optional(),
  compareWithPrevious: z.boolean().optional().default(true),
});

export type AnalyticsRequest = z.infer<typeof AnalyticsRequestSchema>;

export interface AnalyticsResponse<T> {
  data: T;
  period: {
    startDate: string;
    endDate: string;
  };
  generatedAt: string;
}

// ============================================
// CHART DATA TYPES
// ============================================

export interface LineChartData {
  date: string;
  value: number;
  label?: string;
}

export interface BarChartData {
  name: string;
  value: number;
  fill?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface AreaChartData {
  date: string;
  current: number;
  previous?: number;
}

// ============================================
// EXPORT TYPES
// ============================================

export type ExportFormat = "csv" | "pdf" | "excel";

export interface ExportOptions {
  format: ExportFormat;
  includeCharts: boolean;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

// ============================================
// FILTER TYPES
// ============================================

export interface AnalyticsFilters {
  period: DatePeriod;
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  productId?: string;
  customerId?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function calculateMetric(current: number, previous: number): Metric {
  const change = previous === 0 ? 100 : ((current - previous) / previous) * 100;
  return {
    value: current,
    previousValue: previous,
    change: Math.round(change * 100) / 100, // 2 decimales
    trend: change > 0 ? "up" : change < 0 ? "down" : "neutral",
  };
}

export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
