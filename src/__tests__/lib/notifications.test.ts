/**
 * @jest-environment jsdom
 */

// Notification Service Tests

import {
  getNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount,
  formatNotificationTime,
} from "@/lib/notifications";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock dispatchEvent
window.dispatchEvent = jest.fn();

describe("Notification Service", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("should return empty array when no notifications", () => {
      expect(getNotifications()).toEqual([]);
    });

    it("should return stored notifications", () => {
      const notifications = [
        {
          id: "1",
          type: "info",
          title: "Test",
          message: "Test message",
          read: false,
          createdAt: new Date().toISOString(),
        },
      ];
      localStorageMock.setItem(
        "sacrint-notifications",
        JSON.stringify(notifications),
      );

      const result = getNotifications();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Test");
    });
  });

  describe("addNotification", () => {
    it("should add notification with generated id and timestamp", () => {
      const notification = addNotification({
        type: "success",
        title: "Success!",
        message: "Operation completed",
      });

      expect(notification.id).toBeDefined();
      expect(notification.read).toBe(false);
      expect(notification.createdAt).toBeDefined();
    });

    it("should dispatch custom event", () => {
      addNotification({
        type: "info",
        title: "Test",
        message: "Test message",
      });

      expect(window.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe("markAsRead", () => {
    it("should mark notification as read", () => {
      const notification = addNotification({
        type: "info",
        title: "Test",
        message: "Message",
      });

      markAsRead(notification.id);

      const notifications = getNotifications();
      const updated = notifications.find((n) => n.id === notification.id);
      expect(updated?.read).toBe(true);
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all notifications as read", () => {
      addNotification({ type: "info", title: "Test 1", message: "M1" });
      addNotification({ type: "info", title: "Test 2", message: "M2" });

      markAllAsRead();

      const notifications = getNotifications();
      expect(notifications.every((n) => n.read)).toBe(true);
    });
  });

  describe("deleteNotification", () => {
    it("should remove notification by id", () => {
      const notification = addNotification({
        type: "info",
        title: "Test",
        message: "Message",
      });

      deleteNotification(notification.id);

      const notifications = getNotifications();
      expect(
        notifications.find((n) => n.id === notification.id),
      ).toBeUndefined();
    });
  });

  describe("clearAllNotifications", () => {
    it("should remove all notifications", () => {
      addNotification({ type: "info", title: "Test 1", message: "M1" });
      addNotification({ type: "info", title: "Test 2", message: "M2" });

      clearAllNotifications();

      expect(getNotifications()).toHaveLength(0);
    });
  });

  describe("getUnreadCount", () => {
    it("should return count of unread notifications", () => {
      const n1 = addNotification({
        type: "info",
        title: "T1",
        message: "M1",
      });
      addNotification({ type: "info", title: "T2", message: "M2" });
      addNotification({ type: "info", title: "T3", message: "M3" });

      markAsRead(n1.id);

      expect(getUnreadCount()).toBe(2);
    });
  });

  describe("formatNotificationTime", () => {
    it("should format recent time as 'Ahora'", () => {
      const now = new Date();
      expect(formatNotificationTime(now)).toBe("Ahora");
    });

    it("should format minutes ago", () => {
      const date = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatNotificationTime(date)).toBe("Hace 5 min");
    });

    it("should format hours ago", () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
      expect(formatNotificationTime(date)).toBe("Hace 3h");
    });

    it("should format days ago", () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(formatNotificationTime(date)).toBe("Hace 2d");
    });
  });
});
