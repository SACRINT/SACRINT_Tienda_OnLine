/**
 * Offline Page
 * Displayed when the user is offline and requests a page not cached
 * Features: Auto-reconnect, dark mode support, bilingual
 */

"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    // Initialize online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);

    // Check if we're actually online now
    if (navigator.onLine) {
      // Try to reload the page
      window.location.reload();
    } else {
      // Still offline, wait a bit and check again
      setTimeout(() => {
        setRetrying(false);
      }, 2000);
    }
  };

  useEffect(() => {
    // Auto-reload when connection is restored
    if (isOnline) {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            {isOnline ? (
              <Wifi className="w-10 h-10 text-green-600 dark:text-green-400 animate-pulse" />
            ) : (
              <WifiOff className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isOnline ? "Reconectando..." : "Sin conexión"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {isOnline
              ? "Tu conexión ha sido restaurada. Reconectando..."
              : "Parece que no tienes conexión a internet. Verifica tu conexión y vuelve a intentarlo."}
          </p>

          {!isOnline && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
                  Mientras tanto, puedes:
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Ver productos guardados previamente</li>
                  <li>Revisar tu carrito de compras</li>
                  <li>Ver tus órdenes anteriores</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="w-full"
                  size="lg"
                >
                  {retrying ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Reintentando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Reintentar conexión
                    </>
                  )}
                </Button>

                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href="/">
                    <Home className="w-5 h-5 mr-2" />
                    Ir al inicio
                  </Link>
                </Button>
              </div>

              {/* Troubleshooting Tips */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold mb-3">
                  Consejos para solucionar problemas:
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Verifica que el modo avión esté desactivado</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Confirma que WiFi o datos móviles estén activos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Intenta desactivar y reactivar el WiFi</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Muévete a un área con mejor señal</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          {isOnline && (
            <div className="flex items-center justify-center text-green-600 dark:text-green-400 py-4">
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              <span className="text-sm font-medium">Cargando página...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
