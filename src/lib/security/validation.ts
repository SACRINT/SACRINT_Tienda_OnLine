// Zod validation schemas
// Reutilizable schemas para validación en APIs

import { z } from "zod";

// Common validation schemas
export const Schemas = {
  UUID: z.string().uuid("Invalid UUID format"),
  EMAIL: z.string().email("Invalid email format"),
  PRICE: z.number().positive("Price must be positive"),
  SKU: z.string().regex(/^[A-Z0-9-]+$/, "Invalid SKU format"),
  PHONE: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number"),
  POSTAL_CODE: z.string().regex(/^\d{5}$/, "Invalid postal code"),
};

// Product validation
export const CreateProductSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().min(10).max(5000),
  sku: Schemas.SKU,
  basePrice: Schemas.PRICE,
  stock: z.number().int().min(0),
  tenantId: Schemas.UUID,
  categoryId: Schemas.UUID,
  published: z.boolean().default(false),
});

// User validation
export const CreateUserSchema = z.object({
  email: Schemas.EMAIL,
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(100),
  tenantId: Schemas.UUID.optional(),
});
