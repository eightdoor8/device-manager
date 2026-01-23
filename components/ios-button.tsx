import React from "react";
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "./themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { BorderRadius, Spacing } from "@/constants/theme";

export type IOSButtonVariant = "primary" | "secondary" | "destructive";

interface IOSButtonProps {
  onPress: () => void;
  title: string;
  variant?: IOSButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function IOSButton({
  onPress,
  title,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: IOSButtonProps) {
  const primaryColor = useThemeColor({}, "tint");
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const errorColor = useThemeColor({}, "error");

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      height: 44,
      borderRadius: BorderRadius.button,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
    };

    switch (variant) {
      case "primary":
        return {
          ...baseStyle,
          backgroundColor: primaryColor,
          opacity: disabled ? 0.6 : 1,
        };
      case "secondary":
        return {
          ...baseStyle,
          backgroundColor: backgroundColor,
          borderWidth: 1,
          borderColor: primaryColor,
          opacity: disabled ? 0.6 : 1,
        };
      case "destructive":
        return {
          ...baseStyle,
          backgroundColor: errorColor,
          opacity: disabled ? 0.6 : 1,
        };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case "primary":
        return {
          color: "#FFFFFF",
          fontSize: 17,
          fontWeight: "600",
        };
      case "secondary":
        return {
          color: primaryColor,
          fontSize: 17,
          fontWeight: "600",
        };
      case "destructive":
        return {
          color: "#FFFFFF",
          fontSize: 17,
          fontWeight: "600",
        };
      default:
        return {
          color: textColor,
          fontSize: 17,
          fontWeight: "600",
        };
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        getButtonStyle(),
        pressed && !disabled && { opacity: 0.7 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "secondary" ? primaryColor : "#FFFFFF"}
        />
      ) : (
        <ThemedText style={getTextStyle()}>{title}</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    borderRadius: BorderRadius.button,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
});
