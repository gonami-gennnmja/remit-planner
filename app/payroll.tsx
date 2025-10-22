import CommonHeader from "@/components/CommonHeader";
import { Text } from "@/components/Themed";
import { Theme } from "@/constants/Theme";
import { database } from "@/database";
import { ScheduleWorker, Worker } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Clipboard,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface PayrollData {
  worker: Worker;
  scheduleWorkers: ScheduleWorker[];
  totalHours: number;
  totalPay: number;
  paidAmount: number;
  unpaidAmount: number;
  lastPaymentDate?: string;
}

export default function PayrollScreen() {
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPayrollData = async () => {
    try {
      setLoading(true);

      // 모든 근로자 가져오기
      const workers = await database.getAllWorkers();

      // 모든 스케줄 가져오기
      const schedules = await database.getAllSchedules();

      const payrollList: PayrollData[] = [];

      for (const worker of workers) {
        // 해당 근로자의 스케줄-근로자 관계 찾기
        const scheduleWorkers: ScheduleWorker[] = [];
        let totalHours = 0;
        let totalPay = 0;
        let paidAmount = 0;
        let unpaidAmount = 0;
        let lastPaymentDate: string | undefined;

        for (const schedule of schedules) {
          const scheduleWorker = schedule.workers?.find(
            (sw) => sw.worker.id === worker.id
          );
          if (scheduleWorker) {
            scheduleWorkers.push(scheduleWorker);

            // 근무 시간 계산
            const periods = scheduleWorker.periods || [];
            const hours = periods.reduce((sum, period) => {
              const start = dayjs(period.start);
              const end = dayjs(period.end);
              return sum + end.diff(start, "hour", true);
            }, 0);

            totalHours += hours;

            // 급여 계산
            const grossPay = worker.hourlyWage * hours;
            const tax = worker.taxWithheld ? grossPay * 0.033 : 0;
            const netPay = grossPay - tax;

            totalPay += netPay;

            if (scheduleWorker.paid) {
              paidAmount += netPay;
              lastPaymentDate = schedule.endDate;
            } else {
              unpaidAmount += netPay;
            }
          }
        }

        if (scheduleWorkers.length > 0) {
          payrollList.push({
            worker,
            scheduleWorkers,
            totalHours: Math.round(totalHours * 100) / 100,
            totalPay: Math.round(totalPay),
            paidAmount: Math.round(paidAmount),
            unpaidAmount: Math.round(unpaidAmount),
            lastPaymentDate,
          });
        }
      }

      setPayrollData(
        payrollList.sort((a, b) => b.unpaidAmount - a.unpaidAmount)
      );
    } catch (error) {
      console.error("급여 데이터 로드 오류:", error);
      Alert.alert("오류", "급여 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayrollData();
    setRefreshing(false);
  };

  const copyAccountNumber = (accountNumber: string, workerName: string) => {
    Clipboard.setString(accountNumber);
    Alert.alert("복사 완료", `${workerName}의 계좌번호가 복사되었습니다.`);
  };

  const handleTransfer = (worker: Worker, amount: number) => {
    Alert.alert(
      "송금 확인",
      `${
        worker.name
      }님에게 ${amount.toLocaleString()}원을 송금하시겠습니까?\n\n계좌번호: ${
        worker.bankAccount
      }`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "송금",
          onPress: () => {
            // TODO: 실제 송금 API 연동
            Alert.alert("송금 완료", "송금이 완료되었습니다.");
          },
        },
      ]
    );
  };

  const markAsPaid = async (workerId: string) => {
    try {
      // TODO: 실제 지급 완료 처리
      Alert.alert("지급 완료", "급여 지급이 완료되었습니다.");
      await loadPayrollData();
    } catch (error) {
      Alert.alert("오류", "지급 처리 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    loadPayrollData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="급여 관리" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>급여 데이터를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader title="급여 관리" />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {payrollData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={80}
              color={Theme.colors.text.secondary}
            />
            <Text style={styles.emptyTitle}>급여 데이터가 없습니다</Text>
            <Text style={styles.emptyDescription}>
              근로자를 등록하고 스케줄에 배정하면 급여 정보가 표시됩니다.
            </Text>
          </View>
        ) : (
          <View style={styles.payrollList}>
            {payrollData.map((data) => (
              <View key={data.worker.id} style={styles.payrollCard}>
                {/* 근로자 정보 헤더 */}
                <View style={styles.workerHeader}>
                  <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{data.worker.name}</Text>
                    <Text style={styles.workerPhone}>{data.worker.phone}</Text>
                  </View>
                  <View style={styles.paymentStatus}>
                    {data.unpaidAmount > 0 ? (
                      <View style={styles.unpaidBadge}>
                        <Text style={styles.unpaidText}>미지급</Text>
                      </View>
                    ) : (
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidText}>지급완료</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* 급여 정보 */}
                <View style={styles.payrollInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>총 근무시간</Text>
                    <Text style={styles.infoValue}>{data.totalHours}시간</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>시급</Text>
                    <Text style={styles.infoValue}>
                      {data.worker.hourlyWage.toLocaleString()}원
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>총 급여</Text>
                    <Text style={styles.infoValue}>
                      {data.totalPay.toLocaleString()}원
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>지급완료</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        { color: Theme.colors.success },
                      ]}
                    >
                      {data.paidAmount.toLocaleString()}원
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>미지급</Text>
                    <Text
                      style={[styles.infoValue, { color: Theme.colors.error }]}
                    >
                      {data.unpaidAmount.toLocaleString()}원
                    </Text>
                  </View>
                </View>

                {/* 계좌 정보 및 액션 버튼 */}
                {data.worker.bankAccount && (
                  <View style={styles.accountSection}>
                    <View style={styles.accountInfo}>
                      <Ionicons
                        name="card-outline"
                        size={16}
                        color={Theme.colors.text.secondary}
                      />
                      <Text style={styles.accountNumber}>
                        {data.worker.bankAccount}
                      </Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() =>
                          copyAccountNumber(
                            data.worker.bankAccount,
                            data.worker.name
                          )
                        }
                      >
                        <Ionicons
                          name="copy-outline"
                          size={16}
                          color={Theme.colors.primary}
                        />
                        <Text style={styles.buttonText}>복사</Text>
                      </TouchableOpacity>
                      {data.unpaidAmount > 0 && (
                        <TouchableOpacity
                          style={styles.transferButton}
                          onPress={() =>
                            handleTransfer(data.worker, data.unpaidAmount)
                          }
                        >
                          <Ionicons
                            name="send-outline"
                            size={16}
                            color="#fff"
                          />
                          <Text style={[styles.buttonText, { color: "#fff" }]}>
                            송금
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                {/* 마지막 지급일 */}
                {data.lastPaymentDate && (
                  <View style={styles.lastPaymentRow}>
                    <Text style={styles.lastPaymentText}>
                      마지막 지급일:{" "}
                      {dayjs(data.lastPaymentDate).format("YYYY-MM-DD")}
                    </Text>
                  </View>
                )}

                {/* 지급 완료 버튼 */}
                {data.unpaidAmount > 0 && (
                  <TouchableOpacity
                    style={styles.markPaidButton}
                    onPress={() => markAsPaid(data.worker.id)}
                  >
                    <Text style={styles.markPaidText}>지급 완료 처리</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
  emptyDescription: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
  },
  payrollList: {
    padding: Theme.spacing.md,
  },
  payrollCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: 4,
  },
  workerPhone: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  paymentStatus: {
    marginLeft: Theme.spacing.md,
  },
  unpaidBadge: {
    backgroundColor: Theme.colors.warning,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
  },
  unpaidText: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.medium,
    color: "#fff",
  },
  paidBadge: {
    backgroundColor: Theme.colors.success,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
  },
  paidText: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.medium,
    color: "#fff",
  },
  payrollInfo: {
    marginBottom: Theme.spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  infoLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  infoValue: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.primary,
  },
  accountSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  accountNumber: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
    fontFamily: "monospace",
  },
  actionButtons: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.sm,
  },
  transferButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.sm,
  },
  buttonText: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.medium,
    marginLeft: 4,
  },
  lastPaymentRow: {
    marginBottom: Theme.spacing.sm,
  },
  lastPaymentText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    textAlign: "center",
  },
  markPaidButton: {
    backgroundColor: Theme.colors.success,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
  },
  markPaidText: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: "#fff",
  },
});
