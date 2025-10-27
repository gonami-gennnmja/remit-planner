import CommonHeader from "@/components/CommonHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import PeriodSelector, { PeriodType } from "@/components/PeriodSelector";
import { Text } from "@/components/Themed";
import { Theme } from "@/constants/Theme";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import { Schedule, Worker } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

interface WorkerStats {
  totalWorkers: number;
  activeWorkers: number;
  totalWorkHours: number;
  totalPayroll: number;
  averageHourlyWage: number;
  totalFuelAllowance: number;
  totalOtherAllowance: number;
  workerStats: Array<{
    worker: Worker;
    totalHours: number;
    totalPay: number;
    totalFuelAllowance: number;
    totalOtherAllowance: number;
    scheduleCount: number;
    lastWorkDate: string | null;
    overtimeHours: number;
    nightShiftHours: number;
  }>;
  monthlyPayroll: Array<{
    month: string;
    amount: number;
    fuelAllowance: number;
    otherAllowance: number;
  }>;
}

export default function WorkerReportsScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<WorkerStats>({
    totalWorkers: 0,
    activeWorkers: 0,
    totalWorkHours: 0,
    totalPayroll: 0,
    averageHourlyWage: 0,
    totalFuelAllowance: 0,
    totalOtherAllowance: 0,
    workerStats: [],
    monthlyPayroll: [],
  });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  useEffect(() => {
    loadWorkerData();
  }, [selectedPeriod, customStartDate, customEndDate]);

  const loadWorkerData = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      await db.init();

      const allSchedules = await db.getAllSchedules();
      const allWorkers = await db.getAllWorkers();

      setSchedules(allSchedules);
      setWorkers(allWorkers);

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

      // 기간 내 일정 필터링
      const periodSchedules = allSchedules.filter((schedule) => {
        const scheduleDate = dayjs(schedule.startDate);
        return (
          scheduleDate.isSameOrAfter(periodStart) &&
          scheduleDate.isSameOrBefore(periodEnd)
        );
      });

      // 직원별 통계 계산
      const workerStatsMap = new Map<
        string,
        {
          worker: Worker;
          totalHours: number;
          totalPay: number;
          scheduleCount: number;
          lastWorkDate: string | null;
        }
      >();

      // 모든 직원 초기화
      allWorkers.forEach((worker) => {
        workerStatsMap.set(worker.id, {
          worker,
          totalHours: 0,
          totalPay: 0,
          scheduleCount: 0,
          lastWorkDate: null,
        });
      });

      // 일정별로 직원 통계 계산
      periodSchedules.forEach((schedule) => {
        schedule.workers?.forEach((workerInfo) => {
          const workerId = workerInfo.worker.id;
          const existingStats = workerStatsMap.get(workerId);

          if (existingStats) {
            // 근무 시간 계산
            const periods = workerInfo.periods || [];
            const totalHours = periods.reduce((sum, period) => {
              const start = dayjs(period.start);
              const end = dayjs(period.end);
              return sum + end.diff(start, "hour", true);
            }, 0);

            // 급여 계산
            const grossPay = workerInfo.worker.hourlyWage * totalHours;
            const tax = workerInfo.worker.taxWithheld ? grossPay * 0.033 : 0;
            const netPay = grossPay - tax;

            existingStats.totalHours += totalHours;
            existingStats.totalPay += Math.round(netPay);
            existingStats.scheduleCount += 1;

            // 마지막 근무일 업데이트
            const scheduleDate = dayjs(schedule.startDate);
            if (
              !existingStats.lastWorkDate ||
              scheduleDate.isAfter(existingStats.lastWorkDate)
            ) {
              existingStats.lastWorkDate = schedule.startDate;
            }
          }
        });
      });

      const workerStats = Array.from(workerStatsMap.values())
        .filter((stat) => stat.scheduleCount > 0)
        .sort((a, b) => b.totalPay - a.totalPay);

      // 전체 통계 계산
      const totalWorkHours = workerStats.reduce(
        (sum, stat) => sum + stat.totalHours,
        0
      );
      const totalPayroll = workerStats.reduce(
        (sum, stat) => sum + stat.totalPay,
        0
      );
      const averageHourlyWage =
        totalWorkHours > 0 ? totalPayroll / totalWorkHours : 0;

      // 월별 급여 트렌드 (최근 12개월)
      const monthlyPayroll = [];
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

        let monthPayroll = 0;
        monthSchedules.forEach((schedule) => {
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
            monthPayroll += Math.round(netPay);
          });
        });

        monthlyPayroll.push({
          month: month.format("YYYY-MM"),
          amount: monthPayroll,
        });
      }

      setStats({
        totalWorkers: allWorkers.length,
        activeWorkers: workerStats.length,
        totalWorkHours,
        totalPayroll,
        averageHourlyWage,
        workerStats,
        monthlyPayroll,
      });
    } catch (error) {
      console.error("Failed to load worker data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodSchedules = () => {
    const today = dayjs();
    let periodStart, periodEnd;

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
    }

    return schedules.filter((s) => {
      const scheduleDate = dayjs(s.startDate);
      return (
        scheduleDate.isSameOrAfter(periodStart) &&
        scheduleDate.isSameOrBefore(periodEnd)
      );
    });
  };

  const periodSchedules = getPeriodSchedules();

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="직원 근무 리포트" />
        <LoadingSpinner message="근로자 데이터를 불러오는 중..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader title="직원 근무 리포트" />

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
            <View style={[styles.statIcon, { backgroundColor: "#dbeafe" }]}>
              <Ionicons name="people" size={24} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats.totalWorkers}</Text>
            <Text style={styles.statLabel}>총 직원</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#dcfce7" }]}>
              <Ionicons name="person-check" size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{stats.activeWorkers}</Text>
            <Text style={styles.statLabel}>활성 직원</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="time" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>
              {stats.totalWorkHours.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>총 근무시간</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#e0e7ff" }]}>
              <Ionicons name="cash" size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.statValue}>
              {new Intl.NumberFormat("ko-KR", {
                notation: "compact",
                compactDisplay: "short",
              }).format(stats.totalPayroll)}
            </Text>
            <Text style={styles.statLabel}>총 급여</Text>
          </View>
        </View>

        {/* 급여 현황 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>급여 현황</Text>
          <View style={styles.payrollCard}>
            <View style={styles.payrollRow}>
              <View style={styles.payrollItem}>
                <Text style={styles.payrollLabel}>총 급여</Text>
                <Text style={styles.payrollValue}>
                  {new Intl.NumberFormat("ko-KR").format(stats.totalPayroll)}원
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.payrollItem}>
                <Text style={styles.payrollLabel}>평균 시급</Text>
                <Text style={styles.payrollValue}>
                  {new Intl.NumberFormat("ko-KR").format(
                    Math.round(stats.averageHourlyWage)
                  )}
                  원
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 월별 급여 트렌드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            월별 급여 트렌드 (최근 12개월)
          </Text>
          <View style={styles.trendCard}>
            {stats.monthlyPayroll.map((item, index) => (
              <View key={index} style={styles.trendItem}>
                <Text style={styles.trendMonth}>
                  {dayjs(item.month).format("M월")}
                </Text>
                <View style={styles.trendBar}>
                  <View
                    style={[
                      styles.trendBarFill,
                      {
                        height: `${Math.max(
                          (item.amount /
                            Math.max(
                              ...stats.monthlyPayroll.map((t) => t.amount)
                            )) *
                            100,
                          5
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.trendCount}>
                  {new Intl.NumberFormat("ko-KR", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(item.amount)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 직원별 상세 현황 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>직원별 상세 현황</Text>
          {stats.workerStats.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name="person-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>근무한 직원이 없습니다</Text>
            </View>
          ) : (
            stats.workerStats.map((workerStat, index) => (
              <View key={workerStat.worker.id} style={styles.workerItem}>
                <View style={styles.workerHeader}>
                  <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>
                      {workerStat.worker.name}
                    </Text>
                    <Text style={styles.workerPhone}>
                      {workerStat.worker.phone}
                    </Text>
                  </View>
                  <View style={styles.workerRank}>
                    <Text style={styles.rankNumber}>#{index + 1}</Text>
                  </View>
                </View>

                <View style={styles.workerStats}>
                  <View style={styles.workerStatItem}>
                    <Text style={styles.workerStatLabel}>근무시간</Text>
                    <Text style={styles.workerStatValue}>
                      {workerStat.totalHours.toFixed(1)}시간
                    </Text>
                  </View>
                  <View style={styles.workerStatItem}>
                    <Text style={styles.workerStatLabel}>급여</Text>
                    <Text style={styles.workerStatValue}>
                      {new Intl.NumberFormat("ko-KR").format(
                        workerStat.totalPay
                      )}
                      원
                    </Text>
                  </View>
                  <View style={styles.workerStatItem}>
                    <Text style={styles.workerStatLabel}>일정수</Text>
                    <Text style={styles.workerStatValue}>
                      {workerStat.scheduleCount}건
                    </Text>
                  </View>
                  <View style={styles.workerStatItem}>
                    <Text style={styles.workerStatLabel}>시급</Text>
                    <Text style={styles.workerStatValue}>
                      {new Intl.NumberFormat("ko-KR").format(
                        workerStat.worker.hourlyWage
                      )}
                      원
                    </Text>
                  </View>
                </View>

                {workerStat.lastWorkDate && (
                  <Text style={styles.lastWorkDate}>
                    마지막 근무:{" "}
                    {dayjs(workerStat.lastWorkDate).format("YYYY-MM-DD")}
                  </Text>
                )}
              </View>
            ))
          )}
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
  payrollCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  payrollRow: {
    flexDirection: "row",
  },
  payrollItem: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    backgroundColor: Theme.colors.border.light,
    marginHorizontal: Theme.spacing.md,
  },
  payrollLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  payrollValue: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
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
    height: 60,
  },
  trendMonth: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    width: 40,
    textAlign: "center",
  },
  trendBar: {
    flex: 1,
    height: 40,
    backgroundColor: Theme.colors.surface,
    borderRadius: 4,
    marginHorizontal: Theme.spacing.sm,
    justifyContent: "end",
  },
  trendBarFill: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 4,
    minHeight: 4,
  },
  trendCount: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    width: 50,
    textAlign: "center",
  },
  workerItem: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  workerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    marginBottom: 2,
  },
  workerPhone: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  workerRank: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumber: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.bold,
    color: "white",
  },
  workerStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.md,
  },
  workerStatItem: {
    flex: 1,
    minWidth: 80,
    alignItems: "center",
  },
  workerStatLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  workerStatValue: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
  },
  lastWorkDate: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.tertiary,
    marginTop: Theme.spacing.sm,
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
