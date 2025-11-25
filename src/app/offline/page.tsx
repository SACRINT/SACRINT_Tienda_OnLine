/**
 * Página Offline - PWA
 * Semana 30: Progressive Web App
 * Página mostrada cuando no hay conexión
 */

import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Sin Conexión - Tienda Online',
  description: 'No hay conexión a internet disponible',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icono Animado */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-ping"></div>
            <div className="relative bg-yellow-400 p-6 rounded-full">
              <WifiOff className="h-16 w-16 text-white" />
            </div>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Sin Conexión
        </h1>

        {/* Descripción */}
        <p className="text-lg text-gray-600 mb-2">
          Parece que no tienes conexión a internet en este momento.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          No te preocupes, algunos contenidos aún están disponibles offline.
        </p>

        {/* Acciones */}
        <div className="space-y-3">
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-primary hover:bg-primary/90 text-white"
            size="lg"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Reintentar Conexión
          </Button>

          <Link href="/" className="block">
            <Button
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Home className="h-5 w-5 mr-2" />
              Ir a Inicio
            </Button>
          </Link>
        </div>

        {/* Información Adicional */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            💡 Mientras tanto, puedes:
          </h2>
          <ul className="text-left space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Navegar por las páginas que ya visitaste</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Ver productos que viste anteriormente</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Revisar tu carrito guardado</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Cuando vuelvas a estar online, todo se sincronizará automáticamente</span>
            </li>
          </ul>
        </div>

        {/* Estado de Conexión */}
        <div className="mt-6 text-xs text-gray-400">
          <p>Verificando conexión automáticamente...</p>
        </div>
      </div>
    </div>
  );
}
