/**
 * Store Info Form
 * Semana 9.7: Settings Page - Store Information
 *
 * Formulario para editar información básica de la tienda
 */

"use client";

import { useState } from "react";
import { Tenant } from "@prisma/client";
import { z } from "zod";
import { useRouter } from "next/navigation";

const storeInfoSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  logo: z.string().url("URL de logo inválida").optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Color inválido"),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Color inválido"),
  domain: z
    .string()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Dominio inválido")
    .optional()
    .or(z.literal("")),
});

type StoreInfoFormData = z.infer<typeof storeInfoSchema>;

interface StoreInfoFormProps {
  store: Tenant;
}

export function StoreInfoForm({ store }: StoreInfoFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<StoreInfoFormData>({
    name: store.name,
    slug: store.slug,
    logo: store.logo || "",
    primaryColor: store.primaryColor,
    accentColor: store.accentColor,
    domain: store.domain || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    setSuccessMessage("");

    try {
      // Validate
      storeInfoSchema.parse(formData);

      setIsSubmitting(true);

      const response = await fetch(`/api/tenants/${store.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al actualizar");
      }

      setSuccessMessage("Información actualizada correctamente");
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
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información de Tienda
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Actualiza la información básica de tu tienda
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* General Error */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {errors.general}
        </div>
      )}

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nombre de la Tienda *
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
          placeholder="Mi Tienda Online"
        />
        {errors.name && (
          <p className="text-red-600 text-sm mt-1">{errors.name}</p>
        )}
      </div>

      {/* Slug */}
      <div>
        <label
          htmlFor="slug"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Slug (URL amigable) *
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.slug ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="mi-tienda"
        />
        <p className="text-sm text-gray-500 mt-1">
          URL: https://tudominio.com/{formData.slug || "slug"}
        </p>
        {errors.slug && (
          <p className="text-red-600 text-sm mt-1">{errors.slug}</p>
        )}
      </div>

      {/* Logo */}
      <div>
        <label
          htmlFor="logo"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          URL del Logo
        </label>
        <input
          type="url"
          id="logo"
          name="logo"
          value={formData.logo}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.logo ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="https://ejemplo.com/logo.png"
        />
        {errors.logo && (
          <p className="text-red-600 text-sm mt-1">{errors.logo}</p>
        )}
        {formData.logo && (
          <div className="mt-2">
            <img
              src={formData.logo}
              alt="Logo preview"
              className="h-12 object-contain"
            />
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="primaryColor"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Color Primario *
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              id="primaryColor"
              name="primaryColor"
              value={formData.primaryColor}
              onChange={handleChange}
              className="h-10 w-20 border border-gray-300 rounded"
            />
            <input
              type="text"
              value={formData.primaryColor}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  primaryColor: e.target.value,
                }))
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="#0A1128"
            />
          </div>
          {errors.primaryColor && (
            <p className="text-red-600 text-sm mt-1">{errors.primaryColor}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="accentColor"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Color de Acento *
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              id="accentColor"
              name="accentColor"
              value={formData.accentColor}
              onChange={handleChange}
              className="h-10 w-20 border border-gray-300 rounded"
            />
            <input
              type="text"
              value={formData.accentColor}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, accentColor: e.target.value }))
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              placeholder="#D4AF37"
            />
          </div>
          {errors.accentColor && (
            <p className="text-red-600 text-sm mt-1">{errors.accentColor}</p>
          )}
        </div>
      </div>

      {/* Custom Domain */}
      <div>
        <label
          htmlFor="domain"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Dominio Personalizado (Opcional)
        </label>
        <input
          type="text"
          id="domain"
          name="domain"
          value={formData.domain}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.domain ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="mitienda.com"
        />
        {errors.domain && (
          <p className="text-red-600 text-sm mt-1">{errors.domain}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Configura tu propio dominio apuntando el DNS a nuestros servidores
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}
