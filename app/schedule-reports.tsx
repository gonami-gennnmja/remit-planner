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

interface ScheduleStats {
  totalSchedules: number;
  thisMonthSchedules: number;
  thisWeekSchedules: number;
  completedSchedules: number;
  upcomingSchedules: number;
  totalWorkers: number;
  totalWorkHours: number;
  categoryStats: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    count: number;
    workHours: number;
  }>;
  scheduleTimes: Array<{
    workDate: string;
    startTime: string;
    endTime: string;
    workerCount: number;
  }>;
}

export default function ScheduleReportsScreen() {
  const [stats, setStats] = useState<ScheduleStats>({
    totalSchedules: 0,
    thisMonthSchedules: 0,
    thisWeekSchedules: 0,
    completedSchedules: 0,
    upcomingSchedules: 0,
    totalWorkers: 0,
    totalWorkHours: 0,
    categoryStats: [],
    monthlyTrend: [],
    scheduleTimes: [],
  });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("month");

  useEffect(() => {
    loadScheduleData();
  }, [selectedPeriod]);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      await db.init();

      const allSchedules = await db.getAllSchedules();
      setSchedules(allSchedules);

      const today = dayjs();
      const thisMonthStart = today.startOf("month");
      const thisMonthEnd = today.endOf("month");
      const thisWeekStart = today.startOf("week");
      const thisWeekEnd = today.endOf("week");

      // 기본 통계
      const thisMonthSchedules = allSchedules.filter((s) => {
        const scheduleDate = dayjs(s.startDate);
        return (
          scheduleDate.isSameOrAfter(thisMonthStart) &&
          scheduleDate.isSameOrBefore(thisMonthEnd)
        );
      });

      const thisWeekSchedules = allSchedules.filter((s) => {
        const scheduleDate = dayjs(s.startDate);
        return (
          scheduleDate.isSameOrAfter(thisWeekStart) &&
          scheduleDate.isSameOrBefore(thisWeekEnd)
        );
      });

      const completedSchedules = allSchedules.filter((s) => {
        const scheduleEnd = dayjs(s.endDate);
        return scheduleEnd.isBefore(today, "day");
      });

      const upcomingSchedules = allSchedules.filter((s) => {
        const scheduleStart = dayjs(s.startDate);
        return scheduleStart.isSameOrAfter(today, "day");
      });

      // 카테고리별 통계
      const categoryMap = new Map<string, number>();
      allSchedules.forEach((schedule) => {
        const category = schedule.category;
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });

      const categoryStats = Array.from(categoryMap.entries())
        .map(([category, count]) => ({
          category: getCategoryDisplayName(category),
          count,
          percentage: (count / allSchedules.length) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      // 월별 트렌드 (최근 12개월)
      const monthlyTrend = [];
      for (let i = 11; i >= 0; i--) {
        const month = today.subtract(i, "month");
        const monthStart = month.startOf("month");
        const monthEnd = month.endOf("month");

        const monthCount = allSchedules.filter((s) => {
          const scheduleDate = dayjs(s.startDate);
          return (
            scheduleDate.isSameOrAfter(monthStart) &&
            scheduleDate.isSameOrBefore(monthEnd)
          );
        }).length;

        monthlyTrend.push({
          month: month.format("YYYY-MM"),
          count: monthCount,
        });
      }

      // 근로자 및 작업 시간 통계 계산
      let totalWorkers = 0;
      let totalWorkHours = 0;
      const scheduleTimes: Array<{
        workDate: string;
        startTime: string;
        endTime: string;
        workerCount: number;
      }> = [];

      for (const schedule of allSchedules) {
        try {
          // 스케줄별 근로자 수 계산
          const scheduleWorkers = await db.getScheduleWorkers(schedule.id);
          totalWorkers += scheduleWorkers.length;

          // 스케줄 시간 정보 처리
          if (schedule.scheduleTimes && schedule.scheduleTimes.length > 0) {
            for (const scheduleTime of schedule.scheduleTimes) {
              const workHours =
                dayjs(scheduleTime.endTime, "HH:mm").diff(
                  dayjs(scheduleTime.startTime, "HH:mm"),
                  "hour",
                  true
                ) -
                scheduleTime.breakDuration / 60;

              totalWorkHours += workHours * scheduleWorkers.length;

              scheduleTimes.push({
                workDate: scheduleTime.workDate,
                startTime: scheduleTime.startTime,
                endTime: scheduleTime.endTime,
                workerCount: scheduleWorkers.length,
              });
            }
          } else {
            // 기본 시간 정보 사용
            const workHours = dayjs(schedule.endTime, "HH:mm").diff(
              dayjs(schedule.startTime, "HH:mm"),
              "hour",
              true
            );

            totalWorkHours += workHours * scheduleWorkers.length;
          }
        } catch (error) {
          console.error(`Error processing schedule ${schedule.id}:`, error);
        }
      }

      setStats({
        totalSchedules: allSchedules.length,
        thisMonthSchedules: thisMonthSchedules.length,
        thisWeekSchedules: thisWeekSchedules.length,
        completedSchedules: completedSchedules.length,
        upcomingSchedules: upcomingSchedules.length,
        totalWorkers,
        totalWorkHours: Math.round(totalWorkHours * 10) / 10,
        categoryStats,
        monthlyTrend,
        scheduleTimes,
      });
    } catch (error) {
      console.error("Failed to load schedule data:", error);
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

  const getPeriodSchedules = () => {
    const today = dayjs();
    switch (selectedPeriod) {
      case "week":
        const weekStart = today.startOf("week");
        const weekEnd = today.endOf("week");
        return schedules.filter((s) => {
          const scheduleDate = dayjs(s.startDate);
          return (
            scheduleDate.isSameOrAfter(weekStart) &&
            scheduleDate.isSameOrBefore(weekEnd)
          );
        });
      case "month":
        const monthStart = today.startOf("month");
        const monthEnd = today.endOf("month");
        return schedules.filter((s) => {
          const scheduleDate = dayjs(s.startDate);
          return (
            scheduleDate.isSameOrAfter(monthStart) &&
            scheduleDate.isSameOrBefore(monthEnd)
          );
        });
      case "year":
        const yearStart = today.startOf("year");
        const yearEnd = today.endOf("year");
        return schedules.filter((s) => {
          const scheduleDate = dayjs(s.startDate);
          return (
            scheduleDate.isSameOrAfter(yearStart) &&
            scheduleDate.isSameOrBefore(yearEnd)
          );
        });
      default:
        return schedules;
    }
  };

  const periodSchedules = getPeriodSchedules();

  return (
    <View style={styles.container}>
      <CommonHeader title="일정 현황 리포트" />

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
              selectedPeriod === "year" && styles.periodButtonActive,
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
            <View style={[styles.statIcon, { backgroundColor: "#dbeafe" }]}>
              <Ionicons name="calendar" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>{stats.totalSchedules}</Text>
            <Text style={styles.statLabel}>총 일정</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#dcfce7" }]}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{stats.completedSchedules}</Text>
            <Text style={styles.statLabel}>완료된 일정</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="time" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>{stats.upcomingSchedules}</Text>
            <Text style={styles.statLabel}>예정된 일정</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#e0e7ff" }]}>
              <Ionicons name="trending-up" size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.statValue}>{periodSchedules.length}</Text>
            <Text style={styles.statLabel}>
              {selectedPeriod === "week"
                ? "이번 주"
                : selectedPeriod === "month"
                ? "이번 달"
                : "올해"}{" "}
              일정
            </Text>
          </View>
        </View>

        {/* 추가 통계 카드 */}
        <View style={[styles.statsGrid, isWeb && styles.statsGridWeb]}>
          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#f3e8ff" }]}>
              <Ionicons name="people" size={24} color="#a855f7" />
            </View>
            <Text style={styles.statValue}>{stats.totalWorkers}</Text>
            <Text style={styles.statLabel}>총 근로자 수</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#fef2f2" }]}>
              <Ionicons name="time-outline" size={24} color="#ef4444" />
            </View>
            <Text style={styles.statValue}>{stats.totalWorkHours}</Text>
            <Text style={styles.statLabel}>총 작업 시간</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#ecfdf5" }]}>
              <Ionicons name="calendar-outline" size={24} color="#059669" />
            </View>
            <Text style={styles.statValue}>{stats.thisMonthSchedules}</Text>
            <Text style={styles.statLabel}>이번 달 일정</Text>
          </View>

          <View style={[styles.statCard, isWeb && styles.statCardWeb]}>
            <View style={[styles.statIcon, { backgroundColor: "#f0f9ff" }]}>
              <Ionicons name="calendar-clear" size={24} color="#0284c7" />
            </View>
            <Text style={styles.statValue}>{stats.thisWeekSchedules}</Text>
            <Text style={styles.statLabel}>이번 주 일정</Text>
          </View>
        </View>

        {/* 카테고리별 분포 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>카테고리별 분포</Text>
          <View style={styles.categoryCard}>
            {stats.categoryStats.map((item, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{item.category}</Text>
                  <Text style={styles.categoryCount}>{item.count}건</Text>
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

        {/* 월별 트렌드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>월별 트렌드 (최근 12개월)</Text>
          <View style={styles.trendCard}>
            {stats.monthlyTrend.map((item, index) => (
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
                          (item.count /
                            Math.max(
                              ...stats.monthlyTrend.map((t) => t.count)
                            )) *
                            100,
                          5
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.trendCount}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 최근 일정 목록 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>최근 일정</Text>
          {periodSchedules.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>일정이 없습니다</Text>
            </View>
          ) : (
            periodSchedules.slice(0, 10).map((schedule) => (
              <View key={schedule.id} style={styles.scheduleItem}>
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
                      {getCategoryDisplayName(schedule.category)}
                    </Text>
                  </View>
                  <Text style={styles.scheduleItemWorkers}>
                    {schedule.workers?.length || 0}명
                  </Text>
                </View>
              </View>
            ))
          )}
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
  categoryCount: {
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
    width: 30,
    textAlign: "center",
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
