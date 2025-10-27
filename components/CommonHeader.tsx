import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";

interface CommonHeaderProps {
  title: string;
  showBackButton?: boolean;
  leftButton?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    label?: string;
  };
  rightButton?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    label?: string;
  };
}

export default function CommonHeader({
  title,
  showBackButton = true,
  leftButton,
  rightButton,
}: CommonHeaderProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.headerContent}>
        {/* 왼쪽 버튼 */}
        {leftButton ? (
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            onPress={leftButton.onPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={leftButton.icon} size={24} color={colors.text} />
          </Pressable>
        ) : showBackButton ? (
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        ) : null}

        {/* 제목 */}
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {title}
        </Text>

        {/* 오른쪽 버튼 또는 빈 공간 */}
        {rightButton ? (
          <Pressable
            style={({ pressed }) => [
              styles.rightButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            onPress={rightButton.onPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={rightButton.icon} size={24} color={colors.text} />
            {rightButton.label && (
              <Text style={[styles.rightButtonLabel, { color: colors.text }]}>
                {rightButton.label}
              </Text>
            )}
          </Pressable>
        ) : (
          <View style={styles.rightButton} />
        )}
      </View>
    </View>
  );
}

const styles = {
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    flex: 1,
    textAlign: "center" as const,
  },
  rightButton: {
    minWidth: 44,
    height: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    paddingHorizontal: 8,
  },
  rightButtonLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    marginLeft: 4,
  },
};
