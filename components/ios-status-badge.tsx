import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { ThemedText } from "./themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { BorderRadius, Spacing } from "@/constants/theme";
import { DeviceStatus } from "@/types/device";

interface IOSStatusBadgeProps {
  status: DeviceStatus;
  style?: ViewStyle;
}

export function IOSStatusBadge({ status, style }: IOSStatusBadgeProps) {
  const getStatusColors = () => {
    switch (status) {
      case DeviceStatus.AVAILABLE:
        return {
          backgroundColor: "#34C759", // iOS Green
          textColor: "#FFFFFF",
          label: "利用可",
        };
      case DeviceStatus.IN_USE:
        return {
          backgroundColor: "#FF9500", // iOS Orange
          textColor: "#FFFFFF",
          label: "貸出中",
        };
      default:
        return {
          backgroundColor: "#999999",
          textColor: "#FFFFFF",
          label: "その他",
        };
    }
  };

  const { backgroundColor, textColor, label } = getStatusColors();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor },
        style,
      ]}
    >
      <ThemedText
        style={{
          color: textColor,
          fontSize: 12,
          fontWeight: "600",
          lineHeight: 16,
        }}
      >
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.button,
    alignSelf: "flex-start",
  },
});
