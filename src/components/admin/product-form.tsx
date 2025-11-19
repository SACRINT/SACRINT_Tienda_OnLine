// Product Form Component
// Form for creating/editing products

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Upload, X, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField, FormSection } from "@/components/ui/form-field";
import { SelectField } from "@/components/ui/select-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { NumberInput } from "@/components/ui/number-input";

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  price: number;
  salePrice?: number;
  cost?: number;
  stock: number;
  categoryId: string;
  status: "active" | "draft" | "archived";
  images: string[];
  variants: ProductVariant[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  categories: Array<{ value: string; label: string }>;
  onSubmit: (data: ProductFormData) => void;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

export function ProductForm({
  initialData,
  categories,
  onSubmit,
  onCancel,
  loading,
  className,
}: ProductFormProps) {
  const [formData, setFormData] = React.useState<ProductFormData>({
    name: "",
    description: "",
    sku: "",
    price: 0,
    stock: 0,
    categoryId: "",
    status: "draft",
    images: [],
    variants: [],
    tags: [],
    ...initialData,
  });

  const [tagInput, setTagInput] = React.useState("");

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleChange("tags", [...formData.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleChange(
      "tags",
      formData.tags.filter((t) => t !== tag)
    );
  };

  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      name: "",
      sku: "",
      price: formData.price,
      stock: 0,
      attributes: {},
    };
    handleChange("variants", [...formData.variants, newVariant]);
  };

  const handleUpdateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: any
  ) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    handleChange("variants", newVariants);
  };

  const handleRemoveVariant = (index: number) => {
    handleChange(
      "variants",
      formData.variants.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-8", className)}>
      {/* Basic info */}
      <FormSection title="Basic Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Product Name" required className="sm:col-span-2">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </FormField>

          <FormField label="SKU" required>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </FormField>

          <FormField label="Category" required>
            <SelectField
              options={categories}
              value={formData.categoryId}
              onChange={(e) => handleChange("categoryId", e.target.value)}
              placeholder="Select category"
            />
          </FormField>

          <FormField label="Description" className="sm:col-span-2">
            <TextareaField
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              autoResize
              showCount
              maxLength={500}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Pricing */}
      <FormSection title="Pricing">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Price" required>
            <NumberInput
              value={formData.price}
              onChange={(value) => handleChange("price", value)}
              min={0}
              step={0.01}
            />
          </FormField>

          <FormField label="Sale Price">
            <NumberInput
              value={formData.salePrice || 0}
              onChange={(value) =>
                handleChange("salePrice", value || undefined)
              }
              min={0}
              step={0.01}
            />
          </FormField>

          <FormField label="Cost">
            <NumberInput
              value={formData.cost || 0}
              onChange={(value) => handleChange("cost", value || undefined)}
              min={0}
              step={0.01}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Inventory */}
      <FormSection title="Inventory">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Stock Quantity" required>
            <NumberInput
              value={formData.stock}
              onChange={(value) => handleChange("stock", value)}
              min={0}
            />
          </FormField>

          <FormField label="Status" required>
            <SelectField
              options={[
                { value: "active", label: "Active" },
                { value: "draft", label: "Draft" },
                { value: "archived", label: "Archived" },
              ]}
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value)}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Variants */}
      <FormSection title="Variants" description="Add product variations like size or color">
        <div className="space-y-4">
          {formData.variants.map((variant, index) => (
            <div key={variant.id} className="flex items-start gap-2 p-4 border rounded-lg">
              <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
              <div className="flex-1 grid gap-3 sm:grid-cols-4">
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) =>
                    handleUpdateVariant(index, "name", e.target.value)
                  }
                  placeholder="Variant name"
                  className="px-3 py-2 border rounded-md text-sm"
                />
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(e) =>
                    handleUpdateVariant(index, "sku", e.target.value)
                  }
                  placeholder="SKU"
                  className="px-3 py-2 border rounded-md text-sm"
                />
                <input
                  type="number"
                  value={variant.price}
                  onChange={(e) =>
                    handleUpdateVariant(index, "price", Number(e.target.value))
                  }
                  placeholder="Price"
                  className="px-3 py-2 border rounded-md text-sm"
                />
                <input
                  type="number"
                  value={variant.stock}
                  onChange={(e) =>
                    handleUpdateVariant(index, "stock", Number(e.target.value))
                  }
                  placeholder="Stock"
                  className="px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveVariant(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={handleAddVariant}>
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        </div>
      </FormSection>

      {/* Tags */}
      <FormSection title="Tags">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
              placeholder="Add a tag"
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>
              Add
            </Button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </FormSection>

      {/* SEO */}
      <FormSection title="SEO" description="Optimize for search engines">
        <div className="space-y-4">
          <FormField label="SEO Title">
            <input
              type="text"
              value={formData.seoTitle || ""}
              onChange={(e) => handleChange("seoTitle", e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              maxLength={60}
            />
          </FormField>

          <FormField label="SEO Description">
            <TextareaField
              value={formData.seoDescription || ""}
              onChange={(e) => handleChange("seoDescription", e.target.value)}
              showCount
              maxLength={160}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : initialData ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
