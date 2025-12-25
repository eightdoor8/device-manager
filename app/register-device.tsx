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
import { registerDevice, checkDeviceDuplicate } from "@/services/device-service";
import { useDeviceContext } from "@/contexts/DeviceContext";
import { DeviceFormData } from "@/types/device";

export default function RegisterDeviceScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
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
  const { syncDevices } = useDeviceContext();
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
      console.log("[RegisterDevice] Loading device info...");
      if (!isPhysicalDevice()) {
        Alert.alert(
          "注意",
          "シミュレーター/エミュレーターで実行されています。実機での使用を推奨します。",
        );
      }

      const deviceInfo = await getCurrentDeviceInfo();
      console.log("[RegisterDevice] Device info loaded:", deviceInfo);
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
      console.error("[RegisterDevice] Failed to load device info:", error);
      Alert.alert("エラー", "端末情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    console.log("[RegisterDevice] Submit button pressed");
    console.log("[RegisterDevice] Form data:", formData);
    console.log("[RegisterDevice] User:", user?.id);

    // 必須項目の検証
    const newErrors: Record<string, boolean> = {};
    if (!formData.modelName) newErrors.modelName = true;
    if (!formData.osName) newErrors.osName = true;
    if (!formData.osVersion) newErrors.osVersion = true;

    if (Object.keys(newErrors).length > 0) {
      console.log("[RegisterDevice] Missing required fields");
      setErrors(newErrors);
      Alert.alert("エラー", "必須項目を入力してください");
      return;
    }
    setErrors({});

    if (!user) {
      console.log("[RegisterDevice] User not found");
      Alert.alert("エラー", "ユーザー情報が取得できません");
      return;
    }

    try {
      setSubmitting(true);
      
      // Check for duplicate device
      console.log("[RegisterDevice] Checking for duplicate device...");
      const isDuplicate = await checkDeviceDuplicate(formData.uuid);
      if (isDuplicate) {
        console.log("[RegisterDevice] Device already registered");
        Alert.alert("注意", "この端末は既に登録されています");
        setSubmitting(false);
        return;
      }
      
      console.log("[RegisterDevice] Calling registerDevice...");
      const deviceId = await registerDevice(formData, user.id);
      console.log("[RegisterDevice] Device registered successfully:", deviceId);
      // 登録完了後に全端末データを同期
      await syncDevices();
      Alert.alert("成功", "端末を登録しました", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("[RegisterDevice] Failed to register device:", error);
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

          <View style={styles.requiredNote}>
            <ThemedText style={[styles.requiredNoteText, { color: textSecondary }]}>
              <ThemedText style={{ color: "#FF3B30" }}>*必須</ThemedText>、上記以外は任意
            </ThemedText>
          </View>

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
              <View style={styles.labelContainer}>
                <ThemedText style={styles.label}>機種名</ThemedText>
                <ThemedText style={[styles.requiredBadge, { color: "#FF3B30" }]}>必須</ThemedText>
              </View>
              <TextInput
                style={[
                  styles.input,
                  { color: textColor, borderColor: errors.modelName ? "#FF3B30" : tintColor },
                  errors.modelName && styles.inputError,
                ]}
                value={formData.modelName}
                onChangeText={(text) => {
                  setFormData({ ...formData, modelName: text });
                  setErrors({ ...errors, modelName: false });
                }}
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
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  requiredBadge: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  inputError: {
    backgroundColor: "rgba(255, 59, 48, 0.05)",
  },
  requiredNote: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  requiredNoteText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
