// WebSocket Client

import { REALTIME_CONFIG, REALTIME_EVENTS } from "./config";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: number;
  id?: string;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private statusHandlers: Set<(status: ConnectionStatus) => void> = new Set();

  // Connect to WebSocket server
  connect(url?: string): void {
    if (this.ws && (this.status === "connected" || this.status === "connecting")) {
      return;
    }

    const wsUrl = url || REALTIME_CONFIG.wsUrl;
    this.setStatus("connecting");

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error("[WS] Connection error:", error);
      this.handleReconnect();
    }
  }

  // Disconnect from server
  disconnect(): void {
    this.clearTimers();
    this.reconnectAttempts = 0;

    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }

    this.setStatus("disconnected");
  }

  // Send message to server
  send(type: string, payload: unknown, id?: string): boolean {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      id: id || this.generateId(),
    };

    if (this.status !== "connected" || !this.ws) {
      // Queue message for later
      if (this.messageQueue.length < REALTIME_CONFIG.message.queueSize) {
        this.messageQueue.push(message);
      }
      return false;
    }

    try {
      const data = JSON.stringify(message);
      if (data.length > REALTIME_CONFIG.message.maxSize) {
        console.error("[WS] Message too large");
        return false;
      }
      this.ws.send(data);
      return true;
    } catch (error) {
      console.error("[WS] Send error:", error);
      return false;
    }
  }

  // Subscribe to event type
  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  // Subscribe to all events
  onAny(handler: MessageHandler): () => void {
    return this.on("*", handler);
  }

  // Subscribe to connection status changes
  onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  // Get current status
  getStatus(): ConnectionStatus {
    return this.status;
  }

  // Check if connected
  isConnected(): boolean {
    return this.status === "connected";
  }

  // Private methods
  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log("[WS] Connected");
      this.setStatus("connected");
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.flushMessageQueue();
      this.emit(REALTIME_EVENTS.CONNECT, {});
    };

    this.ws.onclose = (event) => {
      console.log("[WS] Disconnected:", event.code, event.reason);
      this.clearTimers();
      this.emit(REALTIME_EVENTS.DISCONNECT, { code: event.code, reason: event.reason });

      if (event.code !== 1000 && REALTIME_CONFIG.reconnect.enabled) {
        this.handleReconnect();
      } else {
        this.setStatus("disconnected");
      }
    };

    this.ws.onerror = (error) => {
      console.error("[WS] Error:", error);
      this.emit(REALTIME_EVENTS.ERROR, { error });
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as WebSocketMessage;

      // Handle heartbeat response
      if (message.type === "pong") {
        this.clearHeartbeatTimeout();
        return;
      }

      // Emit to specific handlers
      this.handlers.get(message.type)?.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error("[WS] Handler error:", error);
        }
      });

      // Emit to wildcard handlers
      this.handlers.get("*")?.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error("[WS] Handler error:", error);
        }
      });
    } catch (error) {
      console.error("[WS] Parse error:", error);
    }
  }

  private emit(type: string, payload: unknown): void {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };

    this.handlers.get(type)?.forEach((handler) => handler(message));
    this.handlers.get("*")?.forEach((handler) => handler(message));
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= REALTIME_CONFIG.reconnect.maxAttempts) {
      console.error("[WS] Max reconnect attempts reached");
      this.setStatus("disconnected");
      return;
    }

    this.setStatus("reconnecting");
    this.reconnectAttempts++;

    const delay = Math.min(
      REALTIME_CONFIG.reconnect.initialDelay *
        Math.pow(REALTIME_CONFIG.reconnect.factor, this.reconnectAttempts - 1),
      REALTIME_CONFIG.reconnect.maxDelay
    );

    console.log("[WS] Reconnecting in " + delay + "ms (attempt " + this.reconnectAttempts + ")");

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    if (!REALTIME_CONFIG.heartbeat.enabled) return;

    this.heartbeatInterval = setInterval(() => {
      if (this.status === "connected") {
        this.send("ping", {});
        this.heartbeatTimeout = setTimeout(() => {
          console.warn("[WS] Heartbeat timeout");
          this.ws?.close(4000, "Heartbeat timeout");
        }, REALTIME_CONFIG.heartbeat.timeout);
      }
    }, REALTIME_CONFIG.heartbeat.interval);
  }

  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private clearTimers(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.clearHeartbeatTimeout();
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      this.send(message.type, message.payload, message.id);
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.statusHandlers.forEach((handler) => handler(status));
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();
