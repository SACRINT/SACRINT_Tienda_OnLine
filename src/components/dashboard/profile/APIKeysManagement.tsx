/**
 * API Keys Management
 * Semana 9.8: Profile Management - API Keys for Integration
 */

"use client";

import { User } from "@prisma/client";
import { Key, Copy, Plus, Trash2 } from "lucide-react";

interface APIKeysManagementProps {
  user: User;
}

export function APIKeysManagement({ user }: APIKeysManagementProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">API Keys</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Genera y administra claves API para integrar tu tienda con servicios externos
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
        <p className="font-medium">Próximamente</p>
        <p className="text-sm mt-1">
          La gestión de API Keys estará disponible próximamente
        </p>
      </div>

      {/* Create API Key Button */}
      <div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Crear Nueva API Key
        </button>
      </div>

      {/* API Keys List (Placeholder) */}
      <div className="border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h4 className="font-semibold text-gray-900">Claves Activas</h4>
        </div>
        <div className="p-8 text-center text-gray-500">
          No hay API keys creadas
        </div>
      </div>

      {/* API Keys Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2">
          ⚠️ Importante
        </h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Guarda tus API keys en un lugar seguro</li>
          <li>• No compartas tus claves con nadie</li>
          <li>• Revoca inmediatamente claves comprometidas</li>
          <li>• Usa claves diferentes para cada integración</li>
        </ul>
      </div>

      {/* Documentation Link */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="font-semibold text-gray-900 mb-3">
          Documentación de API
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Aprende cómo integrar tu tienda con servicios externos usando nuestra API
        </p>
        <button
          disabled
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Ver Documentación
        </button>
      </div>

      {/* Rate Limits */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="font-semibold text-gray-900 mb-3">
          Límites de Rate Limiting
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600 mb-1">Solicitudes por Minuto</p>
            <p className="text-2xl font-bold text-gray-900">60</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-gray-600 mb-1">Solicitudes por Hora</p>
            <p className="text-2xl font-bold text-gray-900">1,000</p>
          </div>
        </div>
      </div>
    </div>
  );
}
