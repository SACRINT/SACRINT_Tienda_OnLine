// Responsive Utilities

// Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export type Breakpoint = keyof typeof BREAKPOINTS;

// Get current breakpoint
export function getCurrentBreakpoint(): Breakpoint | null {
  if (typeof window === "undefined") {
    return null;
  }

  const width = window.innerWidth;

  if (width >= BREAKPOINTS["2xl"]) return "2xl";
  if (width >= BREAKPOINTS.xl) return "xl";
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  if (width >= BREAKPOINTS.sm) return "sm";

  return null;
}

// Check if above breakpoint
export function isAboveBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.innerWidth >= BREAKPOINTS[breakpoint];
}

// Check if below breakpoint
export function isBelowBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  return window.innerWidth < BREAKPOINTS[breakpoint];
}

// Check if mobile view
export function isMobileView(): boolean {
  return isBelowBreakpoint("md");
}

// Check if tablet view
export function isTabletView(): boolean {
  return isAboveBreakpoint("md") && isBelowBreakpoint("lg");
}

// Check if desktop view
export function isDesktopView(): boolean {
  return isAboveBreakpoint("lg");
}

// Responsive value helper
export function responsiveValue<T>(values: {
  base: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  "2xl"?: T;
}): T {
  const breakpoint = getCurrentBreakpoint();

  if (breakpoint === "2xl" && values["2xl"] !== undefined) return values["2xl"];
  if ((breakpoint === "2xl" || breakpoint === "xl") && values.xl !== undefined)
    return values.xl;
  if (["2xl", "xl", "lg"].includes(breakpoint || "") && values.lg !== undefined)
    return values.lg;
  if (
    ["2xl", "xl", "lg", "md"].includes(breakpoint || "") &&
    values.md !== undefined
  )
    return values.md;
  if (
    ["2xl", "xl", "lg", "md", "sm"].includes(breakpoint || "") &&
    values.sm !== undefined
  )
    return values.sm;

  return values.base;
}

// Get viewport dimensions
export function getViewportDimensions(): { width: number; height: number } {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

// Get scroll position
export function getScrollPosition(): { x: number; y: number } {
  if (typeof window === "undefined") {
    return { x: 0, y: 0 };
  }

  return {
    x: window.scrollX || window.pageXOffset,
    y: window.scrollY || window.pageYOffset,
  };
}

// Check if element is in viewport
export function isInViewport(
  element: HTMLElement,
  threshold: number = 0,
): boolean {
  const rect = element.getBoundingClientRect();
  const viewHeight = Math.max(
    document.documentElement.clientHeight,
    window.innerHeight,
  );

  return !(rect.bottom < threshold || rect.top - viewHeight >= -threshold);
}

// Media query helper
export function matchesMediaQuery(query: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(query).matches;
}

// Subscribe to media query changes
export function subscribeToMediaQuery(
  query: string,
  callback: (matches: boolean) => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(query);
  const handler = (e: MediaQueryListEvent) => callback(e.matches);

  mediaQuery.addEventListener("change", handler);
  callback(mediaQuery.matches);

  return () => mediaQuery.removeEventListener("change", handler);
}
