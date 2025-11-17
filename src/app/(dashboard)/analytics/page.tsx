import Image from 'next/image'
import { auth } from '@/lib/auth/auth'
import { getDashboardMetrics, getSalesData, getTopProducts } from '@/lib/db/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { days?: string }
}) {
  const session = await auth()

  if (!session?.user?.tenantId) {
    return <div>No tenant found</div>
  }

  const days = parseInt(searchParams.days || '30')
  const metrics = await getDashboardMetrics(session.user.tenantId)
  const salesData = await getSalesData(session.user.tenantId, days)
  const topProducts = await getTopProducts(session.user.tenantId, 5)

  const avgOrderValue = metrics.totalOrders > 0 ? metrics.totalRevenue / metrics.totalOrders : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Análisis</h2>
        <p className="text-gray-600 mt-1">
          Métricas y estadísticas de tu tienda
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <svg
              className="h-4 w-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">
              De {metrics.totalOrders} órdenes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Órdenes
            </CardTitle>
            <svg
              className="h-4 w-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOrders}</div>
            <p className="text-xs text-gray-500">
              Desde el inicio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productos
            </CardTitle>
            <svg
              className="h-4 w-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProducts}</div>
            <p className="text-xs text-gray-500">
              En tu catálogo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Promedio
            </CardTitle>
            <svg
              className="h-4 w-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${avgOrderValue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">
              Por orden
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas - Últimos {days} días</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesData.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No hay datos de ventas para mostrar
              </p>
            ) : (
              <div className="space-y-2">
                {salesData.map((day: any) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString('es-ES')}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">
                        {day.orders} órdenes
                      </span>
                      <span className="text-sm font-bold">
                        ${day.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Productos Más Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts && topProducts.length > 0 ? (
              topProducts.map((product: any) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex items-center space-x-4">
                    {product.images[0] && (
                      <Image
                        src={product.images[0].url}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">${product.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{product.soldCount || 0} vendidos</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                No hay datos de productos
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
