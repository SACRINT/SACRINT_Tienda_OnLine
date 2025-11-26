/**
 * Store Settings Page
 * Semana 9.7: Settings Page
 *
 * Configuración completa de la tienda: info, contacto, pagos, envíos, impuestos
 */

import { requireAuth } from "@/lib/auth/require-auth";
import { getStoreOrThrow } from "@/lib/auth/dashboard";
import { SettingsTabs } from "@/components/dashboard/settings/SettingsTabs";

interface SettingsPageProps {
  params: {
    storeId: string;
  };
}

export default async function SettingsPage({
  params: { storeId },
}: SettingsPageProps) {
  // Require authentication
  const session = await requireAuth();

  // Verify store ownership
  const store = await getStoreOrThrow(storeId, session.user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">
          Administra la configuración de tu tienda
        </p>
      </div>

      {/* Settings Tabs */}
      <SettingsTabs store={store} />
    </div>
  );
}

export const metadata = {
  title: "Configuración - Dashboard",
  description: "Configuración de la tienda",
};
