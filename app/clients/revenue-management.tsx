// @ts-nocheck
import CommonHeader from "@/components/CommonHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import PeriodSelector, { PeriodType } from "@/components/PeriodSelector";
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

export default function RevenueManagementScreen() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "received" | "pending" | "overdue"
  >("all");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("month");
  const [customStartDate, setCustomStartDate] = useState<string>(
    dayjs().startOf("month").format("YYYY-MM-DD")
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    dayjs().endOf("month").format("YYYY-MM-DD")
  );

  const loadRevenueData = async () => {
    try {
      setLoading(true);

      // 모든 스케줄과 거래처 가져오기
      const allSchedules = await database.getAllSchedules();
      const clients = await database.getAllClients();

      // 기간 필터링
      const today = dayjs();
      let schedules = allSchedules;

      switch (selectedPeriod) {
        case "week":
          schedules = allSchedules.filter((s) => {
            const scheduleDate = dayjs(s.startDate);
            return (
              scheduleDate.isSameOrAfter(today.startOf("week")) &&
              scheduleDate.isSameOrBefore(today.endOf("week"))
            );
          });
          break;
        case "month":
          const startOfMonth = today.startOf("month");
          const endOfMonth = today.endOf("month");
          schedules = allSchedules.filter((s) => {
            const scheduleDate = dayjs(s.startDate);
            return (
              scheduleDate.isSameOrAfter(startOfMonth) &&
              scheduleDate.isSameOrBefore(endOfMonth)
            );
          });
          break;
        case "year":
          schedules = allSchedules.filter((s) => {
            const scheduleDate = dayjs(s.startDate);
            return (
              scheduleDate.isSameOrAfter(today.startOf("year")) &&
              scheduleDate.isSameOrBefore(today.endOf("year"))
            );
          });
          break;
        case "custom":
          {
            const start = dayjs(customStartDate).startOf("day");
            const end = dayjs(customEndDate).endOf("day");
            schedules = allSchedules.filter((s) => {
              const scheduleDate = dayjs(s.startDate);
              return (
                scheduleDate.isSameOrAfter(start) &&
                scheduleDate.isSameOrBefore(end)
              );
            });
          }
          break;
      }

      const revenueList: RevenueData[] = [];

      // 각 스케줄에 대해 수입 데이터 생성
      for (const schedule of schedules) {
        const client = clients.find((c) => c.id === schedule.clientId);

        if (client && schedule.scheduleType === "business") {
          // 업무 스케줄만 수익에 포함, 실제 계약금액 사용
          const totalAmount = schedule.contractAmount || 0;

          // 미수금 상태 확인 (2주 이상 지난 경우)
          const today = dayjs();
          const scheduleEnd = dayjs(schedule.endDate);
          const daysSinceEnd = today.diff(scheduleEnd, "day");
          const isOverdue = daysSinceEnd >= 14;

          let status: "received" | "pending" | "overdue";
          if (schedule.collected) {
            status = "received";
          } else if (isOverdue) {
            status = "overdue";
          } else {
            status = "pending";
          }

          let receivedDate: string | undefined;
          if (status === "received") {
            receivedDate = schedule.endDate;
          }

          revenueList.push({
            id: `revenue_${schedule.id}`,
            clientName: client.name,
            scheduleTitle: schedule.title,
            amount: totalAmount,
            status,
            dueDate: dayjs(schedule.endDate)
              .add(14, "day")
              .format("YYYY-MM-DD"),
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

  const markAsReceived = async (revenueId: string) => {
    try {
      // 스케줄의 collected 상태를 true로 업데이트
      const revenueItem = revenueData.find((item) => item.id === revenueId);
      if (revenueItem) {
        // TODO: 실제 데이터베이스 업데이트
        // await database.updateSchedule(revenueItem.schedule.id, { collected: true });
        Alert.alert("수입 확인", "수입 확인이 완료되었습니다.");
        await loadRevenueData();
      }
    } catch (error) {
      Alert.alert("오류", "수입 확인 처리 중 오류가 발생했습니다.");
    }
  };

  const getFilteredData = () => {
    if (filter === "all") return revenueData;
    return revenueData.filter((item) => item.status === filter);
  };

  const getTotalAmount = () => {
    return getFilteredData().reduce((sum, item) => sum + item.amount, 0);
  };

  const getStatusCount = (status: "received" | "pending" | "overdue") => {
    return revenueData.filter((item) => item.status === status).length;
  };

  useEffect(() => {
    loadRevenueData();
  }, [selectedPeriod]);

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="수입 관리" />
        <LoadingSpinner />
      </View>
    );
  }

  const filteredData = getFilteredData();

  return (
    <View style={styles.container}>
      <CommonHeader title="수입 관리" />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 기간 선택 */}
        <View style={styles.periodSelectorContainer}>
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            startDate={customStartDate}
            endDate={customEndDate}
            onStartDateChange={setCustomStartDate}
            onEndDateChange={setCustomEndDate}
            showCustomRange={true}
            onSearch={loadRevenueData}
            showSearchButton={selectedPeriod === "custom"}
          />
        </View>

        {/* 통계 요약 */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>총 수입</Text>
            <Text style={styles.summaryAmount}>
              {getTotalAmount().toLocaleString()}원
            </Text>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>수입완료</Text>
              <Text style={[styles.statValue, { color: Theme.colors.success }]}>
                {getStatusCount("received")}건
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>대기중</Text>
              <Text style={[styles.statValue, { color: Theme.colors.warning }]}>
                {getStatusCount("pending")}건
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>연체</Text>
              <Text style={[styles.statValue, { color: Theme.colors.error }]}>
                {getStatusCount("overdue")}건
              </Text>
            </View>
          </View>
        </View>

        {/* 필터 버튼 */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "all" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === "all" && styles.filterButtonTextActive,
              ]}
            >
              전체
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "received" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("received")}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === "received" && styles.filterButtonTextActive,
              ]}
            >
              수입완료
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "pending" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("pending")}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === "pending" && styles.filterButtonTextActive,
              ]}
            >
              대기중
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === "overdue" && styles.filterButtonActive,
            ]}
            onPress={() => setFilter("overdue")}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === "overdue" && styles.filterButtonTextActive,
              ]}
            >
              연체
            </Text>
          </TouchableOpacity>
        </View>

        {/* 수입 목록 */}
        {filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="cash-outline"
              size={80}
              color={Theme.colors.text.secondary}
            />
            <Text style={styles.emptyTitle}>수입 데이터가 없습니다</Text>
            <Text style={styles.emptyDescription}>
              거래처를 등록하고 스케줄을 생성하면 수입 정보가 표시됩니다.
            </Text>
          </View>
        ) : (
          <View style={styles.revenueList}>
            {filteredData.map((item) => (
              <View key={item.id} style={styles.revenueCard}>
                {/* 거래처 정보 헤더 */}
                <View style={styles.clientHeader}>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{item.clientName}</Text>
                    <Text style={styles.scheduleTitle}>
                      {item.scheduleTitle}
                    </Text>
                  </View>
                  <View style={styles.statusContainer}>
                    {item.status === "received" && (
                      <View style={styles.receivedBadge}>
                        <Text style={styles.receivedText}>수입완료</Text>
                      </View>
                    )}
                    {item.status === "pending" && (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>대기중</Text>
                      </View>
                    )}
                    {item.status === "overdue" && (
                      <View style={styles.overdueBadge}>
                        <Text style={styles.overdueText}>연체</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* 수입 정보 */}
                <View style={styles.revenueInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>수입 금액</Text>
                    <Text style={styles.infoValue}>
                      {item.amount.toLocaleString()}원
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>마감일</Text>
                    <Text style={styles.infoValue}>
                      {dayjs(item.dueDate).format("YYYY-MM-DD")}
                    </Text>
                  </View>
                  {item.receivedDate && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>수입일</Text>
                      <Text style={styles.infoValue}>
                        {dayjs(item.receivedDate).format("YYYY-MM-DD")}
                      </Text>
                    </View>
                  )}
                </View>

                {/* 계좌 정보 및 액션 버튼 */}
                {item.client.bankAccount && (
                  <View style={styles.accountSection}>
                    <View style={styles.accountInfo}>
                      <Ionicons
                        name="card-outline"
                        size={16}
                        color={Theme.colors.text.secondary}
                      />
                      <Text style={styles.accountNumber}>
                        {item.client.bankAccount}
                      </Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() =>
                          copyAccountNumber(
                            item.client.bankAccount,
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
                          style={styles.receivedButton}
                          onPress={() => markAsReceived(item.id)}
                        >
                          <Ionicons
                            name="checkmark-outline"
                            size={16}
                            color="#fff"
                          />
                          <Text style={[styles.buttonText, { color: "#fff" }]}>
                            수입확인
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
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
    backgroundColor: "#f5f5f7", // Apple Compact soft gray background
  },
  content: {
    flex: 1,
  },
  periodSelectorContainer: {
    backgroundColor: "#f5f5f7",
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    color: "#86868b",
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1d1d1f",
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#86868b",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#86868b",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#1d1d1f",
    borderColor: "#1d1d1f",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#86868b",
  },
  filterButtonTextActive: {
    color: "#ffffff",
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  revenueCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
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
  statusContainer: {
    marginLeft: Theme.spacing.md,
  },
  receivedBadge: {
    backgroundColor: Theme.colors.success,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
  },
  receivedText: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.medium,
    color: "#fff",
  },
  pendingBadge: {
    backgroundColor: Theme.colors.warning,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
  },
  pendingText: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.medium,
    color: "#fff",
  },
  overdueBadge: {
    backgroundColor: Theme.colors.error,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
  },
  overdueText: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.medium,
    color: "#fff",
  },
  revenueInfo: {
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
  receivedButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    backgroundColor: Theme.colors.success,
    borderRadius: Theme.borderRadius.sm,
  },
  buttonText: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.medium,
    marginLeft: 4,
  },
});
