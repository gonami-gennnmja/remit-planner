import { Theme } from "@/constants/Theme";
import { Schedule } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams();
  const [schedule, setSchedule] = useState<Schedule | null>(null);

  useEffect(() => {
    // 임시 데이터 - 실제로는 데이터베이스에서 가져와야 함
    const today = dayjs().format("YYYY-MM-DD");

    const tempSchedule: Schedule = {
      id: id as string,
      title: "수학 과외",
      startDate: today,
      endDate: today,
      description: "고등학교 2학년 수학 과외",
      location: "강남구 학원",
      memo: "교재 준비 필요",
      category: "education",
      workers: [
        {
          worker: {
            id: "w1",
            name: "김선생",
            phone: "010-1234-5678",
            bankAccount: "110-1234-5678",
            hourlyWage: 50000,
            taxWithheld: true,
          },
          periods: [
            {
              id: "p1",
              start: `${today}T14:00:00+09:00`,
              end: `${today}T16:00:00+09:00`,
            },
          ],
          paid: false,
        },
      ],
    };

    setSchedule(tempSchedule);
  }, [id]);

  if (!schedule) {
    return (
      <View style={styles.container}>
        <Text>로딩 중...</Text>
      </View>
    );
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case "education":
        return "교육";
      case "event":
        return "이벤트";
      case "meeting":
        return "회의";
      default:
        return "기타";
    }
  };

  const getWorkPeriods = (schedule: Schedule) => {
    const allPeriods = schedule.workers.flatMap((w) => w.periods);
    if (allPeriods.length === 0)
      return { start: "시간 미정", end: "시간 미정" };

    const startTimes = allPeriods
      .map((p) => dayjs(p.start))
      .sort((a, b) => a.diff(b));
    const endTimes = allPeriods
      .map((p) => dayjs(p.end))
      .sort((a, b) => b.diff(a));

    return {
      start: startTimes[0].format("HH:mm"),
      end: endTimes[0].format("HH:mm"),
    };
  };

  const periods = getWorkPeriods(schedule);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>스케줄 상세</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* 스케줄 정보 */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleTitle}>{schedule.title}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {getCategoryText(schedule.category)}
              </Text>
            </View>
          </View>

          <Text style={styles.scheduleDate}>
            {dayjs(schedule.startDate).format("YYYY년 M월 D일")}
            {schedule.startDate !== schedule.endDate &&
              ` ~ ${dayjs(schedule.endDate).format("M월 D일")}`}
          </Text>

          {schedule.description && (
            <Text style={styles.description}>{schedule.description}</Text>
          )}

          {schedule.location && (
            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={Theme.colors.text.secondary}
              />
              <Text style={styles.infoText}>{schedule.location}</Text>
            </View>
          )}

          <View style={styles.timeRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color={Theme.colors.text.secondary}
            />
            <Text style={styles.timeText}>
              {periods.start} - {periods.end}
            </Text>
          </View>

          {schedule.memo && (
            <View style={styles.memoRow}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color={Theme.colors.text.secondary}
              />
              <Text style={styles.memoText}>{schedule.memo}</Text>
            </View>
          )}
        </View>

        {/* 근로자 목록 */}
        <View style={styles.workersSection}>
          <Text style={styles.sectionTitle}>참여 근로자</Text>
          {schedule.workers.map((workerInfo, index) => (
            <View key={index} style={styles.workerCard}>
              <View style={styles.workerHeader}>
                <Text style={styles.workerName}>{workerInfo.worker.name}</Text>
                <View
                  style={[
                    styles.paidBadge,
                    {
                      backgroundColor: workerInfo.paid
                        ? Theme.colors.success
                        : Theme.colors.warning,
                    },
                  ]}
                >
                  <Text style={styles.paidText}>
                    {workerInfo.paid ? "지급완료" : "미지급"}
                  </Text>
                </View>
              </View>

              <View style={styles.workerDetails}>
                <Text style={styles.workerPhone}>
                  {workerInfo.worker.phone}
                </Text>
                <Text style={styles.workerWage}>
                  {new Intl.NumberFormat("ko-KR").format(
                    workerInfo.worker.hourlyWage
                  )}
                  원/시간
                </Text>
              </View>

              <View style={styles.periodsList}>
                {workerInfo.periods.map((period, periodIndex) => (
                  <View key={periodIndex} style={styles.periodItem}>
                    <Text style={styles.periodText}>
                      {dayjs(period.start).format("M월 D일 HH:mm")} -{" "}
                      {dayjs(period.end).format("HH:mm")}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
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
  header: {
    backgroundColor: "#1e40af",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Theme.spacing.xl,
  },
  scheduleCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  scheduleTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  categoryText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    fontWeight: Theme.typography.weights.medium,
  },
  scheduleDate: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  description: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.md,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  infoText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  timeText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
    fontWeight: Theme.typography.weights.medium,
  },
  memoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  memoText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginLeft: Theme.spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  workersSection: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  workerCard: {
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
    marginBottom: Theme.spacing.sm,
  },
  workerName: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
  },
  paidBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  paidText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.inverse,
    fontWeight: Theme.typography.weights.medium,
  },
  workerDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  workerPhone: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  workerWage: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  periodsList: {
    gap: Theme.spacing.xs,
  },
  periodItem: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
  },
  periodText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
});
