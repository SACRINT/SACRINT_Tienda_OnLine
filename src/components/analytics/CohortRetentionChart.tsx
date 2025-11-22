"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  TrendingDown,
  TrendingUp,
  Users,
  BarChart3,
  Download,
} from "lucide-react";
import { formatCurrency } from "@/lib/analytics/types";
import {
  exportCohortRetentionCSV,
  generateFilename,
} from "@/lib/analytics/export";

interface CohortData {
  cohortDate: string; // YYYY-MM
  cohortSize: number;
  retention: number[]; // Percentage retained each period
  revenue: number[]; // Revenue per period
}

interface CohortAnalyticsData {
  retention: CohortData[];
  frequency: {
    oneTime: number;
    twoToThree: number;
    fourPlus: number;
  };
  aovByPurchaseNumber: {
    purchaseNumber: number;
    averageValue: number;
  }[];
  timeBetweenPurchases: {
    average: number;
    median: number;
    distribution: { range: string; count: number }[];
  };
}

interface CohortRetentionChartProps {
  tenantId: string;
  months?: number;
}

export function CohortRetentionChart({
  tenantId,
  months = 6,
}: CohortRetentionChartProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CohortAnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"retention" | "revenue">("retention");

  useEffect(() => {
    fetchCohortData();
  }, [tenantId, months]);

  const fetchCohortData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/analytics/cohort?tenantId=${tenantId}&months=${months}&analysis=all`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch cohort data");
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Cohort fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data || !data.retention) return;
    const filename = generateFilename("cohort-retention", "csv");
    exportCohortRetentionCSV(data.retention, filename);
  };

  const getRetentionColor = (retention: number): string => {
    if (retention >= 75) return "bg-green-500 text-white";
    if (retention >= 50) return "bg-green-400 text-white";
    if (retention >= 25) return "bg-yellow-400 text-gray-900";
    if (retention >= 10) return "bg-orange-400 text-white";
    if (retention > 0) return "bg-red-400 text-white";
    return "bg-gray-100 text-gray-400";
  };

  const getRevenueColor = (revenue: number, maxRevenue: number): string => {
    const percentage = (revenue / maxRevenue) * 100;
    if (percentage >= 80) return "bg-blue-600 text-white";
    if (percentage >= 60) return "bg-blue-500 text-white";
    if (percentage >= 40) return "bg-blue-400 text-white";
    if (percentage >= 20) return "bg-blue-300 text-gray-900";
    if (percentage > 0) return "bg-blue-200 text-gray-900";
    return "bg-gray-100 text-gray-400";
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-red-600">Error: {error || "No data available"}</p>
        </CardContent>
      </Card>
    );
  }

  const maxRetentionPeriods = Math.max(
    ...data.retention.map((c) => c.retention.length),
  );
  const maxRevenue = Math.max(
    ...data.retention.flatMap((c) => c.revenue),
    1,
  );

  return (
    <div className="space-y-6">
      {/* Cohort Retention/Revenue Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cohort {viewMode === "retention" ? "Retention" : "Revenue"} Analysis
              </CardTitle>
              <CardDescription className="mt-2">
                {viewMode === "retention"
                  ? "Track customer retention by cohort month"
                  : "Track revenue generation by cohort month"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "retention" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("retention")}
              >
                <Users className="mr-2 h-4 w-4" />
                Retention %
              </Button>
              <Button
                variant={viewMode === "revenue" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("revenue")}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Revenue
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-left text-xs font-semibold text-gray-700">
                    Cohort Month
                  </th>
                  <th className="border border-gray-300 bg-gray-100 px-4 py-2 text-center text-xs font-semibold text-gray-700">
                    Size
                  </th>
                  {Array.from({ length: maxRetentionPeriods }).map((_, i) => (
                    <th
                      key={i}
                      className="border border-gray-300 bg-gray-100 px-4 py-2 text-center text-xs font-semibold text-gray-700"
                    >
                      Month {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.retention.map((cohort) => (
                  <tr key={cohort.cohortDate}>
                    <td className="border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900">
                      {cohort.cohortDate}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900">
                      {cohort.cohortSize}
                    </td>
                    {Array.from({ length: maxRetentionPeriods }).map((_, i) => {
                      const value =
                        viewMode === "retention"
                          ? cohort.retention[i]
                          : cohort.revenue[i];
                      const hasValue = value !== undefined;

                      if (!hasValue) {
                        return (
                          <td
                            key={i}
                            className="border border-gray-300 bg-gray-50"
                          />
                        );
                      }

                      const colorClass =
                        viewMode === "retention"
                          ? getRetentionColor(value)
                          : getRevenueColor(value, maxRevenue);

                      return (
                        <td
                          key={i}
                          className={`border border-gray-300 text-center ${colorClass}`}
                        >
                          <div className="px-2 py-2">
                            {viewMode === "retention" ? (
                              <div className="text-sm font-bold">
                                {value.toFixed(0)}%
                              </div>
                            ) : (
                              <div className="text-xs font-semibold">
                                {formatCurrency(value)}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
            {viewMode === "retention" ? (
              <>
                <span className="font-semibold">Retention Scale:</span>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 rounded bg-red-400"></div>
                  <span>&lt;10%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 rounded bg-orange-400"></div>
                  <span>10-25%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 rounded bg-yellow-400"></div>
                  <span>25-50%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 rounded bg-green-400"></div>
                  <span>50-75%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 rounded bg-green-500"></div>
                  <span>&gt;75%</span>
                </div>
              </>
            ) : (
              <>
                <span className="font-semibold">Revenue Scale:</span>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 rounded bg-blue-200"></div>
                  <span>Low</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 rounded bg-blue-400"></div>
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-4 w-4 rounded bg-blue-600"></div>
                  <span>High</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Purchase Frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Purchase Frequency</CardTitle>
            <CardDescription>Customer purchase patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">One-time buyers</span>
              <span className="text-lg font-bold">{data.frequency.oneTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">2-3 purchases</span>
              <span className="text-lg font-bold">
                {data.frequency.twoToThree}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">4+ purchases</span>
              <span className="text-lg font-bold text-green-600">
                {data.frequency.fourPlus}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Time Between Purchases */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Purchase Timing</CardTitle>
            <CardDescription>Days between purchases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average</span>
              <span className="text-lg font-bold">
                {Math.round(data.timeBetweenPurchases.average)} days
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Median</span>
              <span className="text-lg font-bold">
                {data.timeBetweenPurchases.median} days
              </span>
            </div>
            <div className="mt-4 space-y-1">
              {data.timeBetweenPurchases.distribution.map((dist) => (
                <div
                  key={dist.range}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-600">{dist.range}</span>
                  <span className="font-medium">{dist.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AOV by Purchase Number */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AOV by Purchase #</CardTitle>
            <CardDescription>Average order value trends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.aovByPurchaseNumber.map((aov) => (
              <div
                key={aov.purchaseNumber}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-gray-600">
                  Purchase #{aov.purchaseNumber}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold">
                    {formatCurrency(aov.averageValue)}
                  </span>
                  {aov.purchaseNumber > 1 &&
                    aov.averageValue >
                      data.aovByPurchaseNumber[aov.purchaseNumber - 2]
                        .averageValue && (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    )}
                  {aov.purchaseNumber > 1 &&
                    aov.averageValue <
                      data.aovByPurchaseNumber[aov.purchaseNumber - 2]
                        .averageValue && (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
