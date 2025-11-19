// Order Filters Component
// Filter controls for order list

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Search, Filter, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { BadgeCustom } from "@/components/ui/badge-custom";

export interface OrderFilters {
  search: string;
  status: string;
  paymentStatus: string;
  dateFrom: string;
  dateTo: string;
}

export interface OrderFiltersProps {
  filters: OrderFilters;
  onChange: (filters: OrderFilters) => void;
  onClear: () => void;
  className?: string;
}

export function OrderFiltersComponent({
  filters,
  onChange,
  onClear,
  className,
}: OrderFiltersProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleChange = (field: keyof OrderFilters, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  const activeFiltersCount = [
    filters.status,
    filters.paymentStatus,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  const hasFilters =
    filters.search ||
    filters.status ||
    filters.paymentStatus ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleChange("search", e.target.value)}
            placeholder="Search orders..."
            className="w-full h-10 pl-10 pr-4 border rounded-md text-sm"
          />
        </div>

        {/* Status */}
        <SelectField
          options={[
            { value: "", label: "All Status" },
            { value: "pending", label: "Pending" },
            { value: "confirmed", label: "Confirmed" },
            { value: "processing", label: "Processing" },
            { value: "shipped", label: "Shipped" },
            { value: "delivered", label: "Delivered" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          value={filters.status}
          onChange={(e) => handleChange("status", e.target.value)}
          className="w-full sm:w-40"
        />

        {/* Payment status */}
        <SelectField
          options={[
            { value: "", label: "All Payments" },
            { value: "pending", label: "Pending" },
            { value: "paid", label: "Paid" },
            { value: "failed", label: "Failed" },
            { value: "refunded", label: "Refunded" },
          ]}
          value={filters.paymentStatus}
          onChange={(e) => handleChange("paymentStatus", e.target.value)}
          className="w-full sm:w-40"
        />

        {/* Advanced toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
              {activeFiltersCount}
            </span>
          )}
        </Button>

        {/* Clear */}
        {hasFilters && (
          <Button variant="ghost" onClick={onClear}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium mb-3">Date Range</h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">From</label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleChange("dateFrom", e.target.value)}
                  className="w-full h-10 pl-10 pr-4 border rounded-md text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">To</label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleChange("dateTo", e.target.value)}
                  className="w-full h-10 pl-10 pr-4 border rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active filters */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.status && (
            <BadgeCustom
              variant="secondary"
              removable
              onRemove={() => handleChange("status", "")}
            >
              Status: {filters.status}
            </BadgeCustom>
          )}
          {filters.paymentStatus && (
            <BadgeCustom
              variant="secondary"
              removable
              onRemove={() => handleChange("paymentStatus", "")}
            >
              Payment: {filters.paymentStatus}
            </BadgeCustom>
          )}
          {filters.dateFrom && (
            <BadgeCustom
              variant="secondary"
              removable
              onRemove={() => handleChange("dateFrom", "")}
            >
              From: {filters.dateFrom}
            </BadgeCustom>
          )}
          {filters.dateTo && (
            <BadgeCustom
              variant="secondary"
              removable
              onRemove={() => handleChange("dateTo", "")}
            >
              To: {filters.dateTo}
            </BadgeCustom>
          )}
        </div>
      )}
    </div>
  );
}

export default OrderFiltersComponent;
