/**
 * Product Form Component
 * Semana 10.2: Create Product Form
 *
 * Formulario completo para crear/editar productos
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Save, X } from "lucide-react";

// Validation schema
const productSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(200),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres").max(5000),
  sku: z.string().min(1, "El SKU es requerido").regex(/^[A-Z0-9-]+$/, "Solo letras mayúsculas, números y guiones"),
  basePrice: z.number().positive("El precio debe ser positivo"),
  salePrice: z.number().positive().optional().or(z.literal(0)),
  cost: z.number().positive().optional().or(z.literal(0)),
  stock: z.number().int().nonnegative("El stock no puede ser negativo"),
  categoryId: z.string().min(1, "La categoría es requerida"),
  published: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  storeId: string;
  categories: Array<{ id: string; name: string }>;
  initialData?: Partial<ProductFormData>;
  productId?: string;
}

export function ProductForm({
  storeId,
  categories,
  initialData,
  productId,
}: ProductFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    sku: initialData?.sku || "",
    basePrice: initialData?.basePrice || 0,
    salePrice: initialData?.salePrice || 0,
    cost: initialData?.cost || 0,
    stock: initialData?.stock || 0,
    categoryId: initialData?.categoryId || "",
    published: initialData?.published || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;

    if (type === "number") {
      parsedValue = parseFloat(value) || 0;
    } else if (type === "checkbox") {
      parsedValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({ ...prev, [name]: parsedValue }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate
      productSchema.parse(formData);

      setIsSubmitting(true);

      const url = productId
        ? `/api/products/${productId}`
        : "/api/products";
      const method = productId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          tenantId: storeId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al guardar el producto");
      }

      const result = await response.json();

      // Redirect to products list
      router.push(`/dashboard/${storeId}/products`);
      router.refresh();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Error */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {errors.general}
        </div>
      )}

      {/* Información Básica */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Básica
        </h3>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ej: Camiseta Deportiva"
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Describe las características del producto..."
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length} / 5000 caracteres
            </p>
          </div>

          {/* SKU and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sku ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="PROD-001"
              />
              {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku}</p>}
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.categoryId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-red-600 text-sm mt-1">{errors.categoryId}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Precios */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Precios e Inventario
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Base Price */}
          <div>
            <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-1">
              Precio Base *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="basePrice"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                step="0.01"
                className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.basePrice ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.basePrice && <p className="text-red-600 text-sm mt-1">{errors.basePrice}</p>}
          </div>

          {/* Sale Price */}
          <div>
            <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-1">
              Precio de Oferta (Opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="salePrice"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleChange}
                step="0.01"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Cost */}
          <div>
            <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
              Costo (Opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="cost"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                step="0.01"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Stock */}
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
              Stock *
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.stock ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="0"
            />
            {errors.stock && <p className="text-red-600 text-sm mt-1">{errors.stock}</p>}
          </div>
        </div>
      </div>

      {/* Publishing */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Publicación
        </h3>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="published"
            checked={formData.published}
            onChange={handleChange}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">
            Publicar producto inmediatamente
          </span>
        </label>
        <p className="text-sm text-gray-500 mt-2">
          Los productos no publicados se guardarán como borradores
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          <X className="w-4 h-4 inline mr-2" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4 inline mr-2" />
          {isSubmitting ? "Guardando..." : productId ? "Actualizar Producto" : "Crear Producto"}
        </button>
      </div>
    </form>
  );
}
