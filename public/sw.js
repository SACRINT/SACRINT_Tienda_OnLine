/**
 * Service Worker - SACRINT Tienda Online PWA
 * Semana 30, Tarea 30.3: Service Worker Implementation
 * Caching strategies: Cache-First, Network-First, Stale-While-Revalidate
 */

const CACHE_NAME = 'tienda-online-v1'
const STATIC_CACHE = 'tienda-static-v1'
const DYNAMIC_CACHE = 'tienda-dynamic-v1'
const IMAGE_CACHE = 'tienda-images-v1'
const PRODUCTS_CACHE = 'tienda-products-v1'
const API_CACHE = 'tienda-api-v1'

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Cache size limits
const CACHE_LIMITS = {
  [STATIC_CACHE]: 10,
  [DYNAMIC_CACHE]: 50,
  [IMAGE_CACHE]: 100,
  [PRODUCTS_CACHE]: 30,
  [API_CACHE]: 20,
}

// Caching strategies configuration
const CACHE_STRATEGIES = {
  cacheFirst: [
    /\.(js|css|woff2?|ttf|otf|eot|svg)$/,
    /\/icons\//,
    /\/fonts\//,
  ],
  networkFirst: [
    /\/api\//,
    /\/auth\//,
    /\/checkout\//,
  ],
  staleWhileRevalidate: [
    /\/api\/products\//,
    /\/api\/categories\//,
  ],
  imageCache: [
    /\.(jpg|jpeg|png|gif|webp)$/,
    /\/images\//,
  ],
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

// Determine which caching strategy to use based on URL
function getCacheStrategy(url) {
  if (CACHE_STRATEGIES.cacheFirst.some(pattern => pattern.test(url.pathname))) {
    return 'cacheFirst'
  }
  if (CACHE_STRATEGIES.staleWhileRevalidate.some(pattern => pattern.test(url.pathname))) {
    return 'staleWhileRevalidate'
  }
  if (CACHE_STRATEGIES.networkFirst.some(pattern => pattern.test(url.pathname))) {
    return 'networkFirst'
  }
  if (CACHE_STRATEGIES.imageCache.some(pattern => pattern.test(url.pathname))) {
    return 'imageCache'
  }
  return 'networkFirst' // default
}

// Cache-First Strategy: Check cache first, fallback to network
async function cacheFirstStrategy(request, cacheName = DYNAMIC_CACHE) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  if (cached) {
    console.log('[SW] Cache hit (cache-first):', request.url)
    return cached
  }

  try {
    const response = await fetch(request)

    if (response && response.status === 200) {
      cache.put(request, response.clone())
      limitCacheSize(cacheName, CACHE_LIMITS[cacheName])
    }

    return response
  } catch (error) {
    console.error('[SW] Cache-first strategy failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

// Network-First Strategy: Try network first, fallback to cache
async function networkFirstStrategy(request, cacheName = DYNAMIC_CACHE) {
  try {
    const response = await fetch(request)

    if (response && response.status === 200) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
      limitCacheSize(cacheName, CACHE_LIMITS[cacheName])
    }

    return response
  } catch (error) {
    console.log('[SW] Network failed, checking cache:', request.url)
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request)

    if (cached) {
      return cached
    }

    // Special handling for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline') || new Response('Offline', { status: 503 })
    }

    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Stale-While-Revalidate: Return cache immediately, update in background
async function staleWhileRevalidateStrategy(request, cacheName = PRODUCTS_CACHE) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  // Start fetch in background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone())
        limitCacheSize(cacheName, CACHE_LIMITS[cacheName])
      }
      return response
    })
    .catch((error) => {
      console.error('[SW] Background fetch failed:', error)
    })

  // Return cached response immediately if available
  return cached || fetchPromise
}

// Image Cache Strategy: Cache images aggressively
async function imageCacheStrategy(request) {
  const cache = await caches.open(IMAGE_CACHE)
  const cached = await cache.match(request)

  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)

    if (response && response.status === 200) {
      cache.put(request, response.clone())
      limitCacheSize(IMAGE_CACHE, CACHE_LIMITS[IMAGE_CACHE])
    }

    return response
  } catch (error) {
    console.error('[SW] Image cache strategy failed:', error)
    // Return placeholder or transparent image
    return new Response('', { status: 404 })
  }
}

// Fetch event - implement multiple caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Determine strategy based on URL
  const strategy = getCacheStrategy(url)

  // Handle different strategies
  switch (strategy) {
    case 'cacheFirst':
      event.respondWith(cacheFirstStrategy(request, STATIC_CACHE))
      break

    case 'networkFirst':
      event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE))
      break

    case 'staleWhileRevalidate':
      event.respondWith(staleWhileRevalidateStrategy(request, PRODUCTS_CACHE))
      break

    case 'imageCache':
      event.respondWith(imageCacheStrategy(request))
      break

    default:
      event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE))
  }
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

// Helper: Limit cache size to prevent growth
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()

  if (keys.length > maxSize) {
    // Delete oldest entries (FIFO)
    const keysToDelete = keys.slice(0, keys.length - maxSize)
    await Promise.all(keysToDelete.map((key) => cache.delete(key)))
    console.log(`[SW] Trimmed ${cacheName} cache to ${maxSize} entries (removed ${keysToDelete.length})`)
  }
}

// Helper: Sync orders in background
async function syncOrders() {
  try {
    console.log('[SW] Starting orders sync...')

    // Notify user of sync
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_STARTED',
          data: 'orders',
        })
      })
    })

    // Simulated sync - replace with actual IndexedDB implementation
    console.log('[SW] Orders sync completed')

    // Notify user of completion
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_COMPLETED',
          data: 'orders',
        })
      })
    })

    return Promise.resolve()
  } catch (error) {
    console.error('[SW] Failed to sync orders:', error)
    return Promise.reject(error)
  }
}

// Helper: Sync cart in background
async function syncCart() {
  try {
    console.log('[SW] Starting cart sync...')

    // Notify user of sync
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_STARTED',
          data: 'cart',
        })
      })
    })

    // Simulated sync - replace with actual IndexedDB implementation
    console.log('[SW] Cart sync completed')

    // Notify user of completion
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SYNC_COMPLETED',
          data: 'cart',
        })
      })
    })

    return Promise.resolve()
  } catch (error) {
    console.error('[SW] Failed to sync cart:', error)
    return Promise.reject(error)
  }
}

// Handle messages from client
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Clearing cache:', cacheName)
          return caches.delete(cacheName)
        })
      )
    })
  } else if (event.data.type === 'CACHE_URLS') {
    caches.open(DYNAMIC_CACHE).then((cache) => {
      cache.addAll(event.data.urls || [])
    })
  }
})

console.log('[SW] Service worker script loaded successfully - v1.0.0')
