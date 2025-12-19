import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { ThemedText } from "./themed-text";
import { StatusBadge } from "./status-badge";
import { Device } from "@/types/device";
import { useThemeColor } from "@/hooks/use-theme-color";

interface DeviceCardProps {
  device: Device;
}

export function DeviceCard({ device }: DeviceCardProps) {
  const cardColor = useThemeColor({}, "card");
  const textSecondary = useThemeColor({}, "textSecondary");

  const handlePress = () => {
    router.push(`/device/${device.id}` as any);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: cardColor },
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <ThemedText type="defaultSemiBold" style={styles.modelName}>
            {device.modelName}
          </ThemedText>
          <ThemedText style={[styles.osInfo, { color: textSecondary }]}>
            {device.osName} {device.osVersion}
          </ThemedText>
        </View>
        <StatusBadge status={device.status} />
      </View>

      <View style={styles.details}>
        {device.screenSize && (
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: textSecondary }]}>
              画面サイズ:
            </ThemedText>
            <ThemedText style={styles.detailValue}>{device.screenSize}</ThemedText>
          </View>
        )}
        {device.currentUserName && (
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: textSecondary }]}>
              利用者:
            </ThemedText>
            <ThemedText style={styles.detailValue}>{device.currentUserName}</ThemedText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  modelName: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 4,
  },
  osInfo: {
    fontSize: 14,
    lineHeight: 20,
  },
  details: {
    gap: 4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    lineHeight: 20,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    lineHeight: 20,
  },
});
