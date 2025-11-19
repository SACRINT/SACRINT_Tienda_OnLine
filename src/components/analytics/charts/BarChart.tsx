"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
  Cell,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/analytics/types";

export interface BarChartData {
  name: string;
  value: number;
  fill?: string;
}

interface BarChartProps {
  data: BarChartData[];
  dataKey?: string;
  xAxisKey?: string;
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  formatValue?: "currency" | "number" | "percentage";
  colors?: string[];
  horizontal?: boolean;
}

const DEFAULT_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
];

export function BarChart({
  data,
  dataKey = "value",
  xAxisKey = "name",
  title,
  height = 300,
  showGrid = true,
  showLegend = false,
  formatValue = "number",
  colors = DEFAULT_COLORS,
  horizontal = false,
}: BarChartProps) {
  const formatValueFn = (value: number) => {
    switch (formatValue) {
      case "currency":
        return formatCurrency(value);
      case "percentage":
        return `${value.toFixed(2)}%`;
      default:
        return formatNumber(value);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            {payload[0].payload[xAxisKey]}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            <span className="font-medium">Value:</span>{" "}
            {formatValueFn(payload[0].value as number)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (horizontal) {
    return (
      <div className="w-full">
        {title && (
          <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
        )}
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart
            data={data}
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            )}
            <XAxis
              type="number"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatValueFn(value)}
            />
            <YAxis
              type="category"
              dataKey={xAxisKey}
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill || colors[index % colors.length]}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
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
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill || colors[index % colors.length]}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
