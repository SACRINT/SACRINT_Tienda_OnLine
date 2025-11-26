/**
 * Email Settings Form
 * Semana 9.7: Settings Page - Email Configuration
 */

"use client";

import { Tenant } from "@prisma/client";

interface EmailSettingsFormProps {
  store: Tenant;
}

export function EmailSettingsForm({ store }: EmailSettingsFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Configuración de Email
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Plantillas y remitente de emails
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
        <p className="font-medium">Próximamente</p>
        <p className="text-sm mt-1">
          La configuración de emails estará disponible próximamente
        </p>
      </div>

      {/* Placeholder */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Remitente
        </label>
        <input
          type="email"
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          placeholder="noreply@tienda.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del Remitente
        </label>
        <input
          type="text"
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          placeholder="Mi Tienda"
        />
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Plantillas de Email</h4>
        <p className="text-sm text-gray-600 mb-4">
          Personaliza las plantillas de email para tu tienda
        </p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Confirmación de Orden</span>
            <button disabled className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50">
              Editar
            </button>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Orden Enviada</span>
            <button disabled className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50">
              Editar
            </button>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Orden Entregada</span>
            <button disabled className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50">
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
