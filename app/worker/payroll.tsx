// @ts-nocheck
import CommonHeader from "@/components/CommonHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import PeriodSelector, { PeriodType } from "@/components/PeriodSelector";
import { Text } from "@/components/Themed";
import { database } from "@/database";
import { Schedule, ScheduleWorker, Worker } from "@/models/types";
import { formatAccountNumber } from "@/utils/bankUtils";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Clipboard,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// 스케줄별 근로자 데이터 구조
interface ScheduleWorkerData {
  schedule: Schedule;
  workers: Array<{
    worker: Worker;
    scheduleWorker: ScheduleWorker;
    basePay: number;
    fuelAllowance: number;
    otherAllowance: number;
    totalPay: number;
    isBasePayPaid: boolean;
    isFuelAllowancePaid: boolean;
    isOtherAllowancePaid: boolean;
    isFullyPaid: boolean;
  }>;
}

// 근로자별 스케줄 데이터 구조
interface WorkerScheduleData {
  worker: Worker;
  schedules: Array<{
    schedule: Schedule;
    scheduleWorker: ScheduleWorker;
    basePay: number;
    fuelAllowance: number;
    otherAllowance: number;
    totalPay: number;
    isBasePayPaid: boolean;
    isFuelAllowancePaid: boolean;
    isOtherAllowancePaid: boolean;
    isFullyPaid: boolean;
  }>;
}

// 반응형 스타일 헬퍼 함수
const getResponsiveSize = (mobile: number, tablet: number, desktop: number) => {
  const { width } = Dimensions.get("window");
  if (width >= 1024) return desktop;
  if (width >= 768) return tablet;
  return mobile;
};

const getResponsivePadding = () => {
  const { width } = Dimensions.get("window");
  if (width >= 1024) return 40;
  if (width >= 768) return 30;
  return 20;
};

const getMaxWidth = () => {
  const { width } = Dimensions.get("window");
  if (width >= 1024) return 1200;
  return width;
};

export default function PayrollScreen() {
  const [allScheduleWorkerData, setAllScheduleWorkerData] = useState<
    ScheduleWorkerData[]
  >([]);
  const [allWorkerScheduleData, setAllWorkerScheduleData] = useState<
    WorkerScheduleData[]
  >([]);
  const [scheduleWorkerData, setScheduleWorkerData] = useState<
    ScheduleWorkerData[]
  >([]);
  const [workerScheduleData, setWorkerScheduleData] = useState<
    WorkerScheduleData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [viewMode, setViewMode] = useState<"schedule" | "worker">("schedule");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedScheduleWorker, setSelectedScheduleWorker] =
    useState<any>(null);

  const loadPayrollData = async () => {
    try {
      setLoading(true);

      const workers = await database.getAllWorkers();
      const allSchedules = await database.getAllSchedules();

      const today = dayjs();
      let filteredSchedules = allSchedules;

      switch (selectedPeriod) {
        case "week":
          filteredSchedules = allSchedules.filter((s) => {
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
          filteredSchedules = allSchedules.filter((s) => {
            const scheduleDate = dayjs(s.startDate);
            return (
              scheduleDate.isSameOrAfter(startOfMonth) &&
              scheduleDate.isSameOrBefore(endOfMonth)
            );
          });
          break;
        case "year":
          filteredSchedules = allSchedules.filter((s) => {
            const scheduleDate = dayjs(s.startDate);
            return (
              scheduleDate.isSameOrAfter(today.startOf("year")) &&
              scheduleDate.isSameOrBefore(today.endOf("year"))
            );
          });
          break;
        case "custom":
          if (customStartDate && customEndDate) {
            filteredSchedules = allSchedules.filter((s) => {
              const scheduleDate = dayjs(s.startDate);
              return (
                scheduleDate.isSameOrAfter(dayjs(customStartDate)) &&
                scheduleDate.isSameOrBefore(dayjs(customEndDate))
              );
            });
          }
          break;
      }

      // 스케줄별 근로자 데이터 구성
      const scheduleWorkerMap = new Map<string, ScheduleWorkerData>();

      for (const schedule of filteredSchedules) {
        const scheduleWorkers = [];

        if (schedule.workers) {
          for (const scheduleWorker of schedule.workers) {
            const worker = workers.find(
              (w) => w.id === scheduleWorker.worker?.id
            );
            if (!worker) continue;

            const periods = scheduleWorker.periods || [];
            const hours = periods.reduce((sum, period) => {
              const start = dayjs(period.start);
              const end = dayjs(period.end);
              return sum + end.diff(start, "hour", true);
            }, 0);

            const hourlyWage = scheduleWorker.hourlyWage || worker.hourlyWage;
            const fuelAllowance = scheduleWorker.fuelAllowance || 0;
            const otherAllowance = scheduleWorker.otherAllowance || 0;
            const taxWithheld = scheduleWorker.taxWithheld || 0;

            const basePay = hourlyWage * hours - taxWithheld;
            const totalPay = basePay + fuelAllowance + otherAllowance;

            const isBasePayPaid = scheduleWorker.paid || false;
            const isFuelAllowancePaid = scheduleWorker.paid || false;
            const isOtherAllowancePaid = scheduleWorker.paid || false;
            const isFullyPaid =
              isBasePayPaid && isFuelAllowancePaid && isOtherAllowancePaid;

            scheduleWorkers.push({
              worker,
              scheduleWorker,
              basePay,
              fuelAllowance,
              otherAllowance,
              totalPay,
              isBasePayPaid,
              isFuelAllowancePaid,
              isOtherAllowancePaid,
              isFullyPaid,
            });
          }
        }

        if (scheduleWorkers.length > 0) {
          scheduleWorkerMap.set(schedule.id, {
            schedule,
            workers: scheduleWorkers,
          });
        }
      }

      // 근로자별 스케줄 데이터 구성
      const workerScheduleMap = new Map<string, WorkerScheduleData>();

      for (const worker of workers) {
        const workerSchedules = [];

        for (const schedule of filteredSchedules) {
          const scheduleWorker = schedule.workers?.find(
            (w) => w.worker?.id === worker.id
          );
          if (!scheduleWorker) continue;

          const periods = scheduleWorker.periods || [];
          const hours = periods.reduce((sum, period) => {
            const start = dayjs(period.start);
            const end = dayjs(period.end);
            return sum + end.diff(start, "hour", true);
          }, 0);

          const hourlyWage = scheduleWorker.hourlyWage || worker.hourlyWage;
          const fuelAllowance = scheduleWorker.fuelAllowance || 0;
          const otherAllowance = scheduleWorker.otherAllowance || 0;
          const taxWithheld = scheduleWorker.taxWithheld || 0;

          const basePay = hourlyWage * hours - taxWithheld;
          const totalPay = basePay + fuelAllowance + otherAllowance;

          const isBasePayPaid = scheduleWorker.paid || false;
          const isFuelAllowancePaid = scheduleWorker.paid || false;
          const isOtherAllowancePaid = scheduleWorker.paid || false;
          const isFullyPaid =
            isBasePayPaid && isFuelAllowancePaid && isOtherAllowancePaid;

          workerSchedules.push({
            schedule,
            scheduleWorker,
            basePay,
            fuelAllowance,
            otherAllowance,
            totalPay,
            isBasePayPaid,
            isFuelAllowancePaid,
            isOtherAllowancePaid,
            isFullyPaid,
          });
        }

        if (workerSchedules.length > 0) {
          workerScheduleMap.set(worker.id, {
            worker,
            schedules: workerSchedules,
          });
        }
      }

      setAllScheduleWorkerData(Array.from(scheduleWorkerMap.values()));
      setAllWorkerScheduleData(Array.from(workerScheduleMap.values()));

      // 초기 필터링 적용
      filterData(
        Array.from(scheduleWorkerMap.values()),
        Array.from(workerScheduleMap.values())
      );
    } catch (error) {
      console.error("급여 데이터 로드 오류:", error);
      Alert.alert("오류", "급여 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filterData = (
    allScheduleData: ScheduleWorkerData[],
    allWorkerData: WorkerScheduleData[]
  ) => {
    if (!searchQuery.trim()) {
      setScheduleWorkerData(allScheduleData);
      setWorkerScheduleData(allWorkerData);
      return;
    }

    const query = searchQuery.toLowerCase();

    // 스케줄별 데이터 필터링
    const filteredScheduleData = allScheduleData.filter((scheduleData) => {
      const scheduleTitle = scheduleData.schedule.title.toLowerCase();
      const workerNames = scheduleData.workers
        .map((w) => w.worker.name.toLowerCase())
        .join(" ");

      return scheduleTitle.includes(query) || workerNames.includes(query);
    });

    // 근로자별 데이터 필터링
    const filteredWorkerData = allWorkerData.filter((workerData) => {
      const workerName = workerData.worker.name.toLowerCase();
      const scheduleTitles = workerData.schedules
        .map((s) => s.schedule.title.toLowerCase())
        .join(" ");

      return workerName.includes(query) || scheduleTitles.includes(query);
    });

    setScheduleWorkerData(filteredScheduleData);
    setWorkerScheduleData(filteredWorkerData);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayrollData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadPayrollData();
  }, [selectedPeriod, customStartDate, customEndDate]);

  useEffect(() => {
    filterData(allScheduleWorkerData, allWorkerScheduleData);
  }, [searchQuery, allScheduleWorkerData, allWorkerScheduleData]);

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="급여 관리" />
        <LoadingSpinner />
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
        <View style={styles.periodSelectorContainer}>
          <PeriodSelector
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            startDate={customStartDate}
            endDate={customEndDate}
            onStartDateChange={setCustomStartDate}
            onEndDateChange={setCustomEndDate}
            showCustomRange={true}
          />
        </View>

        {/* 검색 입력 */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#86868b" />
            <TextInput
              style={styles.searchInput}
              placeholder="스케줄명이나 근로자명으로 검색..."
              placeholderTextColor="#86868b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery("")}
              >
                <Ionicons name="close-circle" size={20} color="#86868b" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 보기 전환 버튼 */}
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === "schedule" && styles.viewToggleButtonActive,
            ]}
            onPress={() => setViewMode("schedule")}
          >
            <Text
              style={[
                styles.viewToggleText,
                viewMode === "schedule" && styles.viewToggleTextActive,
              ]}
            >
              스케줄별 보기
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === "worker" && styles.viewToggleButtonActive,
            ]}
            onPress={() => setViewMode("worker")}
          >
            <Text
              style={[
                styles.viewToggleText,
                viewMode === "worker" && styles.viewToggleTextActive,
              ]}
            >
              근로자별 보기
            </Text>
          </TouchableOpacity>
        </View>

        {/* 데이터 표시 */}
        {viewMode === "schedule" ? (
          scheduleWorkerData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={80} color="#86868b" />
              <Text style={styles.emptyTitle}>급여 데이터가 없습니다</Text>
              <Text style={styles.emptyDescription}>
                기간을 선택하거나 검색어를 변경해보세요.
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {scheduleWorkerData.map((data) => (
                <ScheduleCard
                  key={data.schedule.id}
                  data={data}
                  onPress={() => {
                    setSelectedScheduleWorker(data);
                    setShowEditModal(true);
                  }}
                />
              ))}
            </View>
          )
        ) : workerScheduleData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={80} color="#86868b" />
            <Text style={styles.emptyTitle}>급여 데이터가 없습니다</Text>
            <Text style={styles.emptyDescription}>
              기간을 선택하거나 검색어를 변경해보세요.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {workerScheduleData.map((data) => (
              <WorkerCard
                key={data.worker.id}
                data={data}
                onPress={(scheduleWorker) => {
                  setSelectedScheduleWorker(scheduleWorker);
                  setShowEditModal(true);
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* 편집 모달 */}
      {showEditModal && selectedScheduleWorker && (
        <EditModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          data={selectedScheduleWorker}
          onRefresh={loadPayrollData}
        />
      )}
    </View>
  );
}

// 스케줄 카드 컴포넌트
const ScheduleCard = ({
  data,
  onPress,
}: {
  data: ScheduleWorkerData;
  onPress: () => void;
}) => {
  return (
    <Pressable style={styles.scheduleCard} onPress={onPress}>
      <View style={styles.scheduleHeader}>
        <Text style={styles.scheduleTitle}>{data.schedule.title}</Text>
        <Text style={styles.scheduleDate}>
          {dayjs(data.schedule.startDate).format("YYYY-MM-DD")} ~{" "}
          {dayjs(data.schedule.endDate).format("YYYY-MM-DD")}
        </Text>
      </View>
      <Text style={styles.workersCount}>근로자 {data.workers.length}명</Text>
    </Pressable>
  );
};

// 근로자 카드 컴포넌트
const WorkerCard = ({
  data,
  onPress,
}: {
  data: WorkerScheduleData;
  onPress: (scheduleWorker: any) => void;
}) => {
  return (
    <View style={styles.workerCard}>
      <View style={styles.workerHeader}>
        <Text style={styles.workerName}>{data.worker.name}</Text>
        <Text style={styles.schedulesCount}>
          스케줄 {data.schedules.length}개
        </Text>
      </View>
      {data.schedules.map((schedule) => (
        <Pressable
          key={schedule.schedule.id}
          style={styles.workerScheduleItem}
          onPress={() =>
            onPress({
              schedule: schedule.schedule,
              worker: data.worker,
              scheduleWorker: schedule.scheduleWorker,
              ...schedule,
            })
          }
        >
          <Text style={styles.workerScheduleTitle}>
            {schedule.schedule.title}
          </Text>
          <Text style={styles.workerScheduleAmount}>
            총 {schedule.totalPay.toLocaleString()}원
          </Text>
        </Pressable>
      ))}
    </View>
  );
};

// 편집 모달 컴포넌트
const EditModal = ({ visible, onClose, data, onRefresh }: any) => {
  const [basePayPaid, setBasePayPaid] = useState(false);
  const [fuelPaid, setFuelPaid] = useState(false);
  const [otherPaid, setOtherPaid] = useState(false);

  useEffect(() => {
    if (data) {
      setBasePayPaid(data.isBasePayPaid || false);
      setFuelPaid(data.isFuelAllowancePaid || false);
      setOtherPaid(data.isOtherAllowancePaid || false);
    }
  }, [data]);

  const handleSave = async () => {
    try {
      Alert.alert("저장 확인", "급여 지급 상태를 변경하시겠습니까?", [
        { text: "취소", style: "cancel" },
        {
          text: "확인",
          onPress: async () => {
            // TODO: DB 업데이트
            // await database.updateScheduleWorker(data.scheduleWorker.id, {
            //   isBasePayPaid: basePayPaid,
            //   isFuelAllowancePaid: fuelPaid,
            //   isOtherAllowancePaid: otherPaid,
            // });
            Alert.alert("저장 완료", "급여 지급 상태가 업데이트되었습니다.");
            onRefresh();
            onClose();
          },
        },
      ]);
    } catch (error) {
      Alert.alert("오류", "저장 중 오류가 발생했습니다.");
    }
  };

  const makePhoneCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const sendSMS = (phoneNumber: string) => {
    Linking.openURL(`sms:${phoneNumber}`);
  };

  const copyAccountNumber = (accountNumber: string, workerName: string) => {
    Clipboard.setString(accountNumber);
    Alert.alert("복사 완료", `${workerName}의 계좌번호가 복사되었습니다.`);
  };

  if (!data) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>급여 지급 관리</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#1d1d1f" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>근로자 정보</Text>
            <Text style={styles.cardLabel}>이름</Text>
            <Text style={styles.cardValue}>{data.worker?.name}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.cardLabel}>전화번호</Text>
              <View style={styles.phoneIcons}>
                <TouchableOpacity
                  style={styles.phoneIcon}
                  onPress={() => makePhoneCall(data.worker?.phone)}
                >
                  <Ionicons name="call" size={18} color="#1d1d1f" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.phoneIcon}
                  onPress={() => sendSMS(data.worker?.phone)}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color="#1d1d1f"
                  />
                </TouchableOpacity>
              </View>
            </View>
            {data.worker?.bankAccount && (
              <>
                <Text style={styles.cardLabel}>계좌번호</Text>
                <View style={styles.accountRow}>
                  <Text style={styles.cardValue}>
                    {formatAccountNumber(data.worker.bankAccount)}
                  </Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() =>
                      copyAccountNumber(
                        data.worker.bankAccount,
                        data.worker.name
                      )
                    }
                  >
                    <Ionicons name="copy-outline" size={16} color="#1d1d1f" />
                    <Text style={styles.copyButtonText}>복사</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>급여 정보</Text>
            <Text style={styles.cardLabel}>스케줄</Text>
            <Text style={styles.cardValue}>{data.schedule?.title}</Text>
            <Text style={styles.cardLabel}>기간</Text>
            <Text style={styles.cardValue}>
              {dayjs(data.schedule?.startDate).format("YYYY-MM-DD")} ~{" "}
              {dayjs(data.schedule?.endDate).format("YYYY-MM-DD")}
            </Text>
          </View>

          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>지급 상태</Text>

            {data.basePay > 0 && (
              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.toggleLabel}>시급 급여</Text>
                  <Text style={styles.toggleAmount}>
                    {data.basePay.toLocaleString()}원
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    basePayPaid && styles.toggleButtonActive,
                  ]}
                  onPress={() => setBasePayPaid(!basePayPaid)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      basePayPaid && styles.toggleTextActive,
                    ]}
                  >
                    {basePayPaid ? "지급완료" : "미지급"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {data.fuelAllowance > 0 && (
              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.toggleLabel}>유류비</Text>
                  <Text style={styles.toggleAmount}>
                    {data.fuelAllowance.toLocaleString()}원
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    fuelPaid && styles.toggleButtonActive,
                  ]}
                  onPress={() => setFuelPaid(!fuelPaid)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      fuelPaid && styles.toggleTextActive,
                    ]}
                  >
                    {fuelPaid ? "지급완료" : "미지급"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {data.otherAllowance > 0 && (
              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.toggleLabel}>기타 급여</Text>
                  <Text style={styles.toggleAmount}>
                    {data.otherAllowance.toLocaleString()}원
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    otherPaid && styles.toggleButtonActive,
                  ]}
                  onPress={() => setOtherPaid(!otherPaid)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      otherPaid && styles.toggleTextActive,
                    ]}
                  >
                    {otherPaid ? "지급완료" : "미지급"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>저장</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  content: {
    flex: 1,
    maxWidth: getMaxWidth(),
    alignSelf: "center",
    width: "100%",
  },
  periodSelectorContainer: {
    backgroundColor: "#f5f5f7",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: "#f5f5f7",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1d1d1f",
  },
  clearButton: {
    padding: 4,
  },
  viewToggleContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 10,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#86868b",
    alignItems: "center",
  },
  viewToggleButtonActive: {
    backgroundColor: "#1d1d1f",
    borderColor: "#1d1d1f",
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#86868b",
  },
  viewToggleTextActive: {
    color: "#ffffff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1d1d1f",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#86868b",
    textAlign: "center",
  },
  listContainer: {
    padding: 20,
    gap: 12,
  },
  scheduleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  scheduleHeader: {
    marginBottom: 8,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1d1d1f",
    marginBottom: 4,
  },
  scheduleDate: {
    fontSize: 14,
    color: "#86868b",
  },
  workersCount: {
    fontSize: 14,
    color: "#86868b",
  },
  workerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  workerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  workerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1d1d1f",
  },
  schedulesCount: {
    fontSize: 14,
    color: "#86868b",
  },
  workerScheduleItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f7",
    borderRadius: 10,
    marginBottom: 8,
  },
  workerScheduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1d1d1f",
    marginBottom: 4,
  },
  workerScheduleAmount: {
    fontSize: 14,
    color: "#86868b",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1d1d1f",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1d1d1f",
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    color: "#86868b",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1d1d1f",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  phoneIcons: {
    flexDirection: "row",
    gap: 12,
  },
  phoneIcon: {
    padding: 8,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f5f5f7",
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1d1d1f",
    marginLeft: 4,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1d1d1f",
    marginBottom: 4,
  },
  toggleAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1d1d1f",
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f7",
    borderWidth: 1,
    borderColor: "#86868b",
  },
  toggleButtonActive: {
    backgroundColor: "#1d1d1f",
    borderColor: "#1d1d1f",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#86868b",
  },
  toggleTextActive: {
    color: "#ffffff",
  },
  saveButton: {
    backgroundColor: "#1d1d1f",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
