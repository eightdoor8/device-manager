import { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { getCurrentDeviceInfo, isPhysicalDevice } from "@/utils/device-info";
import { registerDevice } from "@/services/device-service";
import { DeviceFormData } from "@/types/device";

export default function RegisterDeviceScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<DeviceFormData>({
    modelName: "",
    internalModelId: "",
    osName: "",
    osVersion: "",
    manufacturer: "",
    uuid: "",
    screenSize: "",
    physicalMemory: "",
    memo: "",
  });

  const { user } = useFirebaseAuth();
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, "tint");
  const cardColor = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const textDisabled = useThemeColor({}, "textDisabled");

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = async () => {
    try {
      if (!isPhysicalDevice()) {
        Alert.alert(
          "注意",
          "シミュレーター/エミュレーターで実行されています。実機での使用を推奨します。",
        );
      }

      const deviceInfo = await getCurrentDeviceInfo();
      setFormData({
        modelName: deviceInfo.modelName,
        internalModelId: deviceInfo.internalModelId,
        osName: deviceInfo.osName,
        osVersion: deviceInfo.osVersion,
        manufacturer: deviceInfo.manufacturer,
        uuid: deviceInfo.uuid,
        screenSize: "",
        physicalMemory: deviceInfo.physicalMemory || "",
        memo: "",
      });
    } catch (error) {
      console.error("Failed to load device info:", error);
      Alert.alert("エラー", "端末情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.modelName || !formData.osName || !formData.osVersion) {
      Alert.alert("エラー", "必須項目を入力してください");
      return;
    }

    if (!user) {
      Alert.alert("エラー", "ユーザー情報が取得できません");
      return;
    }

    try {
      setSubmitting(true);
      await registerDevice(formData, user.id);
      Alert.alert("成功", "端末を登録しました", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Failed to register device:", error);
      Alert.alert("エラー", "端末の登録に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 16) + 16,
              paddingBottom: Math.max(insets.bottom, 16) + 16,
            },
          ]}
        >
          <ThemedText type="title" style={styles.title}>
            端末登録
          </ThemedText>

          <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
            自動検出情報
          </ThemedText>

          {/* Auto-detected fields (read-only style) */}
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>OS名</ThemedText>
              <ThemedText style={[styles.valueText, { color: textDisabled }]}>
                {formData.osName}
              </ThemedText>
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>OSバージョン</ThemedText>
              <ThemedText style={[styles.valueText, { color: textDisabled }]}>
                {formData.osVersion}
              </ThemedText>
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>内部モデルID</ThemedText>
              <ThemedText style={[styles.valueText, { color: textDisabled }]}>
                {formData.internalModelId}
              </ThemedText>
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>メーカー</ThemedText>
              <ThemedText style={[styles.valueText, { color: textDisabled }]}>
                {formData.manufacturer}
              </ThemedText>
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>UUID</ThemedText>
              <ThemedText style={[styles.valueText, { color: textDisabled }]} numberOfLines={1}>
                {formData.uuid}
              </ThemedText>
            </View>

            {formData.physicalMemory && (
              <View style={styles.fieldContainer}>
                <ThemedText style={styles.label}>物理メモリ</ThemedText>
                <ThemedText style={[styles.valueText, { color: textDisabled }]}>
                  {formData.physicalMemory}
                </ThemedText>
              </View>
            )}
          </View>

          <ThemedText style={[styles.sectionTitle, { color: textSecondary }]}>
            編集可能項目
          </ThemedText>

          {/* Editable fields */}
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>機種名 *</ThemedText>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: tintColor }]}
                value={formData.modelName}
                onChangeText={(text) => setFormData({ ...formData, modelName: text })}
                placeholder="例: iPhone 14 Pro Max"
                placeholderTextColor={textSecondary}
              />
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>画面サイズ</ThemedText>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: tintColor }]}
                value={formData.screenSize}
                onChangeText={(text) => setFormData({ ...formData, screenSize: text })}
                placeholder="例: 6.7インチ"
                placeholderTextColor={textSecondary}
              />
            </View>

            <View style={styles.fieldContainer}>
              <ThemedText style={styles.label}>メモ</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { color: textColor, borderColor: tintColor },
                ]}
                value={formData.memo}
                onChangeText={(text) => setFormData({ ...formData, memo: text })}
                placeholder="備考や注意事項など"
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.cancelButton, { borderColor: tintColor }]}
              onPress={() => router.back()}
              disabled={submitting}
            >
              <ThemedText style={[styles.cancelButtonText, { color: tintColor }]}>
                キャンセル
              </ThemedText>
            </Pressable>

            <Pressable
              style={[styles.button, styles.submitButton, { backgroundColor: tintColor }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.submitButtonText}>登録</ThemedText>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  title: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 16,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  valueText: {
    fontSize: 16,
    lineHeight: 24,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    lineHeight: 24,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  submitButton: {},
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
});
