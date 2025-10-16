import { Theme } from "@/constants/Theme";
import { Schedule } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

interface StaffWorkStatusModalProps {
  visible: boolean;
  onClose: () => void;
  schedules: Schedule[];
}

interface StaffWorkInfo {
  name: string;
  scheduleTitle: string;
  isCompleted: boolean;
  isPaid: boolean;
  workDate: string;
  workTime: string;
}

export default function StaffWorkStatusModal({
  visible,
  onClose,
  schedules,
}: StaffWorkStatusModalProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [staffWorkList, setStaffWorkList] = useState<StaffWorkInfo[]>([]);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  // 기본값을 현재 달 1일~말일로 설정
  useEffect(() => {
    const today = dayjs();
    const firstDay = today.startOf("month").format("YYYY-MM-DD");
    const lastDay = today.endOf("month").format("YYYY-MM-DD");

    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  // 시작 날짜가 변경되면 끝 날짜를 자동으로 한 달 후로 설정
  useEffect(() => {
    if (startDate) {
      const newEndDate = dayjs(startDate)
        .add(1, "month")
        .subtract(1, "day")
        .format("YYYY-MM-DD");
      setEndDate(newEndDate);
    }
  }, [startDate]);

  // 스태프 근무 현황 계산
  useEffect(() => {
    if (startDate && endDate) {
      const staffList = calculateStaffWorkStatus(startDate, endDate);
      setStaffWorkList(staffList);
    }
  }, [startDate, endDate, schedules]);

  const calculateStaffWorkStatus = (start: string, end: string) => {
    const staffList: StaffWorkInfo[] = [];

    schedules.forEach((schedule) => {
      const scheduleStart = dayjs(schedule.startDate);
      const scheduleEnd = dayjs(schedule.endDate);
      const periodStart = dayjs(start);
      const periodEnd = dayjs(end);

      // 스케줄이 선택된 기간과 겹치는지 확인
      if (
        scheduleStart.isSameOrBefore(periodEnd) &&
        scheduleEnd.isSameOrAfter(periodStart)
      ) {
        schedule.workers.forEach((workerInfo) => {
          workerInfo.periods.forEach((period) => {
            const workDate = dayjs(period.start).format("YYYY-MM-DD");
            const workStart = dayjs(period.start).format("HH:mm");
            const workEnd = dayjs(period.end).format("HH:mm");

            // 근무가 완료되었는지 확인 (오늘 이전이면 완료)
            const isCompleted = dayjs(workDate).isBefore(dayjs(), "day");

            staffList.push({
              name: workerInfo.worker.name,
              scheduleTitle: schedule.title,
              isCompleted,
              isPaid: workerInfo.paid,
              workDate,
              workTime: `${workStart} - ${workEnd}`,
            });
          });
        });
      }
    });

    // 이름과 날짜 순으로 정렬
    return staffList.sort((a, b) => {
      if (a.name !== b.name) {
        return a.name.localeCompare(b.name);
      }
      return dayjs(a.workDate).diff(dayjs(b.workDate));
    });
  };

  const getStatusColor = (isCompleted: boolean, isPaid: boolean) => {
    if (isCompleted && isPaid) return Theme.colors.success;
    if (isCompleted && !isPaid) return Theme.colors.warning;
    return Theme.colors.text.tertiary;
  };

  const getStatusText = (isCompleted: boolean, isPaid: boolean) => {
    if (isCompleted && isPaid) return "완료/지급";
    if (isCompleted && !isPaid) return "완료/미지급";
    return "예정";
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
          <Text style={styles.headerTitle}>스태프 근무 현황</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons
              name="close"
              size={24}
              color={Theme.colors.text.primary}
            />
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          {/* 기간 선택 */}
          <View style={styles.periodSection}>
            <Text style={styles.sectionTitle}>기간 선택</Text>
            <View style={styles.dateInputContainer}>
              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateLabel}>시작 날짜</Text>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setShowStartCalendar(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {dayjs(startDate).format("YYYY년 M월 D일")}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={Theme.colors.text.secondary}
                  />
                </Pressable>
              </View>
              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateLabel}>끝 날짜</Text>
                <Pressable
                  style={styles.dateButton}
                  onPress={() => setShowEndCalendar(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {dayjs(endDate).format("YYYY년 M월 D일")}
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={Theme.colors.text.secondary}
                  />
                </Pressable>
              </View>
            </View>
          </View>

          {/* 스태프 목록 */}
          <View style={styles.staffSection}>
            <Text style={styles.sectionTitle}>
              근무 현황 ({staffWorkList.length}건)
            </Text>

            {staffWorkList.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="people-outline"
                  size={64}
                  color={Theme.colors.text.tertiary}
                />
                <Text style={styles.emptyText}>
                  선택한 기간에 근무가 없습니다
                </Text>
              </View>
            ) : (
              staffWorkList.map((staff, index) => (
                <Pressable
                  key={index}
                  style={styles.staffCard}
                  onPress={() => {
                    onClose();
                    router.push("/workers");
                  }}
                >
                  <View style={styles.staffHeader}>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusColor(
                            staff.isCompleted,
                            staff.isPaid
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {getStatusText(staff.isCompleted, staff.isPaid)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.staffDetails}>
                    <Text style={styles.scheduleTitle}>
                      {staff.scheduleTitle}
                    </Text>
                    <Text style={styles.workDate}>{staff.workDate}</Text>
                    <Text style={styles.workTime}>{staff.workTime}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>

        {/* 시작 날짜 달력 */}
        {showStartCalendar && (
          <Modal
            visible={showStartCalendar}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowStartCalendar(false)}
          >
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>시작 날짜 선택</Text>
                <Pressable
                  style={styles.calendarCloseButton}
                  onPress={() => setShowStartCalendar(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={Theme.colors.text.primary}
                  />
                </Pressable>
              </View>
              <Calendar
                onDayPress={(day) => {
                  setStartDate(day.dateString);
                  setShowStartCalendar(false);
                }}
                markedDates={{
                  [startDate]: {
                    selected: true,
                    selectedColor: Theme.colors.primary,
                  },
                }}
                theme={{
                  selectedDayBackgroundColor: Theme.colors.primary,
                  todayTextColor: Theme.colors.primary,
                  arrowColor: Theme.colors.primary,
                  calendarBackground: Theme.colors.background,
                  textSectionTitleColor: Theme.colors.text.primary,
                  dayTextColor: Theme.colors.text.primary,
                  monthTextColor: Theme.colors.text.primary,
                  textDisabledColor: Theme.colors.text.tertiary,
                  textDayFontSize: 12,
                  textMonthFontSize: 14,
                  textDayHeaderFontSize: 10,
                  agendaDayTextColor: Theme.colors.text.primary,
                  agendaDayNumColor: Theme.colors.text.primary,
                  agendaTodayColor: Theme.colors.primary,
                }}
                style={styles.calendar}
                hideExtraDays={true}
                firstDay={1}
                showWeekNumbers={false}
                disableMonthChange={false}
                enableSwipeMonths={true}
              />
            </View>
          </Modal>
        )}

        {/* 끝 날짜 달력 */}
        {showEndCalendar && (
          <Modal
            visible={showEndCalendar}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowEndCalendar(false)}
          >
            <View style={styles.calendarContainer}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>끝 날짜 선택</Text>
                <Pressable
                  style={styles.calendarCloseButton}
                  onPress={() => setShowEndCalendar(false)}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={Theme.colors.text.primary}
                  />
                </Pressable>
              </View>
              <Calendar
                onDayPress={(day) => {
                  setEndDate(day.dateString);
                  setShowEndCalendar(false);
                }}
                markedDates={{
                  [endDate]: {
                    selected: true,
                    selectedColor: Theme.colors.primary,
                  },
                }}
                theme={{
                  selectedDayBackgroundColor: Theme.colors.primary,
                  todayTextColor: Theme.colors.primary,
                  arrowColor: Theme.colors.primary,
                  calendarBackground: Theme.colors.background,
                  textSectionTitleColor: Theme.colors.text.primary,
                  dayTextColor: Theme.colors.text.primary,
                  monthTextColor: Theme.colors.text.primary,
                  textDisabledColor: Theme.colors.text.tertiary,
                  textDayFontSize: 12,
                  textMonthFontSize: 14,
                  textDayHeaderFontSize: 10,
                  agendaDayTextColor: Theme.colors.text.primary,
                  agendaDayNumColor: Theme.colors.text.primary,
                  agendaTodayColor: Theme.colors.primary,
                }}
                style={styles.calendar}
                hideExtraDays={true}
                firstDay={1}
                showWeekNumbers={false}
                disableMonthChange={false}
                enableSwipeMonths={true}
              />
            </View>
          </Modal>
        )}
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
  periodSection: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  dateInputContainer: {
    flexDirection: "row",
    gap: Theme.spacing.md,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.background,
  },
  dateButtonText: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
  },
  staffSection: {
    marginBottom: Theme.spacing.xl,
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
  staffCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  staffHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  staffName: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  statusText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.inverse,
    fontWeight: Theme.typography.weights.medium,
  },
  staffDetails: {
    gap: Theme.spacing.xs,
  },
  scheduleTitle: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  workDate: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  workTime: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 50,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  calendarTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
  },
  calendarCloseButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  calendar: {
    height: 250,
    paddingHorizontal: Theme.spacing.sm,
    paddingBottom: Theme.spacing.sm,
  },
});
