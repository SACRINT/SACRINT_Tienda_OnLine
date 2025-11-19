// Activity Feed Component
// Recent activity log for dashboard

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ShoppingCart,
  Package,
  User,
  Star,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  LucideIcon,
} from "lucide-react";
import { AvatarCustom } from "@/components/ui/avatar-custom";

export type ActivityType =
  | "order"
  | "product"
  | "customer"
  | "review"
  | "message"
  | "alert"
  | "success";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
  link?: string;
}

export interface ActivityFeedProps {
  activities: Activity[];
  onViewAll?: () => void;
  onActivityClick?: (activityId: string) => void;
  loading?: boolean;
  maxItems?: number;
  className?: string;
}

const activityIcons: Record<ActivityType, LucideIcon> = {
  order: ShoppingCart,
  product: Package,
  customer: User,
  review: Star,
  message: MessageSquare,
  alert: AlertCircle,
  success: CheckCircle,
};

const activityColors: Record<ActivityType, string> = {
  order: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
  product: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
  customer: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
  review: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400",
  message: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400",
  alert: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
  success: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
};

export function ActivityFeed({
  activities,
  onViewAll,
  onActivityClick,
  loading,
  maxItems = 10,
  className,
}: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Recent Activity</h3>
        {onViewAll && activities.length > maxItems && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary hover:underline"
          >
            View all
          </button>
        )}
      </div>

      {/* Activity list */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
        </div>
      ) : activities.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No recent activity
        </div>
      ) : (
        <div className="divide-y">
          {displayedActivities.map((activity) => {
            const Icon = activityIcons[activity.type];
            return (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start gap-3 p-4",
                  onActivityClick && "cursor-pointer hover:bg-muted/50"
                )}
                onClick={() => onActivityClick?.(activity.id)}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    activityColors[activity.type]
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {activity.user && (
                      <div className="flex items-center gap-1">
                        <AvatarCustom
                          src={activity.user.avatar}
                          name={activity.user.name}
                          size="xs"
                        />
                        <span className="text-xs text-muted-foreground">
                          {activity.user.name}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {activity.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;
