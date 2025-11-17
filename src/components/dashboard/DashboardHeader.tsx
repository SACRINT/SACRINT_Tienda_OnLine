'use client'

/**
 * DashboardHeader Component
 *
 * Top header bar for the dashboard.
 * Features:
 * - Store name/branding
 * - Global search bar
 * - Notifications bell with badge
 * - User profile dropdown
 * - Responsive design
 */

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Bell, User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'

interface DashboardHeaderProps {
  user: {
    name: string
    email: string
    role: string
    tenantId?: string | null
  }
  storeName?: string
  notificationCount?: number
}

export default function DashboardHeader({
  user,
  storeName = 'Mi Tienda',
  notificationCount = 0,
}: DashboardHeaderProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to search results page
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const getUserInitial = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
      {/* Left Section: Store Name */}
      <div className="flex items-center space-x-4">
        <h1 className="text-lg md:text-2xl font-bold text-primary hidden md:block">
          {storeName}
        </h1>
        {/* Mobile: Show shorter version */}
        <h1 className="text-lg font-bold text-primary md:hidden">Dashboard</h1>
      </div>

      {/* Center Section: Search Bar (hidden on mobile) */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar productos, órdenes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </form>
      </div>

      {/* Right Section: Notifications & User Menu */}
      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-200">
                <h3 className="font-semibold text-sm">Notificaciones</h3>
              </div>

              {notificationCount === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No hay notificaciones nuevas
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {/* Example notification items */}
                  <Link
                    href="/dashboard/orders/123"
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    <p className="text-sm font-medium text-gray-900">Nueva orden recibida</p>
                    <p className="text-xs text-gray-500 mt-1">Orden #123 - $150.00</p>
                    <p className="text-xs text-gray-400 mt-1">Hace 5 minutos</p>
                  </Link>
                </div>
              )}

              <div className="px-4 py-2 border-t border-gray-200">
                <Link
                  href="/dashboard/notifications"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setNotificationsOpen(false)}
                >
                  Ver todas las notificaciones
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 md:space-x-3 p-1 md:p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Menú de usuario"
          >
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
              {getUserInitial(user.name)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {user.name}
              </p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-gray-400 transition-transform hidden md:block',
                userMenuOpen && 'transform rotate-180'
              )}
            />
          </button>

          {/* User Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-200">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 mt-1">{user.email}</p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="h-4 w-4 mr-3" />
                  Mi Perfil
                </Link>

                <Link
                  href="/dashboard/settings"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Configuración
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-200 pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
