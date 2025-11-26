/**
 * Shipping Settings Form
 * Semana 9.7: Settings Page - Shipping Configuration
 */

"use client";

import { Tenant } from "@prisma/client";

interface ShippingSettingsFormProps {
  store: Tenant;
}

export function ShippingSettingsForm({ store }: ShippingSettingsFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Configuración de Envíos
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Zonas de envío y costos
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
        <p className="font-medium">Próximamente</p>
        <p className="text-sm mt-1">
          La configuración de envíos estará disponible próximamente
        </p>
      </div>

      {/* Placeholder */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Zonas de Envío</h4>
        <p className="text-sm text-gray-600 mb-4">
          Define zonas geográficas y costos de envío
        </p>
        <button
          disabled
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Agregar Zona
        </button>
      </div>
    </div>
  );
}
