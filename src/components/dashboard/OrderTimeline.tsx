"use client";

import { Clock, CreditCard, Package, Truck, CheckCircle, XCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  status: string;
  timestamp: Date;
  description?: string;
  trackingNumber?: string;
  location?: string;
}

interface OrderTimelineProps {
  events: TimelineEvent[];
  currentStatus: string;
}

const statusConfig = {
  PENDING: {
    label: "Pendiente",
    icon: Clock,
    color: "text-warning bg-warning/10 border-warning",
  },
  PROCESSING: {
    label: "Procesando",
    icon: Package,
    color: "text-info bg-info/10 border-info",
  },
  PAID: {
    label: "Pagado",
    icon: CreditCard,
    color: "text-success bg-success/10 border-success",
  },
  SHIPPED: {
    label: "Enviado",
    icon: Truck,
    color: "text-accent bg-accent/10 border-accent",
  },
  DELIVERED: {
    label: "Entregado",
    icon: CheckCircle,
    color: "text-success bg-success/10 border-success",
  },
  CANCELLED: {
    label: "Cancelado",
    icon: XCircle,
    color: "text-error bg-error/10 border-error",
  },
  FAILED: {
    label: "Fallido",
    icon: XCircle,
    color: "text-error bg-error/10 border-error",
  },
};

const defaultEvents: TimelineEvent[] = [
  {
    id: "1",
    status: "PENDING",
    timestamp: new Date(),
    description: "Orden recibida",
  },
];

export function OrderTimeline({ events = defaultEvents, currentStatus }: OrderTimelineProps) {
  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const config = statusConfig[event.status as keyof typeof statusConfig];
        const Icon = config?.icon || Clock;
        const isLast = index === events.length - 1;
        const isCurrent = event.status === currentStatus;

        return (
          <div key={event.id} className="flex gap-4">
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2",
                  isCurrent ? config?.color : "border-border bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              {!isLast && <div className="mt-2 h-full min-h-[40px] w-0.5 bg-border" />}
            </div>

            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className={cn("font-medium", isCurrent && "text-primary")}>
                    {config?.label || event.status}
                  </p>
                  {event.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</p>
              </div>

              {/* Additional Info */}
              {(event.trackingNumber || event.location) && (
                <div className="mt-2 space-y-1 rounded-lg bg-muted p-3 text-sm">
                  {event.trackingNumber && (
                    <p>
                      <span className="font-medium">Guía:</span> {event.trackingNumber}
                    </p>
                  )}
                  {event.location && (
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Status Progress Bar Component
interface StatusProgressProps {
  currentStatus: string;
}

const statusOrder = ["PENDING", "PROCESSING", "PROCESSING", "SHIPPED", "DELIVERED"];

export function OrderStatusProgress({ currentStatus }: StatusProgressProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const isCancelled = currentStatus === "CANCELLED" || currentStatus === "FAILED";

  if (isCancelled) {
    return (
      <div className="bg-error/10 rounded-lg p-4 text-center">
        <XCircle className="text-error mx-auto mb-2 h-8 w-8" />
        <p className="text-error font-medium">
          {currentStatus === "CANCELLED" ? "Orden Cancelada" : "Orden Fallida"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        {statusOrder.map((status, index) => {
          const config = statusConfig[status as keyof typeof statusConfig];
          const Icon = config?.icon || Clock;
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={status}
              className={cn(
                "flex flex-col items-center",
                isCompleted ? "text-primary" : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "mb-2 flex h-10 w-10 items-center justify-center rounded-full",
                  isCompleted
                    ? isCurrent
                      ? "text-primary-foreground bg-primary"
                      : "bg-primary/20 text-primary"
                    : "bg-muted",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="hidden text-center text-xs sm:block">{config?.label}</span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute left-0 top-0 h-full bg-primary transition-all duration-500"
          style={{
            width: `${((currentIndex + 1) / statusOrder.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
