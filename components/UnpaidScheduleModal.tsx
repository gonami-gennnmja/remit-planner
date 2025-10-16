import { Theme } from "@/constants/Theme";
import { Schedule } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface UnpaidScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  schedules: Schedule[];
}

interface UnpaidScheduleInfo {
  scheduleId: string;
  title: string;
  workDate: string;
  workerName: string;
  hourlyWage: number;
  workHours: number;
  totalAmount: number;
  isOverdue: boolean;
}

export default function UnpaidScheduleModal({
  visible,
  onClose,
  schedules,
}: UnpaidScheduleModalProps) {
  const [unpaidList, setUnpaidList] = useState<UnpaidScheduleInfo[]>([]);

  // 미지급 건수 계산
  useEffect(() => {
    const unpaid = calculateUnpaidSchedules();
    setUnpaidList(unpaid);
  }, [schedules]);

  const calculateUnpaidSchedules = () => {
    const unpaid: UnpaidScheduleInfo[] = [];
    const today = dayjs();

    schedules.forEach((schedule) => {
      schedule.workers.forEach((workerInfo) => {
        workerInfo.periods.forEach((period) => {
          const workDate = dayjs(period.start).format("YYYY-MM-DD");
          const workEnd = dayjs(period.end);

          // 근무가 끝났지만 아직 지급되지 않은 경우
          if (workEnd.isBefore(today) && !workerInfo.paid) {
            const workHours = workEnd.diff(dayjs(period.start), "hour", true);
            const hourlyWage = workerInfo.worker.hourlyWage;
            const taxWithheld = workerInfo.worker.taxWithheld;
            const taxRate = 0.033; // 3.3%

            let totalAmount = hourlyWage * workHours;
            if (taxWithheld) {
              totalAmount = totalAmount * (1 - taxRate);
            }

            unpaid.push({
              scheduleId: schedule.id,
              title: schedule.title,
              workDate,
              workerName: workerInfo.worker.name,
              hourlyWage,
              workHours,
              totalAmount: Math.round(totalAmount),
              isOverdue: workEnd.isBefore(today.subtract(1, "day")), // 1일 이상 지연
            });
          }
        });
      });
    });

    // 지연 순서대로 정렬
    return unpaid.sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) {
        return a.isOverdue ? -1 : 1;
      }
      return dayjs(a.workDate).diff(dayjs(b.workDate));
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  const getTotalUnpaidAmount = () => {
    return unpaidList.reduce((total, item) => total + item.totalAmount, 0);
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
          <Text style={styles.headerTitle}>미지급 건수</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons
              name="close"
              size={24}
              color={Theme.colors.text.primary}
            />
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          {/* 총 미지급 금액 */}
          <View style={styles.totalSection}>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>총 미지급 금액</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(getTotalUnpaidAmount())}원
              </Text>
              <Text style={styles.totalCount}>{unpaidList.length}건</Text>
            </View>
          </View>

          {/* 미지급 목록 */}
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>
              미지급 내역 ({unpaidList.length}건)
            </Text>

            {unpaidList.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={64}
                  color={Theme.colors.success}
                />
                <Text style={styles.emptyText}>미지급 건이 없습니다</Text>
              </View>
            ) : (
              unpaidList.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.unpaidCard,
                    item.isOverdue && styles.overdueCard,
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.scheduleTitle}>{item.title}</Text>
                    {item.isOverdue && (
                      <View style={styles.overdueBadge}>
                        <Text style={styles.overdueText}>지연</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{item.workerName}</Text>
                    <Text style={styles.workDate}>{item.workDate}</Text>
                  </View>

                  <View style={styles.amountInfo}>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>시급</Text>
                      <Text style={styles.amountValue}>
                        {formatCurrency(item.hourlyWage)}원
                      </Text>
                    </View>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>근무시간</Text>
                      <Text style={styles.amountValue}>
                        {item.workHours.toFixed(1)}시간
                      </Text>
                    </View>
                    <View style={[styles.amountRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>지급액</Text>
                      <Text style={styles.totalValue}>
                        {formatCurrency(item.totalAmount)}원
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
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
  totalSection: {
    marginBottom: Theme.spacing.xl,
  },
  totalCard: {
    backgroundColor: Theme.colors.warning,
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
    marginBottom: Theme.spacing.xs,
  },
  totalCount: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.inverse,
    opacity: 0.8,
  },
  listSection: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
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
  unpaidCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  overdueCard: {
    borderColor: Theme.colors.error,
    borderWidth: 2,
  },
  cardHeader: {
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
  overdueBadge: {
    backgroundColor: Theme.colors.error,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  overdueText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.inverse,
    fontWeight: Theme.typography.weights.medium,
  },
  workerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  workerName: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  workDate: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  amountInfo: {
    gap: Theme.spacing.xs,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  amountValue: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
    paddingTop: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
  },
  totalLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.semibold,
  },
  totalValue: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.bold,
  },
});
