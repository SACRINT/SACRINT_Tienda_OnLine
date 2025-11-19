"use client";

import { useState } from "react";
import {
  Trash2,
  Edit,
  Tag,
  Package,
  DollarSign,
  Eye,
  EyeOff,
  Download,
  Upload,
} from "lucide-react";

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: "default" | "danger" | "success";
  requiresInput?: boolean;
}

interface BulkActionsProps {
  selectedCount: number;
  actions: BulkAction[];
  onAction: (actionId: string, value?: any) => void;
  onClear: () => void;
}

export function BulkActions({
  selectedCount,
  actions,
  onAction,
  onClear,
}: BulkActionsProps) {
  const [showInputFor, setShowInputFor] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  const handleAction = (action: BulkAction) => {
    if (action.requiresInput) {
      setShowInputFor(action.id);
    } else {
      onAction(action.id);
    }
  };

  const handleSubmitInput = (actionId: string) => {
    onAction(actionId, inputValue);
    setShowInputFor(null);
    setInputValue("");
  };

  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-10 bg-blue-50 border-y border-blue-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-blue-900">
            {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
          </p>

          <div className="flex items-center gap-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    action.variant === "danger"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : action.variant === "success"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClear}
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          Clear selection
        </button>
      </div>

      {/* Input Dialog */}
      {showInputFor && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white p-3 border border-blue-200">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Enter value for ${actions.find((a) => a.id === showInputFor)?.label}`}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={() => handleSubmitInput(showInputFor)}
            disabled={!inputValue}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setShowInputFor(null);
              setInputValue("");
            }}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// Predefined bulk actions for products
export const PRODUCT_BULK_ACTIONS: BulkAction[] = [
  {
    id: "delete",
    label: "Delete",
    icon: Trash2,
    variant: "danger",
  },
  {
    id: "publish",
    label: "Publish",
    icon: Eye,
    variant: "success",
  },
  {
    id: "unpublish",
    label: "Unpublish",
    icon: EyeOff,
    variant: "default",
  },
  {
    id: "updatePrice",
    label: "Update Price",
    icon: DollarSign,
    variant: "default",
    requiresInput: true,
  },
  {
    id: "updateStock",
    label: "Update Stock",
    icon: Package,
    variant: "default",
    requiresInput: true,
  },
  {
    id: "assignCategory",
    label: "Assign Category",
    icon: Tag,
    variant: "default",
    requiresInput: true,
  },
  {
    id: "export",
    label: "Export CSV",
    icon: Download,
    variant: "default",
  },
];

// Predefined bulk actions for orders
export const ORDER_BULK_ACTIONS: BulkAction[] = [
  {
    id: "markProcessing",
    label: "Mark Processing",
    icon: Package,
    variant: "default",
  },
  {
    id: "markShipped",
    label: "Mark Shipped",
    icon: Package,
    variant: "success",
  },
  {
    id: "export",
    label: "Export CSV",
    icon: Download,
    variant: "default",
  },
];

// Predefined bulk actions for customers
export const CUSTOMER_BULK_ACTIONS: BulkAction[] = [
  {
    id: "export",
    label: "Export CSV",
    icon: Download,
    variant: "default",
  },
  {
    id: "sendEmail",
    label: "Send Email",
    icon: Edit,
    variant: "default",
  },
];
