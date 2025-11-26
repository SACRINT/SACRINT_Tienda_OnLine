/**
 * Payment Settings Form
 * Semana 9.7: Settings Page - Payment Configuration
 */

"use client";

import { Tenant } from "@prisma/client";

interface PaymentSettingsFormProps {
  store: Tenant;
}

export function PaymentSettingsForm({ store }: PaymentSettingsFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Configuración de Pagos
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Conecta tus cuentas de Stripe y Mercado Pago
        </p>
      </div>

      {/* Stripe */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Stripe</h4>
              <p className="text-sm text-gray-600">Tarjetas de crédito/débito</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
            No conectado
          </span>
        </div>
        <button
          disabled
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Conectar con Stripe
        </button>
      </div>

      {/* Mercado Pago */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-100 rounded flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 9.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm-9.124 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm4.562 8.25c-2.9 0-5.25-2.35-5.25-5.25h1.5c0 2.072 1.678 3.75 3.75 3.75s3.75-1.678 3.75-3.75h1.5c0 2.9-2.35 5.25-5.25 5.25z"/>
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Mercado Pago</h4>
              <p className="text-sm text-gray-600">Popular en LATAM</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
            No conectado
          </span>
        </div>
        <button
          disabled
          className="w-full px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:opacity-50"
        >
          Conectar con Mercado Pago
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
        <p className="font-medium">Próximamente</p>
        <p className="text-sm mt-1">
          La integración de pagos estará disponible próximamente
        </p>
      </div>
    </div>
  );
}
