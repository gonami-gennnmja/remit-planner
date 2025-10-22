import CommonHeader from "@/components/CommonHeader";
import { Text } from "@/components/Themed";
import { Theme } from "@/constants/Theme";
import { getDatabase } from "@/database/platformDatabase";
import { Schedule } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
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

interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalExpense: number;
  monthlyExpense: number;
  yearlyExpense: number;
  totalPayroll: number;
  totalFuelAllowance: number;
  totalOtherAllowance: number;
  totalTaxWithheld: number;
  netProfit: number;
  monthlyNetProfit: number;
  yearlyNetProfit: number;
  categoryRevenue: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    expense: number;
    payroll: number;
    profit: number;
  }>;
  clientRevenue: Array<{
    clientName: string;
    revenue: number;
    scheduleCount: number;
  }>;
  payrollBreakdown: Array<{
    workerName: string;
    totalPay: number;
    fuelAllowance: number;
    otherAllowance: number;
    taxWithheld: number;
    netPay: number;
  }>;
}

export default function RevenueReportsScreen() {
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    totalExpense: 0,
    monthlyExpense: 0,
    yearlyExpense: 0,
    totalPayroll: 0,
    totalFuelAllowance: 0,
    totalOtherAllowance: 0,
    totalTaxWithheld: 0,
    netProfit: 0,
    monthlyNetProfit: 0,
    yearlyNetProfit: 0,
    categoryRevenue: [],
    monthlyTrend: [],
    clientRevenue: [],
    payrollBreakdown: [],
  });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("month");

  useEffect(() => {
    loadRevenueData();
  }, [selectedPeriod]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      await db.init();

      const allSchedules = await db.getAllSchedules();
      setSchedules(allSchedules);

      const today = dayjs();
      const thisMonthStart = today.startOf("month");
      const thisMonthEnd = today.endOf("month");
      const thisYearStart = today.startOf("year");
      const thisYearEnd = today.endOf("year");

      // 전체 수익/지출 계산 (임시로 일정당 고정 수익 가정)
      const REVENUE_PER_SCHEDULE = 500000; // 일정당 50만원 수익 가정

      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let yearlyRevenue = 0;
      let totalExpense = 0;
      let monthlyExpense = 0;
      let yearlyExpense = 0;

      const categoryRevenueMap = new Map<string, number>();
      const clientRevenueMap = new Map<
        string,
        { revenue: number; scheduleCount: number }
      >();

      allSchedules.forEach((schedule) => {
        const scheduleDate = dayjs(schedule.startDate);
        const scheduleRevenue = REVENUE_PER_SCHEDULE;
        const isThisMonth =
          scheduleDate.isSameOrAfter(thisMonthStart) &&
          scheduleDate.isSameOrBefore(thisMonthEnd);
        const isThisYear =
          scheduleDate.isSameOrAfter(thisYearStart) &&
          scheduleDate.isSameOrBefore(thisYearEnd);

        // 수익 계산
        totalRevenue += scheduleRevenue;
        if (isThisMonth) monthlyRevenue += scheduleRevenue;
        if (isThisYear) yearlyRevenue += scheduleRevenue;

        // 카테고리별 수익
        const category = schedule.category;
        categoryRevenueMap.set(
          category,
          (categoryRevenueMap.get(category) || 0) + scheduleRevenue
        );

        // 거래처별 수익 (임시로 일정 제목을 거래처명으로 사용)
        const clientName = schedule.title.split(" ")[0]; // 첫 번째 단어를 거래처명으로 가정
        const existingClient = clientRevenueMap.get(clientName);
        if (existingClient) {
          existingClient.revenue += scheduleRevenue;
          existingClient.scheduleCount += 1;
        } else {
          clientRevenueMap.set(clientName, {
            revenue: scheduleRevenue,
            scheduleCount: 1,
          });
        }

        // 지출 계산 (급여)
        schedule.workers?.forEach((workerInfo) => {
          const periods = workerInfo.periods || [];
          const totalHours = periods.reduce((sum, period) => {
            const start = dayjs(period.start);
            const end = dayjs(period.end);
            return sum + end.diff(start, "hour", true);
          }, 0);

          const grossPay = workerInfo.worker.hourlyWage * totalHours;
          const tax = workerInfo.worker.taxWithheld ? grossPay * 0.033 : 0;
          const netPay = grossPay - tax;

          totalExpense += Math.round(netPay);
          if (isThisMonth) monthlyExpense += Math.round(netPay);
          if (isThisYear) yearlyExpense += Math.round(netPay);
        });
      });

      // 카테고리별 수익 정리
      const categoryRevenue = Array.from(categoryRevenueMap.entries())
        .map(([category, revenue]) => ({
          category: getCategoryDisplayName(category),
          revenue,
          percentage: (revenue / totalRevenue) * 100,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // 거래처별 수익 정리
      const clientRevenue = Array.from(clientRevenueMap.entries())
        .map(([clientName, data]) => ({
          clientName,
          revenue: data.revenue,
          scheduleCount: data.scheduleCount,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // 월별 트렌드 (최근 12개월)
      const monthlyTrend = [];
      for (let i = 11; i >= 0; i--) {
        const month = today.subtract(i, "month");
        const monthStart = month.startOf("month");
        const monthEnd = month.endOf("month");

        const monthSchedules = allSchedules.filter((s) => {
          const scheduleDate = dayjs(s.startDate);
          return (
            scheduleDate.isSameOrAfter(monthStart) &&
            scheduleDate.isSameOrBefore(monthEnd)
          );
        });

        let monthRevenue = 0;
        let monthExpense = 0;

        monthSchedules.forEach((schedule) => {
          monthRevenue += REVENUE_PER_SCHEDULE;

          schedule.workers?.forEach((workerInfo) => {
            const periods = workerInfo.periods || [];
            const totalHours = periods.reduce((sum, period) => {
              const start = dayjs(period.start);
              const end = dayjs(period.end);
              return sum + end.diff(start, "hour", true);
            }, 0);

            const grossPay = workerInfo.worker.hourlyWage * totalHours;
            const tax = workerInfo.worker.taxWithheld ? grossPay * 0.033 : 0;
            const netPay = grossPay - tax;
            monthExpense += Math.round(netPay);
          });
        });

        monthlyTrend.push({
          month: month.format("YYYY-MM"),
          revenue: monthRevenue,
          expense: monthExpense,
          profit: monthRevenue - monthExpense,
        });
      }

      setStats({
        totalRevenue,
        monthlyRevenue,
        yearlyRevenue,
        totalExpense,
        monthlyExpense,
        yearlyExpense,
        netProfit: totalRevenue - totalExpense,
        monthlyNetProfit: monthlyRevenue - monthlyExpense,
        yearlyNetProfit: yearlyRevenue - yearlyExpense,
        categoryRevenue,
        monthlyTrend,
        clientRevenue,
      });
    } catch (error) {
      console.error("Failed to load revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      education: "교육",
      event: "이벤트",
      meeting: "회의",
      maintenance: "유지보수",
      other: "기타",
    };
    return categoryMap[category] || category;
  };

  const getPeriodStats = () => {
    switch (selectedPeriod) {
      case "week":
        return {
          revenue: 0, // 주간 수익은 별도 계산 필요
          expense: 0,
          profit: 0,
        };
      case "month":
        return {
          revenue: stats.monthlyRevenue,
          expense: stats.monthlyExpense,
          profit: stats.monthlyNetProfit,
        };
      case "year":
        return {
          revenue: stats.yearlyRevenue,
          expense: stats.yearlyExpense,
          profit: stats.yearlyNetProfit,
        };
      default:
        return {
          revenue: stats.totalRevenue,
          expense: stats.totalExpense,
          profit: stats.netProfit,
        };
    }
  };

  const periodStats = getPeriodStats();

  return (
    <View style={styles.container}>
      <CommonHeader title="수익 리포트" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={isWeb ? styles.contentContainerWeb : undefined}
      >
        {/* 기간 선택 */}
        <View style={styles.periodSelector}>
          <Pressable
            style={[
              styles.periodButton,
              selectedPeriod === "week" && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod("week")}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === "week" && styles.periodButtonTextActive,
              ]}
            >
              주간
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.periodButton,
              selectedPeriod === "month" && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod("month")}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === "month" && styles.periodButtonTextActive,
              ]}
            >
              월간
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.periodButton,
              selectedPeriod === "year" && styles.periodButtonTextActive,
            ]}
            onPress={() => setSelectedPeriod("year")}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === "year" && styles.periodButtonTextActive,
              ]}
            >
              연간
            </Text>
          </Pressable>
        </View>

        {/* 주요 통계 카드 */}
        <View style={[styles.statsGrid, isWeb && styles.statsGridWeb]}>
          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#dcfce7" }]}>
              <Ionicons name="trending-up" size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>
              {new Intl.NumberFormat("ko-KR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(periodStats.revenue)}
            </Text>
            <Text style={styles.statLabel}>
              {selectedPeriod === "week"
                ? "주간"
                : selectedPeriod === "month"
                ? "월간"
                : "연간"}{" "}
              수익
            </Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#fee2e2" }]}>
              <Ionicons name="trending-down" size={24} color="#ef4444" />
            </View>
            <Text style={styles.statValue}>
              {new Intl.NumberFormat("ko-KR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(periodStats.expense)}
            </Text>
            <Text style={styles.statLabel}>
              {selectedPeriod === "week"
                ? "주간"
                : selectedPeriod === "month"
                ? "월간"
                : "연간"}{" "}
              지출
            </Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View
              style={[
                styles.statIcon,
                {
                  backgroundColor:
                    periodStats.profit >= 0 ? "#dcfce7" : "#fee2e2",
                },
              ]}
            >
              <Ionicons
                name={
                  periodStats.profit >= 0 ? "checkmark-circle" : "close-circle"
                }
                size={24}
                color={periodStats.profit >= 0 ? "#10b981" : "#ef4444"}
              />
            </View>
            <Text
              style={[
                styles.statValue,
                { color: periodStats.profit >= 0 ? "#10b981" : "#ef4444" },
              ]}
            >
              {new Intl.NumberFormat("ko-KR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(periodStats.profit)}
            </Text>
            <Text style={styles.statLabel}>순이익</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#e0e7ff" }]}>
              <Ionicons name="analytics" size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.statValue}>
              {periodStats.revenue > 0
                ? Math.round((periodStats.profit / periodStats.revenue) * 100)
                : 0}
              %
            </Text>
            <Text style={styles.statLabel}>수익률</Text>
          </View>
        </View>

        {/* 수익/지출 상세 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수익/지출 상세</Text>
          <View style={styles.financialCard}>
            <View style={styles.financialRow}>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>총 수익</Text>
                <Text style={[styles.financialValue, { color: "#10b981" }]}>
                  {new Intl.NumberFormat("ko-KR").format(periodStats.revenue)}원
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>총 지출</Text>
                <Text style={[styles.financialValue, { color: "#ef4444" }]}>
                  {new Intl.NumberFormat("ko-KR").format(periodStats.expense)}원
                </Text>
              </View>
            </View>
            <View style={styles.profitRow}>
              <Text style={styles.profitLabel}>순이익</Text>
              <Text
                style={[
                  styles.profitValue,
                  {
                    color: periodStats.profit >= 0 ? "#10b981" : "#ef4444",
                  },
                ]}
              >
                {new Intl.NumberFormat("ko-KR").format(periodStats.profit)}원
              </Text>
            </View>
          </View>
        </View>

        {/* 카테고리별 수익 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>카테고리별 수익</Text>
          <View style={styles.categoryCard}>
            {stats.categoryRevenue.map((item, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{item.category}</Text>
                  <Text style={styles.categoryRevenue}>
                    {new Intl.NumberFormat("ko-KR").format(item.revenue)}원
                  </Text>
                </View>
                <View style={styles.categoryBar}>
                  <View
                    style={[
                      styles.categoryBarFill,
                      {
                        width: `${item.percentage}%`,
                        backgroundColor: getCategoryColor(index),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.categoryPercentage}>
                  {item.percentage.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 거래처별 수익 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>거래처별 수익</Text>
          {stats.clientRevenue.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name="briefcase-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>거래처 데이터가 없습니다</Text>
            </View>
          ) : (
            stats.clientRevenue.slice(0, 10).map((client, index) => (
              <View key={index} style={styles.clientItem}>
                <View style={styles.clientHeader}>
                  <Text style={styles.clientName}>{client.clientName}</Text>
                  <Text style={styles.clientRank}>#{index + 1}</Text>
                </View>
                <View style={styles.clientStats}>
                  <View style={styles.clientStatItem}>
                    <Text style={styles.clientStatLabel}>수익</Text>
                    <Text style={styles.clientStatValue}>
                      {new Intl.NumberFormat("ko-KR").format(client.revenue)}원
                    </Text>
                  </View>
                  <View style={styles.clientStatItem}>
                    <Text style={styles.clientStatLabel}>일정수</Text>
                    <Text style={styles.clientStatValue}>
                      {client.scheduleCount}건
                    </Text>
                  </View>
                  <View style={styles.clientStatItem}>
                    <Text style={styles.clientStatLabel}>평균 수익</Text>
                    <Text style={styles.clientStatValue}>
                      {new Intl.NumberFormat("ko-KR").format(
                        Math.round(client.revenue / client.scheduleCount)
                      )}
                      원
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 월별 트렌드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            월별 수익 트렌드 (최근 12개월)
          </Text>
          <View style={styles.trendCard}>
            {stats.monthlyTrend.map((item, index) => (
              <View key={index} style={styles.trendItem}>
                <Text style={styles.trendMonth}>
                  {dayjs(item.month).format("M월")}
                </Text>
                <View style={styles.trendBars}>
                  <View style={styles.trendBarContainer}>
                    <Text style={styles.trendBarLabel}>수익</Text>
                    <View style={styles.trendBar}>
                      <View
                        style={[
                          styles.trendBarFill,
                          styles.trendBarRevenue,
                          {
                            height: `${Math.max(
                              (item.revenue /
                                Math.max(
                                  ...stats.monthlyTrend.map((t) => t.revenue)
                                )) *
                                100,
                              5
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.trendBarContainer}>
                    <Text style={styles.trendBarLabel}>지출</Text>
                    <View style={styles.trendBar}>
                      <View
                        style={[
                          styles.trendBarFill,
                          styles.trendBarExpense,
                          {
                            height: `${Math.max(
                              (item.expense /
                                Math.max(
                                  ...stats.monthlyTrend.map((t) => t.expense)
                                )) *
                                100,
                              5
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
                <Text style={styles.trendCount}>
                  {new Intl.NumberFormat("ko-KR", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(item.profit)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getCategoryColor = (index: number) => {
  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainerWeb: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    padding: Theme.spacing.xl,
  },
  periodSelector: {
    flexDirection: "row",
    margin: Theme.spacing.lg,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    alignItems: "center",
    borderRadius: Theme.borderRadius.md,
  },
  periodButtonActive: {
    backgroundColor: Theme.colors.primary,
  },
  periodButtonText: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.secondary,
  },
  periodButtonTextActive: {
    color: "white",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  statsGridWeb: {
    padding: 0,
    marginBottom: Theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: (width - Theme.spacing.lg * 3) / 2 - Theme.spacing.md,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  statCardWeb: {
    minWidth: 200,
    flex: 0,
    flexBasis: "calc(25% - 12px)",
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.spacing.md,
  },
  statValue: {
    fontSize: 32,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  statLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  financialCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  financialRow: {
    flexDirection: "row",
    marginBottom: Theme.spacing.lg,
  },
  financialItem: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    backgroundColor: Theme.colors.border.light,
    marginHorizontal: Theme.spacing.md,
  },
  financialLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  financialValue: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
  },
  profitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
  },
  profitLabel: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
  },
  profitValue: {
    fontSize: Theme.typography.sizes.xxl,
    fontWeight: Theme.typography.weights.bold,
  },
  categoryCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  categoryItem: {
    marginBottom: Theme.spacing.md,
  },
  categoryInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.xs,
  },
  categoryName: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.primary,
  },
  categoryRevenue: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  categoryBar: {
    height: 8,
    backgroundColor: Theme.colors.surface,
    borderRadius: 4,
    marginBottom: Theme.spacing.xs,
  },
  categoryBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.tertiary,
    textAlign: "right",
  },
  clientItem: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  clientName: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
  },
  clientRank: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.primary,
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  clientStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.md,
  },
  clientStatItem: {
    flex: 1,
    minWidth: 80,
    alignItems: "center",
  },
  clientStatLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  clientStatValue: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
  },
  trendCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  trendItem: {
    flexDirection: "row",
    alignItems: "end",
    marginBottom: Theme.spacing.md,
    height: 80,
  },
  trendMonth: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    width: 40,
    textAlign: "center",
  },
  trendBars: {
    flex: 1,
    flexDirection: "row",
    marginHorizontal: Theme.spacing.sm,
    gap: Theme.spacing.xs,
  },
  trendBarContainer: {
    flex: 1,
    alignItems: "center",
  },
  trendBarLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.tertiary,
    marginBottom: Theme.spacing.xs,
  },
  trendBar: {
    height: 40,
    backgroundColor: Theme.colors.surface,
    borderRadius: 4,
    justifyContent: "end",
    width: "100%",
  },
  trendBarFill: {
    borderRadius: 4,
    minHeight: 4,
  },
  trendBarRevenue: {
    backgroundColor: "#10b981",
  },
  trendBarExpense: {
    backgroundColor: "#ef4444",
  },
  trendCount: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    width: 50,
    textAlign: "center",
  },
  emptySection: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
  emptyText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.tertiary,
    marginTop: Theme.spacing.sm,
  },
});
