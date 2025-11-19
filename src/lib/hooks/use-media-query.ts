// Media Query Hook
// React hook for responsive design

"use client";

import * as React from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Create listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    media.addEventListener("change", listener);

    // Cleanup
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

// Preset hooks for common breakpoints
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 639px)");
}

export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery("(min-width: 1280px)");
}

// Orientation
export function useIsPortrait(): boolean {
  return useMediaQuery("(orientation: portrait)");
}

export function useIsLandscape(): boolean {
  return useMediaQuery("(orientation: landscape)");
}

// Preference queries
export function usePrefersDarkMode(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)");
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

// Touch device detection
export function useHasTouch(): boolean {
  const [hasTouch, setHasTouch] = React.useState(false);

  React.useEffect(() => {
    setHasTouch(
      "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - msMaxTouchPoints is IE specific
        navigator.msMaxTouchPoints > 0
    );
  }, []);

  return hasTouch;
}

// Viewport dimensions
export function useViewportSize(): { width: number; height: number } {
  const [size, setSize] = React.useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return size;
}

// Safe area insets (for notched devices)
export function useSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  const [insets, setInsets] = React.useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  React.useEffect(() => {
    const computeInsets = () => {
      const style = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(style.getPropertyValue("--sat") || "0", 10),
        right: parseInt(style.getPropertyValue("--sar") || "0", 10),
        bottom: parseInt(style.getPropertyValue("--sab") || "0", 10),
        left: parseInt(style.getPropertyValue("--sal") || "0", 10),
      });
    };

    // Set CSS variables for safe area
    document.documentElement.style.setProperty(
      "--sat",
      "env(safe-area-inset-top)"
    );
    document.documentElement.style.setProperty(
      "--sar",
      "env(safe-area-inset-right)"
    );
    document.documentElement.style.setProperty(
      "--sab",
      "env(safe-area-inset-bottom)"
    );
    document.documentElement.style.setProperty(
      "--sal",
      "env(safe-area-inset-left)"
    );

    computeInsets();
    window.addEventListener("resize", computeInsets);
    return () => window.removeEventListener("resize", computeInsets);
  }, []);

  return insets;
}

export default useMediaQuery;
