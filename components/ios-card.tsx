import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  Pressable,
  GestureResponderEvent,
} from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import { BorderRadius, Spacing } from "@/constants/theme";

interface IOSCardProps {
  children: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  padding?: number;
}

export function IOSCard({
  children,
  onPress,
  style,
  padding = Spacing.lg,
}: IOSCardProps) {
  const backgroundColor = useThemeColor({}, "card");
  const shadowColor = useThemeColor({}, "text");

  const cardStyle: ViewStyle = {
    backgroundColor,
    borderRadius: BorderRadius.card,
    padding,
    shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && { opacity: 0.7 },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
