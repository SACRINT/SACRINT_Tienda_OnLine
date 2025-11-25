export const COLORS = {
  primary: "#3B82F6", // Blue
  secondary: "#8B5CF6", // Purple
  success: "#10B981", // Green
  danger: "#EF4444", // Red
  warning: "#F59E0B", // Amber
  neutral: "#6B7280", // Gray
  backgrounds: {
    light: "#F9FAFB",
    dark: "#111827",
  },
} as const;

export const SPACING = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
} as const;

export const TYPOGRAPHY = {
  h1: { size: "48px", weight: 700, lineHeight: "1.2" },
  h2: { size: "36px", weight: 600, lineHeight: "1.3" },
  h3: { size: "28px", weight: 600, lineHeight: "1.4" },
  body: { size: "16px", weight: 400, lineHeight: "1.6" },
  small: { size: "14px", weight: 400, lineHeight: "1.5" },
} as const;

export const SHADOWS = {
  sm: "0 1px 2px rgba(0,0,0,0.05)",
  md: "0 4px 6px rgba(0,0,0,0.1)",
  lg: "0 10px 15px rgba(0,0,0,0.1)",
  xl: "0 20px 25px rgba(0,0,0,0.1)",
} as const;
