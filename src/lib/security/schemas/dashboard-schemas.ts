// Zod Validation Schemas - Dashboard Analytics
// Input validation for dashboard API endpoints

import { z } from 'zod'

/**
 * Dashboard Metrics Schema
 * Validates request for general dashboard metrics
 */
export const DashboardMetricsSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID format'),
})

/**
 * Sales Data Schema
 * Validates request for sales data with date range
 */
export const SalesDataSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID format'),
  days: z
    .number()
    .int('Days must be an integer')
    .positive('Days must be positive')
    .max(365, 'Days cannot exceed 365')
    .default(30),
})

/**
 * Top Products Schema
 * Validates request for top selling products
 */
export const TopProductsSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID format'),
  limit: z
    .number()
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
})

/**
 * Recent Orders Schema
 * Validates request for recent orders
 */
export const RecentOrdersSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID format'),
  limit: z
    .number()
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
})

// Type exports for TypeScript inference
export type DashboardMetricsInput = z.infer<typeof DashboardMetricsSchema>
export type SalesDataInput = z.infer<typeof SalesDataSchema>
export type TopProductsInput = z.infer<typeof TopProductsSchema>
export type RecentOrdersInput = z.infer<typeof RecentOrdersSchema>
