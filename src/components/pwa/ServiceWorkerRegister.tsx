/**
 * Service Worker Registration Component
 * Semana 30: PWA Implementation
 * Auto-registro y gestión del ciclo de vida del SW
 */

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, RefreshCw } from "lucide-react";

export function ServiceWorkerRegister() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Verificar si el navegador soporta Service Workers
    if ("serviceWorker" in navigator) {
      registerServiceWorker();
    }

    // Monitorear estado de conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js", {
        scope: "/",
      });

      console.log("[PWA] Service Worker registrado:", registration);

      // Escuchar actualizaciones del SW
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Hay una nueva versión disponible
              console.log("[PWA] Nueva versión disponible");
              setWaitingWorker(newWorker);
              setShowUpdatePrompt(true);
            }
          });
        }
      });

      // Verificar si ya hay una actualización esperando
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowUpdatePrompt(true);
      }

      // Polling periódico para buscar actualizaciones (cada hora)
      setInterval(
        () => {
          registration.update();
        },
        60 * 60 * 1000,
      );
    } catch (error) {
      console.error("[PWA] Error registrando Service Worker:", error);
    }
  };

  const handleUpdate = () => {
    if (waitingWorker) {
      // Enviar mensaje al SW para que se active inmediatamente
      waitingWorker.postMessage({ type: "SKIP_WAITING" });

      // Recargar la página cuando el nuevo SW tome control
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }
  };

  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  return (
    <>
      {/* Banner de Actualización Disponible */}
      {showUpdatePrompt && (
        <div className="animate-slide-up fixed bottom-4 left-4 right-4 z-50 md:left-auto md:w-96">
          <div className="rounded-lg bg-primary p-4 text-white shadow-2xl">
            <div className="mb-2 flex items-start justify-between">
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-semibold">🎉 Nueva Versión Disponible</h3>
                <p className="text-sm text-white/90">
                  Hay una actualización de la aplicación lista para instalarse.
                </p>
              </div>
              <button
                onClick={dismissUpdate}
                className="text-white/80 transition-colors hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={handleUpdate}
                className="bg-accent hover:bg-accent/90 flex-1 text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar Ahora
              </Button>
              <Button
                onClick={dismissUpdate}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Más Tarde
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Estado Offline */}
      {!isOnline && (
        <div className="fixed left-0 right-0 top-0 z-50 bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-black shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-black"></span>
            Sin conexión - Navegando en modo offline
          </div>
        </div>
      )}
    </>
  );
}

// Hook personalizado para verificar estado de conexión
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook para enviar mensajes al Service Worker
export function useSW() {
  const sendMessage = (message: any) => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  };

  const cacheUrls = (urls: string[]) => {
    sendMessage({ type: "CACHE_URLS", urls });
  };

  const clearCache = () => {
    sendMessage({ type: "CLEAR_CACHE" });
  };

  return { sendMessage, cacheUrls, clearCache };
}

// Función para solicitar permiso de notificaciones push
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("[PWA] Notificaciones no soportadas");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

// Función para suscribirse a notificaciones push
export async function subscribeToPushNotifications() {
  try {
    const hasPermission = await requestNotificationPermission();

    if (!hasPermission) {
      throw new Error("Permiso de notificaciones denegado");
    }

    const registration = await navigator.serviceWorker.ready;

    // Suscripción a push notifications (requiere VAPID keys en producción)
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""),
    });

    // Enviar suscripción al servidor para almacenar
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });

    console.log("[PWA] Suscrito a push notifications");
    return subscription;
  } catch (error) {
    console.error("[PWA] Error suscribiendo a push:", error);
    throw error;
  }
}

// Helper para convertir VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray as Uint8Array<ArrayBuffer>;
}
