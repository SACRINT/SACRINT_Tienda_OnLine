/**
 * Push Notifications
 * Semana 30, Tarea 30.5: Push notifications con Web Push API
 */

export interface PushNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  data?: Record<string, any>;
}

export interface PushSubscriptionDetails {
  endpoint: string;
  auth: string;
  p256dh: string;
}

/**
 * Verificar soporte de Push Notifications
 */
export function isPushNotificationsSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Solicitar permiso para notificaciones
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("[Push] Notifications no soportadas");
    return "denied";
  }

  if (Notification.permission !== "default") {
    return Notification.permission;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log("[Push] Permiso de notificaciones:", permission);
    return permission;
  } catch (error) {
    console.error("[Push] Error solicitando permiso:", error);
    return "denied";
  }
}

/**
 * Suscribirse a push notifications
 */
export async function subscribeToPushNotifications(
  vapidPublicKey: string,
): Promise<PushSubscription | null> {
  if (!isPushNotificationsSupported()) {
    console.warn("[Push] Push notifications no soportadas");
    return null;
  }

  try {
    const permission = await requestNotificationPermission();

    if (permission !== "granted") {
      console.warn("[Push] Permiso denegado para notificaciones");
      return null;
    }

    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log("[Push] Suscripción exitosa:", subscription);
    return subscription;
  } catch (error) {
    console.error("[Push] Error suscribiendo a push:", error);
    return null;
  }
}

/**
 * Obtener suscripción actual
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!navigator.serviceWorker?.controller) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error("[Push] Error obteniendo suscripción:", error);
    return null;
  }
}

/**
 * Desuscribirse de push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const subscription = await getCurrentPushSubscription();

    if (!subscription) {
      return false;
    }

    const success = await subscription.unsubscribe();
    console.log("[Push] Desuscripción exitosa:", success);
    return success;
  } catch (error) {
    console.error("[Push] Error desuscribiendo:", error);
    return false;
  }
}

/**
 * Mostrar notificación local
 */
export async function showLocalNotification(options: PushNotificationOptions): Promise<void> {
  if (!isPushNotificationsSupported()) {
    console.warn("[Push] Notifications no soportadas");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || "/icons/icon-192x192.png",
      badge: options.badge || "/icons/badge-72x72.png",
      image: options.image,
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      actions: options.actions,
      data: options.data,
    });

    console.log("[Push] Notificación local mostrada:", options.title);
  } catch (error) {
    console.error("[Push] Error mostrando notificación:", error);
  }
}

/**
 * Enviar notificación de prueba
 */
export async function sendTestNotification(): Promise<void> {
  await showLocalNotification({
    title: "SACRINT Tienda",
    body: "Esta es una notificación de prueba",
    icon: "/icons/icon-192x192.png",
    tag: "test-notification",
  });
}

/**
 * Escuchar notificaciones push
 */
export function onPushNotification(callback: (data: Record<string, any>) => void): void {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data.type === "PUSH_NOTIFICATION") {
      callback(event.data.payload);
    }
  });
}

/**
 * Enviar mensaje al service worker
 */
export async function sendPushMessage(data: Record<string, any>): Promise<void> {
  if (!navigator.serviceWorker.controller) {
    return;
  }

  navigator.serviceWorker.controller.postMessage({
    type: "PUSH_MESSAGE",
    payload: data,
  });
}

/**
 * Obtener detalles de suscripción (para enviar al servidor)
 */
export async function getPushSubscriptionDetails(): Promise<PushSubscriptionDetails | null> {
  try {
    const subscription = await getCurrentPushSubscription();

    if (!subscription) {
      return null;
    }

    const key = subscription.getKey("p256dh");
    const auth = subscription.getKey("auth");

    return {
      endpoint: subscription.endpoint,
      p256dh: arrayBufferToBase64(key as ArrayBuffer),
      auth: arrayBufferToBase64(auth as ArrayBuffer),
    };
  } catch (error) {
    console.error("[Push] Error obteniendo detalles:", error);
    return null;
  }
}

/**
 * Convertir URL base64 a Uint8Array (para VAPID key)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Convertir ArrayBuffer a Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return window.btoa(binary);
}

/**
 * Crear notificación de bienvenida
 */
export async function sendWelcomeNotification(): Promise<void> {
  await showLocalNotification({
    title: "Bienvenido a SACRINT Shop",
    body: "Ahora recibirás notificaciones sobre ofertas y novedades",
    icon: "/icons/icon-192x192.png",
    tag: "welcome-notification",
    data: {
      url: "/",
    },
  });
}

/**
 * Crear notificación de producto
 */
export async function sendProductNotification(
  productName: string,
  productPrice: number,
  productImage?: string,
): Promise<void> {
  await showLocalNotification({
    title: "Nuevo Producto",
    body: `${productName} por $${productPrice}`,
    icon: productImage || "/icons/icon-192x192.png",
    tag: "product-notification",
    data: {
      url: "/shop",
    },
  });
}

/**
 * Crear notificación de carrito abandonado
 */
export async function sendAbandonedCartNotification(): Promise<void> {
  await showLocalNotification({
    title: "Tu Carrito te Espera",
    body: "Tienes productos en tu carrito. Completa tu compra ahora.",
    icon: "/icons/icon-192x192.png",
    tag: "cart-notification",
    data: {
      url: "/cart",
    },
  });
}

/**
 * Crear notificación de descuento
 */
export async function sendDiscountNotification(discount: number): Promise<void> {
  await showLocalNotification({
    title: "Descuento Especial",
    body: `Aprovecha ${discount}% de descuento en toda la tienda`,
    icon: "/icons/icon-192x192.png",
    tag: "discount-notification",
    data: {
      url: "/shop",
    },
  });
}
