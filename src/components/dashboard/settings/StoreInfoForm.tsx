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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        error.issues.forEach((err) => {
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
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Información de Tienda</h3>
        <p className="mb-6 text-sm text-gray-600">Actualiza la información básica de tu tienda</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          {successMessage}
        </div>
      )}

      {/* General Error */}
      {errors.general && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {errors.general}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
          Nombre de la Tienda *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Mi Tienda Online"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className="mb-1 block text-sm font-medium text-gray-700">
          Slug (URL amigable) *
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.slug ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="mi-tienda"
        />
        <p className="mt-1 text-sm text-gray-500">
          URL: https://tudominio.com/{formData.slug || "slug"}
        </p>
        {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
      </div>

      {/* Logo */}
      <div>
        <label htmlFor="logo" className="mb-1 block text-sm font-medium text-gray-700">
          URL del Logo
        </label>
        <input
          type="url"
          id="logo"
          name="logo"
          value={formData.logo}
          onChange={handleChange}
          className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.logo ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="https://ejemplo.com/logo.png"
        />
        {errors.logo && <p className="mt-1 text-sm text-red-600">{errors.logo}</p>}
        {formData.logo && (
          <div className="mt-2">
            <img src={formData.logo} alt="Logo preview" className="h-12 object-contain" />
          </div>
        )}
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="primaryColor" className="mb-1 block text-sm font-medium text-gray-700">
            Color Primario *
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              id="primaryColor"
              name="primaryColor"
              value={formData.primaryColor}
              onChange={handleChange}
              className="h-10 w-20 rounded border border-gray-300"
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
              className="flex-1 rounded-md border border-gray-300 px-3 py-2"
              placeholder="#0A1128"
            />
          </div>
          {errors.primaryColor && (
            <p className="mt-1 text-sm text-red-600">{errors.primaryColor}</p>
          )}
        </div>

        <div>
          <label htmlFor="accentColor" className="mb-1 block text-sm font-medium text-gray-700">
            Color de Acento *
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              id="accentColor"
              name="accentColor"
              value={formData.accentColor}
              onChange={handleChange}
              className="h-10 w-20 rounded border border-gray-300"
            />
            <input
              type="text"
              value={formData.accentColor}
              onChange={(e) => setFormData((prev) => ({ ...prev, accentColor: e.target.value }))}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2"
              placeholder="#D4AF37"
            />
          </div>
          {errors.accentColor && <p className="mt-1 text-sm text-red-600">{errors.accentColor}</p>}
        </div>
      </div>

      {/* Custom Domain */}
      <div>
        <label htmlFor="domain" className="mb-1 block text-sm font-medium text-gray-700">
          Dominio Personalizado (Opcional)
        </label>
        <input
          type="text"
          id="domain"
          name="domain"
          value={formData.domain}
          onChange={handleChange}
          className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.domain ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="mitienda.com"
        />
        {errors.domain && <p className="mt-1 text-sm text-red-600">{errors.domain}</p>}
        <p className="mt-1 text-sm text-gray-500">
          Configura tu propio dominio apuntando el DNS a nuestros servidores
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </form>
  );
}
