import CommonHeader from "@/components/CommonHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import PeriodSelector, { PeriodType } from "@/components/PeriodSelector";
import { Text } from "@/components/Themed";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import { Schedule } from "@/models/types";
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

interface CashFlowStats {
  // 유입 현금
  totalRevenue: number;
  monthlyRevenue: number;
  uncollectedAmount: number; // 미수금

  // 유출 현금
  totalPayroll: number;
  monthlyPayroll: number;
  unpaidAmount: number; // 미지급 급여

  // 현금 흐름
  netCashFlow: number;
  monthlyNetCashFlow: number;
  expectedBalance: number; // 예상 잔액

  // 월별 현금흐름
  monthlyFlow: Array<{
    month: string;
    inflow: number; // 유입
    outflow: number; // 유출
    netFlow: number; // 순현금흐름
    cumulativeBalance: number; // 누적 잔액
  }>;

  // 미수금 상세
  uncollectedDetails: Array<{
    clientName: string;
    amount: number;
    daysPast: number; // 지연일수
  }>;

  // 미지급 급여 상세
  unpaidDetails: Array<{
    workerName: string;
    amount: number;
    daysPast: number;
  }>;
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

export default function CashFlowReportsScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<CashFlowStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    uncollectedAmount: 0,
    totalPayroll: 0,
    monthlyPayroll: 0,
    unpaidAmount: 0,
    netCashFlow: 0,
    monthlyNetCashFlow: 0,
    expectedBalance: 0,
    monthlyFlow: [],
    uncollectedDetails: [],
    unpaidDetails: [],
  });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("month");

  useEffect(() => {
    loadCashFlowData();
  }, [selectedPeriod]);

  const loadCashFlowData = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      await db.init();

      const allSchedules = await db.getAllSchedules();
      setSchedules(allSchedules);

      const today = dayjs();
      const startOfMonth = today.startOf("month");
      const endOfMonth = today.endOf("month");

      // 수익 계산
      const REVENUE_PER_SCHEDULE = 500000; // 일정당 50만원 수익 가정

      let totalRevenue = 0;
      let monthlyRevenue = 0;

      // 미수금 계산 (14일 지난 스케줄)
      let uncollectedAmount = 0;
      const uncollectedDetails: Array<{
        clientName: string;
        amount: number;
        daysPast: number;
      }> = [];

      // 지출(급여) 계산
      let totalPayroll = 0;
      let monthlyPayroll = 0;

      // 미지급 급여 계산
      let unpaidAmount = 0;
      const unpaidDetails: Array<{
        workerName: string;
        amount: number;
        daysPast: number;
      }> = [];

      allSchedules.forEach((schedule) => {
        const scheduleDate = dayjs(schedule.startDate);
        const scheduleEnd = dayjs(schedule.endDate);
        const daysSinceEnd = today.diff(scheduleEnd, "day");

        // 수익 계산
        const scheduleRevenue = REVENUE_PER_SCHEDULE;
        totalRevenue += scheduleRevenue;
        if (
          scheduleDate.isSameOrAfter(startOfMonth) &&
          scheduleDate.isSameOrBefore(endOfMonth)
        ) {
          monthlyRevenue += scheduleRevenue;
        }

        // 미수금 확인 (14일 이상 지난 경우)
        if (daysSinceEnd >= 14 && schedule.clientId && !schedule.collected) {
          uncollectedAmount += scheduleRevenue;

          // 거래처 정보
          const clientName = schedule.title.split(" ")[0] || "미지정";
          uncollectedDetails.push({
            clientName,
            amount: scheduleRevenue,
            daysPast: daysSinceEnd,
          });
        }

        // 급여 계산
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
          const roundedNetPay = safeNumber(netPay);

          totalPayroll += roundedNetPay;

          // 이번 달 급여
          if (
            scheduleDate.isSameOrAfter(startOfMonth) &&
            scheduleDate.isSameOrBefore(endOfMonth)
          ) {
            monthlyPayroll += roundedNetPay;
          }

          // 미지급 확인 (급여를 받지 않았고, 근무가 끝난 경우)
          if (!workerInfo.paid && scheduleEnd.isBefore(today)) {
            unpaidAmount += roundedNetPay;

            unpaidDetails.push({
              workerName: workerInfo.worker.name,
              amount: roundedNetPay,
              daysPast: today.diff(scheduleEnd, "day"),
            });
          }
        });
      });

      // 월별 현금흐름 (최근 12개월)
      const monthlyFlow: Array<{
        month: string;
        inflow: number;
        outflow: number;
        netFlow: number;
        cumulativeBalance: number;
      }> = [];

      let cumulativeBalance = 0;
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

        let inflow = 0;
        let outflow = 0;

        monthSchedules.forEach((schedule) => {
          inflow += REVENUE_PER_SCHEDULE;

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
            outflow += safeNumber(netPay);
          });
        });

        const netFlow = safeNumber(inflow - outflow);
        cumulativeBalance += netFlow;

        monthlyFlow.push({
          month: month.format("YYYY-MM"),
          inflow: safeNumber(inflow),
          outflow: safeNumber(outflow),
          netFlow,
          cumulativeBalance: safeNumber(cumulativeBalance),
        });
      }

      setStats({
        totalRevenue: safeNumber(totalRevenue),
        monthlyRevenue: safeNumber(monthlyRevenue),
        uncollectedAmount: safeNumber(uncollectedAmount),
        totalPayroll: safeNumber(totalPayroll),
        monthlyPayroll: safeNumber(monthlyPayroll),
        unpaidAmount: safeNumber(unpaidAmount),
        netCashFlow: safeNumber(totalRevenue - totalPayroll),
        monthlyNetCashFlow: safeNumber(monthlyRevenue - monthlyPayroll),
        expectedBalance: safeNumber(
          monthlyRevenue - monthlyPayroll - uncollectedAmount - unpaidAmount
        ),
        monthlyFlow,
        uncollectedDetails: uncollectedDetails.sort(
          (a, b) => b.daysPast - a.daysPast
        ),
        unpaidDetails: unpaidDetails.sort((a, b) => b.daysPast - a.daysPast),
      });
    } catch (error) {
      console.error("Failed to load cash flow data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodStats = () => {
    switch (selectedPeriod) {
      case "week":
        return {
          revenue: 0,
          expense: 0,
          netFlow: 0,
        };
      case "month":
        return {
          revenue: stats.monthlyRevenue,
          expense: stats.monthlyPayroll,
          netFlow: stats.monthlyNetCashFlow,
        };
      case "year":
        return {
          revenue: stats.totalRevenue,
          expense: stats.totalPayroll,
          netFlow: stats.netCashFlow,
        };
      default:
        return {
          revenue: stats.monthlyRevenue,
          expense: stats.monthlyPayroll,
          netFlow: stats.monthlyNetCashFlow,
        };
    }
  };

  const periodStats = getPeriodStats();

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="현금흐름 분석" />
        <LoadingSpinner message="현금흐름 데이터를 불러오는 중..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader title="현금흐름 분석" />

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
            <View style={[styles.statIcon, { backgroundColor: "#dcfce7" }]}>
              <Ionicons name="trending-up" size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>
              {formatCompactNumber(periodStats.revenue)}
            </Text>
            <Text style={styles.statLabel}>현금 유입</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#fee2e2" }]}>
              <Ionicons name="trending-down" size={24} color="#ef4444" />
            </View>
            <Text style={styles.statValue}>
              {formatCompactNumber(periodStats.expense)}
            </Text>
            <Text style={styles.statLabel}>현금 유출</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View
              style={[
                styles.statIcon,
                {
                  backgroundColor:
                    periodStats.netFlow >= 0 ? "#dcfce7" : "#fee2e2",
                },
              ]}
            >
              <Ionicons
                name={periodStats.netFlow >= 0 ? "wallet" : "alert-circle"}
                size={24}
                color={periodStats.netFlow >= 0 ? "#10b981" : "#ef4444"}
              />
            </View>
            <Text
              style={[
                styles.statValue,
                { color: periodStats.netFlow >= 0 ? "#10b981" : "#ef4444" },
              ]}
            >
              {formatCompactNumber(periodStats.netFlow)}
            </Text>
            <Text style={styles.statLabel}>순현금흐름</Text>
          </View>
        </View>

        {/* 미수금/미지급 현황 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>중요 지표</Text>
          <View style={styles.financialCard}>
            <View style={styles.financialRow}>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>💰 미수금</Text>
                <Text style={[styles.financialValue, { color: "#ef4444" }]}>
                  {formatNumber(stats.uncollectedAmount)}원
                </Text>
                <Text style={[styles.financialSubtext, { color: "#86868b" }]}>
                  {stats.uncollectedDetails.length}건
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>💵 미지급 급여</Text>
                <Text style={[styles.financialValue, { color: "#ef4444" }]}>
                  {formatNumber(stats.unpaidAmount)}원
                </Text>
                <Text style={[styles.financialSubtext, { color: "#86868b" }]}>
                  {stats.unpaidDetails.length}건
                </Text>
              </View>
            </View>
            <View style={styles.profitRow}>
              <Text style={styles.profitLabel}>예상 현금 잔액</Text>
              <Text
                style={[
                  styles.profitValue,
                  {
                    color: stats.expectedBalance >= 0 ? "#10b981" : "#ef4444",
                  },
                ]}
              >
                {formatNumber(stats.expectedBalance)}원
              </Text>
            </View>
          </View>
        </View>

        {/* 미수금 상세 */}
        {stats.uncollectedDetails.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>미수금 상세</Text>
            <View style={styles.detailCard}>
              {stats.uncollectedDetails.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.detailItem}>
                  <View style={styles.detailLeft}>
                    <Text style={styles.detailName}>{item.clientName}</Text>
                    <Text style={styles.detailSubtext}>
                      {item.daysPast}일 경과
                    </Text>
                  </View>
                  <Text style={[styles.detailAmount, { color: "#ef4444" }]}>
                    {formatNumber(item.amount)}원
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 미지급 급여 상세 */}
        {stats.unpaidDetails.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>미지급 급여 상세</Text>
            <View style={styles.detailCard}>
              {stats.unpaidDetails.slice(0, 5).map((item, index) => (
                <View key={index} style={styles.detailItem}>
                  <View style={styles.detailLeft}>
                    <Text style={styles.detailName}>{item.workerName}</Text>
                    <Text style={styles.detailSubtext}>
                      {item.daysPast}일 경과
                    </Text>
                  </View>
                  <Text style={[styles.detailAmount, { color: "#ef4444" }]}>
                    {formatNumber(item.amount)}원
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 월별 현금흐름 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>월별 현금흐름 (최근 12개월)</Text>
          <View style={styles.trendCard}>
            {stats.monthlyFlow.map((item, index) => (
              <View key={index} style={styles.trendItem}>
                <View style={styles.trendRow}>
                  <Text style={styles.trendMonth}>{item.month}</Text>
                  <View style={styles.trendStats}>
                    <Text style={[styles.trendValue, { color: "#10b981" }]}>
                      {formatCompactNumber(item.inflow)}
                    </Text>
                    <Text style={styles.trendLabel}>유입</Text>
                  </View>
                  <View style={styles.trendStats}>
                    <Text style={[styles.trendValue, { color: "#ef4444" }]}>
                      {formatCompactNumber(item.outflow)}
                    </Text>
                    <Text style={styles.trendLabel}>유출</Text>
                  </View>
                  <View style={styles.trendStats}>
                    <Text
                      style={[
                        styles.trendValue,
                        { color: item.netFlow >= 0 ? "#10b981" : "#ef4444" },
                      ]}
                    >
                      {formatCompactNumber(item.netFlow)}
                    </Text>
                    <Text style={styles.trendLabel}>순흐름</Text>
                  </View>
                </View>
              </View>
            ))}
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
    backgroundColor: "#ffffff", // Apple Compact white surface
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
    marginBottom: 12,
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
    marginBottom: 2,
  },
  financialSubtext: {
    fontSize: 12,
  },
  profitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  profitLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1d1d1f",
  },
  profitValue: {
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
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  detailLeft: {
    flex: 1,
  },
  detailName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1d1d1f",
    marginBottom: 2,
  },
  detailSubtext: {
    fontSize: 12,
    color: "#86868b",
  },
  detailAmount: {
    fontSize: 15,
    fontWeight: "700",
  },
  trendCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  trendItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 12,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trendMonth: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1d1d1f",
    minWidth: 80,
  },
  trendStats: {
    alignItems: "center",
    flex: 1,
  },
  trendValue: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  trendLabel: {
    fontSize: 10,
    color: "#86868b",
  },
  periodSelectorContainer: {
    backgroundColor: "#f5f5f7",
  },
});
