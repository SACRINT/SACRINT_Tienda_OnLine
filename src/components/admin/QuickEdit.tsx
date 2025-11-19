"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2 } from "lucide-react";

interface QuickEditProps {
  entityId: string;
  tenantId: string;
  field: "price" | "stock" | "status" | "name" | "description";
  currentValue: any;
  entityType?: "product" | "order" | "customer";
  onSuccess?: () => void;
}

export function QuickEdit({
  entityId,
  tenantId,
  field,
  currentValue,
  entityType = "product",
  onSuccess,
}: QuickEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentValue);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const endpoint = `/api/${entityType}s/${entityId}`;
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          [field]:
            field === "price" || field === "stock" ? parseFloat(value) : value,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Quick edit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValue(currentValue);
    setIsEditing(false);
  };

  const renderInput = () => {
    switch (field) {
      case "price":
      case "stock":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 w-32"
            step={field === "price" ? "0.01" : "1"}
            min="0"
            autoFocus
          />
        );

      case "status":
        return (
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entityType === "product" && (
                <>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </>
              )}
              {entityType === "order" && (
                <>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        );

      case "name":
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 w-64"
            autoFocus
          />
        );

      case "description":
        return (
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-[100px]"
            autoFocus
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-8"
            autoFocus
          />
        );
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-left hover:text-primary hover:underline focus:outline-none"
      >
        {currentValue}
      </button>
    );
  }

  if (field === "description") {
    // Use dialog for larger fields
    return (
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {field}</DialogTitle>
            <DialogDescription>Make changes and click save</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="value">Description</Label>
              {renderInput()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Inline editing for small fields
  return (
    <div className="flex items-center gap-2">
      {renderInput()}
      <div className="flex gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4 text-green-600" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleCancel}
          disabled={loading}
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
}

// Quick Edit API endpoint helper
export async function quickEditProduct(
  productId: string,
  tenantId: string,
  updates: Record<string, any>,
) {
  const res = await fetch(`/api/products/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenantId,
      ...updates,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to update product");
  }

  return res.json();
}
