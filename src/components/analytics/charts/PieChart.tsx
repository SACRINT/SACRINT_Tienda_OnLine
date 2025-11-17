'use client'

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  TooltipProps,
} from 'recharts'
import { formatCurrency, formatNumber } from '@/lib/analytics/types'

export interface PieChartData {
  name: string
  value: number
  percentage: number
  color?: string
}

interface PieChartProps {
  data: PieChartData[]
  title?: string
  height?: number
  showLegend?: boolean
  formatValue?: 'currency' | 'number' | 'percentage'
  colors?: string[]
  innerRadius?: number // Para donut chart
  showPercentages?: boolean
}

const DEFAULT_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#6366f1',
  '#f43f5e',
]

export function PieChart({
  data,
  title,
  height = 300,
  showLegend = true,
  formatValue = 'number',
  colors = DEFAULT_COLORS,
  innerRadius = 0, // 0 = pie chart, >0 = donut chart
  showPercentages = true,
}: PieChartProps) {
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

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="mt-1 text-sm text-gray-600">
            <span className="font-medium">Value:</span>{' '}
            {formatValueFn(data.value)}
          </p>
          {showPercentages && (
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-medium">Percentage:</span>{' '}
              {data.percentage.toFixed(2)}%
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent * 100 < 5) return null // No mostrar label si es muy pequeño

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={showPercentages ? renderCustomLabel : false}
            outerRadius={100}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}
