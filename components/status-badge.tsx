import { View, StyleSheet } from "react-native";
import { ThemedText } from "./themed-text";
import { DeviceStatus } from "@/types/device";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface StatusBadgeProps {
  status: DeviceStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const isAvailable = status === DeviceStatus.AVAILABLE;
  const backgroundColor = isAvailable ? colors.secondary : colors.error;
  const label = isAvailable ? "利用可" : "貸出中";

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <ThemedText style={styles.text}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
});
