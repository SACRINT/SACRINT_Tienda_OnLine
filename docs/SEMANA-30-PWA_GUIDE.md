# 📱 PWA Implementation Guide - Semana 30

**Fecha**: Semana 30 (26-30 de Noviembre, 2025)
**Estado**: ✅ 100% COMPLETADA
**Total Tareas**: 12/12 Completadas
**Líneas de Código**: 3,000+

---

## 🎯 Resumen Ejecutivo

Implementación completa de Progressive Web App (PWA) para SACRINT Tienda Online con:

- Service Worker con múltiples estrategias de caching
- Soporte offline completo con IndexedDB
- Push Notifications
- Dark Mode / Light Mode switching
- Instalación en home screen
- Métricas y analytics
- Testing E2E completo

---

## ✅ Tareas Completadas

### 30.1 - Web App Manifest ✅

**Archivo**: `/public/manifest.json`
**Características**:

- 8 íconos responsivos (72x72 - 512x512)
- Screenshots para narrow/wide form factors
- 4 App Shortcuts (Buscar, Carrito, Órdenes, Ofertas)
- Share Target API
- Theme colors optimizados

**Uso**:

```html
<link rel="manifest" href="/manifest.json" />
```

---

### 30.2 - Service Worker Registration ✅

**Archivo**: `/src/lib/pwa/sw-register.ts`
**Funciones principales**:

```typescript
-registerServiceWorker() - // Registro automático
  forceServiceWorkerUpdate() - // Forzar actualización
  getServiceWorkerInfo() - // Obtener estado
  onServiceWorkerMessage() - // Escuchar mensajes
  initializeServiceWorker(); // Inicializar en root layout
```

**Características**:

- Actualización automática cada 6 horas
- Notificación al usuario de nuevas versiones
- Control de ciclo de vida del SW

---

### 30.3 - Service Worker Implementation ✅

**Archivo**: `/public/sw.js`
**Estrategias de Caching**:

```
Cache-First: Assets estáticos (JS, CSS, Fonts, Iconos)
Network-First: APIs y contenido dinámico
Stale-While-Revalidate: Productos y categorías
Image Cache: Imágenes agresivas
```

**Funcionalidades**:

- 6 caches separados con límites de tamaño
- Background sync para órdenes y carrito
- Push notifications
- Manejo de mensajes del cliente
- Limpeza automática de cache antiguo

---

### 30.4 - Offline Functionality ✅

**Archivo**: `/src/lib/pwa/offline.ts`
**Características IndexedDB**:

- **pending-requests**: Queue de requests fallidos
- **products**: Productos cacheados
- **cart**: Carrito offline
- **cache**: Caché general

**Funciones**:

```typescript
-initializeOfflineDB() - // Inicializar BD
  saveOfflineRequest() - // Guardar request fallido
  getPendingRequests() - // Obtener queue
  saveProductOffline() - // Cachear producto
  getOfflineProducts() - // Obtener productos
  syncPendingRequests() - // Sincronizar cuando online
  onConnectionChange() - // Detectar cambios
  getOfflineStats(); // Estadísticas
```

**Detección de Conexión**:

```typescript
-isOnline() / isOffline() - // Estado actual
  getNetworkInfo() - // Info detallada
  subscribeToNetworkChanges(); // Escuchar cambios
```

---

### 30.5 - Push Notifications ✅

**Archivo**: `/src/lib/pwa/push-notifications.ts`
**Funciones principales**:

```typescript
// Suscripción
-isPushNotificationsSupported() -
  requestNotificationPermission() -
  subscribeToPushNotifications(vapidKey) -
  getCurrentPushSubscription() -
  unsubscribeFromPushNotifications() -
  // Notificaciones
  showLocalNotification(options) -
  sendTestNotification() -
  sendWelcomeNotification() -
  sendProductNotification(name, price, image) -
  sendAbandonedCartNotification() -
  sendDiscountNotification(discount) -
  // Datos
  getPushSubscriptionDetails();
```

**Configuración VAPID** (en .env):

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

---

### 30.6 - PWA Installation Prompt ✅

**Archivo**: `/src/components/pwa/InstallPrompt.tsx`
**Características**:

- beforeinstallprompt event handling
- Prompt personalizado
- Detección de app instalada
- No aparece si ya está instalada

**Integración**:

```tsx
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

// En root layout
<InstallPrompt />;
```

---

### 30.7 - Offline Product Browsing ✅

**Archivo**: `/src/lib/pwa/offline-products.ts`
**Funciones**:

```typescript
-cacheProductsFromAPI(products) - // Cachear productos
  searchOfflineProducts(query) - // Buscar offline
  getOfflineCategories() - // Categorías disponibles
  filterProductsByCategory(cat) - // Filtrar por categoría
  getOfflineProduct(id) - // Producto individual
  getOfflineProductsStats(); // Estadísticas
```

**Uso**:

```typescript
import { searchOfflineProducts } from "@/lib/pwa/offline-products";

const results = await searchOfflineProducts("camiseta");
```

---

### 30.8 - Dark Mode & Theme Switching ✅

**Archivo**: `/src/lib/pwa/theme.ts`
**Tipos de Temas**:

- `light`: Tema claro forzado
- `dark`: Tema oscuro forzado
- `system`: Sigue preferencia del sistema (default)

**Funciones**:

```typescript
-getSystemTheme() - // Tema del SO
  getStoredTheme() - // Preferencia guardada
  getEffectiveTheme() - // Tema actual (resuelto)
  setTheme(theme) - // Cambiar tema
  toggleTheme() - // Alternar light/dark
  applyTheme(theme) - // Aplicar al DOM
  watchSystemTheme(callback) - // Escuchar cambios SO
  onThemeChange(callback) - // Escuchar cambios
  useTheme() - // Hook React
  // Inicializar en root layout
  initializeTheme();
```

**Uso en Componentes**:

```tsx
import { useTheme } from "@/lib/pwa/theme";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return <button onClick={toggleTheme}>{isDark ? "☀️" : "🌙"}</button>;
}
```

---

### 30.9 - PWA Testing ✅

**Archivo**: `/e2e/pwa/pwa.spec.ts`
**Tests Incluidos**:

1. Manifest válido
2. Service Worker registrado
3. Funciona offline
4. Prompt de instalación
5. Caching del SW funciona
6. Toggle light/dark mode
7. Productos browseables offline
8. Meta tags correctos
9. Iconos presentes
10. Navegación accesible con teclado
11. Performance metrics buenos

**Ejecución**:

```bash
npx playwright test e2e/pwa/pwa.spec.ts
```

---

### 30.10 - PWA Metrics & Analytics ✅

**Archivo**: `/src/lib/pwa/metrics.ts`
**Métricas Capturadas**:

```typescript
interface PWAMetrics {
  installed: boolean;
  installDate?: string;
  installSource?: string;
  totalSessions: number;
  lastSession?: string;
  offlineUsages: number;
  pushNotificationsEnabled: boolean;
  darkModeEnabled?: boolean;
  avgSessionDuration?: number;
}
```

**Funciones**:

```typescript
-getMetrics() - // Obtener métricas
  trackInstallation(source) - // Registrar instalación
  trackSessionStart() - // Nueva sesión
  trackOfflineUsage() - // Uso offline
  trackPushNotificationsEnabled() - // Push status
  trackDarkModePreference() - // Tema preferido
  getInstallationDate() - // Fecha instalación
  getInstallationSource() - // Cómo se instaló
  getMetricsReport() - // Reporte completo
  initializeSessionTracking(); // Inicializar
```

---

### 30.11 - PWA Documentation ✅

**Archivo**: `/docs/PWA_GUIDE.md` (Este archivo)
**Incluye**:

- Guía completa de instalación
- Documentación de cada componente
- Ejemplos de uso
- Configuración recomendada
- Troubleshooting
- Mejores prácticas

---

### 30.12 - PWA Performance Optimization ✅

**Optimizaciones Implementadas**:

### Bundle Optimization

```typescript
// En next.config.js
- Habilitar SWC minification
- Optimizar dynamic imports
- Tree shaking
- Code splitting automático
```

### Caching Optimization

```typescript
// Estrategias de caché múltiples
- Cache-First: Assets estáticos (1 año)
- Network-First: APIs (siempre fresco)
- Stale-While-Revalidate: Productos (actualiza en background)
- Image Cache: Imágenes agresivas (100 máximo)
```

### Image Optimization

```typescript
- Next.js Image component
- Formatos modernos (WebP)
- Lazy loading
- Responsive sizes
- Blur placeholder
```

### Resource Hints

```html
<!-- En layout -->
<link rel="preconnect" href="https://api.example.com" />
<link rel="dns-prefetch" href="//fonts.googleapis.com" />
<link rel="prefetch" href="/shop" />
```

**Resultados Esperados**:

- Lighthouse Score: 90+
- FCP: < 1.5s
- LCP: < 2.5s
- CLS: < 0.1
- TTI: < 3.5s

---

## 📂 Estructura de Archivos Creados

```
/src/lib/pwa/
├── sw-register.ts           # Service Worker registration (30.2)
├── offline.ts               # Offline + IndexedDB (30.4)
├── push-notifications.ts    # Push notifications (30.5)
├── offline-products.ts      # Offline product browsing (30.7)
├── theme.ts                 # Dark mode / Light mode (30.8)
└── metrics.ts               # Analytics & metrics (30.10)

/src/components/pwa/
└── InstallPrompt.tsx        # Installation prompt (30.6)

/e2e/pwa/
└── pwa.spec.ts             # E2E testing (30.9)

/public/
├── manifest.json           # Web app manifest (30.1)
└── sw.js                   # Service worker (30.3)

/docs/
└── PWA_GUIDE.md           # This guide (30.11)
```

---

## 🚀 Integración en Proyecto

### 1. Root Layout (`app/layout.tsx`)

```tsx
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { initializeServiceWorker } from "@/lib/pwa/sw-register";
import { initializeTheme } from "@/lib/pwa/theme";
import { initializeSessionTracking } from "@/lib/pwa/metrics";

export default function RootLayout() {
  return (
    <html>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <ClientInitializer />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}

function ClientInitializer() {
  "use client";

  useEffect(() => {
    initializeServiceWorker();
    initializeTheme();
    initializeSessionTracking();
  }, []);

  return null;
}
```

### 2. Habilitar Push Notifications

```tsx
import { subscribeToPushNotifications } from "@/lib/pwa/push-notifications";

async function enableNotifications() {
  const subscription = await subscribeToPushNotifications(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  );
  // Enviar al servidor
}
```

### 3. Usar Dark Mode Hook

```tsx
import { useTheme } from "@/lib/pwa/theme";

export function MyComponent() {
  const { isDark, toggleTheme } = useTheme();

  return <button onClick={toggleTheme}>{isDark ? "Light Mode" : "Dark Mode"}</button>;
}
```

### 4. Cachear Productos Offline

```tsx
import { cacheProductsFromAPI } from "@/lib/pwa/offline-products";

useEffect(() => {
  fetch("/api/products")
    .then((r) => r.json())
    .then((products) => {
      cacheProductsFromAPI(products);
    });
}, []);
```

---

## 🔧 Configuración

### .env.local

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:support@sacrint.com
```

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  images: {
    formats: ["image/webp", "image/avif"],
    unoptimized: false,
  },
  headers: async () => ({
    headers: [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ],
  }),
};

module.exports = nextConfig;
```

---

## 📊 Estadísticas Finales Semana 30

### Código Creado

- **Archivos nuevos**: 8 archivos
- **Líneas de código**: 3,000+
- **Componentes React**: 1
- **Librerías TypeScript**: 6 módulos
- **Tests E2E**: 11 tests
- **Documentación**: 250+ líneas

### Cobertura de Funcionalidades

- ✅ Web App Manifest completo
- ✅ Service Worker con múltiples estrategias
- ✅ Offline-first architecture
- ✅ Push Notifications
- ✅ Instalación en home screen
- ✅ Dark/Light mode switching
- ✅ Offline product browsing
- ✅ Analytics & metrics
- ✅ E2E testing
- ✅ Performance optimization

---

## 🐛 Troubleshooting

### Service Worker no se registra

```typescript
// Verificar en DevTools
1. Application -> Service Workers
2. Verificar que /sw.js exista
3. Verificar HTTPS en producción
```

### Offline no funciona

```typescript
// Verificar IndexedDB
1. DevTools -> Application -> IndexedDB
2. Verificar que 'tienda-online-db' existe
3. Verificar que tienes datos cacheados
```

### Push notifications no funcionan

```typescript
// Verificar permisos
1. DevTools -> Application -> Manifest
2. Verificar notification permission
3. Verificar VAPID keys en .env
```

### Dark mode no persiste

```typescript
// Limpiar localStorage
localStorage.removeItem("sacrint-theme-preference");
localStorage.removeItem("sacrint-theme");
// Reload
```

---

## 📚 Referencias

- [Web App Manifest Spec](https://www.w3.org/TR/appmanifest/)
- [Service Worker Spec](https://w3c.github.io/ServiceWorker/)
- [Web Push Protocol](https://tools.ietf.org/html/draft-thomson-webpush-protocol)
- [IndexedDB Spec](https://w3c.github.io/IndexedDB/)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

**Estado**: ✅ SEMANA 30 COMPLETADA 100%
**Próxima Semana**: Semana 31 - Mantenimiento y Mejoras Continuas
**Fecha**: 26-30 de Noviembre, 2025
