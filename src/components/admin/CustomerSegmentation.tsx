"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Award,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/analytics/types";

export interface CustomerSegment {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  createdAt: string;
  rfmScore: {
    recency: number;
    frequency: number;
    monetary: number;
    total: number;
  };
  segment: "champions" | "loyal" | "at_risk" | "lost" | "new" | "promising";
}

interface CustomerSegmentationProps {
  customers: CustomerSegment[];
  summary: {
    champions: number;
    loyal: number;
    atRisk: number;
    lost: number;
    new: number;
    promising: number;
  };
}

const SEGMENT_CONFIG = {
  champions: {
    label: "Champions",
    description: "High value, frequent buyers",
    icon: Award,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    badgeColor: "bg-purple-500",
  },
  loyal: {
    label: "Loyal Customers",
    description: "Regular, consistent buyers",
    icon: TrendingUp,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    badgeColor: "bg-blue-500",
  },
  promising: {
    label: "Promising",
    description: "Recent buyers with potential",
    icon: ShoppingCart,
    color: "bg-green-100 text-green-800 border-green-200",
    badgeColor: "bg-green-500",
  },
  new: {
    label: "New Customers",
    description: "First-time buyers",
    icon: Users,
    color: "bg-cyan-100 text-cyan-800 border-cyan-200",
    badgeColor: "bg-cyan-500",
  },
  at_risk: {
    label: "At Risk",
    description: "Haven't purchased recently",
    icon: AlertCircle,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    badgeColor: "bg-yellow-500",
  },
  lost: {
    label: "Lost Customers",
    description: "Inactive for long time",
    icon: AlertCircle,
    color: "bg-red-100 text-red-800 border-red-200",
    badgeColor: "bg-red-500",
  },
};

export function CustomerSegmentation({
  customers,
  summary,
}: CustomerSegmentationProps) {
  const segmentGroups = {
    champions: customers.filter((c) => c.segment === "champions"),
    loyal: customers.filter((c) => c.segment === "loyal"),
    promising: customers.filter((c) => c.segment === "promising"),
    new: customers.filter((c) => c.segment === "new"),
    at_risk: customers.filter((c) => c.segment === "at_risk"),
    lost: customers.filter((c) => c.segment === "lost"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Customer Segmentation</h2>
        <p className="text-gray-600">
          RFM Analysis (Recency, Frequency, Monetary)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Object.entries(SEGMENT_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const count = summary[key as keyof typeof summary];
          return (
            <Card key={key}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className="h-4 w-4 text-gray-500" />
                  <div
                    className={`h-2 w-2 rounded-full ${config.badgeColor}`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-gray-500 mt-1">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Segment Details */}
      <div className="space-y-4">
        {Object.entries(segmentGroups).map(([segmentKey, segmentCustomers]) => {
          if (segmentCustomers.length === 0) return null;

          const config =
            SEGMENT_CONFIG[segmentKey as keyof typeof SEGMENT_CONFIG];
          const Icon = config.icon;

          return (
            <Card
              key={segmentKey}
              className={`border-2 ${config.color.split(" ")[2]}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {config.label}
                  <Badge variant="outline" className="ml-auto">
                    {segmentCustomers.length} customers
                  </Badge>
                </CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {segmentCustomers.slice(0, 5).map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {customer.name || customer.email}
                        </p>
                        <div className="flex gap-4 mt-1 text-sm text-gray-500">
                          <span>{customer.totalOrders} orders</span>
                          <span>{formatCurrency(customer.totalSpent)}</span>
                          {customer.lastOrderDate && (
                            <span>
                              Last:{" "}
                              {new Date(
                                customer.lastOrderDate,
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <Badge variant="outline">
                          R: {customer.rfmScore.recency}
                        </Badge>
                        <Badge variant="outline">
                          F: {customer.rfmScore.frequency}
                        </Badge>
                        <Badge variant="outline">
                          M: {customer.rfmScore.monetary}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {segmentCustomers.length > 5 && (
                    <p className="text-sm text-gray-500 text-center pt-2">
                      +{segmentCustomers.length - 5} more customers
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* RFM Score Legend */}
      <Card>
        <CardHeader>
          <CardTitle>RFM Score Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-medium mb-2">Recency (R)</h4>
              <p className="text-sm text-gray-600">
                How recently did the customer make a purchase? (1-5, 5 = most
                recent)
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Frequency (F)</h4>
              <p className="text-sm text-gray-600">
                How often do they purchase? (1-5, 5 = most frequent)
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Monetary (M)</h4>
              <p className="text-sm text-gray-600">
                How much do they spend? (1-5, 5 = highest spending)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
