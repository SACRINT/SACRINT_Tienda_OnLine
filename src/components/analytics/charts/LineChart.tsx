'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts'
import { formatCurrency, formatNumber } from '@/lib/analytics/types'

export interface LineChartData {
  date: string
  value: number
  label?: string
  previousValue?: number
}

interface LineChartProps {
  data: LineChartData[]
  dataKey?: string
  xAxisKey?: string
  title?: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  showComparison?: boolean
  formatValue?: 'currency' | 'number' | 'percentage'
  color?: string
  comparisonColor?: string
}

export function LineChart({
  data,
  dataKey = 'value',
  xAxisKey = 'date',
  title,
  height = 300,
  showGrid = true,
  showLegend = true,
  showComparison = false,
  formatValue = 'number',
  color = '#3b82f6',
  comparisonColor = '#94a3b8',
}: LineChartProps) {
  const formatValueFn = (value: number) => {
    switch (formatValue) {
      case 'currency':
        return formatCurrency(value)
      case 'percentage':
        return `${value.toFixed(2)}%`
      default:
        return formatNumber(value)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            {payload[0].payload[xAxisKey]}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            <span className="font-medium" style={{ color }}>
              {payload[0].name}:
            </span>{' '}
            {formatValueFn(payload[0].value as number)}
          </p>
          {showComparison && payload[1] && (
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-medium" style={{ color: comparisonColor }}>
                {payload[1].name}:
              </span>{' '}
              {formatValueFn(payload[1].value as number)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
          <XAxis
            dataKey={xAxisKey}
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatValueFn(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          <Line
            type="monotone"
            dataKey={dataKey}
            name="Current Period"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
          {showComparison && (
            <Line
              type="monotone"
              dataKey="previousValue"
              name="Previous Period"
              stroke={comparisonColor}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: comparisonColor, r: 4 }}
            />
          )}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
