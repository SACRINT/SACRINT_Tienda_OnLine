/**
 * Dashboard Layout - Protected Area
 *
 * This layout wraps all dashboard pages and provides:
 * - Authentication check (redirects to login if not authenticated)
 * - Role-based access control (STORE_OWNER or SUPER_ADMIN only)
 * - Tenant verification (redirects to onboarding if no tenant)
 * - Sidebar navigation
 * - Top header with search and notifications
 * - Responsive design
 */

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ReactNode } from 'react'
import { auth } from '@/lib/auth/auth'
import { USER_ROLES } from '@/lib/types/user-role'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth()

  // =====================================================
  // AUTHENTICATION & AUTHORIZATION CHECKS
  // =====================================================

  // 1. Require authentication
  if (!session?.user) {
    redirect('/login')
  }

  // 2. Require STORE_OWNER or SUPER_ADMIN role (RBAC)
  if (
    session.user.role !== USER_ROLES.STORE_OWNER &&
    session.user.role !== USER_ROLES.SUPER_ADMIN
  ) {
    redirect('/')
  }

  // 3. Require tenant assignment (except for SUPER_ADMIN)
  if (!session.user.tenantId && session.user.role !== USER_ROLES.SUPER_ADMIN) {
    redirect('/onboarding')
  }

  // =====================================================
  // PREPARE USER DATA
  // =====================================================

  const user = {
    name: session.user.name || 'User',
    email: session.user.email || '',
    role: session.user.role,
    tenantId: session.user.tenantId,
  }

  // TODO: Fetch store name from tenant data
  const storeName = 'Mi Tienda'

  // TODO: Fetch real notification count from database
  const notificationCount = 0

  // =====================================================
  // RENDER LAYOUT
  // =====================================================

  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Sidebar - Fixed on desktop, slide-in on mobile */}
      <DashboardSidebar user={user} />

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Top Header - Sticky */}
        <DashboardHeader
          user={user}
          storeName={storeName}
          notificationCount={notificationCount}
        />

        {/* Page Content */}
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
