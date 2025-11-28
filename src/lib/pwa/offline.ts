/**
 * Offline Functionality & IndexedDB Management
 * Semana 30, Tarea 30.4: Offline support con IndexedDB y Network Detection
 */

export type ConnectionStatus = "online" | "offline" | "slow";

export interface NetworkInfo {
  status: ConnectionStatus;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

// IndexedDB Types
const DB_NAME = "tienda-online-db";
const DB_VERSION = 1;

export interface OfflineRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

export interface OfflineProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
  cachedAt: number;
}

export interface OfflineCart {
  id: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  total: number;
  createdAt: number;
  updatedAt: number;
}

// Get current network info
export function getNetworkInfo(): NetworkInfo {
  const info: NetworkInfo = {
    status: navigator.onLine ? "online" : "offline",
  };

  const connection =
    (navigator as any).connection ||
    (navigator as any).mozConnection ||
    (navigator as any).webkitConnection;

  if (connection) {
    info.effectiveType = connection.effectiveType;
    info.downlink = connection.downlink;
    info.rtt = connection.rtt;
    info.saveData = connection.saveData;

    // Determine if connection is slow
    if (
      info.effectiveType === "slow-2g" ||
      info.effectiveType === "2g" ||
      (info.rtt && info.rtt > 500) ||
      (info.downlink && info.downlink < 0.5)
    ) {
      info.status = "slow";
    }
  }

  return info;
}

// Check if currently online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Check if on slow connection
export function isSlowConnection(): boolean {
  const info = getNetworkInfo();
  return info.status === "slow";
}

// Subscribe to online/offline events
export function subscribeToNetworkChanges(
  callback: (status: ConnectionStatus) => void,
): () => void {
  const handleOnline = () => callback("online");
  const handleOffline = () => callback("offline");

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Also listen for connection changes
  const connection = (navigator as any).connection;
  const handleConnectionChange = () => {
    const info = getNetworkInfo();
    callback(info.status);
  };

  if (connection) {
    connection.addEventListener("change", handleConnectionChange);
  }

  // Return cleanup function
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    if (connection) {
      connection.removeEventListener("change", handleConnectionChange);
    }
  };
}

// Queue actions for when back online
interface QueuedAction {
  id: string;
  action: () => Promise<void>;
  timestamp: number;
}

const actionQueue: QueuedAction[] = [];

export function queueOfflineAction(id: string, action: () => Promise<void>): void {
  // Remove existing action with same ID
  const existingIndex = actionQueue.findIndex((a) => a.id === id);
  if (existingIndex !== -1) {
    actionQueue.splice(existingIndex, 1);
  }

  actionQueue.push({
    id,
    action,
    timestamp: Date.now(),
  });

  // Save to localStorage for persistence
  try {
    localStorage.setItem(
      "offline_queue",
      JSON.stringify(actionQueue.map((a) => ({ id: a.id, timestamp: a.timestamp }))),
    );
  } catch (e) {
    // localStorage might be full
  }
}

// Process queued actions when back online
export async function processOfflineQueue(): Promise<{
  processed: number;
  failed: number;
}> {
  let processed = 0;
  let failed = 0;

  for (const item of [...actionQueue]) {
    try {
      await item.action();
      processed++;
      // Remove from queue
      const index = actionQueue.findIndex((a) => a.id === item.id);
      if (index !== -1) {
        actionQueue.splice(index, 1);
      }
    } catch (error) {
      failed++;
      console.error("Failed to process queued action:", item.id, error);
    }
  }

  // Update localStorage
  try {
    if (actionQueue.length === 0) {
      localStorage.removeItem("offline_queue");
    } else {
      localStorage.setItem(
        "offline_queue",
        JSON.stringify(actionQueue.map((a) => ({ id: a.id, timestamp: a.timestamp }))),
      );
    }
  } catch (e) {
    // Ignore
  }

  return { processed, failed };
}

// Get queue size
export function getOfflineQueueSize(): number {
  return actionQueue.length;
}

// Clear offline queue
export function clearOfflineQueue(): void {
  actionQueue.length = 0;
  try {
    localStorage.removeItem("offline_queue");
  } catch (e) {
    // Ignore
  }
}

// ============================================
// IndexedDB Functions - Offline Storage
// ============================================

/**
 * Inicializar base de datos IndexedDB
 */
export async function initializeOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("[Offline] Error abriendo IndexedDB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;
      console.log("[Offline] IndexedDB inicializado correctamente");
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Crear stores para requests pendientes
      if (!db.objectStoreNames.contains("pending-requests")) {
        const store = db.createObjectStore("pending-requests", { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }

      // Crear stores para productos cacheados
      if (!db.objectStoreNames.contains("products")) {
        const store = db.createObjectStore("products", { keyPath: "id" });
        store.createIndex("category", "category", { unique: false });
        store.createIndex("cachedAt", "cachedAt", { unique: false });
      }

      // Crear stores para carrito
      if (!db.objectStoreNames.contains("cart")) {
        db.createObjectStore("cart", { keyPath: "id" });
      }
    };
  });
}

/**
 * Guardar request fallido para sincronizar después
 */
export async function saveOfflineRequest(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string,
): Promise<void> {
  const db = await initializeOfflineDB();
  const transaction = db.transaction(["pending-requests"], "readwrite");
  const store = transaction.objectStore("pending-requests");

  const request: OfflineRequest = {
    id: `${Date.now()}-${Math.random()}`,
    url,
    method,
    headers,
    body,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const saveRequest = store.add(request);

    saveRequest.onsuccess = () => {
      console.log("[Offline] Request guardado:", request.id);
      resolve();
    };

    saveRequest.onerror = () => {
      reject(saveRequest.error);
    };
  });
}

/**
 * Obtener todos los requests pendientes
 */
export async function getPendingRequests(): Promise<OfflineRequest[]> {
  const db = await initializeOfflineDB();
  const transaction = db.transaction(["pending-requests"], "readonly");
  const store = transaction.objectStore("pending-requests");

  return new Promise((resolve, reject) => {
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => {
      resolve(getAllRequest.result as OfflineRequest[]);
    };

    getAllRequest.onerror = () => {
      reject(getAllRequest.error);
    };
  });
}

/**
 * Eliminar request pendiente
 */
export async function removePendingRequest(id: string): Promise<void> {
  const db = await initializeOfflineDB();
  const transaction = db.transaction(["pending-requests"], "readwrite");
  const store = transaction.objectStore("pending-requests");

  return new Promise((resolve, reject) => {
    const deleteRequest = store.delete(id);

    deleteRequest.onsuccess = () => {
      resolve();
    };

    deleteRequest.onerror = () => {
      reject(deleteRequest.error);
    };
  });
}

/**
 * Guardar producto en cache
 */
export async function saveProductOffline(product: OfflineProduct): Promise<void> {
  const db = await initializeOfflineDB();
  const transaction = db.transaction(["products"], "readwrite");
  const store = transaction.objectStore("products");

  return new Promise((resolve, reject) => {
    const saveRequest = store.put({
      ...product,
      cachedAt: Date.now(),
    });

    saveRequest.onsuccess = () => {
      resolve();
    };

    saveRequest.onerror = () => {
      reject(saveRequest.error);
    };
  });
}

/**
 * Obtener productos cacheados
 */
export async function getOfflineProducts(category?: string): Promise<OfflineProduct[]> {
  const db = await initializeOfflineDB();
  const transaction = db.transaction(["products"], "readonly");
  const store = transaction.objectStore("products");

  return new Promise((resolve, reject) => {
    let query;

    if (category) {
      const index = store.index("category");
      query = index.getAll(category);
    } else {
      query = store.getAll();
    }

    query.onsuccess = () => {
      resolve(query.result as OfflineProduct[]);
    };

    query.onerror = () => {
      reject(query.error);
    };
  });
}

/**
 * Guardar carrito
 */
export async function saveCartOffline(cart: OfflineCart): Promise<void> {
  const db = await initializeOfflineDB();
  const transaction = db.transaction(["cart"], "readwrite");
  const store = transaction.objectStore("cart");

  return new Promise((resolve, reject) => {
    const saveRequest = store.put({
      ...cart,
      updatedAt: Date.now(),
    });

    saveRequest.onsuccess = () => {
      resolve();
    };

    saveRequest.onerror = () => {
      reject(saveRequest.error);
    };
  });
}

/**
 * Obtener carrito
 */
export async function getCartOffline(): Promise<OfflineCart | null> {
  const db = await initializeOfflineDB();
  const transaction = db.transaction(["cart"], "readonly");
  const store = transaction.objectStore("cart");

  return new Promise((resolve, reject) => {
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = () => {
      const carts = getAllRequest.result as OfflineCart[];
      resolve(carts.length > 0 ? carts[0] : null);
    };

    getAllRequest.onerror = () => {
      reject(getAllRequest.error);
    };
  });
}

/**
 * Sincronizar requests pendientes
 */
export async function syncPendingRequests(): Promise<void> {
  const requests = await getPendingRequests();

  if (requests.length === 0) {
    return;
  }

  for (const request of requests) {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      if (response.ok) {
        await removePendingRequest(request.id);
      }
    } catch (error) {
      console.error("[Offline] Error sincronizando request:", error);
    }
  }
}

/**
 * Obtener estadísticas
 */
export async function getOfflineStats(): Promise<{
  pendingRequests: number;
  cachedProducts: number;
  hasCart: boolean;
}> {
  try {
    const requests = await getPendingRequests();
    const products = await getOfflineProducts();
    const cart = await getCartOffline();

    return {
      pendingRequests: requests.length,
      cachedProducts: products.length,
      hasCart: !!cart,
    };
  } catch {
    return {
      pendingRequests: 0,
      cachedProducts: 0,
      hasCart: false,
    };
  }
}
