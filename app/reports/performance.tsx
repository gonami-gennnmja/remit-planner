import LoadingSpinner from "@/components/LoadingSpinner";
import { Theme } from "@/constants/Theme";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

interface PerformanceStats {
  // 전월 대비
  revenueChange: number;
  expenseChange: number;
  scheduleChange: number;
  workHoursChange: number;

  // 전년 동월 대비
  yearOverYearRevenue: number;
  yearOverYearExpense: number;
  yearOverYearSchedules: number;

  // 주간 비교
  weekOverWeekRevenue: number;
  weekOverWeekExpense: number;
  weekOverWeekWorkHours: number;
  weekOverWeekSchedules: number;

  // 3개월 평균 대비
  avg3MonthRevenue: number;
  avg3MonthExpense: number;
  avg3MonthSchedules: number;
  avg3MonthWorkHours: number;

  // 성장률 (월간 성장률)
  monthlyGrowthRate: number;
  quarterlyGrowthRate: number;

  // 현재 값들
  currentRevenue: number;
  currentExpense: number;
  currentSchedules: number;
  currentWorkHours: number;

  // 이번 주 값들
  thisWeekRevenue: number;
  thisWeekExpense: number;
  thisWeekSchedules: number;
  thisWeekWorkHours: number;
}

export default function PerformanceAnalysisScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<PerformanceStats>({
    revenueChange: 0,
    expenseChange: 0,
    scheduleChange: 0,
    workHoursChange: 0,
    yearOverYearRevenue: 0,
    yearOverYearExpense: 0,
    yearOverYearSchedules: 0,
    weekOverWeekRevenue: 0,
    weekOverWeekExpense: 0,
    weekOverWeekWorkHours: 0,
    weekOverWeekSchedules: 0,
    avg3MonthRevenue: 0,
    avg3MonthExpense: 0,
    avg3MonthSchedules: 0,
    avg3MonthWorkHours: 0,
    monthlyGrowthRate: 0,
    quarterlyGrowthRate: 0,
    currentRevenue: 0,
    currentExpense: 0,
    currentSchedules: 0,
    currentWorkHours: 0,
    thisWeekRevenue: 0,
    thisWeekExpense: 0,
    thisWeekSchedules: 0,
    thisWeekWorkHours: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      await db.init();

      const allSchedules = await db.getAllSchedules();
      const today = dayjs();

      // 기간 설정
      const monthStart = today.startOf("month");
      const monthEnd = today.endOf("month");
      const lastMonthStart = today.subtract(1, "month").startOf("month");
      const lastMonthEnd = today.subtract(1, "month").endOf("month");
      const lastYearSameMonthStart = today.subtract(1, "year").startOf("month");
      const lastYearSameMonthEnd = today.subtract(1, "year").endOf("month");
      const weekStart = today.startOf("week");
      const weekEnd = today.endOf("week");
      const lastWeekStart = today.subtract(1, "week").startOf("week");
      const lastWeekEnd = today.subtract(1, "week").endOf("week");
      const threeMonthsAgoStart = today.subtract(3, "month").startOf("month");

      let currentRevenue = 0;
      let currentExpense = 0;
      let currentSchedules = 0;
      let currentWorkHours = 0;
      let lastMonthRevenue = 0;
      let lastMonthExpense = 0;
      let lastMonthSchedules = 0;
      let lastMonthWorkHours = 0;
      let lastYearSameMonthRevenue = 0;
      let lastYearSameMonthExpense = 0;
      let lastYearSameMonthSchedules = 0;
      let thisWeekRevenue = 0;
      let thisWeekExpense = 0;
      let thisWeekSchedules = 0;
      let thisWeekWorkHours = 0;
      let lastWeekRevenue = 0;
      let lastWeekExpense = 0;
      let lastWeekSchedules = 0;
      let lastWeekWorkHours = 0;
      let avg3MonthRevenue = 0;
      let avg3MonthExpense = 0;
      let avg3MonthSchedules = 0;
      let avg3MonthWorkHours = 0;

      allSchedules.forEach((schedule) => {
        const scheduleDate = dayjs(schedule.startDate);
        const isThisMonth =
          scheduleDate.isSameOrAfter(monthStart) &&
          scheduleDate.isSameOrBefore(monthEnd);
        const isLastMonth =
          scheduleDate.isSameOrAfter(lastMonthStart) &&
          scheduleDate.isSameOrBefore(lastMonthEnd);
        const isLastYearSameMonth =
          scheduleDate.isSameOrAfter(lastYearSameMonthStart) &&
          scheduleDate.isSameOrBefore(lastYearSameMonthEnd);
        const isThisWeek =
          scheduleDate.isSameOrAfter(weekStart) &&
          scheduleDate.isSameOrBefore(weekEnd);
        const isLastWeek =
          scheduleDate.isSameOrAfter(lastWeekStart) &&
          scheduleDate.isSameOrBefore(lastWeekEnd);
        const isLast3Months =
          scheduleDate.isSameOrAfter(threeMonthsAgoStart) &&
          scheduleDate.isSameOrBefore(monthEnd);

        if (isThisMonth) currentSchedules++;
        if (isLastMonth) lastMonthSchedules++;
        if (isLastYearSameMonth) lastYearSameMonthSchedules++;
        if (isThisWeek) thisWeekSchedules++;
        if (isLastWeek) lastWeekSchedules++;

        schedule.workers.forEach((workerInfo) => {
          const periods = workerInfo.periods || [];
          const totalHours = periods.reduce((sum, period) => {
            const start = dayjs(period.start);
            const end = dayjs(period.end);
            return sum + end.diff(start, "hour", true);
          }, 0);

          const grossPay = workerInfo.worker.hourlyWage * totalHours;
          const tax = workerInfo.worker.taxWithheld ? grossPay * 0.033 : 0;
          const netPay = grossPay - tax;
          const fuelAllowance = workerInfo.worker.fuelAllowance || 0;
          const otherAllowance = workerInfo.worker.otherAllowance || 0;
          const totalAmount =
            Math.round(netPay) + fuelAllowance + otherAllowance;

          // 이번 달 데이터
          if (isThisMonth) {
            currentExpense += totalAmount;
            currentWorkHours += totalHours;
          }

          // 지난 달 데이터
          if (isLastMonth) {
            lastMonthExpense += totalAmount;
            lastMonthWorkHours += totalHours;
          }

          // 이번 주 데이터
          if (isThisWeek) {
            thisWeekExpense += totalAmount;
            thisWeekWorkHours += totalHours;
          }

          // 지난 주 데이터
          if (isLastWeek) {
            lastWeekExpense += totalAmount;
            lastWeekWorkHours += totalHours;
          }
        });

        // 수익 계산 (거래처가 있는 업무 스케줄)
        if (schedule.clientId && schedule.scheduleType === "business") {
          const scheduleEndDate = dayjs(schedule.endDate);
          const isScheduleEnded = scheduleEndDate.isBefore(today, "day");

          if (isScheduleEnded) {
            const scheduleRevenue = schedule.contractAmount || 0;

            if (isThisMonth) {
              currentRevenue += scheduleRevenue;
            }
            if (isLastMonth) {
              lastMonthRevenue += scheduleRevenue;
            }
            if (isLastYearSameMonth) {
              lastYearSameMonthRevenue += scheduleRevenue;
            }
            if (isThisWeek) {
              thisWeekRevenue += scheduleRevenue;
            }
            if (isLastWeek) {
              lastWeekRevenue += scheduleRevenue;
            }
            if (isLast3Months) {
              avg3MonthRevenue += scheduleRevenue;
            }
          }
        }
      });

      // 3개월 평균 계산
      avg3MonthRevenue = avg3MonthRevenue / 3;
      avg3MonthExpense = avg3MonthExpense / 3;
      avg3MonthSchedules = avg3MonthSchedules / 3;
      avg3MonthWorkHours = avg3MonthWorkHours / 3;

      // 변화율 계산
      const revenueChange =
        lastMonthRevenue > 0
          ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          : 0;
      const expenseChange =
        lastMonthExpense > 0
          ? ((currentExpense - lastMonthExpense) / lastMonthExpense) * 100
          : 0;
      const scheduleChange =
        lastMonthSchedules > 0
          ? ((currentSchedules - lastMonthSchedules) / lastMonthSchedules) * 100
          : 0;
      const workHoursChange =
        lastMonthWorkHours > 0
          ? ((currentWorkHours - lastMonthWorkHours) / lastMonthWorkHours) * 100
          : 0;

      // 전년 동월 대비
      const yearOverYearRevenue =
        lastYearSameMonthRevenue > 0
          ? ((currentRevenue - lastYearSameMonthRevenue) /
              lastYearSameMonthRevenue) *
            100
          : 0;
      const yearOverYearExpense =
        lastYearSameMonthExpense > 0
          ? ((currentExpense - lastYearSameMonthExpense) /
              lastYearSameMonthExpense) *
            100
          : 0;
      const yearOverYearSchedules =
        lastYearSameMonthSchedules > 0
          ? ((currentSchedules - lastYearSameMonthSchedules) /
              lastYearSameMonthSchedules) *
            100
          : 0;

      // 주간 비교
      const weekOverWeekRevenue =
        lastWeekRevenue > 0
          ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
          : 0;
      const weekOverWeekExpense =
        lastWeekExpense > 0
          ? ((thisWeekExpense - lastWeekExpense) / lastWeekExpense) * 100
          : 0;
      const weekOverWeekWorkHours =
        lastWeekWorkHours > 0
          ? ((thisWeekWorkHours - lastWeekWorkHours) / lastWeekWorkHours) * 100
          : 0;
      const weekOverWeekSchedules =
        lastWeekSchedules > 0
          ? ((thisWeekSchedules - lastWeekSchedules) / lastWeekSchedules) * 100
          : 0;

      // 성장률 계산
      const monthlyGrowthRate =
        lastMonthRevenue > 0
          ? ((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          : 0;
      const quarterlyGrowthRate =
        avg3MonthRevenue > 0
          ? ((currentRevenue - avg3MonthRevenue) / avg3MonthRevenue) * 100
          : 0;

      setStats({
        revenueChange,
        expenseChange,
        scheduleChange,
        workHoursChange,
        yearOverYearRevenue,
        yearOverYearExpense,
        yearOverYearSchedules,
        weekOverWeekRevenue,
        weekOverWeekExpense,
        weekOverWeekWorkHours,
        weekOverWeekSchedules,
        avg3MonthRevenue,
        avg3MonthExpense,
        avg3MonthSchedules,
        avg3MonthWorkHours,
        monthlyGrowthRate,
        quarterlyGrowthRate,
        currentRevenue,
        currentExpense,
        currentSchedules,
        currentWorkHours,
        thisWeekRevenue,
        thisWeekExpense,
        thisWeekSchedules,
        thisWeekWorkHours,
      });
    } catch (error) {
      console.error("Failed to load performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    const color = change >= 0 ? "#10b981" : "#ef4444";
    return { text: `${sign}${change.toFixed(1)}%`, color };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner message="성과 데이터를 불러오는 중..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={isWeb ? styles.contentContainerWeb : undefined}
      >
        {/* 전월 대비 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>전월 대비</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons
                  name="trending-up"
                  size={20}
                  color={Theme.colors.primary}
                />
                <Text style={styles.metricLabel}>수익</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: formatChange(stats.revenueChange).color },
                ]}
              >
                {formatChange(stats.revenueChange).text}
              </Text>
              <Text style={styles.metricSubtext}>
                {stats.currentRevenue.toLocaleString()}원
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="trending-down" size={20} color="#ef4444" />
                <Text style={styles.metricLabel}>지출</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: formatChange(stats.expenseChange).color },
                ]}
              >
                {formatChange(stats.expenseChange).text}
              </Text>
              <Text style={styles.metricSubtext}>
                {stats.currentExpense.toLocaleString()}원
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={styles.metricLabel}>일정</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: formatChange(stats.scheduleChange).color },
                ]}
              >
                {formatChange(stats.scheduleChange).text}
              </Text>
              <Text style={styles.metricSubtext}>
                {stats.currentSchedules}건
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="time" size={20} color="#f59e0b" />
                <Text style={styles.metricLabel}>근무시간</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: formatChange(stats.workHoursChange).color },
                ]}
              >
                {formatChange(stats.workHoursChange).text}
              </Text>
              <Text style={styles.metricSubtext}>
                {Math.round(stats.currentWorkHours)}시간
              </Text>
            </View>
          </View>
        </View>

        {/* 전년 동월 대비 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>전년 동월 대비</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="trending-up" size={20} color="#8b5cf6" />
                <Text style={styles.metricLabel}>수익</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: formatChange(stats.yearOverYearRevenue).color },
                ]}
              >
                {formatChange(stats.yearOverYearRevenue).text}
              </Text>
              <Text style={styles.metricSubtext}>
                {stats.currentRevenue.toLocaleString()}원
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="trending-down" size={20} color="#ef4444" />
                <Text style={styles.metricLabel}>지출</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: formatChange(stats.yearOverYearExpense).color },
                ]}
              >
                {formatChange(stats.yearOverYearExpense).text}
              </Text>
              <Text style={styles.metricSubtext}>
                {stats.currentExpense.toLocaleString()}원
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={styles.metricLabel}>일정</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: formatChange(stats.yearOverYearSchedules).color },
                ]}
              >
                {formatChange(stats.yearOverYearSchedules).text}
              </Text>
              <Text style={styles.metricSubtext}>
                {stats.currentSchedules}건
              </Text>
            </View>
          </View>
        </View>

        {/* 주간 비교 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주간 비교</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="trending-up" size={20} color="#10b981" />
                <Text style={styles.metricLabel}>수익</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: formatChange(stats.weekOverWeekRevenue).color },
                ]}
              >
                {formatChange(stats.weekOverWeekRevenue).text}
              </Text>
              <Text style={styles.metricSubtext}>
                {stats.thisWeekRevenue.toLocaleString()}원
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="trending-down" size={20} color="#ef4444" />
                <Text style={styles.metricLabel}>지출</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: formatChange(stats.weekOverWeekExpense).color },
                ]}
              >
                {formatChange(stats.weekOverWeekExpense).text}
              </Text>
              <Text style={styles.metricSubtext}>
                {stats.thisWeekExpense.toLocaleString()}원
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="time" size={20} color="#f59e0b" />
                <Text style={styles.metricLabel}>근무시간</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: formatChange(stats.weekOverWeekWorkHours).color },
                ]}
              >
                {formatChange(stats.weekOverWeekWorkHours).text}
              </Text>
              <Text style={styles.metricSubtext}>
                {Math.round(stats.thisWeekWorkHours)}시간
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={styles.metricLabel}>일정</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: formatChange(stats.weekOverWeekSchedules).color },
                ]}
              >
                {formatChange(stats.weekOverWeekSchedules).text}
              </Text>
              <Text style={styles.metricSubtext}>
                {stats.thisWeekSchedules}건
              </Text>
            </View>
          </View>
        </View>

        {/* 성장률 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>성장률</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="trending-up" size={20} color="#10b981" />
                <Text style={styles.metricLabel}>월간 성장률</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: formatChange(stats.monthlyGrowthRate).color },
                ]}
              >
                {formatChange(stats.monthlyGrowthRate).text}
              </Text>
              <Text style={styles.metricSubtext}>전월 대비</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="bar-chart" size={20} color="#8b5cf6" />
                <Text style={styles.metricLabel}>분기 성장률</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  { color: formatChange(stats.quarterlyGrowthRate).color },
                ]}
              >
                {formatChange(stats.quarterlyGrowthRate).text}
              </Text>
              <Text style={styles.metricSubtext}>3개월 평균 대비</Text>
            </View>
          </View>
        </View>

        {/* 3개월 평균 대비 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3개월 평균 대비</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="bar-chart" size={20} color="#10b981" />
                <Text style={styles.metricLabel}>수익</Text>
              </View>
              <Text style={styles.metricValue}>
                {stats.avg3MonthRevenue.toLocaleString()}원
              </Text>
              <Text style={styles.metricSubtext}>3개월 평균</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="bar-chart" size={20} color="#ef4444" />
                <Text style={styles.metricLabel}>지출</Text>
              </View>
              <Text style={styles.metricValue}>
                {stats.avg3MonthExpense.toLocaleString()}원
              </Text>
              <Text style={styles.metricSubtext}>3개월 평균</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text style={styles.metricLabel}>일정</Text>
              </View>
              <Text style={styles.metricValue}>
                {Math.round(stats.avg3MonthSchedules)}건
              </Text>
              <Text style={styles.metricSubtext}>3개월 평균</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Ionicons name="time" size={20} color="#f59e0b" />
                <Text style={styles.metricLabel}>근무시간</Text>
              </View>
              <Text style={styles.metricValue}>
                {Math.round(stats.avg3MonthWorkHours)}시간
              </Text>
              <Text style={styles.metricSubtext}>3개월 평균</Text>
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
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - Theme.spacing.lg * 3) / 2 - Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 0,
    ...Theme.shadows.sm,
    elevation: 2,
  },
  singleMetricCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    borderWidth: 0,
    ...Theme.shadows.sm,
    elevation: 2,
    alignItems: "center",
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  metricLabel: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.primary,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  metricSubtext: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
});
