// Sentry Error Tracking Configuration
// Initialize Sentry for error monitoring and performance tracking

import * as Sentry from '@sentry/nextjs'

export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      enabled: process.env.NODE_ENV === 'production',

      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      profilesSampleRate: 0.1, // 10% of transactions

      // Error Filtering
      beforeSend(event, hint) {
        // Filter out non-critical errors
        if (event.exception) {
          const error = hint.originalException

          // Ignore cancelled requests
          if (error && typeof error === 'object' && 'name' in error) {
            if (error.name === 'AbortError') return null
          }
        }

        // Scrub sensitive data
        if (event.request) {
          delete event.request.cookies
          if (event.request.headers) {
            delete event.request.headers['authorization']
            delete event.request.headers['cookie']
          }
        }

        return event
      },

      // Integrations (BrowserTracing and Replay only available on client-side)
      integrations: [],
    })
  }
}

// Custom error tracking
export function captureError(error: Error, context?: Record<string, any>) {
  console.error('[ERROR]', error, context)

  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context,
    })
  }
}

// Custom event tracking
export function captureEvent(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) {
  console.log(`[${level.toUpperCase()}]`, message, context)

  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    })
  }
}

// Set user context
export function setUser(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  })

  Sentry.setContext('user_details', {
    role: user.role,
  })
}

// Clear user context (on logout)
export function clearUser() {
  Sentry.setUser(null)
}
