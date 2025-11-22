"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/analytics/types";
import {
  generateRevenueForecast,
  analyzeTrend,
  comparePeriods,
  detectSeasonality,
  type ForecastDataPoint,
  type TrendAnalysis,
} from "@/lib/analytics/forecast";

interface RevenueData {
  date: string;
  revenue: number;
}

interface RevenueForecastChartProps {
  historicalData: RevenueData[];
  previousPeriodData?: RevenueData[];
  title?: string;
  forecastDays?: number;
}

export function RevenueForecastChart({
  historicalData,
  previousPeriodData,
  title = "Revenue Forecast & Analysis",
  forecastDays = 7,
}: RevenueForecastChartProps) {
  const [forecastMethod, setForecastMethod] = useState<
    "linear" | "moving-average" | "ema"
  >("linear");
  const [showForecast, setShowForecast] = useState(true);
  const [showPrevious, setShowPrevious] = useState(!!previousPeriodData);

  // Generate forecast
  const forecast = showForecast
    ? generateRevenueForecast(historicalData, forecastDays, forecastMethod)
    : [];

  // Analyze trend
  const trendAnalysis = analyzeTrend(
    historicalData.map((d) => d.revenue),
  );

  // Compare periods
  const comparison = previousPeriodData
    ? comparePeriods(historicalData, previousPeriodData)
    : null;

  // Detect seasonality
  const seasonality = detectSeasonality(historicalData, 7);

  // Combine data for chart
  const chartData = [
    ...historicalData.map((d, index) => ({
      date: new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      actual: d.revenue,
      previous: previousPeriodData?.[index]?.revenue || null,
      isForecast: false,
    })),
    ...forecast.map((f) => ({
      date: new Date(f.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      forecast: f.predicted,
      confidenceLower: f.confidence?.lower,
      confidenceUpper: f.confidence?.upper,
      isForecast: true,
    })),
  ];

  const getTrendIcon = () => {
    switch (trendAnalysis.trend) {
      case "increasing":
        return <TrendingUp className="h-5 w-5 text-green-600" />;
      case "decreasing":
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trendAnalysis.trend) {
      case "increasing":
        return "text-green-600";
      case "decreasing":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Trend Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Trend Direction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={`text-2xl font-bold ${getTrendColor()}`}>
                {trendAnalysis.trend.charAt(0).toUpperCase() +
                  trendAnalysis.trend.slice(1)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Period Change</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trendAnalysis.changePercent > 0 && "+"}
              {trendAnalysis.changePercent.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              First vs second half
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Growth Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trendAnalysis.averageGrowthRate > 0 && "+"}
              {trendAnalysis.averageGrowthRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Per period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Volatility</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {trendAnalysis.volatility.toFixed(1)}%
              </div>
              {trendAnalysis.volatility > 30 && (
                <AlertCircle className="h-4 w-4 text-orange-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {trendAnalysis.volatility < 15
                ? "Stable"
                : trendAnalysis.volatility < 30
                  ? "Moderate"
                  : "High"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period Comparison */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Period Comparison</CardTitle>
            <CardDescription>Current vs previous period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-600">Current Period</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(comparison.currentTotal)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Previous Period</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(comparison.previousTotal)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Change</p>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-2xl font-bold ${
                      comparison.percentChange > 0
                        ? "text-green-600"
                        : comparison.percentChange < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {comparison.percentChange > 0 && "+"}
                    {comparison.percentChange.toFixed(1)}%
                  </p>
                  <Badge
                    variant={
                      comparison.trend === "up"
                        ? "default"
                        : comparison.trend === "down"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {comparison.trend}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seasonality Detection */}
      {seasonality.hasSeasonality && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Seasonality Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">
              Revenue shows a recurring weekly pattern with{" "}
              <span className="font-semibold">
                {(seasonality.strength * 100).toFixed(0)}% strength
              </span>
              . Consider this when planning inventory and marketing campaigns.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="mt-2">
                Historical data with {forecastDays}-day forecast
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={showForecast ? "default" : "outline"}
                size="sm"
                onClick={() => setShowForecast(!showForecast)}
              >
                Forecast
              </Button>
              {previousPeriodData && (
                <Button
                  variant={showPrevious ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowPrevious(!showPrevious)}
                >
                  Compare
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Forecast Method Selector */}
          {showForecast && (
            <div className="mb-4 flex gap-2">
              <span className="text-sm text-gray-600">Method:</span>
              {(["linear", "moving-average", "ema"] as const).map((method) => (
                <Button
                  key={method}
                  variant={forecastMethod === method ? "default" : "outline"}
                  size="sm"
                  onClick={() => setForecastMethod(method)}
                >
                  {method === "linear"
                    ? "Linear Regression"
                    : method === "moving-average"
                      ? "Moving Avg"
                      : "EMA"}
                </Button>
              ))}
            </div>
          )}

          {/* Chart */}
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />

                {/* Actual revenue */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Revenue"
                  stroke="#0A1128"
                  strokeWidth={2}
                  dot={{ fill: "#0A1128", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />

                {/* Previous period (if enabled) */}
                {showPrevious && (
                  <Line
                    type="monotone"
                    dataKey="previous"
                    name="Previous Period"
                    stroke="#9ca3af"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: "#9ca3af", strokeWidth: 2 }}
                    connectNulls
                  />
                )}

                {/* Forecast */}
                {showForecast && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      name="Forecast"
                      stroke="#D4AF37"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: "#D4AF37", strokeWidth: 2 }}
                      connectNulls
                    />

                    {/* Confidence interval */}
                    {forecastMethod === "linear" && (
                      <Area
                        type="monotone"
                        dataKey="confidenceUpper"
                        stackId="confidence"
                        stroke="none"
                        fill="#D4AF37"
                        fillOpacity={0.1}
                        connectNulls
                      />
                    )}
                  </>
                )}

                {/* Today's line */}
                <ReferenceLine
                  x={chartData[historicalData.length - 1]?.date}
                  stroke="#6b7280"
                  strokeDasharray="3 3"
                  label={{
                    value: "Today",
                    position: "top",
                    fill: "#6b7280",
                    fontSize: 12,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
