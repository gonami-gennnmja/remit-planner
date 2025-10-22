import CommonHeader from "@/components/CommonHeader";
import { Text } from "@/components/Themed";
import { Theme } from "@/constants/Theme";
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
    title: "일정 현황 리포트",
    description: "일정 통계, 카테고리별 분포, 월별 트렌드",
    icon: "calendar-outline",
    color: "#3b82f6",
    route: "/schedule-reports",
  },
  {
    id: "worker-reports",
    title: "직원 근무 리포트",
    description: "근무시간, 급여 현황, 직원별 성과",
    icon: "people-outline",
    color: "#10b981",
    route: "/worker-reports",
  },
  {
    id: "revenue-reports",
    title: "수익 리포트",
    description: "수익/지출 분석, 거래처별 수익, 월별 트렌드",
    icon: "trending-up-outline",
    color: "#f59e0b",
    route: "/revenue-reports",
  },
  {
    id: "dashboard",
    title: "대시보드",
    description: "한눈에 보는 업무 현황 및 주요 지표",
    icon: "analytics-outline",
    color: "#8b5cf6",
    route: "/dashboard",
  },
];

export default function ReportsScreen() {
  return (
    <View style={styles.container}>
      <CommonHeader title="보고서" />

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
                  { backgroundColor: `${item.color}20` },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={32}
                  color={item.color}
                />
              </View>
              <Text style={styles.reportTitle}>{item.title}</Text>
              <Text style={styles.reportDescription}>{item.description}</Text>
              <View style={styles.reportArrow}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={Theme.colors.text.tertiary}
                />
              </View>
            </Pressable>
          ))}
        </View>

        {/* 추가 정보 */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={Theme.colors.primary}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>리포트 활용 팁</Text>
              <Text style={styles.infoText}>
                • 주간/월간/연간 단위로 데이터를 분석할 수 있습니다{"\n"}• 각
                리포트에서 기간을 선택하여 상세한 통계를 확인하세요{"\n"}•
                대시보드에서 전체적인 현황을 한눈에 파악할 수 있습니다
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
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
  },
  contentContainerWeb: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    padding: 24,
  },
  reportsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },
  reportCard: {
    flex: 1,
    minWidth: (width - 16 * 3) / 2 - 12,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: "relative",
  },
  reportCardWeb: {
    minWidth: 280,
    flex: 0,
    width: "48%",
  },
  reportIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 16,
  },
  reportArrow: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
});
