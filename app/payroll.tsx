import CommonHeader from "@/components/CommonHeader";
import { Text } from "@/components/Themed";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

export default function PayrollScreen() {
  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <CommonHeader title="급여 관리" />

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
