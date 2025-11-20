/**
 * PWA Hook
 * Manages service worker registration, updates, and offline status
 */

"use client";

import { useState, useEffect } from "react";

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  isRegistered: boolean;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isOnline: true,
    hasUpdate: false,
    isRegistered: false,
  });

  useEffect(() => {
    // Check if app is installed (running in standalone mode)
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-ignore
        window.navigator.standalone === true;

      setState((prev) => ({ ...prev, isInstalled: isStandalone }));
    };

    checkInstalled();

    // Monitor online/offline status
    const handleOnline = () =>
      setState((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () =>
      setState((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Register service worker
    if ("serviceWorker" in navigator) {
      registerServiceWorker();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      setState((prev) => ({ ...prev, isRegistered: true }));

      console.log("[PWA] Service Worker registered:", registration.scope);

      // Check for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;

        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New service worker available
            setState((prev) => ({ ...prev, hasUpdate: true }));
            console.log("[PWA] New service worker available");
          }
        });
      });

      // Check for updates every 1 hour
      setInterval(
        () => {
          registration.update();
        },
        60 * 60 * 1000,
      );
    } catch (error) {
      console.error("[PWA] Service Worker registration failed:", error);
    }
  };

  const updateServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (!registration || !registration.waiting) {
        return;
      }

      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: "SKIP_WAITING" });

      // Reload the page when the new service worker takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      setState((prev) => ({ ...prev, hasUpdate: false }));
    } catch (error) {
      console.error("[PWA] Failed to update service worker:", error);
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      console.log("[PWA] This browser does not support notifications");
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  return {
    ...state,
    updateServiceWorker,
    requestNotificationPermission,
  };
}
