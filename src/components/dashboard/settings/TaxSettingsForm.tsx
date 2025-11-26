/**
 * Tax Settings Form
 * Semana 9.7: Settings Page - Tax Configuration
 */

"use client";

import { Tenant } from "@prisma/client";

interface TaxSettingsFormProps {
  store: Tenant;
}

export function TaxSettingsForm({ store }: TaxSettingsFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Configuración de Impuestos
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Tasa de impuestos y cálculos
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
        <p className="font-medium">Próximamente</p>
        <p className="text-sm mt-1">
          La configuración de impuestos estará disponible próximamente
        </p>
      </div>

      {/* Placeholder */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tasa de IVA (%)
        </label>
        <input
          type="number"
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          placeholder="16"
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input type="checkbox" disabled className="rounded" />
          <span className="text-sm text-gray-700">
            Incluir impuestos en el precio
          </span>
        </label>
      </div>
    </div>
  );
}
