// Performance Optimization - Lazy Loaded Analytics Components
// Dynamic imports para reducir bundle inicial

import dynamic from "next/dynamic";
import { ComponentType } from "react";

// Lazy load analytics charts con loading state
export const RFMSegmentation = dynamic(
  () => import("@/components/analytics/RFMSegmentation").then((mod) => mod.RFMSegmentation),
  {
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    ),
    ssr: false,
  },
);

export const CohortRetentionChart = dynamic(
  () =>
    import("@/components/analytics/CohortRetentionChart").then((mod) => mod.CohortRetentionChart),
  {
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    ),
    ssr: false,
  },
);

export const RevenueForecastChart = dynamic(
  () =>
    import("@/components/analytics/RevenueForecastChart").then((mod) => mod.RevenueForecastChart),
  {
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    ),
    ssr: false,
  },
);

export const SalesChart = dynamic(
  () => import("@/components/analytics/SalesChart").then((mod) => mod.SalesChart),
  {
    loading: () => (
      <div className="flex h-72 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    ),
    ssr: false,
  },
);

export const LineChart = dynamic(
  () => import("@/components/analytics/charts/LineChart").then((mod) => mod.LineChart),
  {
    loading: () => (
      <div className="flex h-72 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    ),
    ssr: false,
  },
);

export const BarChart = dynamic(
  () => import("@/components/analytics/charts/BarChart").then((mod) => mod.BarChart),
  {
    loading: () => (
      <div className="flex h-72 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    ),
    ssr: false,
  },
);

export const PieChart = dynamic(
  () => import("@/components/analytics/charts/PieChart").then((mod) => mod.PieChart),
  {
    loading: () => (
      <div className="flex h-72 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    ),
    ssr: false,
  },
);

// Campaign components
export const CampaignsList = dynamic(
  () => import("@/components/marketing/CampaignsList").then((mod) => mod.CampaignsList),
  {
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    ),
    ssr: false,
  },
);
