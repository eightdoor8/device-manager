import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { DeviceCard } from "@/components/device-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { getDevices } from "@/services/device-service";
import { Device, DeviceFilter, DeviceStatus } from "@/types/device";

export default function HomeScreen() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | undefined>();

  const { user } = useFirebaseAuth();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, "tint");
  const cardColor = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");

  const loadDevices = async () => {
    try {
      const filter: DeviceFilter = {
        status: statusFilter,
        searchQuery: searchQuery || undefined,
      };
      const data = await getDevices(filter);
      setDevices(data);
      setFilteredDevices(data);
    } catch (error) {
      console.error("Failed to load devices:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, [statusFilter]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = devices.filter(
        (device) =>
          device.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          device.osVersion.toLowerCase().includes(searchQuery.toLowerCase()) ||
          device.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredDevices(filtered);
    } else {
      setFilteredDevices(devices);
    }
  }, [searchQuery, devices]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDevices();
  };

  const handleRegisterDevice = () => {
    router.push("/register-device" as any);
  };

  const toggleStatusFilter = () => {
    if (statusFilter === undefined) {
      setStatusFilter(DeviceStatus.AVAILABLE);
    } else if (statusFilter === DeviceStatus.AVAILABLE) {
      setStatusFilter(DeviceStatus.IN_USE);
    } else {
      setStatusFilter(undefined);
    }
  };

  const getFilterLabel = () => {
    if (statusFilter === DeviceStatus.AVAILABLE) return "利用可";
    if (statusFilter === DeviceStatus.IN_USE) return "貸出中";
    return "すべて";
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
        <ThemedText type="title" style={styles.title}>
          端末一覧
        </ThemedText>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: cardColor }]}>
          <IconSymbol name="magnifyingglass" size={20} color={textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="機種名、OSで検索..."
            placeholderTextColor={textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Button */}
        <Pressable
          style={[styles.filterButton, { backgroundColor: cardColor }]}
          onPress={toggleStatusFilter}
        >
          <IconSymbol name="line.3.horizontal.decrease.circle" size={20} color={tintColor} />
          <ThemedText style={[styles.filterText, { color: tintColor }]}>
            {getFilterLabel()}
          </ThemedText>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : (
        <FlatList
          data={filteredDevices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DeviceCard device={item} />}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 80,
            },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={tintColor} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ThemedText style={{ color: textSecondary }}>端末が登録されていません</ThemedText>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <Pressable
        style={[
          styles.fab,
          {
            backgroundColor: tintColor,
            bottom: Math.max(insets.bottom, 16) + 16,
          },
        ]}
        onPress={handleRegisterDevice}
      >
        <IconSymbol name="plus.circle.fill" size={28} color="#fff" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    gap: 12,
  },
  title: {
    marginBottom: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    alignSelf: "flex-start",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
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
  fab: {
    position: "absolute",
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
