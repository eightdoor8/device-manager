/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#2196F3";
const tintColorDark = "#4CAF50";

export const Colors = {
  light: {
    text: "#212121",
    background: "#FFFFFF",
    tint: tintColorLight,
    icon: "#757575",
    tabIconDefault: "#757575",
    tabIconSelected: tintColorLight,
    secondary: "#4CAF50",
    error: "#F44336",
    textSecondary: "#757575",
    textDisabled: "#BDBDBD",
    card: "#F5F5F5",
  },
  dark: {
    text: "#FFFFFF",
    background: "#121212",
    tint: tintColorDark,
    icon: "#BDBDBD",
    tabIconDefault: "#BDBDBD",
    tabIconSelected: tintColorDark,
    secondary: "#4CAF50",
    error: "#F44336",
    textSecondary: "#BDBDBD",
    textDisabled: "#757575",
    card: "#1E1E1E",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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
