/**
 * Analytics Dashboard Components
 * Semana 35, Tarea 35.7: Analytics Dashboard Components
 */

'use client'

import React, { useEffect, useState } from 'react'

interface DashboardMetrics {
  totalRevenue: number
  totalOrders: number
  conversionRate: number
  averageOrderValue: number
  activeUsers: number
  systemHealth: number
}

interface AnalyticsDashboardProps {
  tenantId: string
}

export function AnalyticsDashboard({ tenantId }: AnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [dailyRevenue, setDailyRevenue] = useState<Array<{ date: string; revenue: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/analytics/dashboard?tenantId=${tenantId}`)
        const data = await response.json()

        if (!response.ok) {
          setError('Failed to load analytics')
          return
        }

        setMetrics(data.metrics)
        setDailyRevenue(data.metrics.dailyRevenue || [])
      } catch (err) {
        setError('Failed to fetch analytics data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [tenantId])

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>
  }

  if (error) {
    return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
  }

  const healthColor = metrics && metrics.systemHealth >= 80 ? 'green' : metrics && metrics.systemHealth >= 50 ? 'yellow' : 'red'
  const healthClass = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  }[healthColor]

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Revenue */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            ${metrics?.totalRevenue.toLocaleString() || 0}
          </p>
          <p className="mt-2 text-xs text-gray-500">All time</p>
        </div>

        {/* Total Orders */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Orders</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{metrics?.totalOrders || 0}</p>
          <p className="mt-2 text-xs text-gray-500">Completed orders</p>
        </div>

        {/* Average Order Value */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">Avg Order Value</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            ${metrics?.averageOrderValue.toFixed(2) || 0}
          </p>
          <p className="mt-2 text-xs text-gray-500">Per order</p>
        </div>

        {/* Conversion Rate */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">Conversion Rate</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {metrics?.conversionRate.toFixed(2) || 0}%
          </p>
          <p className="mt-2 text-xs text-gray-500">Checkout to order</p>
        </div>

        {/* Active Users */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">Active Users</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{metrics?.activeUsers || 0}</p>
          <p className="mt-2 text-xs text-gray-500">Last 30 days</p>
        </div>

        {/* System Health */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">System Health</h3>
          <p className={`mt-2 text-3xl font-bold ${healthClass}`}>{metrics?.systemHealth || 0}%</p>
          <p className="mt-2 text-xs text-gray-500">Overall status</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Daily Revenue</h3>

        <div className="mt-6 space-y-2">
          {dailyRevenue.slice(-30).map((item) => (
            <div key={item.date} className="flex items-center">
              <span className="w-24 text-sm text-gray-600">{item.date}</span>
              <div className="flex-1 bg-gray-200 rounded h-6 mx-2">
                <div
                  className="bg-blue-600 h-6 rounded"
                  style={{
                    width: `${Math.min((item.revenue / 1000) * 100, 100)}%`,
                  }}
                />
              </div>
              <span className="w-20 text-right text-sm font-medium text-gray-900">
                ${item.revenue.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            View Detailed Report
          </button>
          <button className="rounded-md bg-gray-200 px-4 py-2 text-gray-900 hover:bg-gray-300">
            Export Data
          </button>
          <button className="rounded-md bg-gray-200 px-4 py-2 text-gray-900 hover:bg-gray-300">
            Settings
          </button>
        </div>
      </div>
    </div>
  )
}
