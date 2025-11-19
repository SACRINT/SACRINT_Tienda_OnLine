// Product and Category Validation Schemas
// Complete Zod schemas for Sprint 2 - Products & Categories

import { z } from "zod";

// ============ CATEGORY SCHEMAS ============

export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name must not exceed 100 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug must not exceed 100 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  image: z.string().url("Image must be a valid URL").optional(),
  parentId: z.string().uuid("Invalid parent category ID").optional().nullable(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

// ============ PRODUCT SCHEMAS ============

export const CreateProductSchema = z.object({
  name: z
    .string()
    .min(3, "Product name must be at least 3 characters")
    .max(255, "Product name must not exceed 255 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug must not exceed 100 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000, "Description must not exceed 5000 characters"),
  shortDescription: z
    .string()
    .min(10, "Short description must be at least 10 characters")
    .max(200, "Short description must not exceed 200 characters")
    .optional(),
  sku: z
    .string()
    .regex(
      /^[A-Z0-9-]+$/,
      "SKU can only contain uppercase letters, numbers, and hyphens",
    )
    .min(3, "SKU must be at least 3 characters")
    .max(50, "SKU must not exceed 50 characters"),

  // Pricing
  basePrice: z.coerce
    .number()
    .positive("Base price must be positive")
    .max(1000000, "Base price is too high"),
  salePrice: z.coerce
    .number()
    .positive("Sale price must be positive")
    .max(1000000, "Sale price is too high")
    .optional()
    .nullable(),
  salePriceExpiresAt: z.coerce.date().optional().nullable(),

  // Inventory
  stock: z.coerce
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative"),
  lowStockThreshold: z.coerce
    .number()
    .int("Low stock threshold must be an integer")
    .min(0, "Low stock threshold cannot be negative")
    .default(5),

  // Logistics (dimensions in cm, weight in kg)
  weight: z.coerce
    .number()
    .positive("Weight must be positive")
    .max(1000, "Weight is too high"),
  length: z.coerce
    .number()
    .positive("Length must be positive")
    .max(500, "Length is too high"),
  width: z.coerce
    .number()
    .positive("Width must be positive")
    .max(500, "Width is too high"),
  height: z.coerce
    .number()
    .positive("Height must be positive")
    .max(500, "Height is too high"),

  // Metadata
  categoryId: z.string().uuid("Invalid category ID"),
  tags: z.array(z.string()).default([]),
  seo: z
    .object({
      title: z.string().max(60).optional(),
      description: z.string().max(160).optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),

  // Status
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
});

export const UpdateProductSchema = CreateProductSchema.partial();

// ============ PRODUCT IMAGE SCHEMAS ============

export const CreateProductImageSchema = z.object({
  url: z.string().url("Image URL must be valid"),
  alt: z
    .string()
    .max(200, "Alt text must not exceed 200 characters")
    .optional(),
  order: z.number().int().min(0).default(0),
  isVideo: z.boolean().default(false),
});

export const UpdateProductImageSchema = CreateProductImageSchema.partial();

// ============ PRODUCT VARIANT SCHEMAS ============

export const CreateProductVariantSchema = z.object({
  size: z.string().max(50).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  sku: z
    .string()
    .regex(
      /^[A-Z0-9-]+$/,
      "SKU can only contain uppercase letters, numbers, and hyphens",
    )
    .min(3, "SKU must be at least 3 characters"),
  price: z.coerce
    .number()
    .positive("Price must be positive")
    .optional()
    .nullable(),
  stock: z.coerce
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative"),
  imageId: z.string().uuid().optional().nullable(),
});

export const UpdateProductVariantSchema = CreateProductVariantSchema.partial();

// ============ FILTER SCHEMAS ============

export const ProductFilterSchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // Filters
  categoryId: z.string().uuid().optional(),
  search: z.string().min(1).max(200).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  inStock: z.coerce.boolean().optional(),
  published: z.coerce.boolean().optional(),
  featured: z.coerce.boolean().optional(),
  tags: z.string().optional(), // comma-separated

  // Sorting
  sort: z
    .enum([
      "newest",
      "oldest",
      "price-asc",
      "price-desc",
      "name-asc",
      "name-desc",
      "stock-asc",
      "stock-desc",
    ])
    .default("newest"),
});

export const CategoryFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  parentId: z.string().uuid().optional().nullable(),
  search: z.string().min(1).max(200).optional(),
});

// ============ SEARCH SCHEMA ============

export const ProductSearchSchema = z.object({
  q: z
    .string()
    .min(1, "Search query must not be empty")
    .max(200, "Search query is too long"),
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ============ TYPE INFERENCE ============

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateProductImageInput = z.infer<typeof CreateProductImageSchema>;
export type CreateProductVariantInput = z.infer<
  typeof CreateProductVariantSchema
>;
export type ProductFilters = z.infer<typeof ProductFilterSchema>;
export type CategoryFilters = z.infer<typeof CategoryFilterSchema>;
export type ProductSearchInput = z.infer<typeof ProductSearchSchema>;
