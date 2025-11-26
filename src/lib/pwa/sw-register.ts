/**
 * Service Worker Registration
 * Semana 30, Tarea 30.2: Registro automático y actualización
 */

const SW_FILE = '/sw.js';
const SW_VERSION = 'v1.0.0';

interface ServiceWorkerUpdateEvent extends Event {
  registration: ServiceWorkerRegistration;
}

interface PWARegistration {
  isSupported: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
}

/**
 * Verificar si el navegador soporta Service Workers
 */
export function isPWASupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Registrar Service Worker automáticamente
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPWASupported()) {
    console.warn('[PWA] Service Workers no soportados en este navegador');
    return null;
  }

  try {
    console.log('[PWA] Registrando Service Worker...', SW_FILE);

    const registration = await navigator.serviceWorker.register(SW_FILE, {
      scope: '/',
    });

    console.log('[PWA] Service Worker registrado exitosamente', registration);

    // Escuchar actualizaciones
    registration.addEventListener('updatefound', handleUpdateFound);

    // Verificar actualizaciones cada 6 horas
    setInterval(() => {
      registration.update().catch((error) => {
        console.error('[PWA] Error verificando actualizaciones:', error);
      });
    }, 6 * 60 * 60 * 1000);

    return registration;
  } catch (error) {
    console.error('[PWA] Error registrando Service Worker:', error);
    return null;
  }
}

/**
 * Manejar actualizaciones del Service Worker
 */
function handleUpdateFound(this: ServiceWorkerRegistration): void {
  const newWorker = this.installing;

  if (!newWorker) return;

  console.log('[PWA] Nuevo Service Worker detectado');

  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // Nueva versión disponible
      console.log('[PWA] Nueva versión disponible');

      // Notificar al usuario
      notifyUpdate();

      // Emitir evento para que la UI se actualice
      window.dispatchEvent(
        new CustomEvent('sw-update-available', {
          detail: { registration: this },
        })
      );
    }

    if (newWorker.state === 'activated') {
      console.log('[PWA] Service Worker actualizado');
      window.dispatchEvent(new Event('sw-updated'));
    }
  });
}

/**
 * Notificar al usuario sobre una actualización
 */
function notifyUpdate(): void {
  // Mostrar notificación en la UI
  const notification = document.createElement('div');
  notification.className = 'pwa-update-notification';
  notification.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: #3B82F6;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      gap: 12px;
    ">
      <span>Actualización disponible</span>
      <button
        onclick="window.location.reload()"
        style="
          background: white;
          color: #3B82F6;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
        "
      >
        Actualizar
      </button>
      <button
        onclick="this.parentElement.remove()"
        style="
          background: transparent;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 20px;
          line-height: 1;
        "
      >
        ✕
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  // Auto-remover después de 10 segundos si se rechaza
  setTimeout(() => {
    notification.remove();
  }, 10000);
}

/**
 * Forzar actualización del Service Worker
 */
export async function forceServiceWorkerUpdate(
  registration: ServiceWorkerRegistration | null
): Promise<void> {
  if (!registration) {
    registration = await navigator.serviceWorker.getRegistration();
  }

  if (!registration) {
    console.error('[PWA] No hay Service Worker registrado');
    return;
  }

  try {
    const updated = await registration.update();
    console.log('[PWA] Actualización forzada completada', updated);
  } catch (error) {
    console.error('[PWA] Error forzando actualización:', error);
  }
}

/**
 * Obtener información del Service Worker actual
 */
export async function getServiceWorkerInfo(): Promise<PWARegistration> {
  const isSupported = isPWASupported();

  if (!isSupported) {
    return {
      isSupported: false,
      isRegistered: false,
      registration: null,
    };
  }

  const registration = await navigator.serviceWorker.getRegistration();

  return {
    isSupported: true,
    isRegistered: !!registration,
    registration: registration || null,
  };
}

/**
 * Desregistrar Service Worker
 */
export async function unregisterServiceWorker(): Promise<void> {
  if (!isPWASupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      const unregistered = await registration.unregister();
      console.log('[PWA] Service Worker desregistrado:', unregistered);
    }
  } catch (error) {
    console.error('[PWA] Error desregistrando Service Worker:', error);
  }
}

/**
 * Comunicar con el Service Worker
 */
export async function postMessageToServiceWorker(data: Record<string, unknown>): Promise<void> {
  if (!isPWASupported() || !navigator.serviceWorker.controller) {
    console.warn('[PWA] Service Worker no está activo');
    return;
  }

  navigator.serviceWorker.controller.postMessage(data);
  console.log('[PWA] Mensaje enviado al Service Worker:', data);
}

/**
 * Escuchar mensajes del Service Worker
 */
export function onServiceWorkerMessage(
  callback: (data: Record<string, unknown>) => void
): void {
  if (!isPWASupported()) {
    return;
  }

  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('[PWA] Mensaje recibido del Service Worker:', event.data);
    callback(event.data);
  });
}

/**
 * Inicializar Service Worker automáticamente (para usarse en root layout)
 */
export async function initializeServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  // Solo en client-side
  if (typeof window === 'undefined') {
    return null;
  }

  // Registrar Service Worker
  const registration = await registerServiceWorker();

  // Escuchar cambios en el controlador
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[PWA] Service Worker controller cambió');
    window.dispatchEvent(new Event('sw-controller-change'));
  });

  return registration;
}
