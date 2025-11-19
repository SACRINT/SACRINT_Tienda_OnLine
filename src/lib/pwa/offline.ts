// @ts-nocheck
// Offline Detection & Management

export type ConnectionStatus = "online" | "offline" | "slow";

export interface NetworkInfo {
  status: ConnectionStatus;
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

// Get current network info
export function getNetworkInfo(): NetworkInfo {
  const info: NetworkInfo = {
    status: navigator.onLine ? "online" : "offline",
  };

  // @ts-ignore - Network Information API
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

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
  // @ts-ignore
  const connection = navigator.connection;
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

export function queueOfflineAction(
  id: string,
  action: () => Promise<void>,
): void {
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
      JSON.stringify(
        actionQueue.map((a) => ({ id: a.id, timestamp: a.timestamp })),
      ),
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
        JSON.stringify(
          actionQueue.map((a) => ({ id: a.id, timestamp: a.timestamp })),
        ),
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
