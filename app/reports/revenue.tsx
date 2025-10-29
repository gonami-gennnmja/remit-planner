import CommonHeader from "@/components/CommonHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import PeriodSelector, { PeriodType } from "@/components/PeriodSelector";
import { Text } from "@/components/Themed";
import { Theme } from "@/constants/Theme";
import { useTheme } from "@/contexts/ThemeContext";
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

// NaN을 0으로 변환하는 헬퍼 함수
const safeNumber = (value: number): number => {
  return isNaN(value) || !isFinite(value) ? 0 : value;
};

// 숫자 포맷팅 헬퍼 함수
const formatNumber = (value: number): string => {
  const safeValue = safeNumber(value);
  return new Intl.NumberFormat("ko-KR").format(safeValue);
};

// compact 포맷팅 헬퍼 함수
const formatCompactNumber = (value: number): string => {
  const safeValue = safeNumber(value);
  return new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    compactDisplay: "short",
  }).format(safeValue);
};

interface RevenueStats {
  totalRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalExpense: number;
  weeklyExpense: number;
  monthlyExpense: number;
  yearlyExpense: number;
  totalPayroll: number;
  totalFuelAllowance: number;
  totalOtherAllowance: number;
  totalTaxWithheld: number;
  netProfit: number;
  weeklyNetProfit: number;
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
  const { colors } = useTheme();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    totalExpense: 0,
    weeklyExpense: 0,
    monthlyExpense: 0,
    yearlyExpense: 0,
    totalPayroll: 0,
    totalFuelAllowance: 0,
    totalOtherAllowance: 0,
    totalTaxWithheld: 0,
    netProfit: 0,
    weeklyNetProfit: 0,
    monthlyNetProfit: 0,
    yearlyNetProfit: 0,
    categoryRevenue: [],
    monthlyTrend: [],
    clientRevenue: [],
    payrollBreakdown: [],
  });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  useEffect(() => {
    loadRevenueData();
  }, [selectedPeriod, customStartDate, customEndDate]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      await db.init();

      const allSchedules = await db.getAllSchedules();
      setSchedules(allSchedules);

      const today = dayjs();
      let periodStart: dayjs.Dayjs;
      let periodEnd: dayjs.Dayjs;

      switch (selectedPeriod) {
        case "week":
          periodStart = today.startOf("week");
          periodEnd = today.endOf("week");
          break;
        case "month":
          periodStart = today.startOf("month");
          periodEnd = today.endOf("month");
          break;
        case "year":
          periodStart = today.startOf("year");
          periodEnd = today.endOf("year");
          break;
        case "custom":
          periodStart = customStartDate
            ? dayjs(customStartDate)
            : today.startOf("month");
          periodEnd = customEndDate
            ? dayjs(customEndDate)
            : today.endOf("month");
          break;
        default:
          periodStart = today.startOf("month");
          periodEnd = today.endOf("month");
      }

      // 전체 수익/지출 계산 (실제 계약금액 사용)
      let totalRevenue = 0;
      let weeklyRevenue = 0;
      let monthlyRevenue = 0;
      let yearlyRevenue = 0;
      let totalExpense = 0;
      let weeklyExpense = 0;
      let monthlyExpense = 0;
      let yearlyExpense = 0;

      const categoryRevenueMap = new Map<string, number>();
      const clientRevenueMap = new Map<
        string,
        { revenue: number; scheduleCount: number }
      >();

      allSchedules.forEach((schedule) => {
        const scheduleDate = dayjs(schedule.startDate);
        const scheduleRevenue = schedule.contractAmount || 0; // 실제 계약금액 사용
        const isInPeriod =
          scheduleDate.isSameOrAfter(periodStart) &&
          scheduleDate.isSameOrBefore(periodEnd);

        // 주간 여부 확인
        const isInWeek =
          scheduleDate.isSameOrAfter(today.startOf("week")) &&
          scheduleDate.isSameOrBefore(today.endOf("week"));
        const isInMonth =
          scheduleDate.isSameOrAfter(today.startOf("month")) &&
          scheduleDate.isSameOrBefore(today.endOf("month"));
        const isInYear =
          scheduleDate.isSameOrAfter(today.startOf("year")) &&
          scheduleDate.isSameOrBefore(today.endOf("year"));

        // 업무 스케줄만 수익에 포함
        if (schedule.scheduleType === "business") {
          totalRevenue += scheduleRevenue;
          if (isInWeek) weeklyRevenue += scheduleRevenue;
          if (isInMonth) monthlyRevenue += scheduleRevenue;
          if (isInYear) yearlyRevenue += scheduleRevenue;
        }

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
          const totalHours = safeNumber(
            periods.reduce((sum, period) => {
              if (
                !period ||
                !period.workDate ||
                !period.startTime ||
                !period.endTime
              ) {
                return sum;
              }
              try {
                const start = dayjs(`${period.workDate}T${period.startTime}`);
                const end = dayjs(`${period.workDate}T${period.endTime}`);
                const breakDuration = safeNumber(period.breakDuration || 0);
                const hours =
                  end.diff(start, "hour", true) - breakDuration / 60;
                return sum + Math.max(0, safeNumber(hours));
              } catch (e) {
                return sum;
              }
            }, 0)
          );

          const grossPay =
            (workerInfo.worker.hourlyWage || 0) * (totalHours || 0);
          const tax = workerInfo.taxWithheld ? grossPay * 0.033 : 0;
          const netPay = grossPay - tax;

          const roundedNetPay = Math.round(netPay || 0);
          totalExpense += roundedNetPay;
          if (isInWeek) weeklyExpense += roundedNetPay;
          if (isInMonth) monthlyExpense += roundedNetPay;
          if (isInYear) yearlyExpense += roundedNetPay;
        });
      });

      // 카테고리별 수익 정리
      const categoryRevenue = Array.from(categoryRevenueMap.entries())
        .map(([category, revenue]) => ({
          category: getCategoryDisplayName(category),
          revenue: safeNumber(revenue),
          percentage: safeNumber((revenue / totalRevenue) * 100),
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // 거래처별 수익 정리
      const clientRevenue = Array.from(clientRevenueMap.entries())
        .map(([clientName, data]) => ({
          clientName,
          revenue: safeNumber(data.revenue),
          scheduleCount: safeNumber(data.scheduleCount),
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
          // 업무 스케줄만 수익에 포함
          if (schedule.scheduleType === "business") {
            monthRevenue += schedule.contractAmount || 0; // 실제 계약금액 사용
          }

          schedule.workers?.forEach((workerInfo) => {
            const periods = workerInfo.periods || [];
            const totalHours = safeNumber(
              periods.reduce((sum, period) => {
                if (
                  !period ||
                  !period.workDate ||
                  !period.startTime ||
                  !period.endTime
                ) {
                  return sum;
                }
                try {
                  const start = dayjs(`${period.workDate}T${period.startTime}`);
                  const end = dayjs(`${period.workDate}T${period.endTime}`);
                  const breakDuration = safeNumber(period.breakDuration || 0);
                  const hours =
                    end.diff(start, "hour", true) - breakDuration / 60;
                  return sum + Math.max(0, safeNumber(hours));
                } catch (e) {
                  return sum;
                }
              }, 0)
            );

            const grossPay = safeNumber(
              (workerInfo.worker.hourlyWage || 0) * (totalHours || 0)
            );
            const tax = workerInfo.taxWithheld ? grossPay * 0.033 : 0;
            const netPay = grossPay - tax;
            monthExpense += Math.round(safeNumber(netPay || 0));
          });
        });

        monthlyTrend.push({
          month: month.format("YYYY-MM"),
          revenue: safeNumber(monthRevenue),
          expense: safeNumber(monthExpense),
          payroll: safeNumber(monthExpense),
          profit: safeNumber(monthRevenue - monthExpense),
        });
      }

      setStats({
        totalRevenue: safeNumber(totalRevenue),
        weeklyRevenue: safeNumber(weeklyRevenue),
        monthlyRevenue: safeNumber(monthlyRevenue),
        yearlyRevenue: safeNumber(yearlyRevenue),
        totalExpense: safeNumber(totalExpense),
        weeklyExpense: safeNumber(weeklyExpense),
        monthlyExpense: safeNumber(monthlyExpense),
        yearlyExpense: safeNumber(yearlyExpense),
        totalPayroll: safeNumber(totalExpense),
        totalFuelAllowance: 0,
        totalOtherAllowance: 0,
        totalTaxWithheld: 0,
        netProfit: safeNumber(totalRevenue - totalExpense),
        weeklyNetProfit: safeNumber(weeklyRevenue - weeklyExpense),
        monthlyNetProfit: safeNumber(monthlyRevenue - monthlyExpense),
        yearlyNetProfit: safeNumber(yearlyRevenue - yearlyExpense),
        categoryRevenue,
        monthlyTrend,
        clientRevenue,
        payrollBreakdown: [],
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
          revenue: safeNumber(stats.weeklyRevenue),
          expense: safeNumber(stats.weeklyExpense),
          profit: safeNumber(stats.weeklyNetProfit),
        };
      case "month":
        return {
          revenue: safeNumber(stats.monthlyRevenue),
          expense: safeNumber(stats.monthlyExpense),
          profit: safeNumber(stats.monthlyNetProfit),
        };
      case "year":
        return {
          revenue: safeNumber(stats.yearlyRevenue),
          expense: safeNumber(stats.yearlyExpense),
          profit: safeNumber(stats.yearlyNetProfit),
        };
      default:
        return {
          revenue: safeNumber(stats.totalRevenue),
          expense: safeNumber(stats.totalExpense),
          profit: safeNumber(stats.netProfit),
        };
    }
  };

  const periodStats = getPeriodStats();

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="수익 리포트" />
        <LoadingSpinner message="수익 데이터를 불러오는 중..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader title="수익 리포트" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={isWeb ? styles.contentContainerWeb : undefined}
      >
        {/* 기간 선택 */}
        <PeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          startDate={customStartDate}
          endDate={customEndDate}
          onStartDateChange={setCustomStartDate}
          onEndDateChange={setCustomEndDate}
          showCustomRange={true}
        />

        {/* 주요 통계 카드 */}
        <View style={[styles.statsGrid, isWeb && styles.statsGridWeb]}>
          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#dcfce7" }]}>
              <Ionicons name="trending-up" size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>
              {formatCompactNumber(periodStats.revenue)}
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
              {formatCompactNumber(periodStats.expense)}
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
              {formatCompactNumber(periodStats.profit)}
            </Text>
            <Text style={styles.statLabel}>순이익</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#e0e7ff" }]}>
              <Ionicons name="analytics" size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.statValue}>
              {safeNumber(
                periodStats.revenue > 0
                  ? Math.round((periodStats.profit / periodStats.revenue) * 100)
                  : 0
              )}
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
                  {formatNumber(periodStats.revenue)}원
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>총 지출</Text>
                <Text style={[styles.financialValue, { color: "#ef4444" }]}>
                  {formatNumber(periodStats.expense)}원
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
                {formatNumber(periodStats.profit)}원
              </Text>
            </View>
          </View>
        </View>

        {/* 카테고리별 수익 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>카테고리별 수익</Text>
          <View style={styles.categoryCard}>
            {(showAllCategories
              ? stats.categoryRevenue
              : stats.categoryRevenue.slice(0, 3)
            ).map((item, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{item.category}</Text>
                  <Text style={styles.categoryRevenue}>
                    {formatNumber(item.revenue)}원
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
            {stats.categoryRevenue.length > 3 && !showAllCategories && (
              <Pressable
                style={styles.showMoreButton}
                onPress={() => setShowAllCategories(true)}
              >
                <Text style={styles.showMoreText}>
                  +{stats.categoryRevenue.length - 3}개 더 보기
                </Text>
              </Pressable>
            )}
            {stats.categoryRevenue.length > 3 && showAllCategories && (
              <Pressable
                style={styles.showLessButton}
                onPress={() => setShowAllCategories(false)}
              >
                <Text style={styles.showLessText}>접기</Text>
              </Pressable>
            )}
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
                      {formatNumber(client.revenue)}원
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
                      {formatNumber(
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
    width: "25%",
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
    alignItems: "flex-end",
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
    justifyContent: "flex-end",
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
  showMoreButton: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 8,
  },
  showMoreText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  showLessButton: {
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 8,
  },
  showLessText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
});
