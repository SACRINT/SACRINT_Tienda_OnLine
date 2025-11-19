// Filter Sidebar Component
// Product filters for shop page

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox-field";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: "checkbox" | "radio" | "range";
  options?: FilterOption[];
  min?: number;
  max?: number;
}

export interface FilterValues {
  [key: string]: string[] | [number, number];
}

export interface FilterSidebarProps {
  filters: FilterGroup[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onClear: () => void;
  collapsible?: boolean;
  className?: string;
}

export function FilterSidebar({
  filters,
  values,
  onChange,
  onClear,
  collapsible = true,
  className,
}: FilterSidebarProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(filters.map((f) => f.id)),
  );

  const toggleGroup = (id: string) => {
    if (!collapsible) return;
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedGroups(newExpanded);
  };

  const handleCheckboxChange = (
    groupId: string,
    value: string,
    checked: boolean,
  ) => {
    const currentValues = (values[groupId] as string[]) || [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);
    onChange({ ...values, [groupId]: newValues });
  };

  const handleRadioChange = (groupId: string, value: string) => {
    onChange({ ...values, [groupId]: [value] });
  };

  const handleRangeChange = (groupId: string, range: [number, number]) => {
    onChange({ ...values, [groupId]: range });
  };

  const hasActiveFilters = Object.values(values).some((v) =>
    Array.isArray(v) ? v.length > 0 : false,
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear all
          </Button>
        )}
      </div>

      {/* Filter groups */}
      {filters.map((group) => {
        const isExpanded = expandedGroups.has(group.id);

        return (
          <div key={group.id} className="border-t pt-4">
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between text-sm font-medium"
              disabled={!collapsible}
            >
              {group.label}
              {collapsible && (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isExpanded && "rotate-180",
                  )}
                />
              )}
            </button>

            {/* Group content */}
            {isExpanded && (
              <div className="mt-3 space-y-2">
                {group.type === "checkbox" &&
                  group.options?.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(values[group.id] as string[])?.includes(
                          option.value,
                        )}
                        onChange={(e) =>
                          handleCheckboxChange(
                            group.id,
                            option.value,
                            e.target.checked,
                          )
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{option.label}</span>
                      {option.count !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          ({option.count})
                        </span>
                      )}
                    </label>
                  ))}

                {group.type === "radio" &&
                  group.options?.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={group.id}
                        checked={
                          (values[group.id] as string[])?.[0] === option.value
                        }
                        onChange={() =>
                          handleRadioChange(group.id, option.value)
                        }
                        className="border-gray-300"
                      />
                      <span className="text-sm">{option.label}</span>
                      {option.count !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          ({option.count})
                        </span>
                      )}
                    </label>
                  ))}

                {group.type === "range" &&
                  group.min !== undefined &&
                  group.max !== undefined && (
                    <PriceRangeFilter
                      min={group.min}
                      max={group.max}
                      value={
                        (values[group.id] as [number, number]) || [
                          group.min,
                          group.max,
                        ]
                      }
                      onChange={(range) => handleRangeChange(group.id, range)}
                    />
                  )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Price range filter component
interface PriceRangeFilterProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

function PriceRangeFilter({
  min,
  max,
  value,
  onChange,
}: PriceRangeFilterProps) {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localValue[1] - 1);
    setLocalValue([newMin, localValue[1]]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localValue[0] + 1);
    setLocalValue([localValue[0], newMax]);
  };

  const handleApply = () => {
    onChange(localValue);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={localValue[0]}
          onChange={handleMinChange}
          min={min}
          max={localValue[1] - 1}
          className="w-full px-2 py-1 text-sm border rounded"
          placeholder="Min"
        />
        <span className="text-muted-foreground">-</span>
        <input
          type="number"
          value={localValue[1]}
          onChange={handleMaxChange}
          min={localValue[0] + 1}
          max={max}
          className="w-full px-2 py-1 text-sm border rounded"
          placeholder="Max"
        />
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={handleApply}
      >
        Apply
      </Button>
    </div>
  );
}

// Active filters display
export interface ActiveFiltersProps {
  filters: FilterGroup[];
  values: FilterValues;
  onRemove: (groupId: string, value: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function ActiveFilters({
  filters,
  values,
  onRemove,
  onClearAll,
  className,
}: ActiveFiltersProps) {
  const activeFilters: Array<{
    groupId: string;
    groupLabel: string;
    value: string;
    label: string;
  }> = [];

  filters.forEach((group) => {
    const groupValues = values[group.id];
    if (Array.isArray(groupValues) && group.options) {
      groupValues.forEach((value) => {
        if (typeof value === "string") {
          const option = group.options?.find((o) => o.value === value);
          if (option) {
            activeFilters.push({
              groupId: group.id,
              groupLabel: group.label,
              value,
              label: option.label,
            });
          }
        }
      });
    }
  });

  if (activeFilters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {activeFilters.map((filter) => (
        <span
          key={`${filter.groupId}-${filter.value}`}
          className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-muted rounded-md"
        >
          <span className="text-muted-foreground">{filter.groupLabel}:</span>
          {filter.label}
          <button
            onClick={() => onRemove(filter.groupId, filter.value)}
            className="ml-1 hover:text-destructive"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Button variant="ghost" size="sm" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
}

export default FilterSidebar;
