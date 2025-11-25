/**
 * Users Management Component
 * Semana 9.7: Settings Page - Users and Staff Management
 */

"use client";

import { Tenant } from "@prisma/client";
import { UserPlus } from "lucide-react";

interface UsersManagementProps {
  store: Tenant;
}

export function UsersManagement({ store }: UsersManagementProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Gestión de Usuarios
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Agrega staff y administra permisos
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
        <p className="font-medium">Próximamente</p>
        <p className="text-sm mt-1">
          La gestión de usuarios estará disponible próximamente
        </p>
      </div>

      {/* Placeholder */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="text-center">
          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 mb-2">
            Agrega Miembros del Equipo
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Invita a colaboradores para que ayuden a administrar tu tienda
          </p>
          <button
            disabled
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Invitar Usuario
          </button>
        </div>
      </div>

      {/* Roles Preview */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Roles Disponibles</h4>
        <div className="space-y-2">
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-medium text-gray-900">Owner</h5>
                <p className="text-sm text-gray-600">
                  Acceso completo a todas las funciones
                </p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                ADMIN
              </span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-medium text-gray-900">Manager</h5>
                <p className="text-sm text-gray-600">
                  Puede gestionar productos, órdenes y ver analíticas
                </p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                MANAGER
              </span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <h5 className="font-medium text-gray-900">Editor</h5>
                <p className="text-sm text-gray-600">
                  Solo puede editar productos y contenido
                </p>
              </div>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded">
                EDITOR
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
