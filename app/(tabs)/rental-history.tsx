import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { getRentalHistory, formatTimestamp, getActionLabel, RentalHistoryRecord } from "@/services/rental-history-service";

export default function RentalHistoryScreen() {
  const [history, setHistory] = useState<RentalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const cardColor = useThemeColor({}, "card");
  const tintColor = useThemeColor({}, "tint");

  const fetchHistory = async () => {
    try {
      console.log("[RentalHistoryScreen] Fetching rental history...");
      const records = await getRentalHistory(100);
      setHistory(records);
      console.log("[RentalHistoryScreen] Fetched", records.length, "records");
    } catch (error) {
      console.error("[RentalHistoryScreen] Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchHistory();
    } finally {
      setRefreshing(false);
    }
  };

  const renderHistoryItem = ({ item }: { item: RentalHistoryRecord }) => {
    const isReturn = item.action === "return";
    const actionLabel = getActionLabel(item.action);
    const timestamp = formatTimestamp(item.timestamp);

    return (
      <View style={[styles.historyItem, { backgroundColor: cardColor }]}>
        <View style={styles.historyHeader}>
          <ThemedText type="defaultSemiBold" style={styles.deviceName}>
            {item.deviceName}
          </ThemedText>
          <View
            style={[
              styles.actionBadge,
              {
                backgroundColor: isReturn ? "#34C759" : "#007AFF",
              },
            ]}
          >
            <ThemedText style={styles.actionBadgeText}>
              {actionLabel}
            </ThemedText>
          </View>
        </View>

        <View style={styles.historyDetails}>
          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: textSecondary }]}>
              ユーザー：
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: textColor }]}>
              {item.userName}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: textSecondary }]}>
              メーカー：
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: textColor }]}>
              {item.manufacturer}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: textSecondary }]}>
              OS：
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: textColor }]}>
              {item.osName} {item.osVersion}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={[styles.detailLabel, { color: textSecondary }]}>
              日時：
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: textColor }]}>
              {timestamp}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <ThemedText type="subtitle" style={{ color: textSecondary }}>
        貸出履歴がありません
      </ThemedText>
    </View>
  );

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
          貸出履歴
        </ThemedText>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
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
    gap: 12,
  },
  title: {
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  historyItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  deviceName: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  actionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  historyDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    textAlign: "right",
  },
});
