// Presence Manager
// Track online status and activity

import { wsClient } from "./websocket";
import { eventBus, Events, PresenceEvent } from "./events";
import { REALTIME_CONFIG, REALTIME_EVENTS } from "./config";

export interface UserPresence {
  userId: string;
  status: "online" | "away" | "offline";
  lastSeen: Date;
  metadata?: Record<string, any>;
}

class PresenceManager {
  private userId: string | null = null;
  private status: "online" | "away" | "offline" = "offline";
  private presenceMap: Map<string, UserPresence> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private activityTimeout: NodeJS.Timeout | null = null;

  // Initialize presence for current user
  init(userId: string): void {
    this.userId = userId;
    this.setOnline();
    this.startUpdateInterval();
    this.setupActivityTracking();
    this.setupWebSocketHandlers();
  }

  // Cleanup
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
      this.activityTimeout = null;
    }
    this.setOffline();
    this.userId = null;
  }

  // Set online status
  setOnline(): void {
    if (this.status !== "online") {
      this.status = "online";
      this.broadcastPresence();
    }
  }

  // Set away status
  setAway(): void {
    if (this.status !== "away") {
      this.status = "away";
      this.broadcastPresence();
    }
  }

  // Set offline status
  setOffline(): void {
    if (this.status !== "offline") {
      this.status = "offline";
      this.broadcastPresence();
    }
  }

  // Get current user status
  getStatus(): "online" | "away" | "offline" {
    return this.status;
  }

  // Get presence of a specific user
  getUserPresence(userId: string): UserPresence | undefined {
    return this.presenceMap.get(userId);
  }

  // Get all online users
  getOnlineUsers(): UserPresence[] {
    return Array.from(this.presenceMap.values()).filter((p) => p.status === "online");
  }

  // Get all users with presence
  getAllPresence(): UserPresence[] {
    return Array.from(this.presenceMap.values());
  }

  // Private methods
  private broadcastPresence(): void {
    if (!this.userId) return;

    const presence: UserPresence = {
      userId: this.userId,
      status: this.status,
      lastSeen: new Date(),
    };

    // Send via WebSocket
    wsClient.send(REALTIME_EVENTS.USER_PRESENCE, presence);

    // Emit local event
    eventBus.emit<PresenceEvent>(Events.PRESENCE, {
      userId: this.userId,
      status: this.status,
      lastSeen: presence.lastSeen,
    });
  }

  private startUpdateInterval(): void {
    this.updateInterval = setInterval(() => {
      if (this.status === "online") {
        this.broadcastPresence();
      }
    }, REALTIME_CONFIG.presence.updateInterval);
  }

  private setupActivityTracking(): void {
    const resetActivityTimeout = () => {
      if (this.activityTimeout) {
        clearTimeout(this.activityTimeout);
      }

      // If was away, set back to online
      if (this.status === "away") {
        this.setOnline();
      }

      // Set timeout for away status
      this.activityTimeout = setTimeout(
        () => {
          if (this.status === "online") {
            this.setAway();
          }
        },
        5 * 60 * 1000,
      ); // 5 minutes of inactivity
    };

    // Track user activity
    if (typeof window !== "undefined") {
      const events = ["mousedown", "keydown", "touchstart", "scroll"];
      events.forEach((event) => {
        window.addEventListener(event, resetActivityTimeout, { passive: true });
      });

      // Handle visibility change
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.setAway();
        } else {
          this.setOnline();
        }
      });

      // Handle before unload
      window.addEventListener("beforeunload", () => {
        this.setOffline();
      });

      // Initial activity
      resetActivityTimeout();
    }
  }

  private setupWebSocketHandlers(): void {
    // Listen for presence updates from other users
    wsClient.on(REALTIME_EVENTS.USER_PRESENCE, (message) => {
      const presence = message.payload as UserPresence;

      // Don't update our own presence from server
      if (presence.userId === this.userId) return;

      // Update presence map
      this.presenceMap.set(presence.userId, {
        ...presence,
        lastSeen: new Date(presence.lastSeen),
      });

      // Clean up old offline users
      this.cleanupOldPresence();

      // Emit event
      eventBus.emit<PresenceEvent>(Events.PRESENCE, {
        userId: presence.userId,
        status: presence.status,
        lastSeen: new Date(presence.lastSeen),
      });
    });
  }

  private cleanupOldPresence(): void {
    const now = Date.now();
    const timeout = REALTIME_CONFIG.presence.timeout;

    this.presenceMap.forEach((presence, odUserId) => {
      if (presence.status === "offline" && now - presence.lastSeen.getTime() > timeout) {
        this.presenceMap.delete(odUserId);
      }
    });
  }
}

// Singleton instance
export const presence = new PresenceManager();
