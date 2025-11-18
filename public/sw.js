// Service Worker for Tienda Online PWA
// Provides offline support, caching, and background sync

const CACHE_NAME = 'tienda-online-v1'
const STATIC_CACHE = 'tienda-static-v1'
const DYNAMIC_CACHE = 'tienda-dynamic-v1'
const IMAGE_CACHE = 'tienda-images-v1'

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
]

// Cache size limits
const CACHE_LIMITS = {
  [DYNAMIC_CACHE]: 50,
  [IMAGE_CACHE]: 100,
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )

  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('tienda-') &&
                   name !== STATIC_CACHE &&
                   name !== DYNAMIC_CACHE &&
                   name !== IMAGE_CACHE
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )

  // Take control of all pages immediately
  return self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Skip API requests (always fetch fresh)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Return offline response for API calls
          return new Response(
            JSON.stringify({ error: 'Offline', message: 'No internet connection' }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        })
    )
    return
  }

  // Handle images with cache-first strategy
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached
        }

        return fetch(request).then((response) => {
          // Clone response before caching
          const responseClone = response.clone()

          caches.open(IMAGE_CACHE).then((cache) => {
            cache.put(request, responseClone)
            limitCacheSize(IMAGE_CACHE, CACHE_LIMITS[IMAGE_CACHE])
          })

          return response
        })
      })
    )
    return
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful responses
          const responseClone = response.clone()

          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
            limitCacheSize(DYNAMIC_CACHE, CACHE_LIMITS[DYNAMIC_CACHE])
          })

          return response
        })
        .catch(() => {
          // Try to serve from cache
          return caches.match(request).then((cached) => {
            if (cached) {
              return cached
            }

            // Fallback to offline page
            return caches.match('/offline')
          })
        })
    )
    return
  }

  // Handle other requests with network-first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone and cache successful responses
        const responseClone = response.clone()

        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone)
          limitCacheSize(DYNAMIC_CACHE, CACHE_LIMITS[DYNAMIC_CACHE])
        })

        return response
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request)
      })
  )
})

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)

  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders())
  }

  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart())
  }
})

// Push notification support
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

  const data = event.data?.json() || {}
  const title = data.title || 'Tienda Online'
  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: data.url || '/',
    actions: data.actions || [],
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked')

  event.notification.close()

  const urlToOpen = event.notification.data || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }

      // Open new window if no existing window found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Helper: Limit cache size
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()

  if (keys.length > maxSize) {
    // Delete oldest entries
    const keysToDelete = keys.slice(0, keys.length - maxSize)
    await Promise.all(keysToDelete.map((key) => cache.delete(key)))
    console.log(`[SW] Trimmed ${cacheName} cache to ${maxSize} entries`)
  }
}

// Helper: Sync orders in background
async function syncOrders() {
  try {
    // Get pending orders from IndexedDB
    // This would be implemented based on your offline storage strategy
    console.log('[SW] Syncing orders...')

    // Example: Post pending orders to API
    // const pendingOrders = await getPendingOrders()
    // for (const order of pendingOrders) {
    //   await fetch('/api/orders', {
    //     method: 'POST',
    //     body: JSON.stringify(order),
    //   })
    // }

    return Promise.resolve()
  } catch (error) {
    console.error('[SW] Failed to sync orders:', error)
    return Promise.reject(error)
  }
}

// Helper: Sync cart in background
async function syncCart() {
  try {
    console.log('[SW] Syncing cart...')

    // Similar implementation to syncOrders
    // Sync cart data when connection is restored

    return Promise.resolve()
  } catch (error) {
    console.error('[SW] Failed to sync cart:', error)
    return Promise.reject(error)
  }
}

console.log('[SW] Service worker script loaded')
