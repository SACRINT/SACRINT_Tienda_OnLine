/**
 * Security Form
 * Semana 9.8: Profile Management - Password Change & 2FA
 */

"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { z } from "zod";
import { Shield, Lock } from "lucide-react";

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(8, "Mínimo 8 caracteres"),
    newPassword: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Mínimo 8 caracteres"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

interface SecurityFormProps {
  user: User;
}

export function SecurityForm({ user }: SecurityFormProps) {
  const [formData, setFormData] = useState<PasswordChangeFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      passwordChangeSchema.parse(formData);

      setIsSubmitting(true);

      const response = await fetch(`/api/user/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al cambiar contraseña");
      }

      setSuccessMessage("Contraseña actualizada correctamente");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
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
    <div className="space-y-8">
      {/* Password Change */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Cambiar Contraseña</h3>
          </div>
          <p className="mb-6 text-sm text-gray-600">
            Actualiza tu contraseña para mantener tu cuenta segura
          </p>
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

        {/* Current Password */}
        <div>
          <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium text-gray-700">
            Contraseña Actual *
          </label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.currentPassword ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-gray-700">
            Nueva Contraseña *
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.newPassword ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
            Confirmar Nueva Contraseña *
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.confirmPassword ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Actualizando..." : "Cambiar Contraseña"}
        </button>
      </form>

      {/* Two-Factor Authentication */}
      <div className="border-t border-gray-200 pt-8">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Autenticación de Dos Factores (2FA)
          </h3>
        </div>
        <p className="mb-6 text-sm text-gray-600">
          Agrega una capa adicional de seguridad a tu cuenta
        </p>

        <div className="rounded border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
          <p className="font-medium">Próximamente</p>
          <p className="mt-1 text-sm">
            La autenticación de dos factores estará disponible próximamente
          </p>
        </div>

        <div className="mt-6">
          <button
            disabled
            className="rounded-md bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Habilitar 2FA
          </button>
        </div>
      </div>
    </div>
  );
}
