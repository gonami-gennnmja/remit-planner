import CommonHeader from "@/components/CommonHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Text } from "@/components/Themed";
import { Theme } from "@/constants/Theme";
import { getDatabase } from "@/database/platformDatabase";
import { Schedule, Worker } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Clipboard,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

interface UnpaidWorker {
  worker: Worker;
  schedule: Schedule;
  wage: number;
  fuelAllowance: number;
  otherAllowance: number;
  totalAmount: number;
  isWagePaid: boolean;
  isFuelPaid: boolean;
  isOtherPaid: boolean;
  isAllPaid: boolean;
  isExpanded: boolean;
}

interface ScheduleGroup {
  schedule: Schedule;
  workers: UnpaidWorker[];
  isExpanded: boolean;
}

interface WorkerGroup {
  worker: Worker;
  schedules: {
    schedule: Schedule;
    wage: number;
    fuelAllowance: number;
    otherAllowance: number;
    totalAmount: number;
    isWagePaid: boolean;
    isFuelPaid: boolean;
    isOtherPaid: boolean;
    isAllPaid: boolean;
  }[];
  totalAmount: number;
  isExpanded: boolean;
}

export default function UnpaidDetailsScreen() {
  const [scheduleGroups, setScheduleGroups] = useState<ScheduleGroup[]>([]);
  const [workerGroups, setWorkerGroups] = useState<WorkerGroup[]>([]);
  const [viewMode, setViewMode] = useState<"schedule" | "worker">("schedule");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnpaidData();
  }, []);

  const loadUnpaidData = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      await db.init();

      const allSchedules = await db.getAllSchedules();
      const allWorkers = await db.getAllWorkers();

      const scheduleGroupsMap = new Map<string, ScheduleGroup>();
      const workerGroupsMap = new Map<string, WorkerGroup>();

      allSchedules.forEach((schedule) => {
        const unpaidWorkers: UnpaidWorker[] = [];

        schedule.workers?.forEach((workerInfo) => {
          const periods = workerInfo.periods || [];
          const totalHours = periods.reduce((sum, period) => {
            const start = dayjs(period.start);
            const end = dayjs(period.end);
            return sum + end.diff(start, "hour", true);
          }, 0);

          const grossPay = workerInfo.worker.hourlyWage * totalHours;
          const tax = workerInfo.worker.taxWithheld ? grossPay * 0.033 : 0;
          const wage = Math.round(grossPay - tax);
          const fuelAllowance = workerInfo.worker.fuelAllowance || 0;
          const otherAllowance = workerInfo.worker.otherAllowance || 0;
          const totalAmount = wage + fuelAllowance + otherAllowance;

          // 지급 상태 확인
          const isWagePaid = (workerInfo as any).wagePaid || false;
          const isFuelPaid = (workerInfo as any).fuelPaid || false;
          const isOtherPaid = (workerInfo as any).otherPaid || false;
          const isAllPaid =
            isWagePaid &&
            (fuelAllowance === 0 || isFuelPaid) &&
            (otherAllowance === 0 || isOtherPaid);

          // 미지급인 경우만 추가
          if (!isAllPaid) {
            const unpaidWorker = {
              worker: workerInfo.worker,
              schedule,
              wage,
              fuelAllowance,
              otherAllowance,
              totalAmount,
              isWagePaid,
              isFuelPaid,
              isOtherPaid,
              isAllPaid,
              isExpanded: false,
            };

            unpaidWorkers.push(unpaidWorker);

            // 근로자별 그룹 생성
            if (!workerGroupsMap.has(workerInfo.worker.id)) {
              workerGroupsMap.set(workerInfo.worker.id, {
                worker: workerInfo.worker,
                schedules: [],
                totalAmount: 0,
                isExpanded: false,
              });
            }

            const workerGroup = workerGroupsMap.get(workerInfo.worker.id)!;
            workerGroup.schedules.push({
              schedule,
              wage,
              fuelAllowance,
              otherAllowance,
              totalAmount,
              isWagePaid,
              isFuelPaid,
              isOtherPaid,
              isAllPaid,
            });
            workerGroup.totalAmount += totalAmount;
          }
        });

        // 미지급 근로자가 있는 스케줄만 추가
        if (unpaidWorkers.length > 0) {
          scheduleGroupsMap.set(schedule.id, {
            schedule,
            workers: unpaidWorkers,
            isExpanded: false,
          });
        }
      });

      setScheduleGroups(Array.from(scheduleGroupsMap.values()));
      setWorkerGroups(Array.from(workerGroupsMap.values()));
    } catch (error) {
      console.error("Failed to load unpaid data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyAccountNumber = (accountNumber: string, workerName: string) => {
    Clipboard.setString(accountNumber);
    Alert.alert("복사 완료", `${workerName}의 계좌번호가 복사되었습니다.`);
  };

  const makePhoneCall = (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl);
  };

  const sendSMS = (phoneNumber: string) => {
    const smsUrl = `sms:${phoneNumber}`;
    Linking.openURL(smsUrl);
  };

  const transferMoney = (worker: Worker, amount: number) => {
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

  const toggleSchedule = (scheduleId: string) => {
    setScheduleGroups((prev) =>
      prev.map((group) =>
        group.schedule.id === scheduleId
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };

  const toggleWorker = (scheduleId: string, workerId: string) => {
    setScheduleGroups((prev) =>
      prev.map((group) => {
        if (group.schedule.id === scheduleId) {
          return {
            ...group,
            workers: group.workers.map((worker) =>
              worker.worker.id === workerId
                ? { ...worker, isExpanded: !worker.isExpanded }
                : worker
            ),
          };
        }
        return group;
      })
    );
  };

  const toggleWorkerGroup = (workerId: string) => {
    setWorkerGroups((prev) =>
      prev.map((group) =>
        group.worker.id === workerId
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };

  const markAsPaid = async (
    worker: Worker,
    schedule: Schedule,
    type: "wage" | "fuel" | "other"
  ) => {
    const typeName =
      type === "wage" ? "급여" : type === "fuel" ? "유류비" : "기타비용";

    Alert.alert(
      "지급 완료 확인",
      `${worker.name}님의 ${typeName} 지급을 완료하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "확인",
          onPress: async () => {
            try {
              // TODO: 실제 지급 완료 처리 (DB 업데이트)
              Alert.alert("지급 완료", `${typeName} 지급이 완료되었습니다.`);

              // UI에서 즉시 업데이트
              setScheduleGroups((prev) => {
                return prev
                  .map((group) => {
                    if (group.schedule.id === schedule.id) {
                      const updatedWorkers = group.workers
                        .map((workerData) => {
                          if (workerData.worker.id === worker.id) {
                            const updatedWorker = { ...workerData };
                            if (type === "wage")
                              updatedWorker.isWagePaid = true;
                            if (type === "fuel")
                              updatedWorker.isFuelPaid = true;
                            if (type === "other")
                              updatedWorker.isOtherPaid = true;

                            // 전체 지급 완료 여부 재계산
                            updatedWorker.isAllPaid =
                              updatedWorker.isWagePaid &&
                              (updatedWorker.fuelAllowance === 0 ||
                                updatedWorker.isFuelPaid) &&
                              (updatedWorker.otherAllowance === 0 ||
                                updatedWorker.isOtherPaid);

                            return updatedWorker;
                          }
                          return workerData;
                        })
                        .filter((workerData) => !workerData.isAllPaid); // 전체 지급 완료된 근로자는 제거

                      return { ...group, workers: updatedWorkers };
                    }
                    return group;
                  })
                  .filter((group) => group.workers.length > 0); // 근로자가 없는 스케줄은 제거
              });
            } catch (error) {
              Alert.alert("오류", "지급 처리 중 오류가 발생했습니다.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="미지급 금액 상세" />
        <LoadingSpinner message="미지급 데이터를 불러오는 중..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader title="미지급 금액 상세" />

      {/* 뷰 모드 선택 */}
      <View style={styles.viewModeSelector}>
        <Pressable
          style={[
            styles.viewModeButton,
            viewMode === "schedule" && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode("schedule")}
        >
          <Text
            style={[
              styles.viewModeText,
              viewMode === "schedule" && styles.viewModeTextActive,
            ]}
          >
            스케줄별
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.viewModeButton,
            viewMode === "worker" && styles.viewModeButtonActive,
          ]}
          onPress={() => setViewMode("worker")}
        >
          <Text
            style={[
              styles.viewModeText,
              viewMode === "worker" && styles.viewModeTextActive,
            ]}
          >
            근로자별
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={isWeb ? styles.contentContainerWeb : undefined}
      >
        {(
          viewMode === "schedule"
            ? scheduleGroups.length === 0
            : workerGroups.length === 0
        ) ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="checkmark-circle"
              size={80}
              color={Theme.colors.success}
            />
            <Text style={styles.emptyTitle}>미지급 금액이 없습니다</Text>
            <Text style={styles.emptyDescription}>
              모든 근로자의 급여가 지급 완료되었습니다.
            </Text>
          </View>
        ) : viewMode === "schedule" ? (
          <View style={styles.scheduleList}>
            {scheduleGroups.map((group) => (
              <View key={group.schedule.id} style={styles.scheduleCard}>
                {/* 스케줄 헤더 (토글 가능) */}
                <Pressable
                  style={styles.scheduleHeader}
                  onPress={() => toggleSchedule(group.schedule.id)}
                >
                  <View style={styles.scheduleHeaderContent}>
                    <View style={styles.scheduleInfo}>
                      <Text style={styles.scheduleTitle}>
                        {group.schedule.title}
                      </Text>
                      <Text style={styles.scheduleDate}>
                        {dayjs(group.schedule.startDate).format("MM.DD")} -{" "}
                        {dayjs(group.schedule.endDate).format("MM.DD")}
                      </Text>
                      <Text style={styles.workerCount}>
                        미지급 근로자 {group.workers.length}명
                      </Text>
                    </View>
                    <Ionicons
                      name={group.isExpanded ? "chevron-up" : "chevron-down"}
                      size={24}
                      color={Theme.colors.text.secondary}
                    />
                  </View>
                </Pressable>

                {/* 근로자 목록 (토글됨) */}
                {group.isExpanded && (
                  <View style={styles.workersList}>
                    {group.workers.map((workerData) => (
                      <View
                        key={workerData.worker.id}
                        style={styles.workerCard}
                      >
                        {/* 근로자 헤더 (토글 가능) */}
                        <Pressable
                          style={styles.workerHeader}
                          onPress={() =>
                            toggleWorker(
                              group.schedule.id,
                              workerData.worker.id
                            )
                          }
                        >
                          <View style={styles.workerHeaderContent}>
                            <View style={styles.workerInfo}>
                              <Text style={styles.workerName}>
                                {workerData.worker.name}
                              </Text>
                              <Text style={styles.workerPhone}>
                                {workerData.worker.phone}
                              </Text>
                              <Text style={styles.totalAmountText}>
                                총 {workerData.totalAmount.toLocaleString()}원
                              </Text>
                            </View>
                            <View style={styles.workerHeaderRight}>
                              <View style={styles.contactButtons}>
                                <Pressable
                                  style={styles.contactButton}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    makePhoneCall(workerData.worker.phone);
                                  }}
                                >
                                  <Ionicons
                                    name="call-outline"
                                    size={16}
                                    color={Theme.colors.primary}
                                  />
                                </Pressable>
                                <Pressable
                                  style={styles.contactButton}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    sendSMS(workerData.worker.phone);
                                  }}
                                >
                                  <Ionicons
                                    name="chatbubble-outline"
                                    size={16}
                                    color={Theme.colors.primary}
                                  />
                                </Pressable>
                              </View>
                              <Ionicons
                                name={
                                  workerData.isExpanded
                                    ? "chevron-up"
                                    : "chevron-down"
                                }
                                size={20}
                                color={Theme.colors.text.secondary}
                              />
                            </View>
                          </View>
                        </Pressable>

                        {/* 근로자 상세 정보 (토글됨) */}
                        {workerData.isExpanded && (
                          <View style={styles.workerDetails}>
                            {/* 계좌 정보 */}
                            {workerData.worker.bankAccount && (
                              <View style={styles.accountSection}>
                                <View style={styles.accountInfo}>
                                  <Ionicons
                                    name="card-outline"
                                    size={16}
                                    color={Theme.colors.text.secondary}
                                  />
                                  <Text style={styles.bankName}>
                                    {workerData.worker.bankName || "은행"}
                                  </Text>
                                  <Text style={styles.accountNumber}>
                                    {workerData.worker.bankAccount}
                                  </Text>
                                </View>
                                <View style={styles.accountButtons}>
                                  <Pressable
                                    style={styles.copyButton}
                                    onPress={() =>
                                      copyAccountNumber(
                                        workerData.worker.bankAccount,
                                        workerData.worker.name
                                      )
                                    }
                                  >
                                    <Ionicons
                                      name="copy-outline"
                                      size={16}
                                      color={Theme.colors.primary}
                                    />
                                    <Text style={styles.buttonText}>복사</Text>
                                  </Pressable>
                                  <Pressable
                                    style={styles.transferButton}
                                    onPress={() =>
                                      transferMoney(
                                        workerData.worker,
                                        workerData.totalAmount
                                      )
                                    }
                                  >
                                    <Ionicons
                                      name="send-outline"
                                      size={16}
                                      color="white"
                                    />
                                    <Text
                                      style={[
                                        styles.buttonText,
                                        { color: "white" },
                                      ]}
                                    >
                                      송금
                                    </Text>
                                  </Pressable>
                                </View>
                              </View>
                            )}

                            {/* 급여 내역 */}
                            <View style={styles.paymentDetails}>
                              {/* 기본 급여 */}
                              <View style={styles.paymentItem}>
                                <View style={styles.paymentInfo}>
                                  <Text style={styles.paymentLabel}>
                                    기본 급여
                                  </Text>
                                  <Text style={styles.paymentAmount}>
                                    {workerData.wage.toLocaleString()}원
                                  </Text>
                                </View>
                                <Pressable
                                  style={[
                                    styles.switchContainer,
                                    workerData.isWagePaid &&
                                      styles.switchActive,
                                  ]}
                                  onPress={() =>
                                    markAsPaid(
                                      workerData.worker,
                                      workerData.schedule,
                                      "wage"
                                    )
                                  }
                                >
                                  <Animated.View
                                    style={[
                                      styles.switchThumb,
                                      {
                                        transform: [
                                          {
                                            translateX: workerData.isWagePaid
                                              ? 20
                                              : 0,
                                          },
                                        ],
                                      },
                                    ]}
                                  />
                                </Pressable>
                              </View>

                              {/* 유류비 */}
                              {workerData.fuelAllowance > 0 && (
                                <View style={styles.paymentItem}>
                                  <View style={styles.paymentInfo}>
                                    <Text style={styles.paymentLabel}>
                                      유류비
                                    </Text>
                                    <Text style={styles.paymentAmount}>
                                      {workerData.fuelAllowance.toLocaleString()}
                                      원
                                    </Text>
                                  </View>
                                  <Pressable
                                    style={[
                                      styles.switchContainer,
                                      workerData.isFuelPaid &&
                                        styles.switchActive,
                                    ]}
                                    onPress={() =>
                                      markAsPaid(
                                        workerData.worker,
                                        workerData.schedule,
                                        "fuel"
                                      )
                                    }
                                  >
                                    <Animated.View
                                      style={[
                                        styles.switchThumb,
                                        {
                                          transform: [
                                            {
                                              translateX: workerData.isFuelPaid
                                                ? 20
                                                : 0,
                                            },
                                          ],
                                        },
                                      ]}
                                    />
                                  </Pressable>
                                </View>
                              )}

                              {/* 기타 비용 */}
                              {workerData.otherAllowance > 0 && (
                                <View style={styles.paymentItem}>
                                  <View style={styles.paymentInfo}>
                                    <Text style={styles.paymentLabel}>
                                      기타 비용
                                    </Text>
                                    <Text style={styles.paymentAmount}>
                                      {workerData.otherAllowance.toLocaleString()}
                                      원
                                    </Text>
                                  </View>
                                  <Pressable
                                    style={[
                                      styles.switchContainer,
                                      workerData.isOtherPaid &&
                                        styles.switchActive,
                                    ]}
                                    onPress={() =>
                                      markAsPaid(
                                        workerData.worker,
                                        workerData.schedule,
                                        "other"
                                      )
                                    }
                                  >
                                    <Animated.View
                                      style={[
                                        styles.switchThumb,
                                        {
                                          transform: [
                                            {
                                              translateX: workerData.isOtherPaid
                                                ? 20
                                                : 0,
                                            },
                                          ],
                                        },
                                      ]}
                                    />
                                  </Pressable>
                                </View>
                              )}
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.workerList}>
            {workerGroups.map((group) => (
              <View key={group.worker.id} style={styles.workerCard}>
                {/* 근로자 헤더 (토글 가능) */}
                <Pressable
                  style={styles.workerHeader}
                  onPress={() => toggleWorkerGroup(group.worker.id)}
                >
                  <View style={styles.workerHeaderContent}>
                    <View style={styles.workerInfo}>
                      <Text style={styles.workerName}>{group.worker.name}</Text>
                      <Text style={styles.workerPhone}>
                        {group.worker.phone}
                      </Text>
                      <Text style={styles.totalAmountText}>
                        총 {group.totalAmount.toLocaleString()}원
                      </Text>
                    </View>
                    <View style={styles.workerHeaderRight}>
                      <View style={styles.contactButtons}>
                        <Pressable
                          style={styles.contactButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            makePhoneCall(group.worker.phone);
                          }}
                        >
                          <Ionicons
                            name="call-outline"
                            size={16}
                            color={Theme.colors.primary}
                          />
                        </Pressable>
                        <Pressable
                          style={styles.contactButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            sendSMS(group.worker.phone);
                          }}
                        >
                          <Ionicons
                            name="chatbubble-outline"
                            size={16}
                            color={Theme.colors.primary}
                          />
                        </Pressable>
                      </View>
                      <Ionicons
                        name={group.isExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={Theme.colors.text.secondary}
                      />
                    </View>
                  </View>
                </Pressable>

                {/* 근로자 상세 정보 (토글됨) */}
                {group.isExpanded && (
                  <View style={styles.workerDetails}>
                    {/* 계좌 정보 */}
                    {group.worker.bankAccount && (
                      <View style={styles.accountSection}>
                        <View style={styles.accountInfo}>
                          <Ionicons
                            name="card-outline"
                            size={16}
                            color={Theme.colors.text.secondary}
                          />
                          <Text style={styles.bankName}>
                            {group.worker.bankName || "은행"}
                          </Text>
                          <Text style={styles.accountNumber}>
                            {group.worker.bankAccount}
                          </Text>
                        </View>
                        <View style={styles.accountButtons}>
                          <Pressable
                            style={styles.copyButton}
                            onPress={() =>
                              copyAccountNumber(
                                group.worker.bankAccount,
                                group.worker.name
                              )
                            }
                          >
                            <Ionicons
                              name="copy-outline"
                              size={20}
                              color={Theme.colors.primary}
                            />
                          </Pressable>
                          <Pressable
                            style={styles.transferButton}
                            onPress={() =>
                              transferMoney(group.worker, group.totalAmount)
                            }
                          >
                            <Ionicons
                              name="send-outline"
                              size={20}
                              color="white"
                            />
                          </Pressable>
                        </View>
                      </View>
                    )}

                    {/* 스케줄별 급여 내역 */}
                    <View style={styles.scheduleDetails}>
                      {group.schedules.map((scheduleData, index) => (
                        <View
                          key={scheduleData.schedule.id}
                          style={styles.scheduleSection}
                        >
                          <View style={styles.scheduleHeader}>
                            <Text style={styles.scheduleTitle}>
                              {scheduleData.schedule.title}
                            </Text>
                            <Text style={styles.scheduleDate}>
                              {dayjs(scheduleData.schedule.startDate).format(
                                "MM.DD"
                              )}{" "}
                              -{" "}
                              {dayjs(scheduleData.schedule.endDate).format(
                                "MM.DD"
                              )}
                            </Text>
                          </View>

                          <View style={styles.paymentDetails}>
                            {/* 기본 급여 */}
                            {scheduleData.wage > 0 && (
                              <View style={styles.paymentItem}>
                                <View style={styles.paymentInfo}>
                                  <Text style={styles.paymentLabel}>
                                    기본 급여
                                  </Text>
                                  <Text style={styles.paymentAmount}>
                                    {scheduleData.wage.toLocaleString()}원
                                  </Text>
                                </View>
                                <Pressable
                                  style={[
                                    styles.switchContainer,
                                    scheduleData.isWagePaid &&
                                      styles.switchActive,
                                  ]}
                                  onPress={() =>
                                    markAsPaid(
                                      group.worker,
                                      scheduleData.schedule,
                                      "wage"
                                    )
                                  }
                                >
                                  <Animated.View
                                    style={[
                                      styles.switchThumb,
                                      {
                                        transform: [
                                          {
                                            translateX: scheduleData.isWagePaid
                                              ? 20
                                              : 0,
                                          },
                                        ],
                                      },
                                    ]}
                                  />
                                </Pressable>
                              </View>
                            )}

                            {/* 유류비 */}
                            {scheduleData.fuelAllowance > 0 && (
                              <View style={styles.paymentItem}>
                                <View style={styles.paymentInfo}>
                                  <Text style={styles.paymentLabel}>
                                    유류비
                                  </Text>
                                  <Text style={styles.paymentAmount}>
                                    {scheduleData.fuelAllowance.toLocaleString()}
                                    원
                                  </Text>
                                </View>
                                <Pressable
                                  style={[
                                    styles.switchContainer,
                                    scheduleData.isFuelPaid &&
                                      styles.switchActive,
                                  ]}
                                  onPress={() =>
                                    markAsPaid(
                                      group.worker,
                                      scheduleData.schedule,
                                      "fuel"
                                    )
                                  }
                                >
                                  <Animated.View
                                    style={[
                                      styles.switchThumb,
                                      {
                                        transform: [
                                          {
                                            translateX: scheduleData.isFuelPaid
                                              ? 20
                                              : 0,
                                          },
                                        ],
                                      },
                                    ]}
                                  />
                                </Pressable>
                              </View>
                            )}

                            {/* 기타 비용 */}
                            {scheduleData.otherAllowance > 0 && (
                              <View style={styles.paymentItem}>
                                <View style={styles.paymentInfo}>
                                  <Text style={styles.paymentLabel}>
                                    기타 비용
                                  </Text>
                                  <Text style={styles.paymentAmount}>
                                    {scheduleData.otherAllowance.toLocaleString()}
                                    원
                                  </Text>
                                </View>
                                <Pressable
                                  style={[
                                    styles.switchContainer,
                                    scheduleData.isOtherPaid &&
                                      styles.switchActive,
                                  ]}
                                  onPress={() =>
                                    markAsPaid(
                                      group.worker,
                                      scheduleData.schedule,
                                      "other"
                                    )
                                  }
                                >
                                  <Animated.View
                                    style={[
                                      styles.switchThumb,
                                      {
                                        transform: [
                                          {
                                            translateX: scheduleData.isOtherPaid
                                              ? 20
                                              : 0,
                                          },
                                        ],
                                      },
                                    ]}
                                  />
                                </Pressable>
                              </View>
                            )}

                            {/* 스케줄별 총액 */}
                            <View
                              style={[styles.paymentItem, styles.totalItem]}
                            >
                              <View style={styles.paymentInfo}>
                                <Text style={styles.totalLabel}>
                                  스케줄 총액
                                </Text>
                                <Text style={styles.totalAmount}>
                                  {scheduleData.totalAmount.toLocaleString()}원
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
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
    backgroundColor: Theme.colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainerWeb: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
    padding: Theme.spacing.xl,
  },
  viewModeSelector: {
    flexDirection: "row",
    marginHorizontal: Theme.spacing.lg,
    marginVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
  },
  viewModeButtonActive: {
    backgroundColor: Theme.colors.primary,
  },
  viewModeText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.secondary,
  },
  viewModeTextActive: {
    color: "white",
  },
  workerList: {
    padding: Theme.spacing.lg,
  },
  scheduleDetails: {
    paddingTop: Theme.spacing.sm,
  },
  scheduleSection: {
    marginBottom: Theme.spacing.md,
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.lg,
    borderWidth: 0,
    ...Theme.shadows.xs,
    elevation: 1,
  },
  scheduleHeader: {
    marginBottom: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  scheduleTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  scheduleDate: {
    fontSize: Theme.typography.sizes.sm,
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
  scheduleList: {
    padding: Theme.spacing.lg,
  },
  scheduleCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.xl,
    marginBottom: Theme.spacing.lg,
    borderWidth: 0,
    ...Theme.shadows.md,
    elevation: 3,
  },
  scheduleHeader: {
    padding: Theme.spacing.lg,
  },
  scheduleHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  scheduleDate: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  workerCount: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  workersList: {
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  workerCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 0,
    ...Theme.shadows.sm,
    elevation: 2,
  },
  workerHeader: {
    padding: Theme.spacing.md,
  },
  workerHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  workerPhone: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  totalAmountText: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.primary,
  },
  workerHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  workerDetails: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
  },
  contactButtons: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
  },
  contactButton: {
    padding: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
  },
  accountSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bankName: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    marginLeft: Theme.spacing.sm,
    marginRight: Theme.spacing.xs,
  },
  accountNumber: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    fontFamily: "monospace",
  },
  accountButtons: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
  },
  copyButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.sm,
  },
  transferButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.sm,
  },
  paymentDetails: {
    gap: Theme.spacing.xs,
  },
  paymentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Theme.spacing.xs,
  },
  totalItem: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
    marginTop: Theme.spacing.sm,
    paddingTop: Theme.spacing.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: 2,
  },
  paymentAmount: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
  },
  totalLabel: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.primary,
  },
  // 아이폰 스타일 토글 스위치
  switchContainer: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: Theme.colors.border.medium,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: Theme.colors.primary,
  },
  switchThumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
