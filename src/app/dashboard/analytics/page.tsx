"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { subDays } from "date-fns";
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

import {
  StatCard,
  StatCardSkeleton,
} from "@/components/analytics/widgets/StatCard";
import { LineChart } from "@/components/analytics/charts/LineChart";
import { BarChart } from "@/components/analytics/charts/BarChart";
import { DateRangePicker } from "@/components/analytics/filters/DateRangePicker";
import { RevenueForecastChart } from "@/components/analytics/RevenueForecastChart";
import {
  OverviewMetrics,
  SalesMetrics,
  AnalyticsResponse,
  formatCurrency,
  formatNumber,
} from "@/lib/analytics/types";

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [overviewMetrics, setOverviewMetrics] =
    useState<OverviewMetrics | null>(null);
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 29),
    endDate: new Date(),
  });

  useEffect(() => {
    if (session?.user?.tenantId) {
      fetchAnalytics();
    }
  }, [session, dateRange]);

  const fetchAnalytics = async () => {
    if (!session?.user?.tenantId) return;

    setLoading(true);
    try {
      // Fetch overview metrics
      const overviewRes = await fetch(
        `/api/analytics/overview?` +
          new URLSearchParams({
            tenantId: session.user.tenantId,
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
          }),
      );

      if (overviewRes.ok) {
        const overviewData: AnalyticsResponse<OverviewMetrics> =
          await overviewRes.json();
        setOverviewMetrics(overviewData.data);
      }

      // Fetch sales metrics (if API exists)
      const salesRes = await fetch(
        `/api/analytics/sales?` +
          new URLSearchParams({
            tenantId: session.user.tenantId,
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
          }),
      );

      if (salesRes.ok) {
        const salesData: AnalyticsResponse<SalesMetrics> =
          await salesRes.json();
        setSalesMetrics(salesData.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-600">Please sign in to view analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="mt-1 text-gray-600">
            Track your store&apos;s performance and metrics
          </p>
        </div>

        {/* Date Range Picker */}
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : overviewMetrics ? (
          <>
            <StatCard
              title="Total Revenue"
              metric={overviewMetrics.revenue}
              icon={DollarSign}
              formatType="currency"
              description="Total revenue in selected period"
            />
            <StatCard
              title="Total Orders"
              metric={overviewMetrics.orders}
              icon={ShoppingCart}
              formatType="number"
              description="Number of orders placed"
            />
            <StatCard
              title="Customers"
              metric={overviewMetrics.customers}
              icon={Users}
              formatType="number"
              description="Unique customers"
            />
            <StatCard
              title="Avg Order Value"
              metric={overviewMetrics.avgOrderValue}
              icon={TrendingUp}
              formatType="currency"
              description="Average value per order"
            />
          </>
        ) : (
          <div className="col-span-4 flex h-32 items-center justify-center">
            <p className="text-gray-600">No data available</p>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Revenue Trend
          </h3>
          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            </div>
          ) : salesMetrics && salesMetrics.revenueByDay.length > 0 ? (
            <LineChart
              data={salesMetrics.revenueByDay.map((d) => ({
                date: d.date,
                value: d.revenue,
              }))}
              formatValue="currency"
              height={300}
            />
          ) : (
            <div className="flex h-72 items-center justify-center">
              <p className="text-gray-500">No revenue data available</p>
            </div>
          )}
        </div>

        {/* Revenue by Category */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Revenue by Category
          </h3>
          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            </div>
          ) : salesMetrics && salesMetrics.revenueByCategory.length > 0 ? (
            <BarChart
              data={salesMetrics.revenueByCategory.map((c) => ({
                name: c.categoryName,
                value: c.revenue,
              }))}
              formatValue="currency"
              height={300}
            />
          ) : (
            <div className="flex h-72 items-center justify-center">
              <p className="text-gray-500">No category data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      {salesMetrics && salesMetrics.topProducts.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Selling Products
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Best performing products by revenue
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Quantity Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Avg Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {salesMetrics.topProducts.map((product, index) => (
                  <tr key={product.productId} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">
                          #{index + 1}
                        </span>
                        <span className="font-medium text-gray-900">
                          {product.productName}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatNumber(product.quantitySold)} units
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatCurrency(product.avgPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue Forecast & Trend Analysis */}
      {salesMetrics && salesMetrics.revenueByDay.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Revenue Forecast & Trend Analysis
            </h2>
            <p className="text-gray-600 mb-6">
              Predictive analytics with trend detection and seasonality analysis
            </p>
          </div>
          <RevenueForecastChart
            historicalData={salesMetrics.revenueByDay}
            forecastDays={7}
          />
        </div>
      )}
    </div>
  );
}
