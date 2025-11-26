/**
 * Personal Info Form
 * Semana 9.8: Profile Management - Personal Information
 */

"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

const personalInfoSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  image: z.string().url("URL de imagen inválida").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

interface PersonalInfoFormProps {
  user: User;
}

export function PersonalInfoForm({ user }: PersonalInfoFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<PersonalInfoFormData>({
    name: user.name || "",
    email: user.email,
    image: user.image || "",
    phone: user.phone || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      personalInfoSchema.parse(formData);

      setIsSubmitting(true);

      const response = await fetch(`/api/user/profile`, {
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

      setSuccessMessage("Perfil actualizado correctamente");
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
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Información Personal</h3>
        <p className="mb-6 text-sm text-gray-600">Actualiza tu información personal</p>
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

      {/* Profile Photo */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Foto de Perfil</label>
        <div className="flex items-center gap-4">
          {formData.image ? (
            <img
              src={formData.image}
              alt="Profile"
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://ejemplo.com/avatar.jpg"
            />
            {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
            <p className="mt-1 text-sm text-gray-500">URL de tu foto de perfil</p>
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
          Nombre Completo *
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
          placeholder="Juan Pérez"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="juan@ejemplo.com"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
          Teléfono (Opcional)
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="+52 55 1234 5678"
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
      </div>

      {/* User Info */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Información de Cuenta</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">ID de Usuario</p>
            <p className="font-mono text-gray-900">{user.id}</p>
          </div>
          <div>
            <p className="text-gray-600">Rol</p>
            <p className="font-semibold text-gray-900">{user.role}</p>
          </div>
          <div>
            <p className="text-gray-600">Fecha de Registro</p>
            <p className="text-gray-900">{new Date(user.createdAt).toLocaleDateString("es-MX")}</p>
          </div>
          <div>
            <p className="text-gray-600">Estado</p>
            <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
              {user.status}
            </span>
          </div>
        </div>
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
