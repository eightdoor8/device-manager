import { View, StyleSheet, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

export default function ProfileScreen() {
  const { user, signOut } = useFirebaseAuth();
  const insets = useSafeAreaInsets();
  const cardColor = useThemeColor({}, "card");
  const textSecondary = useThemeColor({}, "textSecondary");
  const errorColor = useThemeColor({}, "error");

  const handleLogout = () => {
    Alert.alert("ログアウト", "ログアウトしますか?", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "ログアウト",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/login" as any);
          } catch (error) {
            Alert.alert("エラー", "ログアウトに失敗しました");
          }
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 16) + 16,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
          },
        ]}
      >
        <ThemedText type="title" style={styles.title}>
          プロフィール
        </ThemedText>

        {/* User Info Card */}
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View style={styles.infoRow}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>名前</ThemedText>
            <ThemedText type="defaultSemiBold">{user?.name || "未設定"}</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>メール</ThemedText>
            <ThemedText type="defaultSemiBold">{user?.email}</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <ThemedText style={[styles.label, { color: textSecondary }]}>権限</ThemedText>
            <ThemedText type="defaultSemiBold">
              {user?.role === "admin" ? "管理者" : "一般ユーザー"}
            </ThemedText>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable
          style={[styles.logoutButton, { backgroundColor: errorColor }]}
          onPress={handleLogout}
        >
          <ThemedText style={styles.logoutText}>ログアウト</ThemedText>
        </Pressable>

        {/* App Info */}
        <View style={styles.appInfo}>
          <ThemedText style={[styles.appInfoText, { color: textSecondary }]}>
            Device Manager v1.0.0
          </ThemedText>
          <ThemedText style={[styles.appInfoText, { color: textSecondary }]}>
            社内QAチーム向け端末管理システム
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    marginBottom: 24,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  logoutButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  appInfo: {
    marginTop: "auto",
    alignItems: "center",
    gap: 4,
  },
  appInfoText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
