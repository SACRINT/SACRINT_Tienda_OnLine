import { auth } from '@/lib/auth/auth'
import { getTenantById } from '@/lib/db/tenant'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsForm } from '@/components/dashboard/SettingsForm'

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user?.tenantId) {
    return <div>No tenant found</div>
  }

  const tenant = await getTenantById(session.user.tenantId)

  if (!tenant) {
    return <div>Tenant not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Configuración</h2>
        <p className="text-gray-600 mt-1">
          Administra la configuración de tu tienda
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Tienda</CardTitle>
          <CardDescription>
            Actualiza la información básica de tu tienda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm tenant={tenant} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de Pago</CardTitle>
          <CardDescription>
            Configuración de Stripe y métodos de pago
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Estado de Stripe</p>
              <p className="text-sm text-gray-600">
                Configurado y activo
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Webhook URL</p>
              <p className="text-sm text-gray-600">
                {process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/stripe
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
