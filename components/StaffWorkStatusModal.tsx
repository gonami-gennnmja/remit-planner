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

interface StaffWorkStatusModalProps {
  visible: boolean;
  onClose: () => void;
  schedules: Schedule[];
}

export default function StaffWorkStatusModal({
  visible,
  onClose,
  schedules,
}: StaffWorkStatusModalProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [staffList, setStaffList] = useState<any[]>([]);

  // 기본값을 현재 달 1일~말일로 설정
  useEffect(() => {
    const today = dayjs();
    const firstDay = today.startOf("month").format("YYYY-MM-DD");
    const lastDay = today.endOf("month").format("YYYY-MM-DD");
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  // 날짜가 변경될 때마다 스태프 목록 계산
  useEffect(() => {
    if (startDate && endDate) {
      calculateStaffList();
    }
  }, [startDate, endDate, schedules]);

  const calculateStaffList = () => {
    const staffMap = new Map();

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
        schedule.workers.forEach((workerInfo) => {
          const workerId = workerInfo.worker.id;
          const existingStaff = staffMap.get(workerId);

          if (existingStaff) {
            // 기존 스태프 정보 업데이트
            existingStaff.totalHours += workerInfo.periods.reduce((sum, period) => {
              const start = dayjs(period.start);
              const end = dayjs(period.end);
              return sum + end.diff(start, "hour", true);
            }, 0);
            existingStaff.schedules.push(schedule.title);
            existingStaff.paidCount += workerInfo.paid ? 1 : 0;
            existingStaff.totalCount += 1;
          } else {
            // 새 스태프 추가
            const totalHours = workerInfo.periods.reduce((sum, period) => {
              const start = dayjs(period.start);
              const end = dayjs(period.end);
              return sum + end.diff(start, "hour", true);
            }, 0);

            staffMap.set(workerId, {
              id: workerId,
              name: workerInfo.worker.name,
              phone: workerInfo.worker.phone,
              position: getPosition(workerInfo.worker.name),
              totalHours: totalHours,
              schedules: [schedule.title],
              paidCount: workerInfo.paid ? 1 : 0,
              totalCount: 1,
              workStatus: getWorkStatus(workerInfo.periods),
            });
          }
        });
      }
    });

    setStaffList(Array.from(staffMap.values()));
  };

  const getPosition = (name: string) => {
    if (name.includes("선생") || name.includes("Teacher")) return "강사";
    if (name.includes("개발") || name.includes("Developer")) return "개발자";
    if (name.includes("이벤트") || name.includes("Event")) return "이벤트 담당";
    return "근로자";
  };

  const getWorkStatus = (periods: any[]) => {
    const now = dayjs();
    const hasCompletedWork = periods.some(period => dayjs(period.end).isBefore(now));
    const hasUpcomingWork = periods.some(period => dayjs(period.start).isAfter(now));
    
    if (hasCompletedWork && hasUpcomingWork) return "mixed";
    if (hasCompletedWork) return "completed";
    if (hasUpcomingWork) return "upcoming";
    return "unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return Theme.colors.success;
      case "upcoming":
        return Theme.colors.warning;
      case "mixed":
        return Theme.colors.primary;
      default:
        return Theme.colors.text.tertiary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "근무완료";
      case "upcoming":
        return "근무예정";
      case "mixed":
        return "진행중";
      default:
        return "미정";
    }
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

          {/* 스태프 목록 */}
          <View style={styles.staffSection}>
            <Text style={styles.sectionTitle}>
              스태프 현황 ({staffList.length}명)
            </Text>
            {staffList.map((staff) => (
              <Pressable
                key={staff.id}
                style={styles.staffCard}
                onPress={() => {
                  onClose();
                  router.push("/workers");
                }}
              >
                <View style={styles.staffHeader}>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <Text style={styles.staffPosition}>{staff.position}</Text>
                  </View>
                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(staff.workStatus) },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {getStatusText(staff.workStatus)}
                    </Text>
                  </View>
                </View>

                <View style={styles.staffDetails}>
                  <Text style={styles.staffPhone}>{staff.phone}</Text>
                  <Text style={styles.staffHours}>
                    총 {staff.totalHours.toFixed(1)}시간
                  </Text>
                </View>

                <View style={styles.staffStats}>
                  <Text style={styles.scheduleCount}>
                    {staff.schedules.length}개 일정
                  </Text>
                  <Text style={styles.paymentStatus}>
                    지급완료 {staff.paidCount}/{staff.totalCount}
                  </Text>
                </View>

                <View style={styles.scheduleList}>
                  {staff.schedules.slice(0, 3).map((schedule, index) => (
                    <Text key={index} style={styles.scheduleItem}>
                      • {schedule}
                    </Text>
                  ))}
                  {staff.schedules.length > 3 && (
                    <Text style={styles.moreSchedules}>
                      +{staff.schedules.length - 3}개 더
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
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
  staffSection: {
    marginBottom: Theme.spacing.xl,
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
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: 2,
  },
  staffPosition: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Theme.spacing.xs,
  },
  statusText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  staffDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  staffPhone: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  staffHours: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  staffStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  scheduleCount: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.tertiary,
  },
  paymentStatus: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.tertiary,
  },
  scheduleList: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
    paddingTop: Theme.spacing.sm,
  },
  scheduleItem: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  moreSchedules: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.tertiary,
    fontStyle: "italic",
  },
});