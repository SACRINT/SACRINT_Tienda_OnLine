"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { subDays } from "date-fns";
import {
  Users,
  UserPlus,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Award,
} from "lucide-react";

import { PieChart } from "@/components/analytics/charts/PieChart";
import { BarChart } from "@/components/analytics/charts/BarChart";
import { DateRangePicker } from "@/components/analytics/filters/DateRangePicker";
import { RFMSegmentation } from "@/components/analytics/RFMSegmentation";
import { CohortRetentionChart } from "@/components/analytics/CohortRetentionChart";
import {
  CustomerMetrics,
  AnalyticsResponse,
  formatCurrency,
  formatNumber,
} from "@/lib/analytics/types";

export default function CustomerAnalyticsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [customerMetrics, setCustomerMetrics] =
    useState<CustomerMetrics | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 29),
    endDate: new Date(),
  });

  useEffect(() => {
    if (session?.user?.tenantId) {
      fetchCustomerData();
    }
  }, [session, dateRange]);

  const fetchCustomerData = async () => {
    if (!session?.user?.tenantId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/analytics/customers?` +
          new URLSearchParams({
            tenantId: session.user.tenantId,
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
          }),
      );

      if (res.ok) {
        const data: AnalyticsResponse<CustomerMetrics> = await res.json();
        setCustomerMetrics(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch customer data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-600">
          Please sign in to view customer analytics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Customer Analytics
          </h1>
          <p className="mt-1 text-gray-600">
            Understand your customer base and buying behavior
          </p>
        </div>

        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg bg-gray-200"
              />
            ))}
          </>
        ) : customerMetrics ? (
          <>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">
                  Total Customers
                </p>
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(customerMetrics.totalCustomers)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Registered in your store
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">
                  New Customers
                </p>
                <UserPlus className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(customerMetrics.newCustomers)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                First purchase in period
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">
                  Returning Customers
                </p>
                <RefreshCw className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(customerMetrics.returningCustomers)}
              </p>
              <p className="mt-2 text-xs text-gray-500">Multiple purchases</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">
                  Avg Lifetime Value
                </p>
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(customerMetrics.avgLifetimeValue)}
              </p>
              <p className="mt-2 text-xs text-gray-500">Per customer</p>
            </div>
          </>
        ) : null}
      </div>

      {/* Customer Segmentation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* New vs Returning */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-gray-900">
            Customer Type Distribution
          </h3>
          {loading ? (
            <div className="flex h-80 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            </div>
          ) : customerMetrics ? (
            <PieChart
              data={[
                {
                  name: "New Customers",
                  value: customerMetrics.newCustomers,
                  percentage:
                    (customerMetrics.newCustomers /
                      (customerMetrics.newCustomers +
                        customerMetrics.returningCustomers)) *
                    100,
                  color: "#10b981",
                },
                {
                  name: "Returning Customers",
                  value: customerMetrics.returningCustomers,
                  percentage:
                    (customerMetrics.returningCustomers /
                      (customerMetrics.newCustomers +
                        customerMetrics.returningCustomers)) *
                    100,
                  color: "#8b5cf6",
                },
              ]}
              formatValue="number"
              height={350}
              showPercentages
            />
          ) : (
            <div className="flex h-80 items-center justify-center">
              <p className="text-gray-500">No customer data available</p>
            </div>
          )}
        </div>

        {/* Purchase Frequency */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-gray-900">
            Purchase Metrics
          </h3>
          {loading ? (
            <div className="flex h-80 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            </div>
          ) : customerMetrics ? (
            <div className="space-y-6 py-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                  <TrendingUp className="h-10 w-10 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  Average Purchase Frequency
                </p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {customerMetrics.avgPurchaseFrequency.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  orders per customer
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">
                      Customer Retention
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {customerMetrics.newCustomers +
                        customerMetrics.returningCustomers >
                      0
                        ? (
                            (customerMetrics.returningCustomers /
                              (customerMetrics.newCustomers +
                                customerMetrics.returningCustomers)) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600">
                      Avg Lifetime Value
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {formatCurrency(customerMetrics.avgLifetimeValue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-80 items-center justify-center">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Customers Table */}
      {customerMetrics && customerMetrics.topCustomers.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Top Customers
              </h3>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Your most valuable customers by total revenue
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Avg Order Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Last Order
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {customerMetrics.topCustomers.map((customer, index) => (
                  <tr key={customer.userId} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center justify-center">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : index === 1
                                ? "bg-gray-100 text-gray-700"
                                : index === 2
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {customer.userName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {customer.email}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatNumber(customer.totalOrders)} orders
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(customer.totalRevenue)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatCurrency(customer.avgOrderValue)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(customer.lastOrderDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RFM Segmentation */}
      {session?.user?.tenantId && (
        <div className="space-y-4">
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              RFM Customer Segmentation
            </h2>
            <p className="text-gray-600 mb-6">
              Advanced customer segmentation based on Recency, Frequency, and
              Monetary value analysis
            </p>
          </div>
          <RFMSegmentation tenantId={session.user.tenantId} />
        </div>
      )}

      {/* Cohort Retention Analysis */}
      {session?.user?.tenantId && (
        <div className="space-y-4">
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Cohort Retention Analysis
            </h2>
            <p className="text-gray-600 mb-6">
              Track customer retention and revenue by acquisition cohort
            </p>
          </div>
          <CohortRetentionChart tenantId={session.user.tenantId} months={6} />
        </div>
      )}
    </div>
  );
}
