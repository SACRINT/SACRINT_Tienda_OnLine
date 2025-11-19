// Mobile React Hooks
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPlatform,
  getDeviceType,
  getOrientation,
  isPWA,
  Platform,
  DeviceType,
} from "./platform";
import {
  getCurrentBreakpoint,
  Breakpoint,
  isAboveBreakpoint,
  getViewportDimensions,
} from "./responsive";
import {
  isOnline,
  subscribeToNetworkChanges,
  ConnectionStatus,
} from "../pwa/offline";

// Platform detection hook
export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>("web");

  useEffect(() => {
    setPlatform(getPlatform());
  }, []);

  return platform;
}

// Device type hook
export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");

  useEffect(() => {
    const updateDeviceType = () => setDeviceType(getDeviceType());
    updateDeviceType();

    window.addEventListener("resize", updateDeviceType);
    return () => window.removeEventListener("resize", updateDeviceType);
  }, []);

  return deviceType;
}

// Orientation hook
export function useOrientation(): "portrait" | "landscape" {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait",
  );

  useEffect(() => {
    const updateOrientation = () => setOrientation(getOrientation());
    updateOrientation();

    window.addEventListener("orientationchange", updateOrientation);
    window.addEventListener("resize", updateOrientation);

    return () => {
      window.removeEventListener("orientationchange", updateOrientation);
      window.removeEventListener("resize", updateOrientation);
    };
  }, []);

  return orientation;
}

// PWA detection hook
export function useIsPWA(): boolean {
  const [pwa, setPwa] = useState(false);

  useEffect(() => {
    setPwa(isPWA());
  }, []);

  return pwa;
}

// Breakpoint hook
export function useBreakpoint(): Breakpoint | null {
  const [breakpoint, setBreakpoint] = useState<Breakpoint | null>(null);

  useEffect(() => {
    const updateBreakpoint = () => setBreakpoint(getCurrentBreakpoint());
    updateBreakpoint();

    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return breakpoint;
}

// Media query hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Mobile detection hook
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(!isAboveBreakpoint("md"));
    checkMobile();

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

// Viewport dimensions hook
export function useViewportDimensions(): { width: number; height: number } {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => setDimensions(getViewportDimensions());
    updateDimensions();

    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return dimensions;
}

// Online status hook
export function useOnlineStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>("online");

  useEffect(() => {
    setStatus(isOnline() ? "online" : "offline");
    return subscribeToNetworkChanges(setStatus);
  }, []);

  return status;
}

// Scroll position hook
export function useScrollPosition(): { x: number; y: number } {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = () => {
      setPosition({
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    window.addEventListener("scroll", updatePosition, { passive: true });
    updatePosition();

    return () => window.removeEventListener("scroll", updatePosition);
  }, []);

  return position;
}

// Scroll direction hook
export function useScrollDirection(): "up" | "down" | null {
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const updateDirection = () => {
      const currentY = window.scrollY;
      if (currentY > lastY) {
        setDirection("down");
      } else if (currentY < lastY) {
        setDirection("up");
      }
      setLastY(currentY);
    };

    window.addEventListener("scroll", updateDirection, { passive: true });
    return () => window.removeEventListener("scroll", updateDirection);
  }, [lastY]);

  return direction;
}

// Lock scroll hook
export function useLockScroll(): [boolean, (locked: boolean) => void] {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (locked) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = "-" + scrollY + "px";
      document.body.style.width = "100%";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [locked]);

  return [locked, setLocked];
}

// Touch device hook
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

// Keyboard visibility hook (mobile)
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // @ts-ignore - VirtualKeyboard API
    if (navigator.virtualKeyboard) {
      // @ts-ignore
      navigator.virtualKeyboard.overlaysContent = true;
      // @ts-ignore
      const handleGeometryChange = () => {
        // @ts-ignore
        setVisible(navigator.virtualKeyboard.boundingRect.height > 0);
      };
      // @ts-ignore
      navigator.virtualKeyboard.addEventListener(
        "geometrychange",
        handleGeometryChange,
      );
      // @ts-ignore
      return () =>
        navigator.virtualKeyboard.removeEventListener(
          "geometrychange",
          handleGeometryChange,
        );
    }

    // Fallback: detect by viewport height change
    let initialHeight = window.innerHeight;
    const handleResize = () => {
      const heightDiff = initialHeight - window.innerHeight;
      setVisible(heightDiff > 150); // Keyboard typically > 150px
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return visible;
}
