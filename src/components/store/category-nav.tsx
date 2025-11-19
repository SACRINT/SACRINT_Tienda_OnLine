// Category Navigation Component
// Hierarchical category navigation for store

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown } from "lucide-react";

export interface Category {
  id: string;
  name: string;
  slug: string;
  count?: number;
  children?: Category[];
}

export interface CategoryNavProps {
  categories: Category[];
  selectedCategory?: string;
  onCategorySelect?: (categorySlug: string) => void;
  showCounts?: boolean;
  collapsible?: boolean;
  className?: string;
}

export function CategoryNav({
  categories,
  selectedCategory,
  onCategorySelect,
  showCounts = true,
  collapsible = true,
  className,
}: CategoryNavProps) {
  return (
    <nav className={cn("space-y-1", className)} aria-label="Categories">
      {categories.map((category) => (
        <CategoryItem
          key={category.id}
          category={category}
          selectedCategory={selectedCategory}
          onCategorySelect={onCategorySelect}
          showCounts={showCounts}
          collapsible={collapsible}
          level={0}
        />
      ))}
    </nav>
  );
}

interface CategoryItemProps {
  category: Category;
  selectedCategory?: string;
  onCategorySelect?: (categorySlug: string) => void;
  showCounts: boolean;
  collapsible: boolean;
  level: number;
}

function CategoryItem({
  category,
  selectedCategory,
  onCategorySelect,
  showCounts,
  collapsible,
  level,
}: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(
    selectedCategory?.startsWith(category.slug) || false,
  );
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedCategory === category.slug;

  const handleClick = () => {
    onCategorySelect?.(category.slug);
    if (collapsible && hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
          isSelected
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-muted",
          level > 0 && "pl-6",
        )}
        aria-current={isSelected ? "page" : undefined}
      >
        <div className="flex items-center gap-2">
          {collapsible && hasChildren && (
            <span className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          )}
          <span>{category.name}</span>
        </div>
        {showCounts && category.count !== undefined && (
          <span className="text-xs text-muted-foreground">
            {category.count}
          </span>
        )}
      </button>

      {hasChildren && isExpanded && (
        <div className="mt-1 ml-4 border-l pl-2">
          {category.children!.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              selectedCategory={selectedCategory}
              onCategorySelect={onCategorySelect}
              showCounts={showCounts}
              collapsible={collapsible}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Horizontal category tabs
export interface CategoryTabsProps {
  categories: Category[];
  selectedCategory?: string;
  onCategorySelect?: (categorySlug: string) => void;
  showAll?: boolean;
  className?: string;
}

export function CategoryTabs({
  categories,
  selectedCategory,
  onCategorySelect,
  showAll = true,
  className,
}: CategoryTabsProps) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2", className)}>
      {showAll && (
        <button
          onClick={() => onCategorySelect?.("")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
            !selectedCategory
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80",
          )}
        >
          All
        </button>
      )}
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategorySelect?.(category.slug)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors",
            selectedCategory === category.slug
              ? "bg-primary text-primary-foreground"
              : "bg-muted hover:bg-muted/80",
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

// Breadcrumb navigation
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn("flex", className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            {item.href && index < items.length - 1 ? (
              <a
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={cn(
                  "text-sm",
                  index === items.length - 1
                    ? "font-medium"
                    : "text-muted-foreground",
                )}
                aria-current={index === items.length - 1 ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default CategoryNav;
