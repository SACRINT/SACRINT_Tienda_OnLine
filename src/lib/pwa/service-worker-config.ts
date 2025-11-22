/**
 * Service Worker Configuration
 * Configuración para PWA
 */

export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  startUrl: string;
  display: "fullscreen" | "standalone" | "minimal-ui" | "browser";
  orientation?: "any" | "natural" | "landscape" | "portrait";
  scope?: string;
}

export interface CacheStrategy {
  name: string;
  pattern: RegExp;
  strategy: "NetworkFirst" | "CacheFirst" | "StaleWhileRevalidate" | "NetworkOnly" | "CacheOnly";
  cacheName?: string;
  expiration?: {
    maxEntries?: number;
    maxAgeSeconds?: number;
  };
}

/**
 * Configuración por defecto de PWA
 */
export const defaultPWAConfig: PWAConfig = {
  name: "Tienda Online",
  shortName: "Tienda",
  description: "Tu tienda online favorita",
  themeColor: "#000000",
  backgroundColor: "#ffffff",
  startUrl: "/",
  display: "standalone",
  orientation: "portrait",
  scope: "/",
};

/**
 * Estrategias de cache predefinidas
 */
export const defaultCacheStrategies: CacheStrategy[] = [
  // API calls - Network First
  {
    name: "api-calls",
    pattern: /^https:\/\/.*\/api\/.*/,
    strategy: "NetworkFirst",
    cacheName: "api-cache",
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 5, // 5 minutos
    },
  },
  // Imágenes - Cache First
  {
    name: "images",
    pattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
    strategy: "CacheFirst",
    cacheName: "images-cache",
    expiration: {
      maxEntries: 200,
      maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
    },
  },
  // Fonts - Cache First
  {
    name: "fonts",
    pattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
    strategy: "CacheFirst",
    cacheName: "fonts-cache",
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
    },
  },
  // Static assets - Stale While Revalidate
  {
    name: "static-assets",
    pattern: /\.(?:js|css)$/,
    strategy: "StaleWhileRevalidate",
    cacheName: "static-cache",
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
    },
  },
  // Google Analytics - Network Only
  {
    name: "google-analytics",
    pattern: /^https:\/\/www\.google-analytics\.com\/.*/,
    strategy: "NetworkOnly",
  },
];

/**
 * Generar manifest.json
 */
export function generateManifest(config: PWAConfig = defaultPWAConfig) {
  return {
    name: config.name,
    short_name: config.shortName,
    description: config.description,
    theme_color: config.themeColor,
    background_color: config.backgroundColor,
    start_url: config.startUrl,
    display: config.display,
    orientation: config.orientation,
    scope: config.scope,
    icons: [
      {
        src: "/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}

/**
 * Verificar si el navegador soporta Service Workers
 */
export function isServiceWorkerSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

/**
 * Registrar Service Worker
 */
export async function registerServiceWorker(
  swPath: string = "/sw.js",
): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.warn("Service Workers are not supported in this browser");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(swPath, {
      scope: "/",
    });

    console.log("Service Worker registered successfully:", registration.scope);

    // Actualizar SW si hay una nueva versión
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          console.log("New Service Worker available. Refresh to update.");
          // Aquí podrías mostrar un mensaje al usuario
        }
      });
    });

    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

/**
 * Desregistrar Service Worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    console.log("Service Worker unregistered:", success);
    return success;
  } catch (error) {
    console.error("Service Worker unregistration failed:", error);
    return false;
  }
}

/**
 * Hook de instalación de PWA
 */
export function usePWAInstallPrompt() {
  if (typeof window === "undefined") {
    return { canInstall: false, promptInstall: async () => false };
  }

  let deferredPrompt: any = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    deferredPrompt = null;
    return outcome === "accepted";
  };

  return {
    canInstall: !!deferredPrompt,
    promptInstall,
  };
}

export default {
  defaultPWAConfig,
  defaultCacheStrategies,
  generateManifest,
  isServiceWorkerSupported,
  registerServiceWorker,
  unregisterServiceWorker,
  usePWAInstallPrompt,
};
