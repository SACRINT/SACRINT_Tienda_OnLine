'use client'

import { useEffect, useState } from 'react'
import { X, Download, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode
    const isInStandaloneMode = () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://')

    setIsStandalone(isInStandaloneMode())

    // Check if iOS
    const checkIsIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(checkIsIOS)

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)

      // Check if user has dismissed prompt before
      const dismissed = localStorage.getItem('pwa-prompt-dismissed')
      if (!dismissed) {
        // Show prompt after 30 seconds or on second visit
        const visitCount = parseInt(localStorage.getItem('visit-count') || '0')
        if (visitCount > 1) {
          setTimeout(() => setShowPrompt(true), 30000)
        }
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Track visit count
    const visitCount = parseInt(localStorage.getItem('visit-count') || '0')
    localStorage.setItem('visit-count', String(visitCount + 1))

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    // Show the install prompt
    await deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferred prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', 'true')

    // Re-enable after 7 days
    setTimeout(
      () => {
        localStorage.removeItem('pwa-prompt-dismissed')
      },
      7 * 24 * 60 * 60 * 1000
    )
  }

  // Don't show if already installed or dismissed
  if (isStandalone || !showPrompt) {
    return null
  }

  // iOS-specific install instructions
  if (isIOS && !isStandalone) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-blue-600 to-blue-500 text-white p-4 shadow-lg animate-in slide-in-from-bottom-5">
        <div className="container mx-auto max-w-2xl">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-3 pr-8">
            <Smartphone className="h-6 w-6 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-1">
                Install Tienda Online
              </h3>
              <p className="text-sm text-white/90 mb-3">
                Add to your home screen for quick access and a better experience
              </p>
              <ol className="text-sm space-y-1 text-white/90 list-decimal list-inside">
                <li>Tap the Share button in Safari</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right corner</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Standard install prompt (Chrome, Edge, etc.)
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 animate-in slide-in-from-bottom-5">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
          <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Install Tienda Online
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Install our app for a faster experience with offline support
          </p>
          <div className="flex gap-2">
            <Button onClick={handleInstallClick} size="sm" className="flex-1">
              Install
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
