import { useEffect } from "react";
import { router, useSegments } from "expo-router";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { ThemedView } from "./themed-view";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useFirebaseAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(tabs)";

    if (!user && inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace("/login" as any);
    } else if (user && !inAuthGroup) {
      // Redirect to tabs if authenticated
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

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
