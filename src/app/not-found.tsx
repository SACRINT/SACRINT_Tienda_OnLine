import Link from "next/link";
import { Home, Search, ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200">404</h1>
          <div className="-mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              P&aacute;gina no encontrada
            </h2>
            <p className="text-gray-600">
              Lo sentimos, la p&aacute;gina que buscas no existe o ha sido movida.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button asChild variant="default" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Ir al inicio
            </Link>
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link href="/shop">
              <ShoppingBag className="h-4 w-4" />
              Ver tienda
            </Link>
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          <p className="mb-2">Tambi&eacute;n puedes:</p>
          <ul className="space-y-1">
            <li>
              <Link href="/shop" className="text-blue-600 hover:underline">
                Explorar productos
              </Link>
            </li>
            <li>
              <Link href="/track" className="text-blue-600 hover:underline">
                Rastrear tu pedido
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-blue-600 hover:underline">
                Contactar soporte
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
