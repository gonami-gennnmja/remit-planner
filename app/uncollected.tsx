import { Theme } from "@/constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function UncollectedScreen() {
  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>미수급 건수</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 콘텐츠 */}
      <ScrollView style={styles.content}>
        <View style={styles.comingSoonContainer}>
          <Ionicons
            name="card-outline"
            size={80}
            color={Theme.colors.primary}
          />
          <Text style={styles.comingSoonTitle}>미수급 건수 관리</Text>
          <Text style={styles.comingSoonDescription}>
            업체에서 받는 수입을 관리하는 기능이 곧 출시됩니다.
          </Text>
          <Text style={styles.featureList}>
            • 수입 내역 등록 및 관리{"\n"}• 수입 현황 대시보드{"\n"}• 수입 분석
            및 보고서{"\n"}• 미수금 추적 기능
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    backgroundColor: "#1e40af",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  comingSoonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: 60,
  },
  comingSoonTitle: {
    fontSize: Theme.typography.sizes.xxl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
  },
  comingSoonDescription: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: Theme.spacing.xl,
  },
  featureList: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.tertiary,
    textAlign: "left",
    lineHeight: 20,
  },
});
