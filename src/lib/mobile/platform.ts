// Platform Detection Utilities

export type Platform = "ios" | "android" | "web" | "unknown";
export type DeviceType = "mobile" | "tablet" | "desktop";

// Detect current platform
export function getPlatform(): Platform {
  if (typeof window === "undefined") {
    return "web";
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }

  if (/android/.test(userAgent)) {
    return "android";
  }

  return "web";
}

// Detect device type
export function getDeviceType(): DeviceType {
  if (typeof window === "undefined") {
    return "desktop";
  }

  const userAgent = navigator.userAgent.toLowerCase();

  // Check for tablet
  if (
    /ipad/.test(userAgent) ||
    (/android/.test(userAgent) && !/mobile/.test(userAgent))
  ) {
    return "tablet";
  }

  // Check for mobile
  if (
    /iphone|ipod|android.*mobile|windows phone|blackberry|bb10|opera mini|opera mobi|iemobile/.test(
      userAgent,
    )
  ) {
    return "mobile";
  }

  // Check screen size as fallback
  if (window.innerWidth < 768) {
    return "mobile";
  }

  if (window.innerWidth < 1024) {
    return "tablet";
  }

  return "desktop";
}

// Check if running as PWA
export function isPWA(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-ignore - iOS Safari
    window.navigator.standalone === true
  );
}

// Check if touch device
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

// Get screen orientation
export function getOrientation(): "portrait" | "landscape" {
  if (typeof window === "undefined") {
    return "portrait";
  }

  if (window.screen.orientation) {
    return window.screen.orientation.type.includes("portrait")
      ? "portrait"
      : "landscape";
  }

  return window.innerHeight > window.innerWidth ? "portrait" : "landscape";
}

// Check if device has notch (iPhone X+)
export function hasNotch(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  // Check for CSS safe area insets
  const root = document.documentElement;
  const safeAreaTop = getComputedStyle(root).getPropertyValue("--sat");
  return parseFloat(safeAreaTop) > 20;
}

// Get platform-specific safe area insets
export function getSafeAreaInsets(): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  if (typeof window === "undefined") {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const root = document.documentElement;
  const style = getComputedStyle(root);

  return {
    top: parseFloat(style.getPropertyValue("--sat") || "0"),
    bottom: parseFloat(style.getPropertyValue("--sab") || "0"),
    left: parseFloat(style.getPropertyValue("--sal") || "0"),
    right: parseFloat(style.getPropertyValue("--sar") || "0"),
  };
}

// Platform-specific utilities
export const platformUtils = {
  // Get status bar height
  getStatusBarHeight(): number {
    const platform = getPlatform();
    if (platform === "ios") {
      return hasNotch() ? 44 : 20;
    }
    if (platform === "android") {
      return 24;
    }
    return 0;
  },

  // Get navigation bar height
  getNavBarHeight(): number {
    const platform = getPlatform();
    if (platform === "ios") {
      return hasNotch() ? 34 : 0;
    }
    if (platform === "android") {
      return 48;
    }
    return 0;
  },

  // Check if device supports haptic feedback
  supportsHaptic(): boolean {
    return "vibrate" in navigator;
  },

  // Trigger haptic feedback
  haptic(style: "light" | "medium" | "heavy" = "light"): void {
    if (!this.supportsHaptic()) return;

    const duration = {
      light: 10,
      medium: 20,
      heavy: 30,
    };

    navigator.vibrate(duration[style]);
  },
};
