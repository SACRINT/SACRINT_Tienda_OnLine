// Service Worker Registration & Management
// Client-side utilities for SW

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  registration?: ServiceWorkerRegistration;
  updateAvailable: boolean;
  isOffline: boolean;
}

// Check if service workers are supported
export function isServiceWorkerSupported(): boolean {
  return "serviceWorker" in navigator;
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) {
    console.log("Service workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    console.log("Service Worker registered:", registration.scope);

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Every hour

    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

// Unregister service worker
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.unregister();
  } catch (error) {
    console.error("Service Worker unregistration failed:", error);
    return false;
  }
}

// Listen for SW updates
export function onServiceWorkerUpdate(
  callback: (registration: ServiceWorkerRegistration) => void
): void {
  if (!isServiceWorkerSupported()) {
    return;
  }

  navigator.serviceWorker.ready.then((registration) => {
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            callback(registration);
          }
        });
      }
    });
  });
}

// Skip waiting and activate new SW
export function skipWaiting(registration: ServiceWorkerRegistration): void {
  registration.waiting?.postMessage({ type: "SKIP_WAITING" });
}

// Get current SW status
export async function getServiceWorkerStatus(): Promise<ServiceWorkerStatus> {
  const status: ServiceWorkerStatus = {
    isSupported: isServiceWorkerSupported(),
    isRegistered: false,
    updateAvailable: false,
    isOffline: !navigator.onLine,
  };

  if (!status.isSupported) {
    return status;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      status.isRegistered = true;
      status.registration = registration;
      status.updateAvailable = !!registration.waiting;
    }
  } catch (error) {
    console.error("Failed to get SW status:", error);
  }

  return status;
}

// Clear all caches
export async function clearAllCaches(): Promise<void> {
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log("All caches cleared");
  }
}

// Get cache storage usage
export async function getCacheStorageUsage(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    return {
      usage,
      quota,
      percentage: quota > 0 ? (usage / quota) * 100 : 0,
    };
  }
  return { usage: 0, quota: 0, percentage: 0 };
}
