'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { subDays } from 'date-fns'
import {
  Download,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Filter,
} from 'lucide-react'

import { LineChart } from '@/components/analytics/charts/LineChart'
import { BarChart } from '@/components/analytics/charts/BarChart'
import { PieChart } from '@/components/analytics/charts/PieChart'
import { DateRangePicker } from '@/components/analytics/filters/DateRangePicker'
import {
  SalesMetrics,
  AnalyticsResponse,
  formatCurrency,
  formatNumber,
} from '@/lib/analytics/types'

export default function SalesReportsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 29),
    endDate: new Date(),
  })
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [exportingCSV, setExportingCSV] = useState(false)

  useEffect(() => {
    if (session?.user?.tenantId) {
      fetchSalesData()
    }
  }, [session, dateRange])

  const fetchSalesData = async () => {
    if (!session?.user?.tenantId) return

    setLoading(true)
    try {
      const res = await fetch(
        `/api/analytics/sales?` +
          new URLSearchParams({
            tenantId: session.user.tenantId,
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
          })
      )

      if (res.ok) {
        const data: AnalyticsResponse<SalesMetrics> = await res.json()
        setSalesMetrics(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch sales data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    if (!salesMetrics) return

    setExportingCSV(true)
    try {
      // Preparar datos para CSV
      const Papa = (await import('papaparse')).default

      // Revenue by day CSV
      const revenueData = salesMetrics.revenueByDay.map((day) => ({
        Date: day.date,
        Revenue: day.revenue.toFixed(2),
        Orders: day.orders,
        'Avg Order Value': day.avgOrderValue.toFixed(2),
      }))

      const csv = Papa.unparse(revenueData)

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `sales-report-${dateRange.startDate.toISOString().split('T')[0]}-to-${dateRange.endDate.toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to export CSV:', error)
    } finally {
      setExportingCSV(false)
    }
  }

  const filteredCategoryData =
    selectedCategory === 'all'
      ? salesMetrics?.revenueByCategory || []
      : salesMetrics?.revenueByCategory.filter((c) => c.categoryId === selectedCategory) || []

  if (!session?.user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-600">Please sign in to view sales reports</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Reports</h1>
          <p className="mt-1 text-gray-600">
            Detailed sales analysis and revenue breakdown
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={handleExportCSV}
            disabled={!salesMetrics || exportingCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exportingCSV ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </>
        ) : salesMetrics ? (
          <>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(salesMetrics.totalRevenue)}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(salesMetrics.totalOrders)}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(salesMetrics.avgOrderValue)}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Products Sold</p>
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatNumber(
                  salesMetrics.topProducts.reduce((sum, p) => sum + p.quantitySold, 0)
                )}
              </p>
            </div>
          </>
        ) : null}
      </div>

      {/* Revenue Trend Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">
          Daily Revenue Trend
        </h3>
        {loading ? (
          <div className="flex h-80 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
          </div>
        ) : salesMetrics && salesMetrics.revenueByDay.length > 0 ? (
          <LineChart
            data={salesMetrics.revenueByDay.map((d) => ({
              date: d.date,
              value: d.revenue,
            }))}
            formatValue="currency"
            height={350}
            showGrid
          />
        ) : (
          <div className="flex h-80 items-center justify-center">
            <p className="text-gray-500">No revenue data available for this period</p>
          </div>
        )}
      </div>

      {/* Revenue by Category */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-gray-900">
            Revenue by Category
          </h3>
          {loading ? (
            <div className="flex h-80 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            </div>
          ) : salesMetrics && salesMetrics.revenueByCategory.length > 0 ? (
            <BarChart
              data={salesMetrics.revenueByCategory.slice(0, 10).map((c) => ({
                name: c.categoryName,
                value: c.revenue,
              }))}
              formatValue="currency"
              height={350}
            />
          ) : (
            <div className="flex h-80 items-center justify-center">
              <p className="text-gray-500">No category data available</p>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-semibold text-gray-900">
            Category Distribution
          </h3>
          {loading ? (
            <div className="flex h-80 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            </div>
          ) : salesMetrics && salesMetrics.revenueByCategory.length > 0 ? (
            <PieChart
              data={salesMetrics.revenueByCategory.slice(0, 8).map((c) => ({
                name: c.categoryName,
                value: c.revenue,
                percentage: c.percentage,
              }))}
              formatValue="currency"
              height={350}
              showPercentages
            />
          ) : (
            <div className="flex h-80 items-center justify-center">
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
              Products ranked by total revenue generated
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
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Units Sold
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
                      <div className="flex items-center justify-center">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            index === 0
                              ? 'bg-yellow-100 text-yellow-700'
                              : index === 1
                                ? 'bg-gray-100 text-gray-700'
                                : index === 2
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {product.productName}
                      </p>
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

      {/* Category Breakdown Table */}
      {salesMetrics && salesMetrics.revenueByCategory.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Category Performance
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Detailed breakdown of sales by category
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    % of Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {salesMetrics.revenueByCategory.map((category) => (
                  <tr key={category.categoryId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {category.categoryName}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatNumber(category.orders)} orders
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(category.revenue)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(category.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {category.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
