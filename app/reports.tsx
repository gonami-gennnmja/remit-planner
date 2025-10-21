import CommonHeader from "@/components/CommonHeader";
import { Text } from "@/components/Themed";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

export default function ReportsScreen() {
  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <CommonHeader title="보고서" />

      {/* 내용 */}
      <ScrollView style={styles.content}>
        <View style={styles.comingSoonContainer}>
          <Ionicons name="bar-chart" size={80} color="#8b5cf6" />
          <Text style={styles.comingSoonTitle}>보고서</Text>
          <Text style={styles.comingSoonDescription}>
            통계 및 보고서 기능이 곧 출시됩니다.
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
