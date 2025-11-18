'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { subDays } from 'date-fns'
import {
  Tag,
  Receipt,
  Truck,
  TrendingUp,
  Percent,
  DollarSign,
} from 'lucide-react'

import { BarChart } from '@/components/analytics/charts/BarChart'
import { PieChart } from '@/components/analytics/charts/PieChart'
import { DateRangePicker } from '@/components/analytics/filters/DateRangePicker'
import {
  CouponUsage,
  TaxReport,
  ShippingReport,
  formatCurrency,
  formatNumber,
} from '@/lib/analytics/types'

interface ReportsData {
  coupons: CouponUsage[]
  tax: TaxReport[]
  shipping: ShippingReport[]
}

export default function SpecializedReportsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [reportsData, setReportsData] = useState<ReportsData | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 29),
    endDate: new Date(),
  })
  const [activeTab, setActiveTab] = useState<'coupons' | 'tax' | 'shipping'>('coupons')

  useEffect(() => {
    if (session?.user?.tenantId) {
      fetchReportsData()
    }
  }, [session, dateRange])

  const fetchReportsData = async () => {
    if (!session?.user?.tenantId) return

    setLoading(true)
    try {
      // Fetch all reports data
      const [couponsRes, taxRes, shippingRes] = await Promise.all([
        fetch(
          `/api/reports/coupons?` +
            new URLSearchParams({
              tenantId: session.user.tenantId,
              startDate: dateRange.startDate.toISOString(),
              endDate: dateRange.endDate.toISOString(),
            })
        ),
        fetch(
          `/api/reports/tax?` +
            new URLSearchParams({
              tenantId: session.user.tenantId,
              startDate: dateRange.startDate.toISOString(),
              endDate: dateRange.endDate.toISOString(),
            })
        ),
        fetch(
          `/api/reports/shipping?` +
            new URLSearchParams({
              tenantId: session.user.tenantId,
              startDate: dateRange.startDate.toISOString(),
              endDate: dateRange.endDate.toISOString(),
            })
        ),
      ])

      const coupons = couponsRes.ok ? await couponsRes.json() : { data: [] }
      const tax = taxRes.ok ? await taxRes.json() : { data: [] }
      const shipping = shippingRes.ok ? await shippingRes.json() : { data: [] }

      setReportsData({
        coupons: coupons.data || [],
        tax: tax.data || [],
        shipping: shipping.data || [],
      })
    } catch (error) {
      console.error('Failed to fetch reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'coupons' as const, label: 'Coupons', icon: Tag },
    { id: 'tax' as const, label: 'Tax Reports', icon: Receipt },
    { id: 'shipping' as const, label: 'Shipping', icon: Truck },
  ]

  if (!session?.user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-600">Please sign in to view reports</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Specialized Reports</h1>
          <p className="mt-1 text-gray-600">
            Coupons, tax, and shipping analytics
          </p>
        </div>

        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          {reportsData && reportsData.coupons.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Active Coupons</p>
                  <Tag className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {reportsData.coupons.length}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Total Discount Given</p>
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(
                    reportsData.coupons.reduce((sum, c) => sum + c.totalDiscount, 0)
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-600">Revenue Generated</p>
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(
                    reportsData.coupons.reduce((sum, c) => sum + c.revenueImpact, 0)
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Coupons Table */}
          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            </div>
          ) : reportsData && reportsData.coupons.length > 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Coupon Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Times Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Total Discount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Revenue Impact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        ROI
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {reportsData.coupons.map((coupon) => (
                      <tr key={coupon.couponId} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <code className="rounded bg-gray-100 px-2 py-1 text-sm font-mono font-medium text-gray-900">
                            {coupon.code}
                          </code>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {coupon.type === 'PERCENTAGE' ? (
                            <span className="inline-flex items-center gap-1">
                              <Percent className="h-3 w-3" />
                              Percentage
                            </span>
                          ) : (
                            'Fixed Amount'
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {coupon.type === 'PERCENTAGE'
                            ? `${coupon.value}%`
                            : formatCurrency(coupon.value)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {formatNumber(coupon.timesUsed)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-red-600">
                          -{formatCurrency(coupon.totalDiscount)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-green-600">
                          {formatCurrency(coupon.revenueImpact)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {coupon.roi.toFixed(2)}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
              <p className="text-gray-500">No coupon data available for this period</p>
            </div>
          )}
        </div>
      )}

      {/* Tax Tab */}
      {activeTab === 'tax' && (
        <div className="space-y-6">
          {/* Tax Summary */}
          {reportsData && reportsData.tax.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-semibold text-gray-900">
                  Tax by State
                </h3>
                <BarChart
                  data={reportsData.tax.slice(0, 10).map((t) => ({
                    name: t.state,
                    value: t.totalTax,
                  }))}
                  formatValue="currency"
                  height={300}
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-semibold text-gray-900">
                  Tax Distribution
                </h3>
                <PieChart
                  data={reportsData.tax.slice(0, 8).map((t, idx) => ({
                    name: t.state,
                    value: t.totalTax,
                    percentage: (t.totalTax / reportsData.tax.reduce((sum, x) => sum + x.totalTax, 0)) * 100,
                  }))}
                  formatValue="currency"
                  height={300}
                  showPercentages
                />
              </div>
            </div>
          )}

          {/* Tax Table */}
          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            </div>
          ) : reportsData && reportsData.tax.length > 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        State
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Total Tax Collected
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Avg Tax per Order
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {reportsData.tax.map((taxData) => (
                      <tr key={taxData.state} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {taxData.state}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(taxData.totalTax)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {formatNumber(taxData.orders)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {formatCurrency(taxData.taxRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
              <p className="text-gray-500">No tax data available for this period</p>
            </div>
          )}
        </div>
      )}

      {/* Shipping Tab */}
      {activeTab === 'shipping' && (
        <div className="space-y-6">
          {/* Shipping Charts */}
          {reportsData && reportsData.shipping.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-semibold text-gray-900">
                  Shipping Method Usage
                </h3>
                <BarChart
                  data={reportsData.shipping.map((s) => ({
                    name: s.method,
                    value: s.timesUsed,
                  }))}
                  formatValue="number"
                  height={300}
                />
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-6 text-lg font-semibold text-gray-900">
                  Shipping Cost Distribution
                </h3>
                <PieChart
                  data={reportsData.shipping.map((s) => ({
                    name: s.method,
                    value: s.totalCost,
                    percentage: (s.totalCost / reportsData.shipping.reduce((sum, x) => sum + x.totalCost, 0)) * 100,
                  }))}
                  formatValue="currency"
                  height={300}
                  showPercentages
                />
              </div>
            </div>
          )}

          {/* Shipping Table */}
          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            </div>
          ) : reportsData && reportsData.shipping.length > 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Shipping Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Times Used
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Total Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Avg Cost
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {reportsData.shipping.map((shippingData) => (
                      <tr key={shippingData.method} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {shippingData.method}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {formatNumber(shippingData.timesUsed)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatCurrency(shippingData.totalCost)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {formatCurrency(shippingData.avgCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white">
              <p className="text-gray-500">No shipping data available for this period</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
