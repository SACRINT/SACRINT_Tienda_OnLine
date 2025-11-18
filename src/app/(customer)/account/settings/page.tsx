// Account Settings Page
// Manage profile, password, notifications, and preferences

'use client'

import { useState } from 'react'
import { AccountLayout, ProfileForm } from '@/components/account'
import type { ProfileFormData } from '@/components/account'
import {
  User,
  Lock,
  Bell,
  CreditCard,
  Globe,
  Shield,
  Trash2,
  Save,
} from 'lucide-react'

// Mock data - In production, fetch from API
const getMockUser = () => ({
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  dateOfBirth: '1990-05-15',
  image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
})

type SettingsTab = 'profile' | 'security' | 'notifications' | 'preferences'

export default function SettingsPage() {
  const user = getMockUser()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  const handleSaveProfile = async (data: ProfileFormData) => {
    console.log('Save profile:', data)
    // In production, make API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    alert('Profile updated successfully!')
  }

  const tabs: Array<{
    id: SettingsTab
    label: string
    icon: typeof User
  }> = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe },
  ]

  return (
    <AccountLayout user={user}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account preferences and security settings
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'profile' && (
            <ProfileForm
              initialData={user}
              onSave={handleSaveProfile}
            />
          )}

          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
        </div>
      </div>
    </AccountLayout>
  )
}

// Security Tab Component
function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    console.log('Change password')
    // In production, make API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    alert('Password updated successfully!')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            <span>Update Password</span>
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              Two-Factor Authentication
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Add an extra layer of security to your account
            </p>
          </div>
          <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Enable
          </button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Active Sessions</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
            <div>
              <p className="font-medium text-gray-900">Chrome on MacOS</p>
              <p className="text-sm text-gray-600">San Francisco, CA • Active now</p>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Current
            </span>
          </div>
        </div>
      </div>

      {/* Delete Account */}
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-4">
          <Shield className="h-6 w-6 text-red-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Danger Zone</h3>
            <p className="mt-1 text-sm text-red-800">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700">
              <Trash2 className="h-4 w-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Notifications Tab Component
function NotificationsTab() {
  const [emailNotifications, setEmailNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    newsletter: true,
    productRecommendations: false,
  })

  const [pushNotifications, setPushNotifications] = useState({
    orderShipped: true,
    orderDelivered: true,
    priceDrops: false,
    backInStock: true,
  })

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Email Notifications
        </h2>
        <div className="space-y-4">
          {Object.entries(emailNotifications).map(([key, value]) => (
            <label key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </p>
                <p className="text-sm text-gray-600">
                  Get notified about {key.toLowerCase()}
                </p>
              </div>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  setEmailNotifications({
                    ...emailNotifications,
                    [key]: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Push Notifications */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Push Notifications
        </h2>
        <div className="space-y-4">
          {Object.entries(pushNotifications).map(([key, value]) => (
            <label key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </p>
                <p className="text-sm text-gray-600">
                  Get push notifications for {key.toLowerCase()}
                </p>
              </div>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) =>
                  setPushNotifications({
                    ...pushNotifications,
                    [key]: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          ))}
        </div>
      </div>

      <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700">
        <Save className="h-4 w-4" />
        <span>Save Preferences</span>
      </button>
    </div>
  )
}

// Preferences Tab Component
function PreferencesTab() {
  const [language, setLanguage] = useState('en')
  const [currency, setCurrency] = useState('USD')
  const [timezone, setTimezone] = useState('America/Los_Angeles')

  return (
    <div className="space-y-6">
      {/* Language & Region */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Language & Region
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="Europe/London">London (GMT)</option>
            </select>
          </div>
        </div>
      </div>

      <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700">
        <Save className="h-4 w-4" />
        <span>Save Preferences</span>
      </button>
    </div>
  )
}
