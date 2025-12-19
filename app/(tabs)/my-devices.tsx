import { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { DeviceCard } from "@/components/device-card";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { getDevicesByUser } from "@/services/device-service";
import { Device } from "@/types/device";

export default function MyDevicesScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useFirebaseAuth();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, "tint");
  const textSecondary = useThemeColor({}, "textSecondary");

  const loadDevices = async () => {
    if (!user) return;
    try {
      const data = await getDevicesByUser(user.id);
      setDevices(data);
    } catch (error) {
      console.error("Failed to load my devices:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDevices();
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16) + 16,
            paddingBottom: 16,
          },
        ]}
      >
        <ThemedText type="title">マイデバイス</ThemedText>
        <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
          現在借りている端末
        </ThemedText>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DeviceCard device={item} />}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 16,
            },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={tintColor} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={{ color: textSecondary }}>
                現在借りている端末はありません
              </ThemedText>
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
});
