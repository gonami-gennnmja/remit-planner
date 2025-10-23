import CommonHeader from "@/components/CommonHeader";
import { Text } from "@/components/Themed";
import { Theme } from "@/constants/Theme";
import { database } from "@/database";
import { Client, Schedule } from "@/models/types";
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

interface RevenueData {
  id: string;
  clientName: string;
  scheduleTitle: string;
  amount: number;
  status: "received" | "pending" | "overdue";
  dueDate?: string;
  receivedDate?: string;
  client: Client;
  schedule: Schedule;
}

export default function RevenueScreen() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "received" | "pending" | "overdue"
  >("all");

  const loadRevenueData = async () => {
    try {
      setLoading(true);

      // 모든 스케줄과 거래처 가져오기
      const schedules = await database.getAllSchedules();
      const clients = await database.getAllClients();

      const revenueList: RevenueData[] = [];

      // 각 스케줄에 대해 수입 데이터 생성
      for (const schedule of schedules) {
        const client = clients.find((c) => c.name === schedule.category); // 임시로 category를 거래처명으로 사용

        if (client) {
          // 스케줄별 수입 금액 계산 (예시: 근로자 수 * 50000원)
          const workerCount = schedule.workers?.length || 0;
          const baseAmount = workerCount * 50000; // 기본 수입

          // 스케줄의 수급 상태 사용
          let status: "received" | "pending" | "overdue" =
            schedule.revenueStatus || "pending";
          let receivedDate: string | undefined;

          if (status === "received") {
            receivedDate = schedule.endDate;
          }

          revenueList.push({
            id: `revenue_${schedule.id}`,
            clientName: client.name,
            scheduleTitle: schedule.title,
            amount: baseAmount,
            status,
            dueDate:
              schedule.revenueDueDate ||
              dayjs(schedule.endDate).add(14, "day").format("YYYY-MM-DD"),
            receivedDate,
            client,
            schedule,
          });
        }
      }

      setRevenueData(revenueList);
    } catch (error) {
      console.error("수입 데이터 로드 오류:", error);
      Alert.alert("오류", "수입 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRevenueData();
    setRefreshing(false);
  };

  const copyAccountNumber = (accountNumber: string, clientName: string) => {
    Clipboard.setString(accountNumber);
    Alert.alert("복사 완료", `${clientName}의 계좌번호가 복사되었습니다.`);
  };

  const handleTransfer = (client: Client, amount: number) => {
    Alert.alert(
      "송금 확인",
      `${
        client.name
      }에서 ${amount.toLocaleString()}원을 받으시겠습니까?\n\n계좌번호: ${
        client.businessNumber || "계좌번호 없음"
      }`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "수금 완료",
          onPress: () => {
            // TODO: 실제 수금 완료 처리
            Alert.alert("수금 완료", "수금이 완료되었습니다.");
          },
        },
      ]
    );
  };

  const markAsReceived = async (revenueId: string) => {
    try {
      // TODO: 실제 수금 완료 처리
      Alert.alert("수금 완료", "수금이 완료되었습니다.");
      await loadRevenueData();
    } catch (error) {
      Alert.alert("오류", "수금 처리 중 오류가 발생했습니다.");
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "received":
        return {
          text: "수금완료",
          color: Theme.colors.success,
          icon: "checkmark-circle" as const,
        };
      case "pending":
        return {
          text: "수금예정",
          color: Theme.colors.warning,
          icon: "time-outline" as const,
        };
      case "overdue":
        return {
          text: "연체",
          color: Theme.colors.error,
          icon: "alert-circle" as const,
        };
      default:
        return {
          text: "알 수 없음",
          color: Theme.colors.text.secondary,
          icon: "help-circle" as const,
        };
    }
  };

  const filteredData = revenueData.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const totalReceived = revenueData
    .filter((item) => item.status === "received")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalPending = revenueData
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + item.amount, 0);

  const totalOverdue = revenueData
    .filter((item) => item.status === "overdue")
    .reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    loadRevenueData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="수급 현황" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>수입 데이터를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 통계 카드 */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {totalReceived.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>수금완료</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Theme.colors.warning }]}>
              {totalPending.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>수금예정</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Theme.colors.error }]}>
              {totalOverdue.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>연체</Text>
          </View>
        </View>

        {/* 필터 버튼 */}
        <View style={styles.filterContainer}>
          {[
            { key: "all", label: "전체" },
            { key: "received", label: "수금완료" },
            { key: "pending", label: "수금예정" },
            { key: "overdue", label: "연체" },
          ].map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterButton,
                filter === key && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(key as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === key && styles.filterButtonTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 수입 목록 */}
        {filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="receipt-outline"
              size={80}
              color={Theme.colors.text.secondary}
            />
            <Text style={styles.emptyTitle}>수입 데이터가 없습니다</Text>
            <Text style={styles.emptyDescription}>
              스케줄을 등록하고 거래처를 연결하면 수입 정보가 표시됩니다.
            </Text>
          </View>
        ) : (
          <View style={styles.revenueList}>
            {filteredData.map((item) => {
              const statusInfo = getStatusInfo(item.status);
              return (
                <View key={item.id} style={styles.revenueCard}>
                  {/* 거래처 정보 헤더 */}
                  <View style={styles.clientHeader}>
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName}>{item.clientName}</Text>
                      <Text style={styles.scheduleTitle}>
                        {item.scheduleTitle}
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Ionicons
                        name={statusInfo.icon}
                        size={16}
                        color={statusInfo.color}
                      />
                      <Text
                        style={[styles.statusText, { color: statusInfo.color }]}
                      >
                        {statusInfo.text}
                      </Text>
                    </View>
                  </View>

                  {/* 금액 정보 */}
                  <View style={styles.amountSection}>
                    <Text style={styles.amountLabel}>수입 금액</Text>
                    <Text style={styles.amountValue}>
                      {item.amount.toLocaleString()}원
                    </Text>
                  </View>

                  {/* 날짜 정보 */}
                  <View style={styles.dateInfo}>
                    <View style={styles.dateRow}>
                      <Text style={styles.dateLabel}>마감일</Text>
                      <Text style={styles.dateValue}>
                        {dayjs(item.dueDate).format("YYYY-MM-DD")}
                      </Text>
                    </View>
                    {item.receivedDate && (
                      <View style={styles.dateRow}>
                        <Text style={styles.dateLabel}>수금일</Text>
                        <Text style={styles.dateValue}>
                          {dayjs(item.receivedDate).format("YYYY-MM-DD")}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* 계좌 정보 및 액션 버튼 */}
                  {item.client.businessNumber && (
                    <View style={styles.accountSection}>
                      <View style={styles.accountInfo}>
                        <Ionicons
                          name="card-outline"
                          size={16}
                          color={Theme.colors.text.secondary}
                        />
                        <Text style={styles.accountNumber}>
                          {item.client.businessNumber}
                        </Text>
                      </View>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={styles.copyButton}
                          onPress={() =>
                            copyAccountNumber(
                              item.client.businessNumber,
                              item.clientName
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
                        {item.status !== "received" && (
                          <TouchableOpacity
                            style={styles.transferButton}
                            onPress={() =>
                              handleTransfer(item.client, item.amount)
                            }
                          >
                            <Ionicons
                              name="cash-outline"
                              size={16}
                              color="#fff"
                            />
                            <Text
                              style={[styles.buttonText, { color: "#fff" }]}
                            >
                              수금
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}

                  {/* 수금 완료 버튼 */}
                  {item.status !== "received" && (
                    <TouchableOpacity
                      style={styles.markReceivedButton}
                      onPress={() => markAsReceived(item.id)}
                    >
                      <Text style={styles.markReceivedText}>
                        수금 완료 처리
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
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
  statsContainer: {
    flexDirection: "row",
    padding: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
    alignItems: "center",
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterButtonText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  filterButtonTextActive: {
    color: "#fff",
    fontWeight: Theme.typography.weights.medium,
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
  revenueList: {
    padding: Theme.spacing.md,
  },
  revenueCard: {
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
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: 4,
  },
  scheduleTitle: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.background,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
  },
  statusText: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.medium,
    marginLeft: 4,
  },
  amountSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Theme.colors.border,
  },
  amountLabel: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
  },
  amountValue: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
  },
  dateInfo: {
    marginBottom: Theme.spacing.md,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.xs,
  },
  dateLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  dateValue: {
    fontSize: Theme.typography.sizes.sm,
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
  markReceivedButton: {
    backgroundColor: Theme.colors.success,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
  },
  markReceivedText: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: "#fff",
  },
});
