"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Target,
  Zap,
  Download,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/analytics/types";
import type { RFMSegment } from "@/lib/analytics/rfm";
import {
  exportRFMSegmentSummaryCSV,
  generateFilename,
} from "@/lib/analytics/export";

interface RFMSegmentData {
  segment: RFMSegment;
  count: number;
  totalRevenue: number;
  avgRecency: number;
  avgFrequency: number;
  avgMonetary: number;
  percentage: number;
  recommendations: {
    description: string;
    actions: string[];
    priority: "high" | "medium" | "low";
  };
}

interface RFMData {
  segments: RFMSegmentData[];
  totalCustomers: number;
  totalRevenue: number;
}

interface RFMSegmentationProps {
  tenantId: string;
}

const segmentColors: Record<
  RFMSegment,
  { bg: string; text: string; border: string }
> = {
  Champions: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  "Loyal Customers": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  "Potential Loyalists": {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
  },
  "New Customers": {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  Promising: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  "Need Attention": {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  "About to Sleep": {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  "At Risk": {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  "Cannot Lose Them": {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  Hibernating: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  },
  Lost: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
};

const getPriorityIcon = (priority: "high" | "medium" | "low") => {
  switch (priority) {
    case "high":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    case "medium":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "low":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  }
};

export function RFMSegmentation({ tenantId }: RFMSegmentationProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RFMData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRFMData();
  }, [tenantId]);

  const fetchRFMData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/analytics/rfm?tenantId=${tenantId}&view=summary`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch RFM data");
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("RFM fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;
    const filename = generateFilename("rfm-segments", "csv");
    exportRFMSegmentSummaryCSV(data.segments, filename);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <p className="text-red-600">Error: {error || "No data available"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(data.totalCustomers)}
            </div>
            <p className="text-xs text-muted-foreground">
              Segmented by purchase behavior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From all customer segments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </div>

      {/* Segment Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Customer Segments</h3>

        {data.segments.map((segment) => {
          const colors = segmentColors[segment.segment];
          return (
            <Card
              key={segment.segment}
              className={`${colors.bg} ${colors.border} border-2`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className={`text-xl ${colors.text}`}>
                        {segment.segment}
                      </CardTitle>
                      <Badge
                        variant={
                          segment.recommendations.priority === "high"
                            ? "destructive"
                            : segment.recommendations.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {getPriorityIcon(segment.recommendations.priority)}
                        <span className="ml-1">
                          {segment.recommendations.priority.toUpperCase()}
                        </span>
                      </Badge>
                    </div>
                    <CardDescription className="mt-2">
                      {segment.recommendations.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Customers</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(segment.count)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {segment.percentage.toFixed(1)}% of total
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(segment.totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ${(segment.avgMonetary).toFixed(0)} avg
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Avg Recency</p>
                    <p className="text-2xl font-bold">
                      {Math.round(segment.avgRecency)}
                    </p>
                    <p className="text-xs text-muted-foreground">days ago</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Avg Orders</p>
                    <p className="text-2xl font-bold">
                      {segment.avgFrequency.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">per customer</p>
                  </div>
                </div>

                {/* Recommended Actions */}
                <div className="rounded-lg bg-white/50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <h4 className="font-semibold">Recommended Actions</h4>
                  </div>
                  <ul className="space-y-2">
                    {segment.recommendations.actions.map((action, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Zap className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-500" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <Button variant="outline" className="w-full">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Create Campaign for {segment.segment}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
