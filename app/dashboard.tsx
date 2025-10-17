import { Theme } from "@/constants/Theme";
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

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

interface DashboardStats {
  totalSchedules: number;
  upcomingSchedules: number;
  totalWorkers: number;
  totalRevenue: number;
  unpaidAmount: number;
  monthlyRevenue: number;
  monthlyExpense: number;
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSchedules: 0,
    upcomingSchedules: 0,
    totalWorkers: 0,
    totalRevenue: 0,
    unpaidAmount: 0,
    monthlyRevenue: 0,
    monthlyExpense: 0,
  });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      await db.init();

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
      let monthRevenue = 0;
      let monthExpense = 0;
      let totalUnpaid = 0;

      allSchedules.forEach((schedule) => {
        const scheduleDate = dayjs(schedule.startDate);
        if (
          scheduleDate.isSameOrAfter(monthStart) &&
          scheduleDate.isSameOrBefore(monthEnd)
        ) {
          schedule.workers.forEach((workerInfo) => {
            const totalHours = workerInfo.periods.reduce((sum, period) => {
              const start = dayjs(period.start);
              const end = dayjs(period.end);
              return sum + end.diff(start, "hour", true);
            }, 0);

            const grossPay = workerInfo.worker.hourlyWage * totalHours;
            const tax = workerInfo.worker.taxWithheld ? grossPay * 0.033 : 0;
            const netPay = grossPay - tax;

            monthExpense += Math.round(netPay);

            if (!workerInfo.paid) {
              totalUnpaid += Math.round(netPay);
            }
          });
        }
      });

      setStats({
        totalSchedules: allSchedules.length,
        upcomingSchedules: upcomingCount,
        totalWorkers: allWorkers.length,
        totalRevenue: 0, // TODO: 거래처 매출 데이터 연동 시 계산
        unpaidAmount: totalUnpaid,
        monthlyRevenue: monthRevenue,
        monthlyExpense: monthExpense,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
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
      schedule.workers.forEach((workerInfo) => {
        if (!workerInfo.paid) {
          const totalHours = workerInfo.periods.reduce((sum, period) => {
            const start = dayjs(period.start);
            const end = dayjs(period.end);
            return sum + end.diff(start, "hour", true);
          }, 0);

          const grossPay = workerInfo.worker.hourlyWage * totalHours;
          const tax = workerInfo.worker.taxWithheld ? grossPay * 0.033 : 0;
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={isWeb ? styles.contentContainerWeb : undefined}
      >
        {/* 주요 통계 카드 */}
        <View style={[styles.statsGrid, isWeb && styles.statsGridWeb]}>
          {/* 총 일정 */}
          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#dbeafe" }]}>
              <Ionicons name="calendar" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>{stats.totalSchedules}</Text>
            <Text style={styles.statLabel}>총 일정</Text>
          </View>

          {/* 예정 일정 */}
          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#dcfce7" }]}>
              <Ionicons name="time" size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{stats.upcomingSchedules}</Text>
            <Text style={styles.statLabel}>예정 일정</Text>
          </View>

          {/* 총 근로자 */}
          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="people" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>{stats.totalWorkers}</Text>
            <Text style={styles.statLabel}>총 근로자</Text>
          </View>

          {/* 미지급 금액 */}
          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
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
          </View>
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

        {/* 이번 주 일정 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>이번 주 일정</Text>
            <Pressable onPress={() => router.push("/schedule-list")}>
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
                key={schedule.id}
                style={styles.scheduleItem}
                onPress={() => router.push(`/schedule/${schedule.id}`)}
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
                      {schedule.category === "education"
                        ? "교육"
                        : schedule.category === "event"
                        ? "이벤트"
                        : schedule.category === "meeting"
                        ? "회의"
                        : "기타"}
                    </Text>
                  </View>
                  <Text style={styles.scheduleItemWorkers}>
                    {schedule.workers.length}명
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

        {/* 빠른 작업 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빠른 작업</Text>
          <View style={styles.quickActionsGrid}>
            <Pressable
              style={styles.quickActionCard}
              onPress={() => router.push("/schedule-list")}
            >
              <Ionicons name="add-circle-outline" size={32} color="#3b82f6" />
              <Text style={styles.quickActionText}>일정 추가</Text>
            </Pressable>
            <Pressable
              style={styles.quickActionCard}
              onPress={() => router.push("/workers")}
            >
              <Ionicons name="person-add-outline" size={32} color="#10b981" />
              <Text style={styles.quickActionText}>근로자 추가</Text>
            </Pressable>
            <Pressable
              style={styles.quickActionCard}
              onPress={() => router.push("/clients")}
            >
              <Ionicons name="briefcase-outline" size={32} color="#f59e0b" />
              <Text style={styles.quickActionText}>거래처 추가</Text>
            </Pressable>
            <Pressable
              style={styles.quickActionCard}
              onPress={() => router.push("/schedule")}
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
});
