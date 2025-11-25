/**
 * Dashboard Home Page
 * Semana 9.2: Dashboard Home Page (placeholder - será completado en próxima tarea)
 *
 * Página principal del dashboard con KPIs, gráficos y métricas
 */

interface DashboardHomeProps {
  params: {
    storeId: string;
  };
}

export default async function DashboardHome({ params: { storeId } }: DashboardHomeProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Bienvenido a tu panel de administración
        </p>
      </div>

      {/* Placeholder content - será completado en tarea 9.2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-center py-8">
          KPIs y gráficos serán implementados en la tarea 9.2
        </p>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Dashboard",
  description: "Panel principal de administración",
};
