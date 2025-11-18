"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log(
            "Service Worker registered successfully:",
            registration.scope,
          );

          // Check for updates every hour
          setInterval(
            () => {
              registration.update();
            },
            60 * 60 * 1000,
          );

          // Handle updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available, show update notification
                  if (
                    confirm(
                      "A new version of the app is available. Reload to update?",
                    )
                  ) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });

      // Handle controller change (when new SW takes over)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("New service worker activated");
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("Message from service worker:", event.data);

        // Handle specific message types
        if (event.data.type === "CACHE_UPDATED") {
          console.log("Cache updated:", event.data.cacheName);
        }
      });
    }
  }, []);

  return null;
}
