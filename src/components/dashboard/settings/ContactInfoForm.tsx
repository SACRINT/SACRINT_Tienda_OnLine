/**
 * Contact Info Form
 * Semana 9.7: Settings Page - Contact Information
 */

"use client";

import { Tenant } from "@prisma/client";

interface ContactInfoFormProps {
  store: Tenant;
}

export function ContactInfoForm({ store }: ContactInfoFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información de Contacto
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Email, teléfono y ubicación de tu tienda
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
        <p className="font-medium">Próximamente</p>
        <p className="text-sm mt-1">
          Esta funcionalidad estará disponible en la siguiente versión
        </p>
      </div>

      {/* Placeholder fields */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email de Contacto
        </label>
        <input
          type="email"
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          placeholder="contacto@tienda.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono
        </label>
        <input
          type="tel"
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          placeholder="+52 55 1234 5678"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dirección
        </label>
        <textarea
          disabled
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          placeholder="Calle, Número, Colonia, Ciudad, Estado, CP"
        />
      </div>
    </div>
  );
}
