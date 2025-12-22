import { useEffect } from "react";
import { router, useSegments } from "expo-router";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { ThemedView } from "./themed-view";
import { ThemedText } from "./themed-text";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useFirebaseAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(tabs)" || segments[0] === "register-device" || segments[0] === "device";

    if (!user && inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace("/login" as any);
    } else if (user && segments[0] === "login") {
      // Redirect to tabs if authenticated and on login screen
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error) {
    console.error("[AuthGuard] Error:", error);
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="defaultSemiBold" style={styles.errorText}>
          エラーが発生しました
        </ThemedText>
        <ThemedText style={styles.errorMessage}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    marginBottom: 8,
  },
  errorMessage: {
    textAlign: "center",
  },
});
