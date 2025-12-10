// @ts-nocheck
import CommonHeader from "@/components/CommonHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Theme } from "@/constants/Theme";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import { Schedule } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

interface DashboardStats {
  totalSchedules: number;
  upcomingSchedules: number;
  totalWorkers: number;
  activeWorkers: number;
  totalWorkHours: number;
  totalRevenue: number;
  totalPayroll: number;
  totalFuelAllowance: number;
  totalOtherAllowance: number;
  unpaidAmount: number;
  totalReceivable: number;
  monthlyRevenue: number;
  monthlyExpense: number;
  monthlyPayroll: number;
  netProfit: number;
  // 비교/트렌드 지표들
  lastMonthRevenue: number;
  lastMonthExpense: number;
  lastMonthSchedules: number;
  lastMonthWorkHours: number;
  lastYearSameMonthRevenue: number;
  lastWeekRevenue: number;
  lastWeekWorkHours: number;
  avg3MonthRevenue: number;
  avg3MonthExpense: number;
  // 차트 데이터
  monthlyTrendData: Array<{
    month: string;
    revenue: number;
    expense: number;
    netProfit: number;
  }>;
  weeklyPerformanceData: Array<{
    week: string;
    revenue: number;
    expense: number;
    workHours: number;
    schedules: number;
  }>;
  recentSchedules: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    workerCount: number;
    status: "upcoming" | "ongoing" | "completed";
  }>;
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalSchedules: 0,
    upcomingSchedules: 0,
    totalWorkers: 0,
    activeWorkers: 0,
    totalWorkHours: 0,
    totalRevenue: 0,
    totalPayroll: 0,
    totalFuelAllowance: 0,
    totalOtherAllowance: 0,
    unpaidAmount: 0,
    totalReceivable: 0,
    monthlyRevenue: 0,
    monthlyExpense: 0,
    monthlyPayroll: 0,
    netProfit: 0,
    // 비교/트렌드 지표들
    lastMonthRevenue: 0,
    lastMonthExpense: 0,
    lastMonthSchedules: 0,
    lastMonthWorkHours: 0,
    lastYearSameMonthRevenue: 0,
    lastWeekRevenue: 0,
    lastWeekWorkHours: 0,
    avg3MonthRevenue: 0,
    avg3MonthExpense: 0,
    // 차트 데이터
    monthlyTrendData: [],
    weeklyPerformanceData: [],
    recentSchedules: [],
  });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      await db.init();

      // 카테고리 로드
      const cats = await db.getAllCategories();
      setCategories(cats);

      // 모든 스케줄 로드
      const allSchedules = await db.getAllSchedules();
      setSchedules(allSchedules);

      // 모든 근로자 로드
      const allWorkers = await db.getAllWorkers();

      // 통계 계산
      const today = dayjs();
      const upcomingCount = allSchedules.filter((s) =>
        dayjs(s.endDate).isSameOrAfter(today, "day")
      ).length;

      // 이번 달 매출/지출 계산
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

      let monthRevenue = 0;
      let monthExpense = 0;
      let totalUnpaid = 0;
      let totalReceivable = 0;
      let monthWorkHours = 0;
      let monthSchedules = 0;

      // 비교 지표들
      let lastMonthRevenue = 0;
      let lastMonthExpense = 0;
      let lastMonthWorkHours = 0;
      let lastMonthSchedules = 0;
      let lastYearSameMonthRevenue = 0;
      let lastWeekRevenue = 0;
      let lastWeekWorkHours = 0;
      let avg3MonthRevenue = 0;
      let avg3MonthExpense = 0;

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

        if (isThisMonth) monthSchedules++;
        if (isLastMonth) lastMonthSchedules++;

        schedule.workers?.forEach((workerInfo) => {
          // periods가 존재하는지 확인하고 안전하게 처리
          const periods = workerInfo.periods || [];
          const totalHours = periods.reduce((sum, period) => {
            const start = dayjs(period.start);
            const end = dayjs(period.end);
            return sum + end.diff(start, "hour", true);
          }, 0);

          const grossPay = workerInfo.worker.hourlyWage * totalHours;
          const tax = (workerInfo.worker as any).taxWithheld
            ? grossPay * 0.033
            : 0;
          const netPay = grossPay - tax;
          const fuelAllowance = workerInfo.worker.fuelAllowance || 0;
          const otherAllowance = workerInfo.worker.otherAllowance || 0;
          const totalAmount =
            Math.round(netPay) + fuelAllowance + otherAllowance;

          // 이번 달 데이터
          if (isThisMonth) {
            monthExpense += totalAmount;
            monthWorkHours += totalHours;
          }

          // 지난 달 데이터
          if (isLastMonth) {
            lastMonthExpense += totalAmount;
            lastMonthWorkHours += totalHours;
          }

          // 이번 주 데이터
          if (isThisWeek) {
            lastWeekRevenue += totalAmount; // 실제로는 이번 주이지만 변수명 유지
          }

          // 지난 주 데이터
          if (isLastWeek) {
            lastWeekRevenue += totalAmount;
            lastWeekWorkHours += totalHours;
          }

          // 미지급 금액 계산 (스케줄 종료 후 미지급 상태)
          const scheduleEndDate = dayjs(schedule.endDate);
          const isScheduleEnded = scheduleEndDate.isBefore(today, "day");

          if (isScheduleEnded) {
            // 지급 상태 확인 (미지급 상세와 동일한 로직)
            const isWagePaid = (workerInfo as any).wagePaid || false;
            const isFuelPaid = (workerInfo as any).fuelPaid || false;
            const isOtherPaid = (workerInfo as any).otherPaid || false;
            const isAllPaid =
              isWagePaid &&
              (fuelAllowance === 0 || isFuelPaid) &&
              (otherAllowance === 0 || isOtherPaid);

            if (!isAllPaid) {
              totalUnpaid += totalAmount;
            }
          }

          // 수익 계산 (거래처가 있는 업무 스케줄)
          if (
            schedule.clientId &&
            schedule.scheduleType === "business" &&
            isScheduleEnded
          ) {
            const scheduleRevenue = schedule.contractAmount || 0;

            if (isThisMonth) {
              monthRevenue += scheduleRevenue;
            }
            if (isLastMonth) {
              lastMonthRevenue += scheduleRevenue;
            }
            if (isLastYearSameMonth) {
              lastYearSameMonthRevenue += scheduleRevenue;
            }
            if (isLast3Months) {
              avg3MonthRevenue += scheduleRevenue;
            }

            totalReceivable += scheduleRevenue;
          }
        });
      });

      // 3개월 평균 계산
      avg3MonthRevenue = avg3MonthRevenue / 3;
      avg3MonthExpense = avg3MonthExpense / 3;

      // 차트 데이터 생성
      const monthlyTrendData = generateMonthlyTrendData(allSchedules);
      const weeklyPerformanceData = generateWeeklyPerformanceData(allSchedules);

      setStats({
        totalSchedules: allSchedules.length,
        upcomingSchedules: upcomingCount,
        totalWorkers: allWorkers.length,
        activeWorkers: allWorkers.filter((w) => (w as any).active !== false)
          .length,
        totalWorkHours: allSchedules.reduce((sum, s) => {
          return (
            sum +
            (s.workers || []).reduce((wSum, w) => {
              const periods = w.periods || [];
              return (
                wSum +
                periods.reduce(
                  (pSum, p) =>
                    pSum + dayjs(p.end).diff(dayjs(p.start), "hour", true),
                  0
                )
              );
            }, 0)
          );
        }, 0),
        totalRevenue: allSchedules
          .filter((s) => s.scheduleType === "business" && s.contractAmount)
          .reduce((sum, s) => sum + (s.contractAmount || 0), 0),
        totalPayroll: allSchedules.reduce((sum, s) => {
          return (
            sum +
            (s.workers || []).reduce((wSum, w) => {
              const periods = w.periods || [];
              const hours = periods.reduce(
                (pSum, p) =>
                  pSum + dayjs(p.end).diff(dayjs(p.start), "hour", true),
                0
              );
              return wSum + w.worker.hourlyWage * hours;
            }, 0)
          );
        }, 0),
        totalFuelAllowance: allSchedules.reduce(
          (sum, s) =>
            sum +
            (s.workers || []).reduce(
              (wSum, w) => wSum + ((w.worker as any).fuelAllowance || 0),
              0
            ),
          0
        ),
        totalOtherAllowance: allSchedules.reduce(
          (sum, s) =>
            sum +
            (s.workers || []).reduce(
              (wSum, w) => wSum + ((w.worker as any).otherAllowance || 0),
              0
            ),
          0
        ),
        unpaidAmount: totalUnpaid,
        totalReceivable: totalReceivable,
        monthlyRevenue: monthRevenue,
        monthlyExpense: monthExpense,
        monthlyPayroll: monthRevenue - monthExpense,
        netProfit: monthRevenue - monthExpense,
        // 비교/트렌드 지표들
        lastMonthRevenue: lastMonthRevenue,
        lastMonthExpense: lastMonthExpense,
        lastMonthSchedules: lastMonthSchedules,
        lastMonthWorkHours: lastMonthWorkHours,
        lastYearSameMonthRevenue: lastYearSameMonthRevenue,
        lastWeekRevenue: lastWeekRevenue,
        lastWeekWorkHours: lastWeekWorkHours,
        avg3MonthRevenue: avg3MonthRevenue,
        avg3MonthExpense: avg3MonthExpense,
        // 차트 데이터
        monthlyTrendData: monthlyTrendData,
        weeklyPerformanceData: weeklyPerformanceData,
        recentSchedules: allSchedules.slice(0, 5).map((s) => ({
          id: s.id,
          title: s.title,
          startDate: s.startDate,
          endDate: s.endDate,
          workerCount: s.workers?.length || 0,
          status: "upcoming" as const,
        })),
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // 월별 트렌드 데이터 생성
  const generateMonthlyTrendData = (schedules: Schedule[]) => {
    const data = [];
    const today = dayjs();

    for (let i = 5; i >= 0; i--) {
      const month = today.subtract(i, "month");
      const monthStart = month.startOf("month");
      const monthEnd = month.endOf("month");

      let revenue = 0;
      let expense = 0;

      schedules.forEach((schedule) => {
        const scheduleDate = dayjs(schedule.startDate);
        const isInMonth =
          scheduleDate.isSameOrAfter(monthStart) &&
          scheduleDate.isSameOrBefore(monthEnd);

        if (isInMonth) {
          // 수익 계산 (거래처가 있는 업무 스케줄)
          if (schedule.clientId && schedule.scheduleType === "business") {
            const scheduleEndDate = dayjs(schedule.endDate);
            const isScheduleEnded = scheduleEndDate.isBefore(today, "day");
            if (isScheduleEnded) {
              revenue += schedule.contractAmount || 0;
            }
          }

          // 지출 계산
          schedule.workers?.forEach((workerInfo) => {
            const periods = workerInfo.periods || [];
            const totalHours = periods.reduce((sum, period) => {
              const start = dayjs(period.start);
              const end = dayjs(period.end);
              return sum + end.diff(start, "hour", true);
            }, 0);

            const grossPay = workerInfo.worker.hourlyWage * totalHours;
            const tax = (workerInfo.worker as any).taxWithheld
              ? grossPay * 0.033
              : 0;
            const netPay = grossPay - tax;
            const fuelAllowance = workerInfo.worker.fuelAllowance || 0;
            const otherAllowance = workerInfo.worker.otherAllowance || 0;
            const totalAmount =
              Math.round(netPay) + fuelAllowance + otherAllowance;

            expense += totalAmount;
          });
        }
      });

      data.push({
        month: month.format("MM월"),
        revenue: revenue,
        expense: expense,
        netProfit: revenue - expense,
      });
    }

    return data;
  };

  // 주간 성과 데이터 생성
  const generateWeeklyPerformanceData = (schedules: Schedule[]) => {
    const data = [];
    const today = dayjs();

    for (let i = 3; i >= 0; i--) {
      const week = today.subtract(i, "week");
      const weekStart = week.startOf("week");
      const weekEnd = week.endOf("week");

      let revenue = 0;
      let expense = 0;
      let workHours = 0;
      let scheduleCount = 0;

      schedules.forEach((schedule) => {
        const scheduleDate = dayjs(schedule.startDate);
        const isInWeek =
          scheduleDate.isSameOrAfter(weekStart) &&
          scheduleDate.isSameOrBefore(weekEnd);

        if (isInWeek) {
          scheduleCount++;

          // 수익 계산 (거래처가 있는 업무 스케줄)
          if (schedule.clientId && schedule.scheduleType === "business") {
            const scheduleEndDate = dayjs(schedule.endDate);
            const isScheduleEnded = scheduleEndDate.isBefore(today, "day");
            if (isScheduleEnded) {
              revenue += schedule.contractAmount || 0;
            }
          }

          // 지출 및 근무시간 계산
          schedule.workers?.forEach((workerInfo) => {
            const periods = workerInfo.periods || [];
            const totalHours = periods.reduce((sum, period) => {
              const start = dayjs(period.start);
              const end = dayjs(period.end);
              return sum + end.diff(start, "hour", true);
            }, 0);

            workHours += totalHours;

            const grossPay = workerInfo.worker.hourlyWage * totalHours;
            const tax = (workerInfo.worker as any).taxWithheld
              ? grossPay * 0.033
              : 0;
            const netPay = grossPay - tax;
            const fuelAllowance = workerInfo.worker.fuelAllowance || 0;
            const otherAllowance = workerInfo.worker.otherAllowance || 0;
            const totalAmount =
              Math.round(netPay) + fuelAllowance + otherAllowance;

            expense += totalAmount;
          });
        }
      });

      data.push({
        week: `${week.format("MM/DD")}주`,
        revenue: revenue,
        expense: expense,
        workHours: workHours,
        schedules: scheduleCount,
      });
    }

    return data;
  };

  // 이번 주 스케줄
  const getThisWeekSchedules = () => {
    const today = dayjs();
    const weekStart = today.startOf("week");
    const weekEnd = today.endOf("week");

    return schedules.filter((s) => {
      const scheduleStart = dayjs(s.startDate);
      return (
        scheduleStart.isSameOrAfter(weekStart) &&
        scheduleStart.isSameOrBefore(weekEnd)
      );
    });
  };

  // 미지급 근로자 목록
  const getUnpaidWorkers = () => {
    const unpaidList: Array<{
      scheduleName: string;
      workerName: string;
      amount: number;
    }> = [];

    schedules.forEach((schedule) => {
      schedule.workers?.forEach((workerInfo) => {
        if (!workerInfo.paid) {
          // periods가 존재하는지 확인하고 안전하게 처리
          const periods = workerInfo.periods || [];
          const totalHours = periods.reduce((sum, period) => {
            const start = dayjs(period.start);
            const end = dayjs(period.end);
            return sum + end.diff(start, "hour", true);
          }, 0);

          const grossPay = workerInfo.worker.hourlyWage * totalHours;
          const tax = (workerInfo.worker as any).taxWithheld
            ? grossPay * 0.033
            : 0;
          const netPay = grossPay - tax;

          unpaidList.push({
            scheduleName: schedule.title,
            workerName: workerInfo.worker.name,
            amount: Math.round(netPay),
          });
        }
      });
    });

    return unpaidList.slice(0, 5); // 최근 5건만
  };

  const thisWeekSchedules = getThisWeekSchedules();
  const unpaidWorkers = getUnpaidWorkers();

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="대시보드" />
        <LoadingSpinner message="대시보드 데이터를 불러오는 중..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <CommonHeader title="대시보드" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={isWeb ? styles.contentContainerWeb : undefined}
      >
        {/* 주요 통계 카드 */}
        <View style={[styles.statsGrid, isWeb && styles.statsGridWeb]}>
          {/* 총 일정 */}
          <Pressable
            style={[styles.statCard, isWeb && styles.statCardWeb]}
            onPress={() => router.push("/schedule/list")}
          >
            <View style={[styles.statIcon, { backgroundColor: "#dbeafe" }]}>
              <Ionicons name="calendar" size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats.totalSchedules}</Text>
            <Text style={styles.statLabel}>총 일정</Text>
          </Pressable>

          {/* 예정 일정 */}
          <Pressable
            style={[styles.statCard, isWeb && styles.statCardWeb]}
            onPress={() => router.push("/schedule?filter=upcoming")}
          >
            <View style={[styles.statIcon, { backgroundColor: "#dcfce7" }]}>
              <Ionicons name="time" size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{stats.upcomingSchedules}</Text>
            <Text style={styles.statLabel}>예정 일정</Text>
          </Pressable>

          {/* 총 근로자 */}
          <Pressable
            style={[styles.statCard, isWeb && styles.statCardWeb]}
            onPress={() => router.push("/worker/index" as any)}
          >
            <View style={[styles.statIcon, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="people" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>{stats.totalWorkers}</Text>
            <Text style={styles.statLabel}>총 근로자</Text>
          </Pressable>

          {/* 미지급 금액 */}
          <Pressable
            style={[styles.statCard, isWeb && styles.statCardWeb]}
            onPress={() => router.push("/clients/unpaid-details")}
          >
            <View style={[styles.statIcon, { backgroundColor: "#fee2e2" }]}>
              <Ionicons name="alert-circle" size={24} color="#ef4444" />
            </View>
            <Text style={[styles.statValue, { color: "#ef4444" }]}>
              {new Intl.NumberFormat("ko-KR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(stats.unpaidAmount)}
            </Text>
            <Text style={styles.statLabel}>미지급 금액</Text>
          </Pressable>

          {/* 미수금 */}
          <Pressable
            style={[styles.statCard, isWeb && styles.statCardWeb]}
            onPress={() => router.push("/reports/revenue")}
          >
            <View style={[styles.statIcon, { backgroundColor: "#e0e7ff" }]}>
              <Ionicons name="trending-up" size={24} color="#6366f1" />
            </View>
            <Text style={[styles.statValue, { color: "#6366f1" }]}>
              {new Intl.NumberFormat("ko-KR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(stats.totalReceivable)}
            </Text>
            <Text style={styles.statLabel}>미수금</Text>
          </Pressable>

          {/* 성과 분석 */}
          <Pressable
            style={[styles.statCard, isWeb && styles.statCardWeb]}
            onPress={() => router.push("/reports/performance")}
          >
            <View style={[styles.statIcon, { backgroundColor: "#f0f9ff" }]}>
              <Ionicons name="analytics" size={24} color="#0ea5e9" />
            </View>
            <Text style={[styles.statValue, { color: "#0ea5e9" }]}>
              {stats.lastMonthRevenue > 0
                ? `${Math.round(
                    ((stats.monthlyRevenue - stats.lastMonthRevenue) /
                      stats.lastMonthRevenue) *
                      100
                  )}%`
                : "0%"}
            </Text>
            <Text style={styles.statLabel}>전월 대비 수익</Text>
          </Pressable>
        </View>

        {/* 이번 달 재무 현황 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이번 달 재무 현황</Text>
          <View style={styles.financialCard}>
            <View style={styles.financialRow}>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>총 지출</Text>
                <Text style={styles.financialValue}>
                  {new Intl.NumberFormat("ko-KR").format(stats.monthlyExpense)}
                  원
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>총 수입</Text>
                <Text style={[styles.financialValue, { color: "#10b981" }]}>
                  {new Intl.NumberFormat("ko-KR").format(stats.monthlyRevenue)}
                  원
                </Text>
              </View>
            </View>
            <View style={styles.profitRow}>
              <Text style={styles.profitLabel}>순이익</Text>
              <Text
                style={[
                  styles.profitValue,
                  {
                    color:
                      stats.monthlyRevenue - stats.monthlyExpense >= 0
                        ? "#10b981"
                        : "#ef4444",
                  },
                ]}
              >
                {new Intl.NumberFormat("ko-KR").format(
                  stats.monthlyRevenue - stats.monthlyExpense
                )}
                원
              </Text>
            </View>
          </View>
        </View>

        {/* 차트 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>수익/지출 트렌드</Text>
          {stats.monthlyTrendData.length > 0 && (
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: stats.monthlyTrendData.map((d) => d.month),
                  datasets: [
                    {
                      data: stats.monthlyTrendData.map(
                        (d) => d.revenue / 1000000
                      ), // 백만원 단위로 변환
                      color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // 초록색
                      strokeWidth: 3,
                    },
                    {
                      data: stats.monthlyTrendData.map(
                        (d) => d.expense / 1000000
                      ), // 백만원 단위로 변환
                      color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // 빨간색
                      strokeWidth: 3,
                    },
                  ],
                }}
                width={width - Theme.spacing.lg * 2}
                height={220}
                chartConfig={{
                  backgroundColor: Theme.colors.surface,
                  backgroundGradientFrom: Theme.colors.surface,
                  backgroundGradientTo: Theme.colors.surface,
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#fff",
                  },
                }}
                bezier
                style={styles.chart}
              />
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendColor, { backgroundColor: "#10b981" }]}
                  />
                  <Text style={styles.legendText}>수익 (백만원)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendColor, { backgroundColor: "#ef4444" }]}
                  />
                  <Text style={styles.legendText}>지출 (백만원)</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 주간 성과 차트 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주간 성과</Text>
          {stats.weeklyPerformanceData.length > 0 && (
            <View style={styles.chartContainer}>
              <BarChart
                data={{
                  labels: stats.weeklyPerformanceData.map((d) => d.week),
                  datasets: [
                    {
                      data: stats.weeklyPerformanceData.map(
                        (d) => d.revenue / 1000000
                      ), // 백만원 단위로 변환
                    },
                  ],
                }}
                width={width - Theme.spacing.lg * 2}
                height={220}
                chartConfig={{
                  backgroundColor: Theme.colors.surface,
                  backgroundGradientFrom: Theme.colors.surface,
                  backgroundGradientTo: Theme.colors.surface,
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // 파란색
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                style={styles.chart}
              />
              <Text style={styles.chartSubtitle}>주간 수익 (백만원)</Text>
            </View>
          )}
        </View>

        {/* 이번 주 일정 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>이번 주 일정</Text>
            <Pressable onPress={() => router.push("/schedule/list")}>
              <Text style={styles.viewAllText}>전체보기</Text>
            </Pressable>
          </View>
          {thisWeekSchedules.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>이번 주 일정이 없습니다</Text>
            </View>
          ) : (
            thisWeekSchedules.slice(0, 5).map((schedule) => (
              <Pressable
                key={schedule.instanceId ?? schedule.id}
                style={styles.scheduleItem}
                onPress={() => router.push(`/schedule/${schedule.id}` as any)}
              >
                <View style={styles.scheduleItemHeader}>
                  <Text style={styles.scheduleItemTitle}>{schedule.title}</Text>
                  <Text style={styles.scheduleItemDate}>
                    {dayjs(schedule.startDate).format("M/D")}
                    {schedule.startDate !== schedule.endDate &&
                      ` - ${dayjs(schedule.endDate).format("M/D")}`}
                  </Text>
                </View>
                <View style={styles.scheduleItemInfo}>
                  <View style={styles.scheduleItemTag}>
                    <Text style={styles.scheduleItemTagText}>
                      {(() => {
                        if (!schedule.category) return "기타";
                        const category = categories.find(
                          (cat) => cat.name === schedule.category
                        );
                        return category ? category.name : schedule.category;
                      })()}
                    </Text>
                  </View>
                  <Text style={styles.scheduleItemWorkers}>
                    {schedule.workers?.length || 0}명
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>

        {/* 미지급 현황 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>미지급 현황</Text>
            <Pressable onPress={() => router.push("/schedule")}>
              <Text style={styles.viewAllText}>전체보기</Text>
            </Pressable>
          </View>
          {unpaidWorkers.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons
                name="checkmark-circle"
                size={32}
                color={Theme.colors.success}
              />
              <Text style={styles.emptyText}>모든 급여가 지급되었습니다</Text>
            </View>
          ) : (
            unpaidWorkers.map((item, index) => (
              <View key={index} style={styles.unpaidItem}>
                <View style={styles.unpaidInfo}>
                  <Text style={styles.unpaidWorkerName}>{item.workerName}</Text>
                  <Text style={styles.unpaidScheduleName}>
                    {item.scheduleName}
                  </Text>
                </View>
                <Text style={styles.unpaidAmount}>
                  {new Intl.NumberFormat("ko-KR").format(item.amount)}원
                </Text>
              </View>
            ))
          )}
        </View>

        {/* 리포트 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>리포트</Text>
            <Pressable onPress={() => router.push("/reports")}>
              <Text style={styles.viewAllText}>전체보기</Text>
            </Pressable>
          </View>
          <View style={styles.reportsGrid}>
            <Pressable
              style={styles.reportCard}
              onPress={() => router.push("/schedule/reports")}
            >
              <View style={[styles.reportIcon, { backgroundColor: "#dbeafe" }]}>
                <Ionicons name="calendar" size={24} color={colors.primary} />
              </View>
              <Text style={styles.reportTitle}>일정 현황</Text>
              <Text style={styles.reportDescription}>일정 통계 및 분석</Text>
            </Pressable>
            <Pressable
              style={styles.reportCard}
              onPress={() => router.push("/worker/reports")}
            >
              <View style={[styles.reportIcon, { backgroundColor: "#dcfce7" }]}>
                <Ionicons name="people" size={24} color="#10b981" />
              </View>
              <Text style={styles.reportTitle}>직원 근무</Text>
              <Text style={styles.reportDescription}>근무시간 및 급여</Text>
            </Pressable>
            <Pressable
              style={styles.reportCard}
              onPress={() => router.push("/reports/revenue")}
            >
              <View style={[styles.reportIcon, { backgroundColor: "#fef3c7" }]}>
                <Ionicons name="trending-up" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.reportTitle}>수익 분석</Text>
              <Text style={styles.reportDescription}>수익/지출 분석</Text>
            </Pressable>
          </View>
        </View>

        {/* 빠른 작업 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빠른 작업</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable
              style={styles.quickActionCard}
              onPress={() => router.push("/schedule/list")}
            >
              <Ionicons
                name="add-circle-outline"
                size={32}
                color={colors.primary}
              />
              <Text style={styles.quickActionText}>일정 추가</Text>
            </Pressable>
            <Pressable
              style={styles.quickActionCard}
              onPress={() => router.push("/worker/index" as any)}
            >
              <Ionicons name="person-add-outline" size={32} color="#10b981" />
              <Text style={styles.quickActionText}>근로자 추가</Text>
            </Pressable>
            <Pressable
              style={styles.quickActionCard}
              onPress={() => router.push("/clients/index")}
            >
              <Ionicons name="briefcase-outline" size={32} color="#f59e0b" />
              <Text style={styles.quickActionText}>거래처 추가</Text>
            </Pressable>
            <Pressable
              style={styles.quickActionCard}
              onPress={() => router.push("/schedule/index")}
            >
              <Ionicons name="cash-outline" size={32} color="#8b5cf6" />
              <Text style={styles.quickActionText}>급여 지급</Text>
            </Pressable>
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
    minWidth: (width - Theme.spacing.lg * 4) / 3 - Theme.spacing.md,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  statCardWeb: {
    minWidth: 180,
    flex: 0,
    flexBasis: "33.333%",
    maxWidth: "calc(33.333% - 12px)",
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
  },
  section: {
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
  },
  viewAllText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
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
    color: Theme.colors.text.primary,
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
  scheduleItem: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
  scheduleItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.xs,
  },
  scheduleItemTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    flex: 1,
  },
  scheduleItemDate: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  scheduleItemInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  scheduleItemTag: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  scheduleItemTagText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
  scheduleItemWorkers: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.tertiary,
  },
  unpaidItem: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
  unpaidInfo: {
    flex: 1,
  },
  unpaidWorkerName: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: 2,
  },
  unpaidScheduleName: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  unpaidAmount: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.bold,
    color: "#ef4444",
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
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.md,
  },
  quickActionCard: {
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
  quickActionText: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.primary,
    marginTop: Theme.spacing.sm,
  },
  // 리포트 섹션 스타일
  reportsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.md,
  },
  reportCard: {
    flex: 1,
    minWidth: (width - Theme.spacing.lg * 3) / 3 - Theme.spacing.md,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.spacing.sm,
  },
  reportTitle: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: 2,
    textAlign: "center",
  },
  reportDescription: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    textAlign: "center",
  },
  // 차트 스타일
  chartContainer: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.md,
    ...Theme.shadows.sm,
    elevation: 2,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Theme.spacing.lg,
    marginTop: Theme.spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  chartSubtitle: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    marginTop: Theme.spacing.sm,
  },
});
