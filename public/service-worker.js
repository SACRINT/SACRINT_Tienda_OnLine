/**
 * Service Worker - PWA Implementation
 * Semana 30: Progressive Web App
 * Calidad Mundial: Caching estratégico, offline support, background sync
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `tienda-online-${CACHE_VERSION}`;

// Recursos críticos para cachear durante la instalación
const CRITICAL_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Rutas de la aplicación para cachear (App Shell)
const APP_SHELL_ROUTES = [
  '/',
  '/shop',
  '/cart',
  '/account',
  '/search',
];

// Patrones de URL para diferentes estrategias de cache
const CACHE_STRATEGIES = {
  // Estrategia: Cache First (para assets estáticos)
  cacheFirst: [
    /\.(js|css|woff2?|ttf|otf|eot)$/,
    /\/icons\//,
    /\/images\//,
  ],

  // Estrategia: Network First (para contenido dinámico)
  networkFirst: [
    /\/api\//,
    /\/auth\//,
  ],

  // Estrategia: Stale While Revalidate (para datos que pueden estar desactualizados)
  staleWhileRevalidate: [
    /\/products\//,
    /\/categories\//,
  ],
};

// ============================================
// INSTALACIÓN DEL SERVICE WORKER
// ============================================

self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...', CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando recursos críticos');
      return cache.addAll(CRITICAL_ASSETS);
    }).then(() => {
      // Forzar activación inmediata
      return self.skipWaiting();
    })
  );
});

// ============================================
// ACTIVACIÓN DEL SERVICE WORKER
// ============================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...', CACHE_VERSION);

  event.waitUntil(
    // Limpiar caches antiguos
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Eliminando cache antiguo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Tomar control de todas las páginas inmediatamente
      return self.clients.claim();
    })
  );
});

// ============================================
// INTERCEPTACIÓN DE REQUESTS (FETCH)
// ============================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no sean HTTP/HTTPS
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Ignorar requests de extensiones de navegador
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Determinar estrategia de cache basada en la URL
  let strategy = 'networkFirst'; // estrategia por defecto

  if (CACHE_STRATEGIES.cacheFirst.some(pattern => pattern.test(url.pathname))) {
    strategy = 'cacheFirst';
  } else if (CACHE_STRATEGIES.staleWhileRevalidate.some(pattern => pattern.test(url.pathname))) {
    strategy = 'staleWhileRevalidate';
  } else if (CACHE_STRATEGIES.networkFirst.some(pattern => pattern.test(url.pathname))) {
    strategy = 'networkFirst';
  }

  // Aplicar estrategia
  switch (strategy) {
    case 'cacheFirst':
      event.respondWith(cacheFirstStrategy(request));
      break;
    case 'networkFirst':
      event.respondWith(networkFirstStrategy(request));
      break;
    case 'staleWhileRevalidate':
      event.respondWith(staleWhileRevalidateStrategy(request));
      break;
    default:
      event.respondWith(networkFirstStrategy(request));
  }
});

// ============================================
// ESTRATEGIAS DE CACHING
// ============================================

/**
 * Cache First: Busca primero en cache, si no existe, va a red
 * Ideal para: Assets estáticos (CSS, JS, imágenes, fonts)
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // Guardar en cache si la respuesta es exitosa
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Error en cacheFirst:', error);

    // Si falla todo, retornar página offline para navegación HTML
    if (request.mode === 'navigate') {
      return cache.match('/offline');
    }

    throw error;
  }
}

/**
 * Network First: Intenta red primero, si falla usa cache
 * Ideal para: APIs, contenido dinámico
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);

    // Actualizar cache con la respuesta de red
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Red falló, buscando en cache:', request.url);

    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Si es navegación y no hay cache, mostrar página offline
    if (request.mode === 'navigate') {
      return cache.match('/offline');
    }

    throw error;
  }
}

/**
 * Stale While Revalidate: Retorna cache inmediatamente, actualiza en background
 * Ideal para: Contenido que puede estar un poco desactualizado (productos, categorías)
 */
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Actualizar cache en background (sin esperar)
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch((error) => {
    console.error('[SW] Error actualizando cache:', error);
  });

  // Retornar respuesta cacheada inmediatamente si existe
  return cachedResponse || fetchPromise;
}

// ============================================
// BACKGROUND SYNC (para operaciones offline)
// ============================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  } else if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

/**
 * Sincronizar órdenes pendientes cuando vuelva la conexión
 */
async function syncOrders() {
  try {
    // Obtener órdenes pendientes del IndexedDB
    const pendingOrders = await getPendingOrders();

    if (pendingOrders.length === 0) {
      return;
    }

    console.log('[SW] Sincronizando órdenes pendientes:', pendingOrders.length);

    // Enviar cada orden al servidor
    for (const order of pendingOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });

        if (response.ok) {
          await removePendingOrder(order.id);
          console.log('[SW] Orden sincronizada:', order.id);
        }
      } catch (error) {
        console.error('[SW] Error sincronizando orden:', error);
      }
    }

    // Notificar al usuario
    self.registration.showNotification('Órdenes Sincronizadas', {
      body: `${pendingOrders.length} orden(es) han sido procesadas.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
    });
  } catch (error) {
    console.error('[SW] Error en syncOrders:', error);
    throw error;
  }
}

/**
 * Sincronizar carrito cuando vuelva la conexión
 */
async function syncCart() {
  try {
    const cartData = await getLocalCart();

    if (!cartData) {
      return;
    }

    const response = await fetch('/api/cart/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cartData),
    });

    if (response.ok) {
      await clearLocalCart();
      console.log('[SW] Carrito sincronizado');
    }
  } catch (error) {
    console.error('[SW] Error en syncCart:', error);
    throw error;
  }
}

// ============================================
// PUSH NOTIFICATIONS
// ============================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification recibida');

  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data = { title: event.data.text() };
    }
  }

  const title = data.title || 'Tienda Online';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image,
    data: {
      url: data.url || '/',
      ...data,
    },
    actions: data.actions || [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' },
    ],
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Manejar clicks en notificaciones
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Obtener URL de la notificación
  const urlToOpen = event.notification.data?.url || '/';

  // Abrir o enfocar ventana existente
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Buscar si ya hay una ventana abierta
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }

      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ============================================
// MENSAJES DEL CLIENTE (postMessage)
// ============================================

self.addEventListener('message', (event) => {
  console.log('[SW] Mensaje recibido:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CACHE_URLS') {
    // Cachear URLs específicas bajo demanda
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  } else if (event.data.type === 'CLEAR_CACHE') {
    // Limpiar cache bajo demanda
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        return caches.open(CACHE_NAME);
      })
    );
  }
});

// ============================================
// HELPERS - IndexedDB
// ============================================

// Funciones placeholder para IndexedDB
// Implementación completa requiere configuración de IndexedDB

async function getPendingOrders() {
  // TODO: Implementar lectura de IndexedDB
  return [];
}

async function removePendingOrder(orderId) {
  // TODO: Implementar eliminación de IndexedDB
  console.log('Removing pending order:', orderId);
}

async function getLocalCart() {
  // TODO: Implementar lectura de IndexedDB
  return null;
}

async function clearLocalCart() {
  // TODO: Implementar limpieza de IndexedDB
  console.log('Clearing local cart');
}

// ============================================
// LOGS DE DEBUGGING (solo en desarrollo)
// ============================================

console.log('[SW] Service Worker cargado:', CACHE_VERSION);
console.log('[SW] Estrategias de cache configuradas');
console.log('[SW] Background sync habilitado');
console.log('[SW] Push notifications habilitadas');
