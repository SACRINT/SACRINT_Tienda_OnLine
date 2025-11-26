/**
 * Operational Dashboard - Semana 19
 * Dashboard completo para gerentes de operaciones
 */
"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OperationsDashboardPage() {
  const params = useParams();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard Operacional</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Órdenes Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">47</p>
            <p className="text-sm text-green-600">+12% vs ayer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">23</p>
            <p className="text-sm text-yellow-600">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">En Envío</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">156</p>
            <p className="text-sm text-blue-600">En tránsito</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Problemas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">3</p>
            <p className="text-sm text-red-600">Necesitan resolución</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Alertas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-2 bg-red-50 rounded">
                <p className="font-medium text-red-800">Stock Bajo: 5 productos</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded">
                <p className="font-medium text-yellow-800">Envío Retrasado: Orden #1234</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Generar Etiquetas Pendientes
              </button>
              <button className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600">
                Aprobar Returns
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
