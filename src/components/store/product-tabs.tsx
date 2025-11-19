// Product Tabs Component
// Tabbed content for product details

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProductTab {
  id: string;
  label: string;
  content: React.ReactNode;
  badge?: number;
}

export interface ProductTabsProps {
  tabs: ProductTab[];
  defaultTab?: string;
  className?: string;
}

export function ProductTabs({ tabs, defaultTab, className }: ProductTabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Tab headers */}
      <div className="border-b">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground",
              )}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="min-h-[200px]">{activeContent}</div>
    </div>
  );
}

// Product Description Tab Content
export interface ProductDescriptionProps {
  description: string;
  features?: string[];
  specifications?: Record<string, string>;
  className?: string;
}

export function ProductDescription({
  description,
  features,
  specifications,
  className,
}: ProductDescriptionProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Description */}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <p className="whitespace-pre-wrap">{description}</p>
      </div>

      {/* Features */}
      {features && features.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Features</h3>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Specifications */}
      {specifications && Object.keys(specifications).length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Specifications</h3>
          <dl className="divide-y">
            {Object.entries(specifications).map(([key, value]) => (
              <div key={key} className="flex py-2 text-sm">
                <dt className="w-1/3 text-muted-foreground">{key}</dt>
                <dd className="w-2/3 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

// Shipping Info Tab Content
export interface ShippingInfoProps {
  shippingOptions?: Array<{
    name: string;
    price: string;
    time: string;
  }>;
  returnPolicy?: string;
  className?: string;
}

export function ShippingInfo({
  shippingOptions = [
    { name: "Standard Shipping", price: "$4.99", time: "5-7 business days" },
    { name: "Express Shipping", price: "$9.99", time: "2-3 business days" },
    { name: "Free Shipping", price: "Free", time: "7-10 business days" },
  ],
  returnPolicy = "We offer a 30-day return policy on all items. Products must be in original condition with tags attached. Refunds will be processed within 5-7 business days after we receive your return.",
  className,
}: ShippingInfoProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Shipping options */}
      <div className="space-y-3">
        <h3 className="font-medium">Shipping Options</h3>
        <div className="space-y-3">
          {shippingOptions.map((option, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div>
                <p className="font-medium">{option.name}</p>
                <p className="text-sm text-muted-foreground">{option.time}</p>
              </div>
              <span className="font-medium">{option.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Return policy */}
      <div className="space-y-3">
        <h3 className="font-medium">Return Policy</h3>
        <p className="text-sm text-muted-foreground">{returnPolicy}</p>
      </div>
    </div>
  );
}

export default ProductTabs;
