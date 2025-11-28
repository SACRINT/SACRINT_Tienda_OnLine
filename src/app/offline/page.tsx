/**
 * Página Offline - PWA
 * Semana 30: Progressive Web App
 * Página mostrada cuando no hay conexión
 */

"use client";

import { WifiOff, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md text-center">
        {/* Icono Animado */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-yellow-400/20"></div>
            <div className="relative rounded-full bg-yellow-400 p-6">
              <WifiOff className="h-16 w-16 text-white" />
            </div>
          </div>
        </div>

        {/* Título */}
        <h1 className="mb-4 text-4xl font-bold text-gray-900">Sin Conexión</h1>

        {/* Descripción */}
        <p className="mb-2 text-lg text-gray-600">
          Parece que no tienes conexión a internet en este momento.
        </p>
        <p className="mb-8 text-sm text-gray-500">
          No te preocupes, algunos contenidos aún están disponibles offline.
        </p>

        {/* Acciones */}
        <div className="space-y-3">
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-primary text-white hover:bg-primary/90"
            size="lg"
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Reintentar Conexión
          </Button>

          <Link href="/" className="block">
            <Button variant="outline" className="w-full" size="lg">
              <Home className="mr-2 h-5 w-5" />
              Ir a Inicio
            </Button>
          </Link>
        </div>

        {/* Información Adicional */}
        <div className="mt-12 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">💡 Mientras tanto, puedes:</h2>
          <ul className="space-y-2 text-left text-sm text-gray-600">
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
