/**
 * Dashboard Layout
 * Semana 9.1: Layout de Dashboard
 *
 * Layout principal del dashboard con:
 * - Autenticación requerida
 * - Verificación de ownership de tienda
 * - Sidebar de navegación
 * - Top navigation bar
 * - Main content area
 */

import { requireAuth, getStoreOrThrow } from "@/lib/auth/dashboard";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: {
    storeId: string;
  };
}

export default async function DashboardLayout({
  children,
  params: { storeId },
}: DashboardLayoutProps) {
  // Require authentication
  const session = await requireAuth();

  // Verify store ownership
  const store = await getStoreOrThrow(storeId, session.user.id);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar store={store} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNav user={session.user} storeId={storeId} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Metadata for dashboard pages
 */
export const metadata = {
  title: {
    template: "%s | Dashboard",
    default: "Dashboard",
  },
  description: "Panel de administración de tu tienda online",
  robots: {
    index: false,
    follow: false,
  },
};
