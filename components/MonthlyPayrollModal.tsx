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

interface MonthlyPayrollModalProps {
  visible: boolean;
  onClose: () => void;
  schedules: Schedule[];
}

export default function MonthlyPayrollModal({
  visible,
  onClose,
  schedules,
}: MonthlyPayrollModalProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalPayroll, setTotalPayroll] = useState(0);
  const [selectedSchedules, setSelectedSchedules] = useState<Schedule[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<any[]>([]);
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

  // 급여 계산
  useEffect(() => {
    if (startDate && endDate) {
      const result = calculatePayroll(startDate, endDate);
      setTotalPayroll(result.total);
      setSelectedSchedules(result.schedules);
      setSelectedWorkers(result.workers);
    }
  }, [startDate, endDate, schedules]);

  const calculatePayroll = (start: string, end: string) => {
    let total = 0;
    const matchingSchedules: Schedule[] = [];
    const matchingWorkers: any[] = [];

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
        matchingSchedules.push(schedule);

        schedule.workers.forEach((workerInfo) => {
          const hourlyWage = workerInfo.worker.hourlyWage;
          const taxWithheld = workerInfo.worker.taxWithheld;
          const taxRate = 0.033; // 3.3%

          // 근무 시간 계산
          const totalHours = workerInfo.periods.reduce((sum, period) => {
            const start = dayjs(period.start);
            const end = dayjs(period.end);
            return sum + end.diff(start, "hour", true);
          }, 0);

          // 급여 계산
          let grossPay = hourlyWage * totalHours;
          let netPay = grossPay;

          if (taxWithheld) {
            netPay = grossPay * (1 - taxRate);
          }

          total += Math.round(netPay);

          // 근로자 정보 저장
          matchingWorkers.push({
            ...workerInfo.worker,
            scheduleId: schedule.id,
            scheduleTitle: schedule.title,
            workHours: totalHours,
            netPay: Math.round(netPay),
            grossPay: Math.round(grossPay),
          });
        });
      }
    });

    return { total, schedules: matchingSchedules, workers: matchingWorkers };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
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
          <Text style={styles.headerTitle}>급여 현황</Text>
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

          {/* 총 급여 */}
          <View style={styles.totalSection}>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>총 급여</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(totalPayroll)}원
              </Text>
            </View>
          </View>

          {/* 기간 정보 */}
          <View style={styles.periodInfo}>
            <Text style={styles.periodText}>
              {dayjs(startDate).format("M월 D일")} ~{" "}
              {dayjs(endDate).format("M월 D일")}
            </Text>
            <Text style={styles.periodDays}>
              ({dayjs(endDate).diff(dayjs(startDate), "day") + 1}일간)
            </Text>
          </View>

          {/* 상세 정보 */}
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>상세 정보</Text>
            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>계산된 스케줄 수</Text>
                <Text style={styles.detailValue}>
                  {selectedSchedules.length}개
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>참여 근로자 수</Text>
                <Text style={styles.detailValue}>
                  {selectedWorkers.length}명
                </Text>
              </View>
            </View>
          </View>

          {/* 스케줄 목록 */}
          {selectedSchedules.length > 0 && (
            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>계산된 스케줄</Text>
              {selectedSchedules.map((schedule) => (
                <Pressable
                  key={schedule.id}
                  style={styles.scheduleCard}
                  onPress={() => {
                    onClose();
                    router.push(`/schedule/${schedule.id}`);
                  }}
                >
                  <View style={styles.scheduleHeader}>
                    <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Theme.colors.text.secondary}
                    />
                  </View>
                  <Text style={styles.scheduleDate}>
                    {dayjs(schedule.startDate).format("M월 D일")} ~{" "}
                    {dayjs(schedule.endDate).format("M월 D일")}
                  </Text>
                  {schedule.location && (
                    <Text style={styles.scheduleLocation}>
                      📍 {schedule.location}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}

          {/* 근로자 목록 */}
          {selectedWorkers.length > 0 && (
            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>참여 근로자</Text>
              {selectedWorkers.map((worker, index) => (
                <Pressable
                  key={`${worker.id}-${index}`}
                  style={styles.workerCard}
                  onPress={() => {
                    onClose();
                    router.push("/workers");
                  }}
                >
                  <View style={styles.workerHeader}>
                    <Text style={styles.workerName}>{worker.name}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Theme.colors.text.secondary}
                    />
                  </View>
                  <Text style={styles.workerSchedule}>
                    {worker.scheduleTitle}
                  </Text>
                  <View style={styles.workerDetails}>
                    <Text style={styles.workerHours}>
                      {worker.workHours.toFixed(1)}시간
                    </Text>
                    <Text style={styles.workerPay}>
                      {formatCurrency(worker.netPay)}원
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
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
  totalSection: {
    marginBottom: Theme.spacing.xl,
  },
  totalCard: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: "center",
    ...Theme.shadows.md,
  },
  totalLabel: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.inverse,
    marginBottom: Theme.spacing.sm,
  },
  totalAmount: {
    fontSize: Theme.typography.sizes.xxxl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.inverse,
  },
  periodInfo: {
    alignItems: "center",
    marginBottom: Theme.spacing.xl,
  },
  periodText: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  periodDays: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.xs,
  },
  detailSection: {
    marginBottom: Theme.spacing.xl,
  },
  detailCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  detailLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  detailValue: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  listSection: {
    marginBottom: Theme.spacing.xl,
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
    marginBottom: Theme.spacing.sm,
  },
  scheduleTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    flex: 1,
  },
  scheduleDate: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  scheduleLocation: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
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
    flex: 1,
  },
  workerSchedule: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  workerDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workerHours: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  workerPay: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.success,
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
