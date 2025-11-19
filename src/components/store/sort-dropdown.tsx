// Sort Dropdown Component
// Product sorting options

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ArrowUpDown } from "lucide-react";

export interface SortOption {
  value: string;
  label: string;
}

export interface SortDropdownProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

const defaultOptions: SortOption[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "name-asc", label: "Name: A-Z" },
  { value: "name-desc", label: "Name: Z-A" },
];

export function SortDropdown({
  options = defaultOptions,
  value,
  onChange,
  label = "Sort by",
  className,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <ArrowUpDown className="h-4 w-4" />
        <span>
          {label}: {selectedOption?.label || "Select"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-background border rounded-md shadow-lg z-10">
          <ul role="listbox" className="py-1">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-muted",
                    option.value === value && "bg-muted font-medium"
                  )}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// View count dropdown
export interface ViewCountDropdownProps {
  options?: number[];
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export function ViewCountDropdown({
  options = [12, 24, 48, 96],
  value,
  onChange,
  className,
}: ViewCountDropdownProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="text-muted-foreground">Show:</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-2 py-1 border rounded-md bg-background"
      >
        {options.map((count) => (
          <option key={count} value={count}>
            {count}
          </option>
        ))}
      </select>
    </div>
  );
}

// Combined toolbar
export interface ProductToolbarProps {
  totalResults: number;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions?: SortOption[];
  viewCount?: number;
  onViewCountChange?: (count: number) => void;
  viewCountOptions?: number[];
  className?: string;
}

export function ProductToolbar({
  totalResults,
  sortValue,
  onSortChange,
  sortOptions = defaultOptions,
  viewCount,
  onViewCountChange,
  viewCountOptions,
  className,
}: ProductToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        {totalResults} {totalResults === 1 ? "result" : "results"}
      </p>

      <div className="flex items-center gap-4">
        {viewCount !== undefined && onViewCountChange && (
          <ViewCountDropdown
            value={viewCount}
            onChange={onViewCountChange}
            options={viewCountOptions}
          />
        )}
        <SortDropdown
          options={sortOptions}
          value={sortValue}
          onChange={onSortChange}
        />
      </div>
    </div>
  );
}

export default SortDropdown;
