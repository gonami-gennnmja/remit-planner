import { useTheme } from "@/contexts/ThemeContext";
import { Schedule } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router } from "expo-router";
import React from "react";
import {
  Modal,
  Platform,
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
  const { colors } = useTheme();

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 헤더 */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {dayjs(selectedDate).format("M월 D일")} 일정
          </Text>
          <Pressable
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* 스케줄 목록 */}
        <ScrollView style={styles.content}>
          {todaySchedules.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                오늘 일정이 없습니다
              </Text>
            </View>
          ) : (
            todaySchedules.map((schedule) => {
              const periods = getWorkPeriods(schedule);
              return (
                <Pressable
                  key={schedule.instanceId ?? schedule.id}
                  style={[
                    styles.scheduleCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    onClose();
                    router.push(`/schedule/${schedule.id}` as any);
                  }}
                >
                  <View style={styles.scheduleHeader}>
                    <Text
                      style={[styles.scheduleTitle, { color: colors.text }]}
                    >
                      {schedule.title}
                    </Text>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          { color: colors.textSecondary },
                        ]}
                      >
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
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.infoText, { color: colors.text }]}>
                        {schedule.location}
                      </Text>
                    </View>
                  )}

                  <View style={styles.timeRow}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={[styles.timeText, { color: colors.text }]}>
                      {periods.start} - {periods.end}
                    </Text>
                  </View>

                  {schedule.memo && (
                    <View style={styles.memoRow}>
                      <Ionicons
                        name="document-text-outline"
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.memoText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {schedule.memo}
                      </Text>
                    </View>
                  )}

                  <View style={styles.workersRow}>
                    <Ionicons
                      name="people-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.workersText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {schedule.workers.length}명 참여
                    </Text>
                  </View>
                </Pressable>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  scheduleCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  timeText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  memoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  memoText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  workersRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  workersText: {
    fontSize: 14,
    marginLeft: 8,
  },
});
