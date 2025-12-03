import CommonHeader from "@/components/CommonHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import PeriodSelector, { PeriodType } from "@/components/PeriodSelector";
import { Text } from "@/components/Themed";
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
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

interface WorkerEfficiency {
  workerId: string;
  workerName: string;
  totalHours: number;
  totalSchedules: number;
  grossPay: number;
  netPay: number;
  hourlyWage: number;
  averageHoursPerSchedule: number;
  efficiencyScore: number; // 시간당 수익 = (스케줄 수익 / 총 근무시간)
  participationRate: number; // 전체 스케줄 대비 참여율
}

interface WorkerEfficiencyStats {
  totalWorkers: number;
  totalHours: number;
  totalSchedules: number;
  avgHoursPerWorker: number;
  avgSchedulesPerWorker: number;
  avgEfficiencyScore: number;
  workerDetails: WorkerEfficiency[];
}

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

// 시간 포맷팅
const formatHours = (hours: number): string => {
  const safeValue = safeNumber(hours);
  const h = Math.floor(safeValue);
  const m = Math.round((safeValue - h) * 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
};

export default function WorkerEfficiencyReportsScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<WorkerEfficiencyStats>({
    totalWorkers: 0,
    totalHours: 0,
    totalSchedules: 0,
    avgHoursPerWorker: 0,
    avgSchedulesPerWorker: 0,
    avgEfficiencyScore: 0,
    workerDetails: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("month");

  useEffect(() => {
    loadWorkerEfficiencyData();
  }, [selectedPeriod]);

  const loadWorkerEfficiencyData = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      await db.init();

      const allSchedules = await db.getAllSchedules();
      const allWorkers = await db.getAllWorkers();

      const today = dayjs();
      const startOfMonth = today.startOf("month");
      const endOfMonth = today.endOf("month");

      // 기간 필터링
      const filteredSchedules = allSchedules.filter((schedule) => {
        const scheduleDate = dayjs(schedule.startDate);
        switch (selectedPeriod) {
          case "week":
            return (
              scheduleDate.isSameOrAfter(today.startOf("week")) &&
              scheduleDate.isSameOrBefore(today.endOf("week"))
            );
          case "month":
            return (
              scheduleDate.isSameOrAfter(startOfMonth) &&
              scheduleDate.isSameOrBefore(endOfMonth)
            );
          case "year":
            return (
              scheduleDate.isSameOrAfter(today.startOf("year")) &&
              scheduleDate.isSameOrBefore(today.endOf("year"))
            );
          default:
            return true;
        }
      });

      // 근로자별 효율 데이터 수집
      const workerMap = new Map<
        string,
        {
          worker: (typeof allWorkers)[0];
          hours: number;
          schedules: number;
          grossPay: number;
          netPay: number;
          revenue: number;
        }
      >();

      // 초기화
      allWorkers.forEach((worker) => {
        workerMap.set(worker.id, {
          worker,
          hours: 0,
          schedules: 0,
          grossPay: 0,
          netPay: 0,
          revenue: 0,
        });
      });

      // 스케줄별 데이터 집계
      filteredSchedules.forEach((schedule) => {
        // 업무 스케줄의 매출 계산
        const scheduleRevenue =
          schedule.scheduleType === "business" && schedule.contractAmount
            ? schedule.contractAmount
            : 0;

        schedule.workers?.forEach((workerInfo) => {
          const workerData = workerMap.get(workerInfo.worker.id);
          if (!workerData) return;

          // 근무 시간 계산
          const periods = workerInfo.periods || [];
          const scheduleHours = safeNumber(
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

          // 급여 계산
          const grossPay = safeNumber(
            (workerInfo.worker.hourlyWage || 0) * scheduleHours
          );
          const tax = workerInfo.taxWithheld ? grossPay * 0.033 : 0;
          const netPay = grossPay - tax;

          workerData.hours += scheduleHours;
          workerData.schedules += 1;
          workerData.grossPay += grossPay;
          workerData.netPay += safeNumber(netPay);
          workerData.revenue += scheduleRevenue;
        });
      });

      // WorkerEfficiency 배열 생성
      const workerEfficiencies: WorkerEfficiency[] = Array.from(
        workerMap.values()
      )
        .filter((data) => data.schedules > 0)
        .map((data) => {
          const efficiencyScore =
            data.hours > 0 ? safeNumber(data.revenue / data.hours) : 0;
          const participationRate =
            filteredSchedules.length > 0
              ? safeNumber((data.schedules / filteredSchedules.length) * 100)
              : 0;

          return {
            workerId: data.worker.id,
            workerName: data.worker.name,
            totalHours: safeNumber(data.hours),
            totalSchedules: data.schedules,
            grossPay: safeNumber(data.grossPay),
            netPay: safeNumber(data.netPay),
            hourlyWage: data.worker.hourlyWage || 0,
            averageHoursPerSchedule:
              data.schedules > 0 ? safeNumber(data.hours / data.schedules) : 0,
            efficiencyScore,
            participationRate,
          };
        })
        .sort((a, b) => b.efficiencyScore - a.efficiencyScore);

      // 전체 통계 계산
      const totalWorkers = workerEfficiencies.length;
      const totalHours = safeNumber(
        workerEfficiencies.reduce((sum, w) => sum + w.totalHours, 0)
      );
      const totalSchedules = workerEfficiencies.reduce(
        (sum, w) => sum + w.totalSchedules,
        0
      );
      const avgHoursPerWorker =
        totalWorkers > 0 ? safeNumber(totalHours / totalWorkers) : 0;
      const avgSchedulesPerWorker =
        totalWorkers > 0 ? safeNumber(totalSchedules / totalWorkers) : 0;
      const avgEfficiencyScore =
        totalWorkers > 0
          ? safeNumber(
              workerEfficiencies.reduce(
                (sum, w) => sum + w.efficiencyScore,
                0
              ) / totalWorkers
            )
          : 0;

      setStats({
        totalWorkers,
        totalHours,
        totalSchedules,
        avgHoursPerWorker,
        avgSchedulesPerWorker,
        avgEfficiencyScore,
        workerDetails: workerEfficiencies,
      });
    } catch (error) {
      console.error("Failed to load worker efficiency data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="근로자 효율" />
        <LoadingSpinner message="근로자 효율 데이터를 불러오는 중..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader title="근로자 효율" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={isWeb ? styles.contentContainerWeb : undefined}
      >
        {/* 기간 선택 */}
        <View style={styles.periodSelectorContainer}>
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </View>

        {/* 주요 통계 카드 */}
        <View style={[styles.statsGrid, isWeb && styles.statsGridWeb]}>
          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#dbeafe" }]}>
              <Ionicons name="people" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>{stats.totalWorkers}</Text>
            <Text style={styles.statLabel}>근로자 수</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="time" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>
              {formatHours(stats.totalHours)}
            </Text>
            <Text style={styles.statLabel}>총 근무시간</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#dcfce7" }]}>
              <Ionicons name="stats-chart" size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>
              {formatCompactNumber(stats.avgEfficiencyScore)}
            </Text>
            <Text style={styles.statLabel}>평균 효율 점수</Text>
          </View>
        </View>

        {/* 상세 통계 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>전체 통계</Text>
          <View style={styles.financialCard}>
            <View style={styles.financialRow}>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>📊 평균 근무시간</Text>
                <Text style={[styles.financialValue, { color: "#1d1d1f" }]}>
                  {formatHours(stats.avgHoursPerWorker)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>📅 평균 일정 수</Text>
                <Text style={[styles.financialValue, { color: "#1d1d1f" }]}>
                  {safeNumber(stats.avgSchedulesPerWorker).toFixed(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 근로자별 효율 랭킹 */}
        {stats.workerDetails.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>근로자별 효율</Text>
            <View style={styles.detailCard}>
              {stats.workerDetails.map((worker, index) => (
                <View key={worker.workerId} style={styles.workerItem}>
                  <View style={styles.workerHeader}>
                    <View style={styles.workerRank}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.workerInfo}>
                      <Text style={styles.workerName}>{worker.workerName}</Text>
                      <Text style={styles.workerSubtext}>
                        시급 {formatNumber(worker.hourlyWage)}원
                      </Text>
                    </View>
                  </View>
                  <View style={styles.workerStats}>
                    <View style={styles.workerStatItem}>
                      <Ionicons name="time-outline" size={16} color="#86868b" />
                      <Text style={styles.workerStatText}>
                        {formatHours(worker.totalHours)}
                      </Text>
                    </View>
                    <View style={styles.workerStatItem}>
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color="#86868b"
                      />
                      <Text style={styles.workerStatText}>
                        {worker.totalSchedules}건
                      </Text>
                    </View>
                    <View style={styles.workerStatItem}>
                      <Ionicons name="cash-outline" size={16} color="#86868b" />
                      <Text style={styles.workerStatText}>
                        {formatNumber(worker.netPay)}원
                      </Text>
                    </View>
                    <View style={styles.workerStatItem}>
                      <Ionicons
                        name="trending-up-outline"
                        size={16}
                        color="#10b981"
                      />
                      <Text
                        style={[styles.workerStatText, { color: "#10b981" }]}
                      >
                        {formatCompactNumber(worker.efficiencyScore)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  content: {
    flex: 1,
  },
  contentContainerWeb: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    padding: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    gap: 10,
  },
  statsGridWeb: {
    justifyContent: "flex-start",
  },
  statCard: {
    flex: 1,
    minWidth: (width - 20 * 3) / 3 - 10,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    alignItems: "center",
  },
  statCardWeb: {
    minWidth: 180,
    flex: 0,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1d1d1f",
    marginBottom: 4,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#86868b",
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1d1d1f",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  financialCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  financialRow: {
    flexDirection: "row",
  },
  financialItem: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 12,
  },
  financialLabel: {
    fontSize: 13,
    color: "#86868b",
    marginBottom: 4,
    textAlign: "center",
  },
  financialValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  workerItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  workerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  workerRank: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1d1d1f",
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1d1d1f",
    marginBottom: 2,
  },
  workerSubtext: {
    fontSize: 12,
    color: "#86868b",
  },
  workerStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  workerStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  workerStatText: {
    fontSize: 13,
    color: "#1d1d1f",
    fontWeight: "500",
  },
  periodSelectorContainer: {
    backgroundColor: "#f5f5f7",
  },
});
