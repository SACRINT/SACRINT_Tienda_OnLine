/**
 * Profile Management Page
 * Semana 9.8: Profile Management
 *
 * Gestión de perfil: información personal, contraseña, sesiones, API keys
 */

import { requireAuth } from "@/lib/auth/require-auth";
import { ProfileTabs } from "@/components/dashboard/profile/ProfileTabs";
import { db } from "@/lib/db";

interface ProfilePageProps {
  params: {
    storeId: string;
  };
}

export default async function ProfilePage({ params: { storeId } }: ProfilePageProps) {
  // Require authentication
  const session = await requireAuth();

  // Get user with sessions
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      sessions: {
        orderBy: { expires: "desc" },
        take: 10,
      },
    },
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="mt-1 text-gray-600">Administra tu información personal y configuración</p>
      </div>

      {/* Profile Tabs */}
      <ProfileTabs user={user} storeId={storeId} />
    </div>
  );
}

export const metadata = {
  title: "Mi Perfil - Dashboard",
  description: "Gestión de perfil de usuario",
};
