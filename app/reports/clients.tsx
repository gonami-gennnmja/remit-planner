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

interface ClientReport {
  clientId: string;
  clientName: string;
  totalSchedules: number;
  totalRevenue: number;
  averageRevenuePerSchedule: number;
  totalWorkers: number;
  repeatRate: number; // 재계약률
  uncollectedAmount: number; // 미수금
  paidAmount: number; // 수납 완료 금액
  collectionRate: number; // 회수율
  lastScheduleDate: string; // 마지막 일정 날짜
}

interface ClientReportsStats {
  totalClients: number;
  totalRevenue: number;
  avgRevenuePerClient: number;
  avgSchedulesPerClient: number;
  totalRepeatRate: number; // 평균 재계약률
  totalUncollectedAmount: number;
  totalCollectionRate: number;
  clientDetails: ClientReport[];
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

export default function ClientReportsScreen() {
  const { colors } = useTheme();
  const [stats, setStats] = useState<ClientReportsStats>({
    totalClients: 0,
    totalRevenue: 0,
    avgRevenuePerClient: 0,
    avgSchedulesPerClient: 0,
    totalRepeatRate: 0,
    totalUncollectedAmount: 0,
    totalCollectionRate: 0,
    clientDetails: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("month");

  useEffect(() => {
    loadClientReportsData();
  }, [selectedPeriod]);

  const loadClientReportsData = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      await db.init();

      const allSchedules = await db.getAllSchedules();
      const today = dayjs();

      // 기간 필터링
      let filteredSchedules = allSchedules;
      switch (selectedPeriod) {
        case "week":
          filteredSchedules = allSchedules.filter((s) => {
            const scheduleDate = dayjs(s.startDate);
            return (
              scheduleDate.isSameOrAfter(today.startOf("week")) &&
              scheduleDate.isSameOrBefore(today.endOf("week"))
            );
          });
          break;
        case "month":
          const startOfMonth = today.startOf("month");
          const endOfMonth = today.endOf("month");
          filteredSchedules = allSchedules.filter((s) => {
            const scheduleDate = dayjs(s.startDate);
            return (
              scheduleDate.isSameOrAfter(startOfMonth) &&
              scheduleDate.isSameOrBefore(endOfMonth)
            );
          });
          break;
        case "year":
          filteredSchedules = allSchedules.filter((s) => {
            const scheduleDate = dayjs(s.startDate);
            return (
              scheduleDate.isSameOrAfter(today.startOf("year")) &&
              scheduleDate.isSameOrBefore(today.endOf("year"))
            );
          });
          break;
      }

      // 거래처별 데이터 집계
      const clientMap = new Map<
        string,
        {
          clientId: string;
          clientName: string;
          schedules: Schedule[];
          totalRevenue: number;
          uncollectedAmount: number;
          paidAmount: number;
          uniqueWorkers: Set<string>;
        }
      >();

      const REVENUE_PER_SCHEDULE = 500000;

      filteredSchedules.forEach((schedule) => {
        if (!schedule.clientId) return;

        let clientData = clientMap.get(schedule.clientId);
        if (!clientData) {
          clientData = {
            clientId: schedule.clientId,
            clientName: schedule.title.split(" ")[0] || "미지정 거래처",
            schedules: [],
            totalRevenue: 0,
            uncollectedAmount: 0,
            paidAmount: 0,
            uniqueWorkers: new Set(),
          };
          clientMap.set(schedule.clientId, clientData);
        }

        clientData.schedules.push(schedule);
        clientData.totalRevenue += REVENUE_PER_SCHEDULE;

        // 거래처 정보 추출
        const titleParts = schedule.title.split(" ");
        if (titleParts.length > 0 && titleParts[0]) {
          clientData.clientName = titleParts[0];
        }

        // 미수금 및 수납 체크
        const scheduleEnd = dayjs(schedule.endDate);
        const daysSinceEnd = today.diff(scheduleEnd, "day");

        if (daysSinceEnd >= 14 && !schedule.collected) {
          clientData.uncollectedAmount += REVENUE_PER_SCHEDULE;
        } else if (schedule.collected) {
          clientData.paidAmount += REVENUE_PER_SCHEDULE;
        }

        // 근로자 수집
        schedule.workers?.forEach((workerInfo) => {
          clientData.uniqueWorkers.add(workerInfo.worker.id);
        });
      });

      // ClientReport 배열 생성
      const clientReports: ClientReport[] = Array.from(clientMap.values())
        .map((clientData) => {
          const scheduleDates = clientData.schedules
            .map((s) => dayjs(s.startDate))
            .sort((a, b) => b.diff(a));

          const averageRevenuePerSchedule =
            clientData.schedules.length > 0
              ? safeNumber(
                  clientData.totalRevenue / clientData.schedules.length
                )
              : 0;

          const repeatRate = clientData.schedules.length > 1 ? 100 : 0;

          const collectionRate =
            clientData.totalRevenue > 0
              ? safeNumber(
                  (clientData.paidAmount / clientData.totalRevenue) * 100
                )
              : 0;

          const lastScheduleDate =
            scheduleDates.length > 0
              ? scheduleDates[0].format("YYYY-MM-DD")
              : "";

          return {
            clientId: clientData.clientId,
            clientName: clientData.clientName,
            totalSchedules: clientData.schedules.length,
            totalRevenue: safeNumber(clientData.totalRevenue),
            averageRevenuePerSchedule: averageRevenuePerSchedule,
            totalWorkers: clientData.uniqueWorkers.size,
            repeatRate,
            uncollectedAmount: safeNumber(clientData.uncollectedAmount),
            paidAmount: safeNumber(clientData.paidAmount),
            collectionRate,
            lastScheduleDate,
          };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      // 전체 통계 계산
      const totalClients = clientReports.length;
      const totalRevenue = safeNumber(
        clientReports.reduce((sum, c) => sum + c.totalRevenue, 0)
      );
      const totalUncollectedAmount = safeNumber(
        clientReports.reduce((sum, c) => sum + c.uncollectedAmount, 0)
      );
      const totalCollectionRate =
        totalRevenue > 0
          ? safeNumber(
              (clientReports.reduce((sum, c) => sum + c.paidAmount, 0) /
                totalRevenue) *
                100
            )
          : 0;

      const avgRevenuePerClient =
        totalClients > 0 ? safeNumber(totalRevenue / totalClients) : 0;
      const avgSchedulesPerClient =
        totalClients > 0
          ? safeNumber(
              clientReports.reduce((sum, c) => sum + c.totalSchedules, 0) /
                totalClients
            )
          : 0;
      const totalRepeatRate =
        totalClients > 0
          ? safeNumber(
              clientReports.reduce((sum, c) => sum + c.repeatRate, 0) /
                totalClients
            )
          : 0;

      setStats({
        totalClients,
        totalRevenue,
        avgRevenuePerClient,
        avgSchedulesPerClient,
        totalRepeatRate,
        totalUncollectedAmount,
        totalCollectionRate,
        clientDetails: clientReports,
      });
    } catch (error) {
      console.error("Failed to load client reports data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="거래처 분석" />
        <LoadingSpinner message="거래처 데이터를 불러오는 중..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader title="거래처 분석" />

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
            <View style={[styles.statIcon, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="business" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>{stats.totalClients}</Text>
            <Text style={styles.statLabel}>거래처 수</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#dcfce7" }]}>
              <Ionicons name="cash" size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>
              {formatCompactNumber(stats.totalRevenue)}
            </Text>
            <Text style={styles.statLabel}>총 매출</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#e0e7ff" }]}>
              <Ionicons name="repeat" size={24} color="#6366f1" />
            </View>
            <Text style={styles.statValue}>
              {safeNumber(stats.totalRepeatRate).toFixed(0)}%
            </Text>
            <Text style={styles.statLabel}>재계약률</Text>
          </View>
        </View>

        {/* 추가 통계 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>전체 통계</Text>
          <View style={styles.financialCard}>
            <View style={styles.financialRow}>
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>💰 평균 매출</Text>
                <Text style={[styles.financialValue, { color: "#10b981" }]}>
                  {formatNumber(stats.avgRevenuePerClient)}원
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>📅 평균 일정 수</Text>
                <Text style={[styles.financialValue, { color: "#1d1d1f" }]}>
                  {safeNumber(stats.avgSchedulesPerClient).toFixed(1)}
                </Text>
              </View>
            </View>
            <View style={styles.profitRow}>
              <Text style={styles.profitLabel}>💸 미수금</Text>
              <Text style={[styles.profitValue, { color: "#ef4444" }]}>
                {formatNumber(stats.totalUncollectedAmount)}원
              </Text>
            </View>
            <View style={styles.profitRow}>
              <Text style={styles.profitLabel}>📊 회수율</Text>
              <Text style={[styles.profitValue, { color: "#10b981" }]}>
                {safeNumber(stats.totalCollectionRate).toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* 거래처별 상세 */}
        {stats.clientDetails.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>거래처별 매출</Text>
            <View style={styles.detailCard}>
              {stats.clientDetails.map((client, index) => (
                <View key={client.clientId} style={styles.clientItem}>
                  <View style={styles.clientHeader}>
                    <View style={styles.clientRank}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>{client.clientName}</Text>
                      <Text style={styles.clientSubtext}>
                        {client.totalSchedules}건 · 평균{" "}
                        {formatCompactNumber(client.averageRevenuePerSchedule)}
                        원
                      </Text>
                    </View>
                  </View>
                  <View style={styles.clientStats}>
                    <View style={styles.clientStatItem}>
                      <Ionicons name="cash-outline" size={16} color="#10b981" />
                      <Text style={styles.clientStatText}>
                        {formatCompactNumber(client.totalRevenue)}원
                      </Text>
                    </View>
                    <View style={styles.clientStatItem}>
                      <Ionicons
                        name="people-outline"
                        size={16}
                        color="#86868b"
                      />
                      <Text style={styles.clientStatText}>
                        근로자 {client.totalWorkers}명
                      </Text>
                    </View>
                    <View style={styles.clientStatItem}>
                      <Ionicons
                        name="repeat-outline"
                        size={16}
                        color="#6366f1"
                      />
                      <Text
                        style={[
                          styles.clientStatText,
                          {
                            color:
                              client.repeatRate > 0 ? "#6366f1" : "#86868b",
                          },
                        ]}
                      >
                        재계약 {safeNumber(client.repeatRate).toFixed(0)}%
                      </Text>
                    </View>
                    {client.uncollectedAmount > 0 && (
                      <View style={styles.clientStatItem}>
                        <Ionicons
                          name="alert-circle-outline"
                          size={16}
                          color="#ef4444"
                        />
                        <Text
                          style={[styles.clientStatText, { color: "#ef4444" }]}
                        >
                          미수금 {formatCompactNumber(client.uncollectedAmount)}
                          원
                        </Text>
                      </View>
                    )}
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
  },
  profitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  profitLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1d1d1f",
  },
  profitValue: {
    fontSize: 15,
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
  clientItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  clientRank: {
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
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1d1d1f",
    marginBottom: 2,
  },
  clientSubtext: {
    fontSize: 12,
    color: "#86868b",
  },
  clientStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  clientStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clientStatText: {
    fontSize: 13,
    color: "#1d1d1f",
    fontWeight: "500",
  },
  periodSelectorContainer: {
    backgroundColor: "#f5f5f7",
  },
});
