// Notification Service Layer

export type NotificationType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "order"
  | "promo"
  | "system"

export type NotificationPriority = "low" | "medium" | "high" | "urgent"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  priority?: NotificationPriority
  read: boolean
  createdAt: Date
  link?: string
  action?: {
    label: string
    onClick: () => void
  }
  meta?: {
    orderId?: string
    productId?: string
    couponCode?: string
  }
}

export interface NotificationPreferences {
  email: {
    orders: boolean
    promotions: boolean
    newsletter: boolean
    priceAlerts: boolean
    stockAlerts: boolean
  }
  push: {
    orders: boolean
    promotions: boolean
    priceAlerts: boolean
  }
  inApp: {
    orders: boolean
    promotions: boolean
    system: boolean
  }
}

// Default preferences
export const defaultPreferences: NotificationPreferences = {
  email: {
    orders: true,
    promotions: true,
    newsletter: true,
    priceAlerts: true,
    stockAlerts: true,
  },
  push: {
    orders: true,
    promotions: false,
    priceAlerts: true,
  },
  inApp: {
    orders: true,
    promotions: true,
    system: true,
  },
}

// Storage key
const NOTIFICATIONS_KEY = "sacrint-notifications"
const PREFERENCES_KEY = "sacrint-notification-preferences"

// Generate unique ID
function generateId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Get all notifications
export function getNotifications(): Notification[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(NOTIFICATIONS_KEY)
  if (!stored) return []

  try {
    const notifications = JSON.parse(stored)
    return notifications.map((n: Notification) => ({
      ...n,
      createdAt: new Date(n.createdAt),
    }))
  } catch {
    return []
  }
}

// Get unread count
export function getUnreadCount(): number {
  const notifications = getNotifications()
  return notifications.filter((n) => !n.read).length
}

// Add notification
export function addNotification(
  notification: Omit<Notification, "id" | "read" | "createdAt">
): Notification {
  const notifications = getNotifications()

  const newNotification: Notification = {
    ...notification,
    id: generateId(),
    read: false,
    createdAt: new Date(),
  }

  const updated = [newNotification, ...notifications].slice(0, 50) // Keep max 50
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated))

  // Dispatch event for UI updates
  window.dispatchEvent(
    new CustomEvent("notification-added", {
      detail: newNotification,
    })
  )

  return newNotification
}

// Mark as read
export function markAsRead(id: string): void {
  const notifications = getNotifications()
  const updated = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
  )

  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated))
  window.dispatchEvent(new CustomEvent("notifications-updated"))
}

// Mark all as read
export function markAllAsRead(): void {
  const notifications = getNotifications()
  const updated = notifications.map((n) => ({ ...n, read: true }))

  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated))
  window.dispatchEvent(new CustomEvent("notifications-updated"))
}

// Delete notification
export function deleteNotification(id: string): void {
  const notifications = getNotifications()
  const updated = notifications.filter((n) => n.id !== id)

  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated))
  window.dispatchEvent(new CustomEvent("notifications-updated"))
}

// Clear all notifications
export function clearAllNotifications(): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]))
  window.dispatchEvent(new CustomEvent("notifications-updated"))
}

// Get preferences
export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return defaultPreferences

  const stored = localStorage.getItem(PREFERENCES_KEY)
  if (!stored) return defaultPreferences

  try {
    return JSON.parse(stored)
  } catch {
    return defaultPreferences
  }
}

// Save preferences
export function saveNotificationPreferences(
  preferences: NotificationPreferences
): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
  window.dispatchEvent(new CustomEvent("preferences-updated"))
}

// Notification templates
export const notificationTemplates = {
  orderConfirmed: (orderId: string) => ({
    type: "order" as NotificationType,
    title: "Pedido confirmado",
    message: `Tu pedido #${orderId} ha sido confirmado y está siendo procesado.`,
    priority: "high" as NotificationPriority,
    link: `/cuenta/pedidos/${orderId}`,
    meta: { orderId },
  }),

  orderShipped: (orderId: string, trackingNumber?: string) => ({
    type: "order" as NotificationType,
    title: "Pedido enviado",
    message: `Tu pedido #${orderId} ha sido enviado.${trackingNumber ? ` Número de rastreo: ${trackingNumber}` : ""}`,
    priority: "high" as NotificationPriority,
    link: `/cuenta/pedidos/${orderId}`,
    meta: { orderId },
  }),

  orderDelivered: (orderId: string) => ({
    type: "order" as NotificationType,
    title: "Pedido entregado",
    message: `Tu pedido #${orderId} ha sido entregado. ¡Gracias por tu compra!`,
    priority: "medium" as NotificationPriority,
    link: `/cuenta/pedidos/${orderId}`,
    meta: { orderId },
  }),

  priceDropped: (productName: string, productId: string, discount: number) => ({
    type: "promo" as NotificationType,
    title: "¡Bajó de precio!",
    message: `${productName} ahora tiene ${discount}% de descuento.`,
    priority: "medium" as NotificationPriority,
    link: `/productos/${productId}`,
    meta: { productId },
  }),

  backInStock: (productName: string, productId: string) => ({
    type: "info" as NotificationType,
    title: "Producto disponible",
    message: `${productName} está de nuevo en stock.`,
    priority: "medium" as NotificationPriority,
    link: `/productos/${productId}`,
    meta: { productId },
  }),

  couponReceived: (code: string, discount: string) => ({
    type: "promo" as NotificationType,
    title: "¡Cupón recibido!",
    message: `Usa el código ${code} para obtener ${discount} de descuento.`,
    priority: "medium" as NotificationPriority,
    link: "/carrito",
    meta: { couponCode: code },
  }),

  welcomeBonus: () => ({
    type: "promo" as NotificationType,
    title: "¡Bienvenido!",
    message: "Usa el código BIENVENIDO para 10% de descuento en tu primera compra.",
    priority: "high" as NotificationPriority,
    link: "/productos",
    meta: { couponCode: "BIENVENIDO" },
  }),

  systemMaintenance: (date: string) => ({
    type: "system" as NotificationType,
    title: "Mantenimiento programado",
    message: `El sistema estará en mantenimiento el ${date}. Disculpa las molestias.`,
    priority: "low" as NotificationPriority,
  }),
}

// Request push notification permission
export async function requestPushPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}

// Show browser notification
export function showBrowserNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/icon-192.png",
      badge: "/icon-72.png",
      ...options,
    })
  }
}

// Format notification time
export function formatNotificationTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Ahora"
  if (minutes < 60) return `Hace ${minutes} min`
  if (hours < 24) return `Hace ${hours}h`
  if (days < 7) return `Hace ${days}d`

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  })
}
