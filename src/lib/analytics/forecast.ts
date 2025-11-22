// @ts-nocheck
// Revenue Forecasting and Trending
// Predictive analytics for revenue planning

export interface ForecastDataPoint {
  date: string;
  actual?: number;
  predicted: number;
  confidence?: {
    lower: number;
    upper: number;
  };
}

export interface TrendAnalysis {
  trend: "increasing" | "decreasing" | "stable";
  changePercent: number;
  averageGrowthRate: number;
  volatility: number; // Standard deviation as % of mean
}

/**
 * Calculate moving average forecast
 * Simple but effective for short-term predictions
 */
export function calculateMovingAverage(
  data: number[],
  windowSize: number = 7,
): number {
  if (data.length === 0) return 0;
  if (data.length < windowSize) {
    windowSize = data.length;
  }

  const window = data.slice(-windowSize);
  return window.reduce((sum, val) => sum + val, 0) / window.length;
}

/**
 * Calculate exponential moving average (EMA)
 * Gives more weight to recent data points
 */
export function calculateEMA(
  data: number[],
  smoothingFactor: number = 0.3,
): number {
  if (data.length === 0) return 0;
  if (data.length === 1) return data[0];

  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = smoothingFactor * data[i] + (1 - smoothingFactor) * ema;
  }

  return ema;
}

/**
 * Simple linear regression for trend prediction
 * Returns slope and intercept for y = mx + b
 */
export function linearRegression(
  data: number[],
): { slope: number; intercept: number; rSquared: number } {
  const n = data.length;
  if (n < 2) {
    return { slope: 0, intercept: data[0] || 0, rSquared: 0 };
  }

  // Calculate means
  const xMean = (n - 1) / 2; // x values are 0, 1, 2, ..., n-1
  const yMean = data.reduce((sum, val) => sum + val, 0) / n;

  // Calculate slope
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (data[i] - yMean);
    denominator += (i - xMean) * (i - xMean);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = yMean - slope * xMean;

  // Calculate R-squared
  let ssRes = 0;
  let ssTot = 0;

  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept;
    ssRes += (data[i] - predicted) * (data[i] - predicted);
    ssTot += (data[i] - yMean) * (data[i] - yMean);
  }

  const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, rSquared };
}

/**
 * Generate revenue forecast for next N periods
 * Uses combination of linear regression and moving average
 */
export function generateRevenueForecast(
  historicalData: { date: string; revenue: number }[],
  periodsAhead: number = 7,
  method: "linear" | "moving-average" | "ema" = "linear",
): ForecastDataPoint[] {
  if (historicalData.length === 0) return [];

  const revenueValues = historicalData.map((d) => d.revenue);
  const forecast: ForecastDataPoint[] = [];

  if (method === "linear") {
    const { slope, intercept } = linearRegression(revenueValues);

    for (let i = 0; i < periodsAhead; i++) {
      const nextIndex = historicalData.length + i;
      const predicted = slope * nextIndex + intercept;

      // Calculate confidence interval (simple approximation)
      const variance = calculateVariance(revenueValues);
      const stdDev = Math.sqrt(variance);
      const margin = 1.96 * stdDev; // 95% confidence interval

      forecast.push({
        date: getFutureDate(
          historicalData[historicalData.length - 1].date,
          i + 1,
        ),
        predicted: Math.max(0, predicted),
        confidence: {
          lower: Math.max(0, predicted - margin),
          upper: predicted + margin,
        },
      });
    }
  } else if (method === "moving-average") {
    const windowSize = Math.min(7, revenueValues.length);
    const avgValue = calculateMovingAverage(revenueValues, windowSize);

    for (let i = 0; i < periodsAhead; i++) {
      forecast.push({
        date: getFutureDate(
          historicalData[historicalData.length - 1].date,
          i + 1,
        ),
        predicted: avgValue,
      });
    }
  } else if (method === "ema") {
    const emaValue = calculateEMA(revenueValues);

    for (let i = 0; i < periodsAhead; i++) {
      forecast.push({
        date: getFutureDate(
          historicalData[historicalData.length - 1].date,
          i + 1,
        ),
        predicted: emaValue,
      });
    }
  }

  return forecast;
}

/**
 * Analyze trend in revenue data
 */
export function analyzeTrend(data: number[]): TrendAnalysis {
  if (data.length < 2) {
    return {
      trend: "stable",
      changePercent: 0,
      averageGrowthRate: 0,
      volatility: 0,
    };
  }

  const { slope } = linearRegression(data);
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;

  // Calculate period-over-period growth rates
  const growthRates: number[] = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1] !== 0) {
      growthRates.push(((data[i] - data[i - 1]) / data[i - 1]) * 100);
    }
  }

  const averageGrowthRate =
    growthRates.length > 0
      ? growthRates.reduce((sum, val) => sum + val, 0) / growthRates.length
      : 0;

  // Calculate volatility (standard deviation as % of mean)
  const variance = calculateVariance(data);
  const stdDev = Math.sqrt(variance);
  const volatility = mean !== 0 ? (stdDev / mean) * 100 : 0;

  // Determine trend
  const slopePercent = mean !== 0 ? (slope / mean) * 100 : 0;
  let trend: "increasing" | "decreasing" | "stable";

  if (slopePercent > 5) {
    trend = "increasing";
  } else if (slopePercent < -5) {
    trend = "decreasing";
  } else {
    trend = "stable";
  }

  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstAvg =
    firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  const changePercent =
    firstAvg !== 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

  return {
    trend,
    changePercent,
    averageGrowthRate,
    volatility,
  };
}

/**
 * Compare two periods of data
 */
export function comparePeriods(
  currentPeriod: { date: string; revenue: number }[],
  previousPeriod: { date: string; revenue: number }[],
): {
  currentTotal: number;
  previousTotal: number;
  percentChange: number;
  trend: "up" | "down" | "neutral";
  dailyComparison: {
    date: string;
    current: number;
    previous: number;
    change: number;
  }[];
} {
  const currentTotal = currentPeriod.reduce((sum, d) => sum + d.revenue, 0);
  const previousTotal = previousPeriod.reduce((sum, d) => sum + d.revenue, 0);

  const percentChange =
    previousTotal !== 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

  const trend =
    percentChange > 2 ? "up" : percentChange < -2 ? "down" : "neutral";

  // Align data for daily comparison
  const dailyComparison = currentPeriod.map((current, index) => {
    const previous = previousPeriod[index] || { revenue: 0 };
    const change =
      previous.revenue !== 0
        ? ((current.revenue - previous.revenue) / previous.revenue) * 100
        : 0;

    return {
      date: current.date,
      current: current.revenue,
      previous: previous.revenue,
      change,
    };
  });

  return {
    currentTotal,
    previousTotal,
    percentChange,
    trend,
    dailyComparison,
  };
}

/**
 * Calculate variance
 */
function calculateVariance(data: number[]): number {
  if (data.length === 0) return 0;

  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const squaredDiffs = data.map((val) => (val - mean) * (val - mean));

  return squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
}

/**
 * Get future date (simplified - adds days)
 */
function getFutureDate(baseDate: string, daysAhead: number): string {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split("T")[0];
}

/**
 * Detect seasonality patterns
 */
export function detectSeasonality(
  data: { date: string; revenue: number }[],
  period: number = 7, // Weekly seasonality by default
): {
  hasSeasonality: boolean;
  pattern: number[]; // Average value for each period position
  strength: number; // 0-1, how strong the pattern is
} {
  if (data.length < period * 2) {
    return {
      hasSeasonality: false,
      pattern: [],
      strength: 0,
    };
  }

  // Group by period position (e.g., day of week)
  const groups: number[][] = Array.from({ length: period }, () => []);

  data.forEach((d, index) => {
    const position = index % period;
    groups[position].push(d.revenue);
  });

  // Calculate average for each position
  const pattern = groups.map((group) => {
    return group.reduce((sum, val) => sum + val, 0) / group.length;
  });

  // Calculate strength of seasonality
  const overallMean = data.reduce((sum, d) => sum + d.revenue, 0) / data.length;
  const patternVariance = calculateVariance(pattern);
  const dataVariance = calculateVariance(data.map((d) => d.revenue));

  const strength =
    dataVariance !== 0 ? Math.min(patternVariance / dataVariance, 1) : 0;

  return {
    hasSeasonality: strength > 0.2, // Threshold for significance
    pattern,
    strength,
  };
}
