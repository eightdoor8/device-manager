/**
 * iOS Design System - Apple Human Interface Guidelines Compliant
 * 
 * Color palette follows Apple's system colors for iOS 14+
 * Supports both Light and Dark modes automatically
 */

import { Platform } from "react-native";

// iOS Standard Colors (Apple HIG)
const iOSBlueLight = "#007AFF";
const iOSBlueDark = "#0A84FF";
const iOSGreenLight = "#34C759";
const iOSGreenDark = "#30B0C0";
const iOSRedLight = "#FF3B30";
const iOSRedDark = "#FF453A";
const iOSOrangeLight = "#FF9500";

export const Colors = {
  light: {
    // Text colors
    text: "#000000",
    textSecondary: "#666666",
    textDisabled: "#BDBDBD",
    
    // Background colors
    background: "#FFFFFF",
    card: "#F5F5F5",
    
    // Interactive colors
    tint: iOSBlueLight,
    icon: "#666666",
    tabIconDefault: "#666666",
    tabIconSelected: iOSBlueLight,
    
    // Status colors
    secondary: iOSGreenLight,
    error: iOSRedLight,
    warning: iOSOrangeLight,
    success: iOSGreenLight,
  },
  dark: {
    // Text colors
    text: "#FFFFFF",
    textSecondary: "#999999",
    textDisabled: "#757575",
    
    // Background colors
    background: "#000000",
    card: "#1C1C1E",
    
    // Interactive colors
    tint: iOSBlueDark,
    icon: "#999999",
    tabIconDefault: "#999999",
    tabIconSelected: iOSBlueDark,
    
    // Status colors
    secondary: iOSGreenDark,
    error: iOSRedDark,
    warning: iOSOrangeLight,
    success: iOSGreenDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS system font stack */
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

/**
 * iOS Typography Scale
 * Based on Apple's Dynamic Type system
 */
export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: "bold" as const,
    lineHeight: 41,
  },
  title1: {
    fontSize: 28,
    fontWeight: "bold" as const,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: "bold" as const,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 25,
  },
  headline: {
    fontSize: 17,
    fontWeight: "600" as const,
    lineHeight: 22,
  },
  body: {
    fontSize: 17,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  callout: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 21,
  },
  subheadline: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  caption1: {
    fontSize: 13,
    fontWeight: "400" as const,
    lineHeight: 18,
  },
  caption2: {
    fontSize: 11,
    fontWeight: "400" as const,
    lineHeight: 14,
  },
};

/**
 * iOS Spacing Scale (8pt grid)
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/**
 * iOS Border Radius
 */
export const BorderRadius = {
  button: 8,
  card: 12,
  modal: 16,
  sheet: 20,
};
