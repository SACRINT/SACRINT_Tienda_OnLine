"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Algo sali&oacute; mal
        </h1>

        <p className="text-gray-600 mb-8">
          Ha ocurrido un error inesperado. Por favor, intenta de nuevo o vuelve
          al inicio.
        </p>

        {error.digest && (
          <p className="text-xs text-gray-400 mb-4">
            C&oacute;digo de error: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Ir al inicio
            </Link>
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-gray-500">
            Si el problema persiste, contacta a{" "}
            <a
              href="mailto:soporte@sacrint.com"
              className="text-blue-600 hover:underline"
            >
              soporte@sacrint.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
