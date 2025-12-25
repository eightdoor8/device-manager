import { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { StatusBadge } from "@/components/status-badge";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { getDevice, borrowDevice, returnDevice, deleteDevice } from "@/services/device-service";
import { Device, DeviceStatus } from "@/types/device";
import { useDeviceContext } from "@/contexts/DeviceContext";

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const { user } = useFirebaseAuth();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, "tint");
  const cardColor = useThemeColor({}, "card");
  const textSecondary = useThemeColor({}, "textSecondary");
  const secondaryColor = useThemeColor({}, "secondary");
  const errorColor = useThemeColor({}, "error");

  useEffect(() => {
    loadDevice();
  }, [id]);

  const loadDevice = async () => {
    if (!id) return;
    try {
      const data = await getDevice(id);
      setDevice(data);
    } catch (error) {
      console.error("Failed to load device:", error);
      Alert.alert("エラー", "端末情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const { updateDevice, syncSingleDevice } = useDeviceContext();

  const handleBorrow = async () => {
    if (!device || !user) return;

    Alert.alert("確認", `${device.modelName}を借りますか?`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "借りる",
        onPress: async () => {
          const originalDevice = device;
          try {
            setActionLoading(true);
            // 楽観的更新：ローカル状態を即座に更新
            const updatedDevice: Device = {
              ...device,
              status: "in_use" as DeviceStatus,
              currentUserId: user.id,
              currentUserName: user.name || user.email,
              borrowedAt: new Date(),
              updatedAt: new Date(),
            };
            setDevice(updatedDevice);
            updateDevice(updatedDevice);

            // サーバーに送信
            await borrowDevice(device.id, user.id, user.name || user.email);
            // 操作完了後に該当端末のデータを同期
            await syncSingleDevice(device.id);
            Alert.alert("成功", "端末を借りました");
          } catch (error: any) {
            console.error("Failed to borrow device:", error);
            // エラー時はロールバック
            setDevice(originalDevice);
            Alert.alert("エラー", error.message || "端末の貸出に失敗しました");
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const { removeDevice } = useDeviceContext();

  const handleDelete = async () => {
    if (!device) return;

    Alert.alert("確認", `${device.modelName}を削除しますか?\nこの操作は取り消せません。`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            setActionLoading(true);
            // 楽観的更新：ローカル状態から即座に削除
            removeDevice(device.id);

            // サーバーに送信
            await deleteDevice(device.id);
            Alert.alert("成功", "端末を削除しました", [
              {
                text: "OK",
                onPress: () => router.back(),
              },
            ]);
          } catch (error: any) {
            console.error("Failed to delete device:", error);
            // エラー時はロールバック
            await loadDevice();
            Alert.alert("エラー", error.message || "端末の削除に失敗しました");
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleReturn = async () => {
    if (!device || !user) return;

    Alert.alert("確認", `${device.modelName}を返却しますか?`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "返却",
        onPress: async () => {
          const originalDevice = device;
          try {
            setActionLoading(true);
            // 楽観的更新：ローカル状態を即座に更新
            const updatedDevice: Device = {
              ...device,
              status: "available" as DeviceStatus,
              currentUserId: undefined,
              currentUserName: undefined,
              borrowedAt: undefined,
              updatedAt: new Date(),
            };
            setDevice(updatedDevice);
            updateDevice(updatedDevice);

            // サーバーに送信
            await returnDevice(device.id, user.id);
            // 操作完了後に該当端末のデータを同期
            await syncSingleDevice(device.id);
            Alert.alert("成功", "端末を返却しました");
          } catch (error: any) {
            console.error("Failed to return device:", error);
            // エラー時はロールバック
            setDevice(originalDevice);
            Alert.alert("エラー", error.message || "端末の返却に失敗しました");
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  if (!device) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>端末が見つかりません</ThemedText>
      </ThemedView>
    );
  }

  const isAvailable = device.status === DeviceStatus.AVAILABLE;
  const isCurrentUser = device.currentUserId === user?.id;
  const canBorrow = isAvailable;
  const canReturn = !isAvailable && isCurrentUser;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16) + 16,
            paddingBottom: Math.max(insets.bottom, 16) + 80,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.modelName}>
            {device.modelName}
          </ThemedText>
          <StatusBadge status={device.status} />
        </View>

        {/* Device Info */}
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            端末情報
          </ThemedText>

          <DetailRow label="OS" value={`${device.osName} ${device.osVersion}`} />
          <DetailRow label="メーカー" value={device.manufacturer} />
          <DetailRow label="内部モデルID" value={device.internalModelId} />
          {device.screenSize && <DetailRow label="画面サイズ" value={device.screenSize} />}
          {device.physicalMemory && <DetailRow label="物理メモリ" value={device.physicalMemory} />}
          <DetailRow label="UUID" value={device.uuid} />
        </View>

        {/* Status Info */}
        {!isAvailable && (
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              貸出情報
            </ThemedText>

            <DetailRow label="利用者" value={device.currentUserName || "不明"} />
            {device.borrowedAt && (
              <DetailRow
                label="貸出日時"
                value={new Date(device.borrowedAt).toLocaleString("ja-JP")}
              />
            )}
          </View>
        )}

        {/* Memo */}
        {device.memo && (
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              メモ
            </ThemedText>
            <ThemedText style={styles.memoText}>{device.memo}</ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={[
          styles.actionContainer,
          {
            paddingBottom: Math.max(insets.bottom, 16) + 16,
          },
        ]}
      >
        {canBorrow && (
          <Pressable
            style={[styles.actionButton, { backgroundColor: secondaryColor }]}
            onPress={handleBorrow}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.actionButtonText}>借りる</ThemedText>
            )}
          </Pressable>
        )}

        {canReturn && (
          <Pressable
            style={[styles.actionButton, { backgroundColor: errorColor }]}
            onPress={handleReturn}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.actionButtonText}>返す</ThemedText>
            )}
          </Pressable>
        )}

        {!canBorrow && !canReturn && (
          <View style={[styles.actionButton, { backgroundColor: "#BDBDBD" }]}>
            <ThemedText style={styles.actionButtonText}>他のユーザーが使用中</ThemedText>
          </View>
        )}

        {device?.status === "available" ? (
          <Pressable
            style={[styles.actionButton, { backgroundColor: errorColor }]}
            onPress={handleDelete}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.actionButtonText}>削除</ThemedText>
            )}
          </Pressable>
        ) : (
          <View style={[styles.actionButton, { backgroundColor: "#BDBDBD" }]}>
            <ThemedText style={styles.actionButtonText}>貸出中の端末は削除不可</ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const textSecondary = useThemeColor({}, "textSecondary");

  return (
    <View style={styles.detailRow}>
      <ThemedText style={[styles.detailLabel, { color: textSecondary }]}>{label}</ThemedText>
      <ThemedText style={styles.detailValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
    gap: 12,
  },
  modelName: {
    lineHeight: 40,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  detailLabel: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    lineHeight: 20,
    flex: 2,
    textAlign: "right",
  },
  memoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "transparent",
    gap: 12,
  },
  actionButton: {
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
});
