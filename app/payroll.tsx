import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function PayrollScreen() {
  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>급여 관리</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 내용 */}
      <ScrollView style={styles.content}>
        <View style={styles.comingSoonContainer}>
          <Ionicons name="card" size={80} color="#f59e0b" />
          <Text style={styles.comingSoonTitle}>급여 관리</Text>
          <Text style={styles.comingSoonDescription}>
            급여 계산 및 지급 관리 기능이 곧 출시됩니다.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#f59e0b",
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
    paddingHorizontal: 40,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 20,
    marginBottom: 12,
  },
  comingSoonDescription: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
});
