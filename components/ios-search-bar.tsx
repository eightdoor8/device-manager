import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  Pressable,
} from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";
import { BorderRadius, Spacing } from "@/constants/theme";
import { IconSymbol } from "./ui/icon-symbol";

interface IOSSearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  style?: ViewStyle;
}

export function IOSSearchBar({
  placeholder = "検索",
  value,
  onChangeText,
  onClear,
  style,
}: IOSSearchBarProps) {
  const backgroundColor = useThemeColor({}, "card");
  const textColor = useThemeColor({}, "text");
  const placeholderColor = useThemeColor({}, "textSecondary");
  const iconColor = useThemeColor({}, "textSecondary");

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <IconSymbol size={16} name="magnifyingglass" color={iconColor} />
      <TextInput
        style={[
          styles.input,
          {
            color: textColor,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        value={value}
        onChangeText={onChangeText}
        clearButtonMode="while-editing"
      />
      {value && onClear && (
        <Pressable onPress={onClear} style={styles.clearButton}>
          <IconSymbol size={16} name="xmark.circle.fill" color={iconColor} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.button,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginHorizontal: Spacing.md,
    padding: 0,
  },
  clearButton: {
    padding: Spacing.xs,
  },
});
