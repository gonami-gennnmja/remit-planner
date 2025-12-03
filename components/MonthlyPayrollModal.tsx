import DatePicker from "@/components/DatePicker";
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

  // 기본값을 현재 달 1일~말일로 설정
  useEffect(() => {
    const today = dayjs();
    const firstDay = today.startOf("month").format("YYYY-MM-DD");
    const lastDay = today.endOf("month").format("YYYY-MM-DD");
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  // 날짜가 변경될 때마다 급여 계산
  useEffect(() => {
    if (startDate && endDate) {
      calculatePayroll();
    }
  }, [startDate, endDate, schedules]);

  const calculatePayroll = () => {
    let total = 0;
    const schedulesInRange: Schedule[] = [];
    const workersInRange: any[] = [];

    schedules.forEach((schedule) => {
      const scheduleStart = dayjs(schedule.startDate);
      const scheduleEnd = dayjs(schedule.endDate);
      const periodStart = dayjs(startDate);
      const periodEnd = dayjs(endDate);

      // 스케줄이 선택된 기간과 겹치는지 확인
      if (
        scheduleStart.isSameOrBefore(periodEnd) &&
        scheduleEnd.isSameOrAfter(periodStart)
      ) {
        schedulesInRange.push(schedule);

        schedule.workers?.forEach((workerInfo) => {
          const hourlyWage = workerInfo.worker.hourlyWage;
          const taxWithheld = workerInfo.taxWithheld;
          const taxRate = 0.033;

          // 근무 시간 계산
          const totalHours = workerInfo.periods.reduce((sum, period) => {
            const start = dayjs(`${period.workDate} ${period.startTime}`);
            const end = dayjs(`${period.workDate} ${period.endTime}`);
            return sum + end.diff(start, "hour", true);
          }, 0);

          let grossPay = hourlyWage * totalHours;
          let netPay = grossPay;

          if (taxWithheld) {
            netPay = grossPay * (1 - taxRate);
          }

          total += Math.round(netPay);

          workersInRange.push({
            id: workerInfo.worker.id,
            name: workerInfo.worker.name,
            phone: workerInfo.worker.phone,
            scheduleTitle: schedule.title,
            workHours: totalHours,
            netPay: Math.round(netPay),
          });
        });
      }
    });

    setTotalPayroll(total);
    setSelectedSchedules(schedulesInRange);
    setSelectedWorkers(workersInRange);
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
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          {/* 기간 선택 */}
          <View style={styles.periodSection}>
            <Text style={styles.sectionTitle}>기간 선택</Text>
            <View style={styles.dateInputContainer}>
              <DatePicker
                label="시작 날짜"
                value={startDate}
                onDateChange={setStartDate}
                placeholder="시작 날짜를 선택하세요"
              />
              <DatePicker
                label="끝 날짜"
                value={endDate}
                onDateChange={setEndDate}
                placeholder="끝 날짜를 선택하세요"
              />
            </View>
          </View>

          {/* 총 급여 */}
          <View style={styles.totalSection}>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>총 급여</Text>
              <Text style={styles.totalAmount}>
                ₩{formatCurrency(totalPayroll)}
              </Text>
            </View>
          </View>

          {/* 스케줄 목록 */}
          {selectedSchedules.length > 0 && (
            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>계산된 스케줄</Text>
              {selectedSchedules.map((schedule) => (
                <Pressable
                  key={schedule.instanceId ?? schedule.id}
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
                    router.push("/worker");
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
    backgroundColor: Theme.colors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: Theme.spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.inverse,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
  totalSection: {
    marginBottom: Theme.spacing.xl,
  },
  totalCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  totalLabel: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.sm,
  },
  totalAmount: {
    fontSize: Theme.typography.sizes.xxl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
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
    color: Theme.colors.text.tertiary,
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
    marginBottom: Theme.spacing.sm,
  },
  workerDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workerHours: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.tertiary,
  },
  workerPay: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.primary,
  },
});
