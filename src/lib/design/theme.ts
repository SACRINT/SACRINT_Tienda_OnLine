// Theme Configuration
// Dynamic theme management for multi-tenant customization

import { colors, typography, shadows, borderRadius } from "./tokens";

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  info: string;
  infoForeground: string;
}

export interface Theme {
  name: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  borderRadius: string;
  fontFamily: string;
}

// Default light theme
const lightTheme: ThemeColors = {
  primary: colors.primary[600],
  primaryForeground: "#ffffff",
  secondary: colors.neutral[100],
  secondaryForeground: colors.neutral[900],
  accent: colors.accent[500],
  accentForeground: colors.neutral[900],
  background: "#ffffff",
  foreground: colors.neutral[950],
  card: "#ffffff",
  cardForeground: colors.neutral[950],
  popover: "#ffffff",
  popoverForeground: colors.neutral[950],
  muted: colors.neutral[100],
  mutedForeground: colors.neutral[500],
  border: colors.neutral[200],
  input: colors.neutral[200],
  ring: colors.primary[500],
  destructive: colors.error.DEFAULT,
  destructiveForeground: "#ffffff",
  success: colors.success.DEFAULT,
  successForeground: "#ffffff",
  warning: colors.warning.DEFAULT,
  warningForeground: colors.neutral[900],
  info: colors.info.DEFAULT,
  infoForeground: "#ffffff",
};

// Default dark theme
const darkTheme: ThemeColors = {
  primary: colors.primary[500],
  primaryForeground: "#ffffff",
  secondary: colors.neutral[800],
  secondaryForeground: colors.neutral[50],
  accent: colors.accent[400],
  accentForeground: colors.neutral[900],
  background: colors.neutral[950],
  foreground: colors.neutral[50],
  card: colors.neutral[900],
  cardForeground: colors.neutral[50],
  popover: colors.neutral[900],
  popoverForeground: colors.neutral[50],
  muted: colors.neutral[800],
  mutedForeground: colors.neutral[400],
  border: colors.neutral[800],
  input: colors.neutral[800],
  ring: colors.primary[400],
  destructive: colors.error.DEFAULT,
  destructiveForeground: "#ffffff",
  success: colors.success.DEFAULT,
  successForeground: "#ffffff",
  warning: colors.warning.DEFAULT,
  warningForeground: colors.neutral[900],
  info: colors.info.DEFAULT,
  infoForeground: "#ffffff",
};

// Default theme
export const defaultTheme: Theme = {
  name: "Default",
  colors: {
    light: lightTheme,
    dark: darkTheme,
  },
  borderRadius: borderRadius.md,
  fontFamily: typography.fontFamily.sans,
};

// Pre-defined themes for tenants
export const themes: Record<string, Theme> = {
  default: defaultTheme,

  elegant: {
    name: "Elegant",
    colors: {
      light: {
        ...lightTheme,
        primary: "#0A1128",
        primaryForeground: "#ffffff",
        accent: "#D4AF37", // Gold
        accentForeground: "#0A1128",
      },
      dark: {
        ...darkTheme,
        primary: "#D4AF37",
        primaryForeground: "#0A1128",
        accent: "#D4AF37",
        accentForeground: "#0A1128",
      },
    },
    borderRadius: borderRadius.lg,
    fontFamily: typography.fontFamily.serif,
  },

  modern: {
    name: "Modern",
    colors: {
      light: {
        ...lightTheme,
        primary: colors.secondary[600],
        primaryForeground: "#ffffff",
        accent: colors.primary[500],
        accentForeground: "#ffffff",
      },
      dark: {
        ...darkTheme,
        primary: colors.secondary[500],
        primaryForeground: "#ffffff",
        accent: colors.primary[400],
        accentForeground: "#ffffff",
      },
    },
    borderRadius: borderRadius.xl,
    fontFamily: typography.fontFamily.sans,
  },

  minimal: {
    name: "Minimal",
    colors: {
      light: {
        ...lightTheme,
        primary: colors.neutral[900],
        primaryForeground: "#ffffff",
        accent: colors.neutral[600],
        accentForeground: "#ffffff",
      },
      dark: {
        ...darkTheme,
        primary: colors.neutral[50],
        primaryForeground: colors.neutral[900],
        accent: colors.neutral[400],
        accentForeground: colors.neutral[900],
      },
    },
    borderRadius: borderRadius.none,
    fontFamily: typography.fontFamily.sans,
  },
};

// Generate CSS variables from theme
export function generateCSSVariables(theme: Theme, mode: "light" | "dark"): string {
  const colors = theme.colors[mode];
  const variables = Object.entries(colors)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `--${cssKey}: ${value};`;
    })
    .join("\n  ");

  return `
  :root {
    ${variables}
    --radius: ${theme.borderRadius};
    --font-sans: ${theme.fontFamily};
  }
  `;
}

// Get tenant theme
export function getTenantTheme(
  tenantId: string,
  customColors?: Partial<ThemeColors>
): Theme {
  const baseTheme = themes.default;

  if (!customColors) {
    return baseTheme;
  }

  return {
    ...baseTheme,
    colors: {
      light: { ...baseTheme.colors.light, ...customColors },
      dark: { ...baseTheme.colors.dark, ...customColors },
    },
  };
}

// Apply theme to document
export function applyTheme(theme: Theme, mode: "light" | "dark"): void {
  if (typeof document === "undefined") return;

  const css = generateCSSVariables(theme, mode);
  let styleElement = document.getElementById("theme-variables");

  if (!styleElement) {
    styleElement = document.createElement("style");
    styleElement.id = "theme-variables";
    document.head.appendChild(styleElement);
  }

  styleElement.textContent = css;
}

export default themes;
