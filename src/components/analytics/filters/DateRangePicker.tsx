"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { DATE_PERIODS, DatePeriod } from "@/lib/analytics/types";

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const PREDEFINED_RANGES: {
  label: string;
  value: DatePeriod;
  getDates: () => DateRange;
}[] = [
  {
    label: "Today",
    value: "today",
    getDates: () => ({
      startDate: startOfDay(new Date()),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    label: "Yesterday",
    value: "yesterday",
    getDates: () => ({
      startDate: startOfDay(subDays(new Date(), 1)),
      endDate: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    label: "Last 7 days",
    value: "last7days",
    getDates: () => ({
      startDate: startOfDay(subDays(new Date(), 6)),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 days",
    value: "last30days",
    getDates: () => ({
      startDate: startOfDay(subDays(new Date(), 29)),
      endDate: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 90 days",
    value: "last90days",
    getDates: () => ({
      startDate: startOfDay(subDays(new Date(), 89)),
      endDate: endOfDay(new Date()),
    }),
  },
];

export function DateRangePicker({
  value,
  onChange,
  className = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriod>("last7days");

  const handlePredefinedRange = (range: (typeof PREDEFINED_RANGES)[0]) => {
    setSelectedPeriod(range.value);
    onChange(range.getDates());
    setIsOpen(false);
  };

  const formatDateRange = () => {
    return `${format(value.startDate, "MMM d, yyyy")} - ${format(value.endDate, "MMM d, yyyy")}`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Calendar className="h-4 w-4 text-gray-500" />
        <span>{formatDateRange()}</span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="p-2">
              {PREDEFINED_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handlePredefinedRange(range)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selectedPeriod === range.value
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Custom Range Section */}
            <div className="border-t border-gray-200 p-2">
              <button
                className="w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  // TODO: Open custom date picker modal
                  console.log("Custom range picker - TODO");
                }}
              >
                Custom Range...
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Simplified version for mobile
export function MobileDateRangePicker({
  value,
  onChange,
  className = "",
}: DateRangePickerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<DatePeriod>("last7days");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const period = e.target.value as DatePeriod;
    setSelectedPeriod(period);
    const range = PREDEFINED_RANGES.find((r) => r.value === period);
    if (range) {
      onChange(range.getDates());
    }
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedPeriod}
        onChange={handleChange}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {PREDEFINED_RANGES.map((range) => (
          <option key={range.value} value={range.value}>
            {range.label}
          </option>
        ))}
        <option value="custom">Custom Range</option>
      </select>
    </div>
  );
}
