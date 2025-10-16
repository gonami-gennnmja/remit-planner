import { Theme } from "@/constants/Theme";
import { Schedule } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface TodayScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  schedules: Schedule[];
  selectedDate: string;
}

export default function TodayScheduleModal({
  visible,
  onClose,
  schedules,
  selectedDate,
}: TodayScheduleModalProps) {
  // 오늘 날짜의 스케줄들을 시작시간 순서대로 정렬
  const todaySchedules = schedules
    .filter((schedule) => {
      const scheduleStart = dayjs(schedule.startDate);
      const scheduleEnd = dayjs(schedule.endDate);
      const selected = dayjs(selectedDate);

      return (
        selected.isSameOrAfter(scheduleStart) &&
        selected.isSameOrBefore(scheduleEnd)
      );
    })
    .sort((a, b) => {
      // 첫 번째 근로자의 첫 번째 기간의 시작시간으로 정렬
      const aStart = a.workers[0]?.periods[0]?.start;
      const bStart = b.workers[0]?.periods[0]?.start;

      if (!aStart || !bStart) return 0;

      return dayjs(aStart).isBefore(dayjs(bStart)) ? -1 : 1;
    });

  const formatTime = (isoString: string) => {
    return dayjs(isoString).format("HH:mm");
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {dayjs(selectedDate).format("M월 D일")} 일정
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons
              name="close"
              size={24}
              color={Theme.colors.text.primary}
            />
          </Pressable>
        </View>

        {/* 스케줄 목록 */}
        <ScrollView style={styles.content}>
          {todaySchedules.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={64}
                color={Theme.colors.text.tertiary}
              />
              <Text style={styles.emptyText}>오늘 일정이 없습니다</Text>
            </View>
          ) : (
            todaySchedules.map((schedule) => {
              const periods = getWorkPeriods(schedule);
              return (
                <View key={schedule.id} style={styles.scheduleCard}>
                  <View style={styles.scheduleHeader}>
                    <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>
                        {schedule.category === "education"
                          ? "교육"
                          : schedule.category === "event"
                          ? "이벤트"
                          : schedule.category === "meeting"
                          ? "회의"
                          : "기타"}
                      </Text>
                    </View>
                  </View>

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

                  <View style={styles.workersRow}>
                    <Ionicons
                      name="people-outline"
                      size={16}
                      color={Theme.colors.text.secondary}
                    />
                    <Text style={styles.workersText}>
                      {schedule.workers.length}명 참여
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.xl,
    paddingTop: 60,
    paddingBottom: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  headerTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: Theme.spacing.xl,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.lg,
  },
  scheduleCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
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
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold,
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
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    fontWeight: Theme.typography.weights.medium,
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
    marginBottom: Theme.spacing.sm,
  },
  memoText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginLeft: Theme.spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  workersRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  workersText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginLeft: Theme.spacing.sm,
  },
});
