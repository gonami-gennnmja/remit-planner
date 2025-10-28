import CommonHeader from "@/components/CommonHeader";
import { Text } from "@/components/Themed";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

const reportItems = [
  {
    id: "schedule-reports",
    title: "일정 현황",
    emoji: "📅",
    description: "일정 통계, 카테고리별 분포",
    color: "#3b82f6",
    route: "/schedule/reports",
  },
  {
    id: "revenue-reports",
    title: "수익 분석",
    emoji: "💰",
    description: "수익/지출, 거래처별 수익",
    color: "#f59e0b",
    route: "/reports/revenue",
  },
  {
    id: "performance-reports",
    title: "성과 분석",
    emoji: "📊",
    description: "전월 대비, 성장률 분석",
    color: "#8b5cf6",
    route: "/reports/performance",
  },
  {
    id: "cashflow-reports",
    title: "현금흐름 분석",
    emoji: "💸",
    description: "현금 유입/유출, 예상 잔액",
    color: "#10b981",
    route: "/reports/cashflow",
  },
  {
    id: "worker-efficiency-reports",
    title: "근로자 효율",
    emoji: "👥",
    description: "근로자별 근무시간, 성과 분석",
    color: "#ef4444",
    route: "/reports/worker-efficiency",
  },
  {
    id: "client-reports",
    title: "거래처 분석",
    emoji: "🏢",
    description: "거래처별 매출, 재계약률",
    color: "#f59e0b",
    route: "/reports/clients",
  },
];

export default function ReportsScreen() {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <CommonHeader title="리포트" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={isWeb ? styles.contentContainerWeb : undefined}
      >
        <View style={styles.reportsGrid}>
          {reportItems.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.reportCard, isWeb && styles.reportCardWeb]}
              onPress={() => router.push(item.route as any)}
            >
              <View
                style={[
                  styles.reportIcon,
                  { backgroundColor: `${item.color}15` },
                ]}
              >
                <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
              </View>
              <Text style={styles.reportTitle}>{item.title}</Text>
              <Text style={styles.reportDescription}>{item.description}</Text>
            </Pressable>
          ))}
        </View>

        {/* 추가 정보 */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoIconContainer}>
              <Ionicons
                name="information-circle-outline"
                size={24}
                color="#1d1d1f"
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>리포트 활용 팁</Text>
              <Text style={styles.infoText}>
                • 현금흐름 분석으로 미수금과 미지급 급여를 확인하세요{"\n"}•
                근로자 효율 리포트로 생산성을 파악하세요{"\n"}• 거래처 분석으로
                재계약률과 매출을 관리하세요{"\n"}• 각 리포트에서 기간을
                선택하여 상세한 통계를 확인하세요
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7", // Apple Compact background
  },
  content: {
    flex: 1,
  },
  contentContainerWeb: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    padding: 20, // Apple Compact container padding
  },
  reportsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    gap: 10, // Apple Compact card gap
  },
  reportCard: {
    flex: 1,
    minWidth: (width - 20 * 3) / 2 - 10,
    backgroundColor: "#ffffff", // Apple Compact white surface
    borderRadius: 14, // Apple Compact card border radius
    padding: 16, // Apple Compact card padding
    marginBottom: 10, // Apple Compact card gap
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, // Apple Compact very subtle shadow
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  reportCardWeb: {
    minWidth: 280,
    flex: 0,
    width: "48%",
  },
  reportIcon: {
    width: 56, // Apple Compact emoji box size
    height: 56,
    borderRadius: 12, // Apple Compact emoji box radius
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "600", // Apple Compact semibold
    color: "#1d1d1f", // Apple Compact primary text
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 13, // Apple Compact secondary text
    color: "#86868b", // Apple Compact secondary text color
    lineHeight: 18,
  },
  reportArrow: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: "#ffffff", // Apple Compact white surface
    borderRadius: 14, // Apple Compact card border radius
    padding: 16, // Apple Compact card padding
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, // Apple Compact very subtle shadow
    shadowRadius: 4,
    elevation: 2,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600", // Apple Compact semibold
    color: "#1d1d1f", // Apple Compact primary text
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#86868b", // Apple Compact secondary text
    lineHeight: 20,
  },
});
