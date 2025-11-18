import { WifiOff, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Offline - Tienda Online',
  description: 'You are currently offline',
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-full p-6">
            <WifiOff className="h-16 w-16 text-gray-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          You&apos;re Offline
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          It looks like you&apos;ve lost your internet connection. Please check your
          connection and try again.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
            size="lg"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Retry Connection
          </Button>

          <Button asChild variant="outline" className="w-full" size="lg">
            <Link href="/">
              <Home className="h-5 w-5 mr-2" />
              Go to Homepage
            </Link>
          </Button>
        </div>

        {/* Tips */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Troubleshooting Tips:
          </h2>
          <ul className="text-sm text-gray-600 space-y-2 text-left">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Check if airplane mode is turned off</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Verify your WiFi or mobile data is enabled</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Try turning WiFi off and on again</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Move to an area with better signal</span>
            </li>
          </ul>
        </div>

        {/* Cached Content Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Some previously visited pages may still be
            available to view offline.
          </p>
        </div>
      </div>
    </div>
  )
}
