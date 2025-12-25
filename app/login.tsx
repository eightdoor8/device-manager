import { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Image } from "expo-image";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, loading } = useFirebaseAuth();
  const insets = useSafeAreaInsets();

  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const textSecondary = useThemeColor({}, "textSecondary");
  const cardColor = useThemeColor({}, "card");

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("エラー", "メールアドレスとパスワードを入力してください");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("エラー", "メールアドレスの形式が正しくありません");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      Alert.alert("エラー", "パスワードは6文字以上である必要があります");
      return;
    }

    try {
      console.log(`[Auth] ${isSignUp ? "Sign up" : "Sign in"} attempt with email: ${email}`);
      if (isSignUp) {
        console.log("[Auth] Calling signUp...");
        await signUp(email, password);
        console.log("[Auth] Sign up successful");
        Alert.alert("成功", "アカウントが作成されました");
      } else {
        console.log("[Auth] Calling signIn...");
        await signIn(email, password);
        console.log("[Auth] Sign in successful");
      }
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("[Auth] Error code:", error.code);
      console.error("[Auth] Error message:", error.message);
      console.error("[Auth] Full error:", error);
      
      let message = "認証に失敗しました";
      
      // ネットワークエラーの検出
      const errorMsg = error.message || "";
      if (errorMsg.includes("Network") || errorMsg.includes("network") || errorMsg.includes("timeout")) {
        message = "ネットワーク接続エラー: インターネット接続を確認してください";
      } else if (error.code === "auth/invalid-email") {
        message = "メールアドレスの形式が正しくありません";
      } else if (error.code === "auth/user-not-found") {
        message = "ユーザーが見つかりません";
      } else if (error.code === "auth/wrong-password") {
        message = "パスワードが正しくありません";
      } else if (error.code === "auth/email-already-in-use") {
        message = "このメールアドレスは既に使用されています";
      } else if (error.code === "auth/weak-password") {
        message = "パスワードは6文字以上である必要があります";
      } else if (error.code === "auth/too-many-requests") {
        message = "ログイン試行回数が多すぎます。しばらく後に再度お試しください";
      } else if (error.code === "auth/invalid-credential") {
        message = "メールアドレスまたはパスワードが正しくありません";
      }
      // Firebaseの詳細なエラーメッセージは表示しない
      Alert.alert("エラー", message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View
          style={[
            styles.content,
            {
              paddingTop: Math.max(insets.top, 60),
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={require("@/assets/images/icon.png")} style={styles.logo} />
            <ThemedText type="title" style={styles.title}>
              Device Manager
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: textColor }]}>
              社内端末管理システム
            </ThemedText>
          </View>

          {/* Form */}
          <View style={[styles.form, { backgroundColor: cardColor }]}>
            <ThemedText type="subtitle" style={styles.formTitle}>
              {isSignUp ? "新規登録" : "ログイン"}
            </ThemedText>

            <TextInput
              style={[styles.input, { color: textColor, borderColor: tintColor }]}
              placeholder="メールアドレス"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: tintColor }]}
                placeholder="パスワード"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <ThemedText style={[styles.passwordToggleText, { color: textSecondary }]}>
                  {showPassword ? "隠す" : "表示"}
                </ThemedText>
              </Pressable>
            </View>

            <Pressable
              style={[styles.button, { backgroundColor: tintColor }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>
                  {isSignUp ? "登録" : "ログイン"}
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              style={styles.switchButton}
              onPress={() => setIsSignUp(!isSignUp)}
              disabled={loading}
            >
              <ThemedText style={[styles.switchText, { color: tintColor }]}>
                {isSignUp ? "既にアカウントをお持ちの方はこちら" : "新規登録はこちら"}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 20,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    padding: 24,
    borderRadius: 16,
    gap: 16,
  },
  formTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  switchButton: {
    paddingVertical: 8,
    alignItems: "center",
  },
  switchText: {
    fontSize: 14,
    lineHeight: 20,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordToggle: {
    position: "absolute",
    right: 16,
    top: 0,
    height: 48,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  passwordToggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
