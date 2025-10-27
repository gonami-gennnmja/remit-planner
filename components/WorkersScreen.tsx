import CommonHeader from "@/components/CommonHeader";
import FileUpload from "@/components/FileUpload";
import { Theme } from "@/constants/Theme";
import { getDatabase } from "@/database/platformDatabase";
import {
  BankInfo,
  detectBankFromAccount,
  formatAccountNumber,
  formatPhoneNumber,
  KOREAN_BANKS,
} from "@/utils/bankUtils";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface Worker {
  id: string;
  userId: string;
  name: string;
  phone: string;
  residentNumber?: string; // 주민등록번호 (급여 지급 시에만 필수)
  bankAccount?: string; // 계좌번호 (급여 지급 시에만 필수)
  bankInfo?: BankInfo;
  hourlyWage: number;
  fuelAllowance: number; // 유류비 (월 고정)
  otherAllowance: number; // 기타비용
  // 파일 관련
  idCardImageUrl?: string; // 신분증 사진 URL
  idCardImagePath?: string; // 신분증 사진 경로
  workTags: string[];
  schedules: string[];
  memo?: string;
  createdAt?: string;
  updatedAt?: string;
  scheduleDetails?: Array<{
    id: string;
    title: string;
    date: string;
    description: string;
    category: string;
  }>;
  scheduleWages: Array<{
    scheduleTitle: string;
    hourlyWage: number;
    workHours: number;
    totalPay: number;
  }>;
}

interface WorkersScreenProps {
  schedules: any[];
  allWorkers?: any[];
  selectedScheduleId?: string | null;
  onAddWorker?: (worker: any) => void;
  onUpdateWorker?: (workerId: string, updates: any) => void;
  onDeleteWorker?: (id: string) => void;
  onBackPress?: () => void;
}

export default function WorkersScreen({
  schedules,
  allWorkers = [],
  selectedScheduleId = null,
  onAddWorker,
  onUpdateWorker,
  onDeleteWorker,
  onBackPress,
}: WorkersScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  // 근로자 추가/수정용 폼 상태
  const [workerForm, setWorkerForm] = useState({
    name: "",
    phone: "",
    residentNumber: "", // 주민등록번호
    bankAccount: "", // 계좌번호
    hourlyWage: "15000", // 기본값 15000원
    fuelAllowance: "0", // 유류비
    otherAllowance: "0", // 기타비용
    selectedBankCode: "",
    memo: "",
    // 파일 관련
    idCardImageUrl: "",
    idCardImagePath: "",
    // 근무시간 관련 (기존 호환성)
    workStartDate: "",
    workEndDate: "",
    workHours: 0,
    workMinutes: 0,
    isFullPeriodWork: true, // 전일정 근무 여부
    isSameWorkHoursDaily: true, // 매일 동일한 근무시간 여부
    dailyWorkTimes: [] as Array<{
      date: string;
      startTime: string;
      endTime: string;
    }>,
    // 스케줄 기본 시간
    defaultStartTime: "09:00",
    defaultEndTime: "18:00",
  });

  const [detectedBank, setDetectedBank] = useState<BankInfo | null>(null);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showScheduleDetailModal, setShowScheduleDetailModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  // 근로자별 참여일정 확장 상태
  const [expandedWorkers, setExpandedWorkers] = useState<
    Record<string, boolean>
  >({});
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState("");
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);

  // 새로 추가된 스케줄별 상세 정보
  const [newScheduleDetails, setNewScheduleDetails] = useState<{
    [scheduleId: string]: {
      workStartDate: string;
      workEndDate: string;
      workHours: number;
      workMinutes: number;
      hourlyWage: string;
      taxWithheld: boolean;
      paid: boolean;
    };
  }>({});

  // 스케줄 상세 정보 입력 단계 여부
  const [isScheduleDetailStep, setIsScheduleDetailStep] = useState(false);

  // 근로자 포지션 결정 함수
  const getWorkerPosition = (name: string) => {
    if (name.includes("선생")) return "강사";
    if (name.includes("개발")) return "개발자";
    if (name.includes("이벤트")) return "이벤트 담당";
    return "근로자";
  };

  // 근무 기간 텍스트 생성 함수
  const getWorkPeriodText = (worker: any) => {
    if (worker.scheduleWages && worker.scheduleWages.length > 0) {
      const firstWage = worker.scheduleWages[0];
      if (firstWage.workStartDate && firstWage.workEndDate) {
        return `${firstWage.workStartDate} ~ ${firstWage.workEndDate}`;
      }
    }
    return "스케줄 기간과 동일";
  };

  // 근무 시간 텍스트 생성 함수
  const getWorkTimeText = (worker: any) => {
    if (worker.scheduleWages && worker.scheduleWages.length > 0) {
      const firstWage = worker.scheduleWages[0];
      const workHours = firstWage.workHours || 0;
      const workMinutes = Math.round((workHours % 1) * 60);
      const workHoursInt = Math.floor(workHours);

      // 전일 근무이고 매일 동일한 경우
      if (firstWage.isFullPeriodWork && firstWage.isSameWorkHoursDaily) {
        const startTime = firstWage.startTime || "09:00";
        const endTime = firstWage.endTime || "18:00";
        return `${startTime} ~ ${endTime}\n총 ${workHoursInt}시간 ${workMinutes}분`;
      }

      // 전일 근무가 아니거나 매일 다른 경우
      if (firstWage.dailyWorkTimes && firstWage.dailyWorkTimes.length > 0) {
        return firstWage.dailyWorkTimes
          .map((day: any) => {
            const date = new Date(day.date).toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
            });
            return `${date}일: ${day.startTime} ~ ${day.endTime}`;
          })
          .join("\n");
      }

      // 기본 근무시간 표시
      return `총 ${workHoursInt}시간 ${workMinutes}분`;
    }
    return "근무시간 정보 없음";
  };

  // 계좌번호 변경 시 은행 자동 감지
  useEffect(() => {
    if (workerForm.bankAccount) {
      const bank = detectBankFromAccount(workerForm.bankAccount);
      setDetectedBank(bank);
      if (bank) {
        setWorkerForm((prev) => ({ ...prev, selectedBankCode: bank.code }));
        setShowBankPicker(false);
      } else {
        setShowBankPicker(true);
      }
    } else {
      setDetectedBank(null);
      setShowBankPicker(false);
    }
  }, [workerForm.bankAccount]);

  // 모든 근로자들을 처리 (allWorkers 우선, 없으면 schedules에서 추출)
  const processedWorkers = useMemo(() => {
    if (allWorkers && allWorkers.length > 0) {
      // allWorkers가 있으면 그것을 사용하고, schedules에서 참여 일정 정보 추가
      const result = allWorkers.map((worker: any) => {
        const bankInfo = detectBankFromAccount(worker.bankAccount);

        // 해당 근로자가 참여한 스케줄 찾기
        const participatedSchedules = (schedules || [])
          .filter((schedule) =>
            schedule.workers?.some(
              (workerInfo: any) => workerInfo.worker.id === worker.id
            )
          )
          .map((schedule) => ({
            id: schedule.id,
            title: schedule.title,
            date: schedule.date,
            startDate: schedule.startDate,
            endDate: schedule.endDate,
            description: schedule.description,
            category: schedule.category,
          }));

        return {
          id: worker.id,
          name: worker.name,
          phone: worker.phone,
          bankAccount: formatAccountNumber(worker.bankAccount),
          bankInfo: bankInfo,
          hourlyWage: worker.hourlyWage,
          taxWithheld: worker.taxWithheld,
          workTags: [],
          schedules: participatedSchedules.map((s) => s.title),
          scheduleDetails: participatedSchedules,
          scheduleWages: [],
          memo: worker.memo || "",
        };
      });
      return result;
    } else {
      // allWorkers가 없으면 기존 로직 사용
      const workerMap = new Map<string, Worker>();

      // schedules가 없거나 빈 배열인 경우 빈 배열 반환
      if (!schedules || schedules.length === 0) {
        return [];
      }

      (schedules || []).forEach((schedule) => {
        schedule.workers?.forEach((workerInfo: any) => {
          const workerId = workerInfo.worker.id;
          if (!workerMap.has(workerId)) {
            // 은행 정보 감지
            const bankInfo = detectBankFromAccount(
              workerInfo.worker.bankAccount
            );

            workerMap.set(workerId, {
              id: workerId,
              name: workerInfo.worker.name,
              phone: workerInfo.worker.phone,
              bankAccount: formatAccountNumber(workerInfo.worker.bankAccount),
              bankInfo: bankInfo || undefined,
              hourlyWage: workerInfo.worker.hourlyWage,
              taxWithheld: workerInfo.worker.taxWithheld,
              workTags: [],
              schedules: [],
              scheduleDetails: [],
              scheduleWages: [],
              memo: workerInfo.worker.memo || "",
            });
          }

          // 스케줄 정보 추가
          const worker = workerMap.get(workerId)!;
          if (!worker.schedules.includes(schedule.title)) {
            worker.schedules.push(schedule.title);

            // scheduleDetails에도 추가
            worker.scheduleDetails!.push({
              id: schedule.id,
              title: schedule.title,
              date: schedule.date,
              startDate: schedule.startDate,
              endDate: schedule.endDate,
              description: schedule.description,
              category: schedule.category,
            });

            // 일정별 시급 계산
            const workHours = workerInfo.periods.reduce(
              (total: number, period: any) => {
                const start = new Date(period.start);
                const end = new Date(period.end);
                return (
                  total + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
                ); // 시간 단위
              },
              0
            );

            const totalPay = workerInfo.worker.hourlyWage * workHours;

            worker.scheduleWages.push({
              scheduleTitle: schedule.title,
              hourlyWage: workerInfo.worker.hourlyWage,
              workHours: workHours,
              totalPay: totalPay,
            });
          }
        });
      });

      return Array.from(workerMap.values());
    }
  }, [allWorkers, schedules]);

  // 검색 필터링
  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) return processedWorkers;

    const query = searchQuery.toLowerCase();
    return processedWorkers.filter(
      (worker) =>
        worker.name.toLowerCase().includes(query) ||
        worker.phone.includes(query)
    );
  }, [processedWorkers, searchQuery]);

  // 전화 걸기
  const makeCall = (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch((err) => {
      Alert.alert("오류", "전화를 걸 수 없습니다.");
    });
  };

  // 문자 보내기
  const sendSMS = (phoneNumber: string) => {
    const smsUrl = `sms:${phoneNumber}`;
    Linking.openURL(smsUrl).catch((err) => {
      Alert.alert("오류", "문자를 보낼 수 없습니다.");
    });
  };

  // 참여일정을 최신순으로 정렬하고 3개 초과시 요약
  const getSortedSchedules = (schedules: any[]) => {
    if (!schedules || schedules.length === 0) {
      return {
        schedules: [],
        hasMore: false,
        totalCount: 0,
      };
    }

    // 날짜순으로 정렬 (최신순)
    const sortedSchedules = schedules.sort((a, b) => {
      const dateA = dayjs(a.date || a.startDate);
      const dateB = dayjs(b.date || b.startDate);
      return dateB.diff(dateA);
    });

    // 3개 초과시 요약
    if (sortedSchedules.length > 3) {
      return {
        schedules: sortedSchedules.slice(0, 3),
        hasMore: true,
        totalCount: sortedSchedules.length,
      };
    }

    return {
      schedules: sortedSchedules,
      hasMore: false,
      totalCount: sortedSchedules.length,
    };
  };

  const addWorkTag = (workerId: string) => {
    if (!newTag.trim()) return;

    // 실제로는 여기서 데이터베이스 업데이트
    Alert.alert("태그 추가", `${newTag} 태그가 추가되었습니다.`);
    setNewTag("");
  };

  const removeWorkTag = (workerId: string, tag: string) => {
    Alert.alert("태그 제거", `${tag} 태그가 제거되었습니다.`);
  };

  const openWorkerDetail = (worker: Worker) => {
    setSelectedWorker(worker);
    setIsEditMode(true);

    // 근로자의 근무시간 정보 추출 (기본값 설정)
    const workHours = worker.scheduleWages?.[0]?.workHours || 0;
    const workMinutes = Math.round((workHours % 1) * 60); // 소수점을 분으로 변환
    const workHoursInt = Math.floor(workHours); // 정수 부분만

    setWorkerForm({
      name: worker.name,
      phone: worker.phone,
      residentNumber: worker.residentNumber || "",
      bankAccount: worker.bankAccount || "",
      hourlyWage: worker.hourlyWage.toString(),
      fuelAllowance: (worker.fuelAllowance || 0).toString(),
      otherAllowance: (worker.otherAllowance || 0).toString(),
      idCardImageUrl: worker.idCardImageUrl || "",
      idCardImagePath: worker.idCardImagePath || "",
      memo: worker.memo || "",
      // 근무시간 관련 - 기존 데이터로 초기화
      workStartDate: "", // 근로자별로는 스케줄마다 다를 수 있음
      workEndDate: "",
      workHours: workHoursInt,
      workMinutes: workMinutes,
      isFullPeriodWork: true, // 기본값
      isSameWorkHoursDaily: true, // 기본값
      dailyWorkTimes: [],
    });
    setShowWorkerModal(true);
  };

  const handleScheduleTagPress = (scheduleTitle: string, worker: Worker) => {
    // 해당 스케줄의 상세 정보 찾기
    const scheduleDetail = worker.scheduleDetails?.find(
      (s) => s.title === scheduleTitle
    );
    if (scheduleDetail) {
      setSelectedSchedule(scheduleDetail);
      setShowScheduleDetailModal(true);
    }
  };

  const openAddWorker = () => {
    setIsEditMode(false);
    // 현재 선택된 스케줄 정보 가져오기
    const currentSchedule = schedules.find((s) => s.id === selectedScheduleId);

    // 스케줄의 근무시간 정보 추출
    let defaultStartTime = "09:00";
    let defaultEndTime = "18:00";
    let dailyWorkTimes: Array<{
      date: string;
      startTime: string;
      endTime: string;
    }> = [];

    if (currentSchedule?.workers && currentSchedule.workers.length > 0) {
      const firstWorker = currentSchedule.workers[0];
      if (firstWorker.periods && firstWorker.periods.length > 0) {
        const firstPeriod = firstWorker.periods[0];
        if (firstPeriod.start && firstPeriod.end) {
          // ISO 시간을 HH:MM 형식으로 변환
          const startTime = new Date(firstPeriod.start);
          const endTime = new Date(firstPeriod.end);
          defaultStartTime = startTime.toTimeString().slice(0, 5);
          defaultEndTime = endTime.toTimeString().slice(0, 5);
        }
      }
    }

    // 스케줄이 여러 날에 걸쳐있는 경우 날짜별 근무시간 초기화
    if (currentSchedule?.startDate && currentSchedule?.endDate) {
      const startDate = new Date(currentSchedule.startDate);
      const endDate = new Date(currentSchedule.endDate);
      const daysDiff =
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

      for (let i = 0; i < daysDiff; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        dailyWorkTimes.push({
          date: currentDate.toISOString().split("T")[0],
          startTime: defaultStartTime,
          endTime: defaultEndTime,
        });
      }
    }

    setWorkerForm({
      name: "",
      phone: "",
      residentNumber: "",
      bankAccount: "",
      hourlyWage: "15000", // 기본값 15000원
      fuelAllowance: "0",
      otherAllowance: "0",
      selectedBankCode: "",
      idCardImageUrl: "",
      idCardImagePath: "",
      memo: "",
      // 근무시간 관련 - 스케줄 정보로 초기화
      workStartDate: currentSchedule?.startDate || "",
      workEndDate: currentSchedule?.endDate || "",
      workHours: 0,
      workMinutes: 0,
      isFullPeriodWork: true, // 기본값: 전일정 근무
      isSameWorkHoursDaily: true, // 기본값: 매일 동일한 근무시간
      dailyWorkTimes: dailyWorkTimes,
      // 스케줄의 시간을 기본값으로 설정
      defaultStartTime: defaultStartTime,
      defaultEndTime: defaultEndTime,
    });
    setDetectedBank(null);
    setShowBankPicker(false);
    setShowAddWorkerModal(true);
  };

  const handleSaveWorker = async () => {
    if (
      !workerForm.name ||
      !workerForm.phone ||
      !workerForm.bankAccount ||
      !workerForm.hourlyWage
    ) {
      Alert.alert("오류", "모든 필드를 입력해주세요.");
      return;
    }

    // 은행이 감지되지 않고 사용자도 선택하지 않은 경우
    if (!detectedBank && !workerForm.selectedBankCode) {
      Alert.alert("오류", "은행을 선택해주세요.");
      return;
    }

    const selectedBank =
      detectedBank ||
      KOREAN_BANKS.find((b) => b.code === workerForm.selectedBankCode);

    if (isEditMode && selectedWorker) {
      // 수정 모드
      const updates = {
        name: workerForm.name,
        phone: workerForm.phone,
        residentNumber: workerForm.residentNumber,
        bankAccount: workerForm.bankAccount,
        bankInfo: selectedBank,
        hourlyWage: parseInt(workerForm.hourlyWage),
        fuelAllowance: parseInt(workerForm.fuelAllowance) || 0,
        otherAllowance: parseInt(workerForm.otherAllowance) || 0,
        idCardImageUrl: workerForm.idCardImageUrl,
        idCardImagePath: workerForm.idCardImagePath,
        memo: workerForm.memo,
        // 근무시간 관련 데이터 추가 (기존 호환성)
        workStartDate: workerForm.workStartDate,
        workEndDate: workerForm.workEndDate,
        workHours: workerForm.workHours,
        workMinutes: workerForm.workMinutes,
        isFullPeriodWork: workerForm.isFullPeriodWork,
        isSameWorkHoursDaily: workerForm.isSameWorkHoursDaily,
        dailyWorkTimes: workerForm.dailyWorkTimes,
      };

      if (onUpdateWorker) {
        await onUpdateWorker(selectedWorker.id, updates);
      }

      // Alert는 부모에서 처리
      setShowWorkerModal(false);
    } else {
      // 추가 모드
      const newWorker = {
        id: `w${Date.now()}`,
        name: workerForm.name,
        phone: workerForm.phone,
        residentNumber: workerForm.residentNumber,
        bankAccount: workerForm.bankAccount,
        bankInfo: selectedBank,
        hourlyWage: parseInt(workerForm.hourlyWage),
        fuelAllowance: parseInt(workerForm.fuelAllowance) || 0,
        otherAllowance: parseInt(workerForm.otherAllowance) || 0,
        idCardImageUrl: workerForm.idCardImageUrl,
        idCardImagePath: workerForm.idCardImagePath,
        memo: workerForm.memo,
        // 근무시간 관련 데이터 추가 (기존 호환성)
        workStartDate: workerForm.workStartDate,
        workEndDate: workerForm.workEndDate,
        workHours: workerForm.workHours,
        workMinutes: workerForm.workMinutes,
        isFullPeriodWork: workerForm.isFullPeriodWork,
        isSameWorkHoursDaily: workerForm.isSameWorkHoursDaily,
        dailyWorkTimes: workerForm.dailyWorkTimes,
      };

      if (onAddWorker) {
        await onAddWorker(newWorker);
      }

      // Alert는 부모에서 처리
      setShowAddWorkerModal(false);
    }
  };

  const handleDeleteWorker = async (workerId?: string) => {
    const targetWorker = workerId
      ? filteredWorkers.find((w) => w.id === workerId)
      : selectedWorker;

    if (!targetWorker) {
      return;
    }

    if (onDeleteWorker) {
      await onDeleteWorker(targetWorker.id);
    }
    setShowWorkerModal(false);
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <CommonHeader
        title="근로자 관리"
        rightButton={{
          icon: "add",
          onPress: openAddWorker,
        }}
      />

      {/* 검색 바 */}
      <View style={styles.searchContainer}>
        <Text style={styles.workerCountText}>
          총 {processedWorkers.length}명의 근로자
        </Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="이름 또는 전화번호로 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </Pressable>
          )}
        </View>
      </View>

      {/* 근로자 목록 */}
      <ScrollView style={styles.workersList}>
        <View style={styles.workersGrid}>
          {filteredWorkers.map((worker) => {
            const sorted = getSortedSchedules(worker.scheduleDetails || []);
            const isExpanded = !!expandedWorkers[worker.id];
            return (
              <Pressable
                key={worker.id}
                style={styles.workerCard}
                onPress={() => openWorkerDetail(worker)}
              >
                <View style={styles.workerInfo}>
                  <View style={styles.workerHeader}>
                    <View style={styles.workerNameContainer}>
                      <Text style={styles.workerName}>{worker.name}</Text>
                      <Text style={styles.workerPosition}>
                        {getWorkerPosition(worker.name)}
                      </Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <Pressable
                        style={styles.iconButton}
                        onPress={() => openWorkerDetail(worker)}
                      >
                        <Ionicons name="pencil" size={16} color="#111827" />
                      </Pressable>
                      <Pressable
                        style={styles.iconButton}
                        onPress={(e) => {
                          e.stopPropagation();

                          if (Platform.OS === "web") {
                            if (
                              window.confirm(
                                `${worker.name}님을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
                              )
                            ) {
                              handleDeleteWorker(worker.id);
                            }
                          } else {
                            Alert.alert(
                              "근로자 삭제",
                              `${worker.name}님을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`,
                              [
                                { text: "취소", style: "cancel" },
                                {
                                  text: "삭제",
                                  style: "destructive",
                                  onPress: () => {
                                    handleDeleteWorker(worker.id);
                                  },
                                },
                              ]
                            );
                          }
                        }}
                        accessibilityLabel="삭제"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#ef4444"
                        />
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.phoneContainer}>
                    <Text style={styles.workerPhone}>
                      📞 {formatPhoneNumber(worker.phone)}
                    </Text>
                    <View style={styles.phoneActionButtons}>
                      <Pressable
                        onPress={() => makeCall(worker.phone)}
                        style={({ pressed }) => [
                          {
                            opacity: pressed ? 0.6 : 1,
                          },
                        ]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={{ fontSize: 16 }}>📞</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => sendSMS(worker.phone)}
                        style={({ pressed }) => [
                          {
                            opacity: pressed ? 0.6 : 1,
                          },
                        ]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={{ fontSize: 16 }}>💬</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankBadge}>
                      {detectBankFromAccount(worker.bankAccount)?.shortName ||
                        "은행"}
                    </Text>
                    <Text style={styles.bankAccountText}>
                      {formatAccountNumber(worker.bankAccount)}
                    </Text>
                  </View>
                  {worker.memo && (
                    <View style={styles.memoContainer}>
                      <Text style={styles.memoLabel}>메모:</Text>
                      <Text style={styles.memoPreview}>
                        {worker.memo.length > 20
                          ? `${worker.memo.substring(0, 20)}...`
                          : worker.memo}
                      </Text>
                    </View>
                  )}
                  <View style={styles.schedulesContainer}>
                    <View style={styles.schedulesRow}>
                      <View style={styles.schedulesHeader}>
                        {(sorted.totalCount || 0) > 0 && (
                          <Pressable
                            style={styles.expandButton}
                            onPress={() => {
                              setExpandedWorkers((prev) => ({
                                ...prev,
                                [worker.id]: !prev[worker.id],
                              }));
                            }}
                          >
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={16}
                              color="#6b7280"
                            />
                          </Pressable>
                        )}
                        <Text style={styles.schedulesLabel}>참여 일정:</Text>
                      </View>
                      <View style={styles.schedulesList}>
                        {(
                          (isExpanded
                            ? sorted.schedules
                            : (sorted.schedules || []).slice(0, 5)) || []
                        ).map((schedule, index) => (
                          <Pressable
                            key={index}
                            style={styles.scheduleTag}
                            onPress={() =>
                              handleScheduleTagPress(schedule.title, worker)
                            }
                          >
                            <Text style={styles.scheduleTagText}>
                              {schedule.title}
                            </Text>
                            <Text style={styles.scheduleDateText}>
                              {dayjs(
                                schedule.date || schedule.startDate
                              ).format("M/D")}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    {isExpanded && (
                      <View style={styles.expandedDetails}>
                        {(sorted.schedules || []).map(
                          (schedule: any, idx: number) => {
                            // schedules prop에서 해당 스케줄 상세 찾기 (근무자 periods, 시급, 지급여부)
                            const sched = schedules.find(
                              (s: any) => s.id === schedule.id
                            );
                            let hours = 0;
                            let hourlyWage = worker.hourlyWage;
                            let paid = false;
                            let workerInfo: any = null;
                            if (sched) {
                              workerInfo = sched.workers.find(
                                (wi: any) => wi.worker.id === worker.id
                              );
                              if (workerInfo) {
                                paid = !!workerInfo.paid;
                                hourlyWage =
                                  workerInfo.worker.hourlyWage ?? hourlyWage;
                                hours = (workerInfo.periods || []).reduce(
                                  (t: number, p: any) => {
                                    const start = dayjs(p.start);
                                    const end = dayjs(p.end);
                                    return t + end.diff(start, "hour", true);
                                  },
                                  0
                                );
                              }
                            }
                            const total = Math.round(hourlyWage * hours);
                            return (
                              <View key={idx} style={styles.detailRow}>
                                <View style={styles.detailHeader}>
                                  <Text style={styles.detailTitle}>
                                    {schedule.title}
                                  </Text>
                                  <Pressable
                                    style={[
                                      styles.paidToggle,
                                      {
                                        backgroundColor: paid
                                          ? "#10b981"
                                          : "#ef4444",
                                      },
                                    ]}
                                    onPress={() => {
                                      if (sched && workerInfo) {
                                        // DB에서 지급여부 업데이트
                                        const db = getDatabase();
                                        db.updateScheduleWorkerPaidStatus(
                                          sched.id,
                                          worker.id,
                                          !paid
                                        ).then(() => {
                                          // 로컬 상태 업데이트
                                          // 로컬 상태 업데이트는 onUpdateSchedule을 통해 처리
                                          if (onUpdateSchedule) {
                                            const updatedSchedule =
                                              schedules.find(
                                                (s) => s.id === sched.id
                                              );
                                            if (updatedSchedule) {
                                              const updatedWorkers =
                                                updatedSchedule.workers.map(
                                                  (w) =>
                                                    w.worker.id === worker.id
                                                      ? { ...w, paid: !paid }
                                                      : w
                                                );
                                              onUpdateSchedule(sched.id, {
                                                ...updatedSchedule,
                                                workers: updatedWorkers,
                                              });
                                            }
                                          }
                                        });
                                      }
                                    }}
                                  >
                                    <Text style={styles.paidToggleText}>
                                      {paid ? "지급완료" : "미지급"}
                                    </Text>
                                  </Pressable>
                                </View>
                                <Text style={styles.detailSub}>
                                  📅{" "}
                                  {dayjs(
                                    schedule.startDate || schedule.date
                                  ).format("M/D")}{" "}
                                  ~{" "}
                                  {dayjs(
                                    schedule.endDate || schedule.date
                                  ).format("M/D")}{" "}
                                  · ⏰ {hours.toFixed(1)}시간 · 💰 시급{" "}
                                  {hourlyWage.toLocaleString()}원 · 💵 합계{" "}
                                  {total.toLocaleString()}원
                                </Text>
                              </View>
                            );
                          }
                        )}
                      </View>
                    )}
                  </View>
                  {(worker.workTags || []).length > 0 && (
                    <View style={styles.tagsContainer}>
                      <Text style={styles.tagsLabel}>작업 태그:</Text>
                      <View style={styles.tagsList}>
                        {(worker.workTags || []).map((tag, index) => (
                          <View key={index} style={styles.workTag}>
                            <Text style={styles.workTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {filteredWorkers.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "검색 결과가 없습니다"
                : "등록된 근로자가 없습니다"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 근로자 상세 모달 */}
      <Modal
        visible={showWorkerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedWorker && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedWorker.name}</Text>
                  <Pressable
                    onPress={() => setShowWorkerModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </Pressable>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>이름</Text>
                    <TextInput
                      style={styles.detailInput}
                      value={workerForm.name}
                      onChangeText={(text) =>
                        setWorkerForm({ ...workerForm, name: text })
                      }
                      placeholder="이름"
                    />
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>전화번호</Text>
                    <TextInput
                      style={styles.detailInput}
                      value={workerForm.phone}
                      onChangeText={(text) =>
                        setWorkerForm({ ...workerForm, phone: text })
                      }
                      placeholder="010-0000-0000"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>계좌번호</Text>
                    <View style={styles.accountInputContainer}>
                      {detectedBank ? (
                        <View style={styles.bankLabel}>
                          <Text style={styles.bankLabelText}>
                            {detectedBank.shortName}
                          </Text>
                        </View>
                      ) : workerForm.selectedBankCode ? (
                        <View style={styles.bankLabel}>
                          <Text style={styles.bankLabelText}>
                            {KOREAN_BANKS.find(
                              (b) => b.code === workerForm.selectedBankCode
                            )?.shortName || "은행"}
                          </Text>
                        </View>
                      ) : null}
                      <TextInput
                        style={[
                          styles.detailInput,
                          detectedBank || workerForm.selectedBankCode
                            ? styles.detailInputWithBank
                            : styles.detailInputWithoutBank,
                        ]}
                        value={workerForm.bankAccount}
                        onChangeText={(text) =>
                          setWorkerForm({ ...workerForm, bankAccount: text })
                        }
                        placeholder="110-1234-5678"
                        keyboardType="number-pad"
                      />
                    </View>
                    {!detectedBank &&
                      workerForm.bankAccount &&
                      !workerForm.selectedBankCode && (
                        <View style={styles.bankSelectContainer}>
                          <Text style={styles.bankHintWarning}>
                            ⚠️ 은행을 자동으로 감지할 수 없습니다. 선택해주세요:
                          </Text>
                          {Platform.OS === "web" ? (
                            <select
                              style={{
                                width: "100%",
                                padding: 10,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: "#d1d5db",
                                fontSize: 14,
                              }}
                              value={workerForm.selectedBankCode}
                              onChange={(e) =>
                                setWorkerForm({
                                  ...workerForm,
                                  selectedBankCode: e.target.value,
                                })
                              }
                            >
                              <option value="">은행 선택...</option>
                              {KOREAN_BANKS.map((bank) => (
                                <option key={bank.code} value={bank.code}>
                                  {bank.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Picker
                              selectedValue={workerForm.selectedBankCode}
                              onValueChange={(value) =>
                                setWorkerForm({
                                  ...workerForm,
                                  selectedBankCode: value,
                                })
                              }
                              style={styles.picker}
                            >
                              <Picker.Item label="은행 선택..." value="" />
                              {KOREAN_BANKS.map((bank) => (
                                <Picker.Item
                                  key={bank.code}
                                  label={bank.name}
                                  value={bank.code}
                                />
                              ))}
                            </Picker>
                          )}
                        </View>
                      )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>시급</Text>
                    <TextInput
                      style={styles.detailInput}
                      value={workerForm.hourlyWage}
                      onChangeText={(text) =>
                        setWorkerForm({
                          ...workerForm,
                          hourlyWage: text.replace(/[^0-9]/g, ""),
                        })
                      }
                      placeholder="15000"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>유류비 (월 고정)</Text>
                    <TextInput
                      style={styles.detailInput}
                      value={workerForm.fuelAllowance}
                      onChangeText={(text) =>
                        setWorkerForm({
                          ...workerForm,
                          fuelAllowance: text.replace(/[^0-9]/g, ""),
                        })
                      }
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>기타비용 (월 고정)</Text>
                    <TextInput
                      style={styles.detailInput}
                      value={workerForm.otherAllowance}
                      onChangeText={(text) =>
                        setWorkerForm({
                          ...workerForm,
                          otherAllowance: text.replace(/[^0-9]/g, ""),
                        })
                      }
                      placeholder="0"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>
                      주민등록번호 (급여 지급 시 필수)
                    </Text>
                    <TextInput
                      style={styles.detailInput}
                      value={workerForm.residentNumber}
                      onChangeText={(text) =>
                        setWorkerForm({
                          ...workerForm,
                          residentNumber: text.replace(/[^0-9-]/g, ""),
                        })
                      }
                      placeholder="123456-1234567"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>메모</Text>
                    <TextInput
                      style={[styles.detailInput, styles.memoInput]}
                      value={workerForm.memo}
                      onChangeText={(text) =>
                        setWorkerForm({ ...workerForm, memo: text })
                      }
                      placeholder="메모를 입력하세요"
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  {/* 참여 일정 */}
                  <View style={styles.detailSection}>
                    <View style={styles.schedulesHeader}>
                      <Text style={styles.detailLabel}>참여 일정</Text>
                      <Pressable
                        style={styles.addScheduleButton}
                        onPress={() => {
                          setSelectedSchedules([]);
                          setScheduleSearchQuery("");
                          setNewScheduleDetails({});
                          setShowScheduleModal(true);
                        }}
                      >
                        <Ionicons name="add" size={20} color="#3b82f6" />
                      </Pressable>
                    </View>
                    <View style={styles.schedulesList}>
                      {(selectedWorker.schedules || []).map(
                        (schedule, index) => (
                          <View key={index} style={styles.scheduleTag}>
                            <Text style={styles.scheduleTagText}>
                              {schedule}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  </View>
                </ScrollView>

                {/* 저장/삭제 버튼 */}
                <View style={styles.modalFooter}>
                  <Pressable
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteWorker(selectedWorker?.id)}
                  >
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={handleSaveWorker}
                  >
                    <Text style={styles.saveButtonText}>저장</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 근로자 추가 모달 */}
      <Modal
        visible={showAddWorkerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddWorkerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>근로자 추가</Text>
              <Pressable
                onPress={() => setShowAddWorkerModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>이름 *</Text>
                <TextInput
                  style={styles.detailInput}
                  value={workerForm.name}
                  onChangeText={(text) =>
                    setWorkerForm({ ...workerForm, name: text })
                  }
                  placeholder="이름을 입력하세요"
                />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>전화번호 *</Text>
                <TextInput
                  style={styles.detailInput}
                  value={workerForm.phone}
                  onChangeText={(text) =>
                    setWorkerForm({ ...workerForm, phone: text })
                  }
                  placeholder="010-0000-0000"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>계좌번호 *</Text>
                <View style={styles.accountInputContainer}>
                  {detectedBank ? (
                    <View style={styles.bankLabel}>
                      <Text style={styles.bankLabelText}>
                        {detectedBank.shortName}
                      </Text>
                    </View>
                  ) : workerForm.selectedBankCode ? (
                    <View style={styles.bankLabel}>
                      <Text style={styles.bankLabelText}>
                        {KOREAN_BANKS.find(
                          (b) => b.code === workerForm.selectedBankCode
                        )?.shortName || "은행"}
                      </Text>
                    </View>
                  ) : null}
                  <TextInput
                    style={[
                      styles.detailInput,
                      detectedBank || workerForm.selectedBankCode
                        ? styles.detailInputWithBank
                        : styles.detailInputWithoutBank,
                    ]}
                    value={workerForm.bankAccount}
                    onChangeText={(text) =>
                      setWorkerForm({ ...workerForm, bankAccount: text })
                    }
                    placeholder="110-1234-5678"
                    keyboardType={
                      Platform.OS === "web" ? "default" : "number-pad"
                    }
                  />
                </View>
                {!detectedBank &&
                  workerForm.bankAccount &&
                  !workerForm.selectedBankCode && (
                    <View style={styles.bankSelectContainer}>
                      <Text style={styles.bankHintWarning}>
                        ⚠️ 은행을 자동으로 감지할 수 없습니다. 선택해주세요:
                      </Text>
                      {Platform.OS === "web" ? (
                        <select
                          style={{
                            width: "100%",
                            padding: 10,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: "#d1d5db",
                            fontSize: 14,
                          }}
                          value={workerForm.selectedBankCode}
                          onChange={(e) =>
                            setWorkerForm({
                              ...workerForm,
                              selectedBankCode: e.target.value,
                            })
                          }
                        >
                          <option value="">은행 선택...</option>
                          {KOREAN_BANKS.map((bank) => (
                            <option key={bank.code} value={bank.code}>
                              {bank.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Picker
                          selectedValue={workerForm.selectedBankCode}
                          onValueChange={(value) =>
                            setWorkerForm({
                              ...workerForm,
                              selectedBankCode: value,
                            })
                          }
                          style={styles.picker}
                        >
                          <Picker.Item label="은행 선택..." value="" />
                          {KOREAN_BANKS.map((bank) => (
                            <Picker.Item
                              key={bank.code}
                              label={bank.name}
                              value={bank.code}
                            />
                          ))}
                        </Picker>
                      )}
                    </View>
                  )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>시급 *</Text>
                <TextInput
                  style={styles.detailInput}
                  value={workerForm.hourlyWage}
                  onChangeText={(text) =>
                    setWorkerForm({
                      ...workerForm,
                      hourlyWage: text.replace(/[^0-9]/g, ""),
                    })
                  }
                  placeholder="15000"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>유류비 (월 고정)</Text>
                <TextInput
                  style={styles.detailInput}
                  value={workerForm.fuelAllowance}
                  onChangeText={(text) =>
                    setWorkerForm({
                      ...workerForm,
                      fuelAllowance: text.replace(/[^0-9]/g, ""),
                    })
                  }
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>기타비용 (월 고정)</Text>
                <TextInput
                  style={styles.detailInput}
                  value={workerForm.otherAllowance}
                  onChangeText={(text) =>
                    setWorkerForm({
                      ...workerForm,
                      otherAllowance: text.replace(/[^0-9]/g, ""),
                    })
                  }
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>
                  주민등록번호 (급여 지급 시 필수)
                </Text>
                <TextInput
                  style={styles.detailInput}
                  value={workerForm.residentNumber}
                  onChangeText={(text) =>
                    setWorkerForm({
                      ...workerForm,
                      residentNumber: text.replace(/[^0-9-]/g, ""),
                    })
                  }
                  placeholder="123456-1234567"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>신분증 사진</Text>
                <FileUpload
                  type="image"
                  currentUrl={workerForm.idCardImageUrl}
                  currentPath={workerForm.idCardImagePath}
                  onUpload={(url, path) => {
                    setWorkerForm({
                      ...workerForm,
                      idCardImageUrl: url,
                      idCardImagePath: path,
                    });
                  }}
                  onDelete={() => {
                    setWorkerForm({
                      ...workerForm,
                      idCardImageUrl: "",
                      idCardImagePath: "",
                    });
                  }}
                  options={{
                    bucket: "remit-planner-files",
                    folder: `workers/${workerForm.name || "temp"}`,
                    fileType: "image",
                    maxSize: 5, // 5MB
                  }}
                  placeholder="신분증 사진을 업로드하세요"
                />
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>세금공제 여부</Text>
                <View style={styles.taxButtonsContainer}>
                  <Pressable
                    style={[
                      styles.taxButton,
                      workerForm.taxWithheld && styles.taxButtonActive,
                    ]}
                    onPress={() =>
                      setWorkerForm({ ...workerForm, taxWithheld: true })
                    }
                  >
                    <Text
                      style={[
                        styles.taxButtonText,
                        workerForm.taxWithheld && styles.taxButtonTextActive,
                      ]}
                    >
                      Y
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.taxButton,
                      !workerForm.taxWithheld && styles.taxButtonActive,
                    ]}
                    onPress={() =>
                      setWorkerForm({ ...workerForm, taxWithheld: false })
                    }
                  >
                    <Text
                      style={[
                        styles.taxButtonText,
                        !workerForm.taxWithheld && styles.taxButtonTextActive,
                      ]}
                    >
                      N
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* 근무 기간 */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>근무 기간</Text>
                <View style={styles.workPeriodContainer}>
                  <Text style={styles.workPeriodText}>
                    {workerForm.workStartDate && workerForm.workEndDate
                      ? `${workerForm.workStartDate} ~ ${workerForm.workEndDate}`
                      : "스케줄 기간과 동일"}
                  </Text>
                </View>
              </View>

              {/* 전일정 근무 여부 */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>전일정 근무</Text>
                <View style={styles.toggleContainer}>
                  <Pressable
                    style={[
                      styles.toggleButton,
                      workerForm.isFullPeriodWork && styles.toggleButtonActive,
                    ]}
                    onPress={() =>
                      setWorkerForm({ ...workerForm, isFullPeriodWork: true })
                    }
                  >
                    <Text
                      style={[
                        styles.toggleButtonText,
                        workerForm.isFullPeriodWork &&
                          styles.toggleButtonTextActive,
                      ]}
                    >
                      Y
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.toggleButton,
                      !workerForm.isFullPeriodWork && styles.toggleButtonActive,
                    ]}
                    onPress={() =>
                      setWorkerForm({ ...workerForm, isFullPeriodWork: false })
                    }
                  >
                    <Text
                      style={[
                        styles.toggleButtonText,
                        !workerForm.isFullPeriodWork &&
                          styles.toggleButtonTextActive,
                      ]}
                    >
                      N
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* 전일정 근무가 아닌 경우 근무 기간 입력 */}
              {!workerForm.isFullPeriodWork && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>근무 시작일</Text>
                  <TextInput
                    style={styles.detailInput}
                    value={workerForm.workStartDate}
                    onChangeText={(text) =>
                      setWorkerForm({ ...workerForm, workStartDate: text })
                    }
                    placeholder="YYYY-MM-DD"
                  />
                  <Text style={styles.detailLabel}>근무 종료일</Text>
                  <TextInput
                    style={styles.detailInput}
                    value={workerForm.workEndDate}
                    onChangeText={(text) =>
                      setWorkerForm({ ...workerForm, workEndDate: text })
                    }
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              )}

              {/* 매일 동일한 근무시간 여부 */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>근무시간 매일 동일한지</Text>
                <View style={styles.toggleContainer}>
                  <Pressable
                    style={[
                      styles.toggleButton,
                      workerForm.isSameWorkHoursDaily &&
                        styles.toggleButtonActive,
                    ]}
                    onPress={() =>
                      setWorkerForm({
                        ...workerForm,
                        isSameWorkHoursDaily: true,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.toggleButtonText,
                        workerForm.isSameWorkHoursDaily &&
                          styles.toggleButtonTextActive,
                      ]}
                    >
                      Y
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.toggleButton,
                      !workerForm.isSameWorkHoursDaily &&
                        styles.toggleButtonActive,
                    ]}
                    onPress={() =>
                      setWorkerForm({
                        ...workerForm,
                        isSameWorkHoursDaily: false,
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.toggleButtonText,
                        !workerForm.isSameWorkHoursDaily &&
                          styles.toggleButtonTextActive,
                      ]}
                    >
                      N
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* 매일 동일한 근무시간인 경우 */}
              {workerForm.isSameWorkHoursDaily && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>근무시간</Text>
                  <View style={styles.timeInputContainer}>
                    {/* 시간 드롭다운 */}
                    <View style={styles.timeSelectContainer}>
                      <Text style={styles.timeLabel}>시간</Text>
                      {Platform.OS === "web" ? (
                        <select
                          style={styles.timeSelect}
                          value={workerForm.workHours}
                          onChange={(e) =>
                            setWorkerForm({
                              ...workerForm,
                              workHours: parseInt(e.target.value) || 0,
                            })
                          }
                        >
                          {Array.from({ length: 25 }, (_, i) => (
                            <option key={i} value={i}>
                              {i}시간
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Picker
                          selectedValue={workerForm.workHours}
                          onValueChange={(value) =>
                            setWorkerForm({
                              ...workerForm,
                              workHours: value,
                            })
                          }
                          style={styles.timePicker}
                        >
                          {Array.from({ length: 25 }, (_, i) => (
                            <Picker.Item key={i} label={`${i}시간`} value={i} />
                          ))}
                        </Picker>
                      )}
                    </View>

                    {/* 분 드롭다운 */}
                    <View style={styles.timeSelectContainer}>
                      <Text style={styles.timeLabel}>분</Text>
                      {Platform.OS === "web" ? (
                        <select
                          style={styles.timeSelect}
                          value={workerForm.workMinutes}
                          onChange={(e) =>
                            setWorkerForm({
                              ...workerForm,
                              workMinutes: parseInt(e.target.value) || 0,
                            })
                          }
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i * 5}>
                              {i * 5}분
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Picker
                          selectedValue={workerForm.workMinutes}
                          onValueChange={(value) =>
                            setWorkerForm({
                              ...workerForm,
                              workMinutes: value,
                            })
                          }
                          style={styles.timePicker}
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <Picker.Item
                              key={i}
                              label={`${i * 5}분`}
                              value={i * 5}
                            />
                          ))}
                        </Picker>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* 매일 동일하지 않은 근무시간인 경우 - 날짜별 입력 */}
              {!workerForm.isSameWorkHoursDaily &&
                (workerForm.dailyWorkTimes || []).length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>날짜별 근무 시간</Text>
                    {(workerForm.dailyWorkTimes || []).map((dayWork, index) => (
                      <View key={index} style={styles.dailyWorkTimeItem}>
                        <Text style={styles.dailyWorkDateText}>
                          {new Date(dayWork.date).toLocaleDateString("ko-KR", {
                            month: "long",
                            day: "numeric",
                          })}
                          일
                        </Text>
                        <View style={styles.dailyTimeInputContainer}>
                          <TextInput
                            style={[styles.detailInput, styles.dailyTimeInput]}
                            value={dayWork.startTime}
                            onChangeText={(text) => {
                              const newDailyWorkTimes = [
                                ...workerForm.dailyWorkTimes,
                              ];
                              newDailyWorkTimes[index].startTime = text;
                              setWorkerForm({
                                ...workerForm,
                                dailyWorkTimes: newDailyWorkTimes,
                              });
                            }}
                            placeholder="09:00"
                          />
                          <Text style={styles.timeSeparatorText}>~</Text>
                          <TextInput
                            style={[styles.detailInput, styles.dailyTimeInput]}
                            value={dayWork.endTime}
                            onChangeText={(text) => {
                              const newDailyWorkTimes = [
                                ...workerForm.dailyWorkTimes,
                              ];
                              newDailyWorkTimes[index].endTime = text;
                              setWorkerForm({
                                ...workerForm,
                                dailyWorkTimes: newDailyWorkTimes,
                              });
                            }}
                            placeholder="18:00"
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                )}

              {/* 메모 - 맨 아래로 이동 */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>메모</Text>
                <TextInput
                  style={[styles.detailInput, styles.memoInput]}
                  value={workerForm.memo}
                  onChangeText={(text) =>
                    setWorkerForm({ ...workerForm, memo: text })
                  }
                  placeholder="메모를 입력하세요"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* 추가 버튼 */}
            <View style={styles.modalFooter}>
              <Pressable style={styles.saveButton} onPress={handleSaveWorker}>
                <Text style={styles.saveButtonText}>추가</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 스케줄 선택 모달 */}
      <Modal
        visible={showScheduleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.scheduleModalOverlay}>
          <View style={styles.scheduleModalContent}>
            <View style={styles.scheduleModalHeader}>
              <Text style={styles.scheduleModalTitle}>일정 선택</Text>
              <Pressable
                onPress={() => setShowScheduleModal(false)}
                style={styles.scheduleModalCloseButton}
              >
                <Ionicons name="close" size={20} color="#6b7280" />
              </Pressable>
            </View>

            <View style={styles.scheduleSearchContainer}>
              <TextInput
                style={styles.scheduleSearchInput}
                placeholder="일정명으로 검색..."
                value={scheduleSearchQuery}
                onChangeText={setScheduleSearchQuery}
              />
            </View>

            {!isScheduleDetailStep ? (
              // 1단계: 스케줄 선택
              <ScrollView style={styles.scheduleModalBody}>
                {schedules
                  .sort(
                    (a, b) =>
                      new Date(b.startDate).getTime() -
                      new Date(a.startDate).getTime()
                  )
                  .filter((schedule) =>
                    schedule.title
                      .toLowerCase()
                      .includes(scheduleSearchQuery.toLowerCase())
                  )
                  .map((schedule) => (
                    <Pressable
                      key={schedule.id}
                      style={[
                        styles.scheduleItem,
                        selectedSchedules.includes(schedule.id) &&
                          styles.scheduleItemSelected,
                      ]}
                      onPress={() => {
                        // 다중 선택 로직
                        if (selectedSchedules.includes(schedule.id)) {
                          setSelectedSchedules((prev) =>
                            prev.filter((id) => id !== schedule.id)
                          );
                        } else {
                          setSelectedSchedules((prev) => [
                            ...prev,
                            schedule.id,
                          ]);
                        }
                      }}
                    >
                      <View style={styles.scheduleItemContent}>
                        <Text
                          style={[
                            styles.scheduleItemTitle,
                            selectedSchedules.includes(schedule.id) &&
                              styles.scheduleItemTitleSelected,
                          ]}
                        >
                          {schedule.title}
                        </Text>
                        <Text style={styles.scheduleItemDate}>
                          {schedule.startDate} ~ {schedule.endDate}
                        </Text>
                        <Text style={styles.scheduleItemDescription}>
                          {schedule.description}
                        </Text>
                      </View>
                      {selectedSchedules.includes(schedule.id) && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#3b82f6"
                        />
                      )}
                    </Pressable>
                  ))}
              </ScrollView>
            ) : (
              // 2단계: 스케줄별 상세 정보 입력
              <ScrollView style={styles.scheduleModalBody}>
                {selectedSchedules.map((scheduleId) => {
                  const schedule = schedules.find((s) => s.id === scheduleId);
                  if (!schedule) return null;

                  const details = newScheduleDetails[scheduleId] || {
                    workStartDate: schedule.startDate,
                    workEndDate: schedule.endDate,
                    workHours: 0,
                    workMinutes: 0,
                    hourlyWage: "11000",
                    taxWithheld: true,
                    paid: false,
                  };

                  return (
                    <View key={scheduleId} style={styles.scheduleDetailCard}>
                      <Text style={styles.scheduleDetailTitle}>
                        {schedule.title}
                      </Text>
                      <Text style={styles.scheduleDetailDate}>
                        {schedule.startDate} ~ {schedule.endDate}
                      </Text>

                      {/* 근무 기간 */}
                      <View style={styles.detailRow}>
                        <Text style={styles.detailRowLabel}>근무 기간</Text>
                        <View style={styles.dateInputRow}>
                          <TextInput
                            style={styles.dateInput}
                            value={details.workStartDate}
                            onChangeText={(text) => {
                              setNewScheduleDetails({
                                ...newScheduleDetails,
                                [scheduleId]: {
                                  ...details,
                                  workStartDate: text,
                                },
                              });
                            }}
                            placeholder="YYYY-MM-DD"
                          />
                          <Text style={styles.dateSeparator}>~</Text>
                          <TextInput
                            style={styles.dateInput}
                            value={details.workEndDate}
                            onChangeText={(text) => {
                              setNewScheduleDetails({
                                ...newScheduleDetails,
                                [scheduleId]: { ...details, workEndDate: text },
                              });
                            }}
                            placeholder="YYYY-MM-DD"
                          />
                        </View>
                      </View>

                      {/* 근무 시간 */}
                      <View style={styles.detailRow}>
                        <Text style={styles.detailRowLabel}>근무 시간</Text>
                        <View style={styles.timeInputRow}>
                          {Platform.OS === "web" ? (
                            <>
                              <input
                                type="number"
                                value={details.workHours}
                                onChange={(e) => {
                                  setNewScheduleDetails({
                                    ...newScheduleDetails,
                                    [scheduleId]: {
                                      ...details,
                                      workHours: parseInt(e.target.value) || 0,
                                    },
                                  });
                                }}
                                style={{
                                  width: 60,
                                  padding: 8,
                                  borderRadius: 8,
                                  border: "1px solid #d1d5db",
                                  fontSize: 14,
                                }}
                              />
                              <Text style={styles.timeUnit}>시간</Text>
                              <input
                                type="number"
                                value={details.workMinutes}
                                onChange={(e) => {
                                  setNewScheduleDetails({
                                    ...newScheduleDetails,
                                    [scheduleId]: {
                                      ...details,
                                      workMinutes:
                                        parseInt(e.target.value) || 0,
                                    },
                                  });
                                }}
                                style={{
                                  width: 60,
                                  padding: 8,
                                  borderRadius: 8,
                                  border: "1px solid #d1d5db",
                                  fontSize: 14,
                                }}
                              />
                              <Text style={styles.timeUnit}>분</Text>
                            </>
                          ) : (
                            <>
                              <Picker
                                selectedValue={details.workHours}
                                onValueChange={(value) => {
                                  setNewScheduleDetails({
                                    ...newScheduleDetails,
                                    [scheduleId]: {
                                      ...details,
                                      workHours: value,
                                    },
                                  });
                                }}
                                style={styles.timePicker}
                              >
                                {Array.from({ length: 25 }, (_, i) => (
                                  <Picker.Item
                                    key={i}
                                    label={`${i}`}
                                    value={i}
                                  />
                                ))}
                              </Picker>
                              <Text style={styles.timeUnit}>시간</Text>
                              <Picker
                                selectedValue={details.workMinutes}
                                onValueChange={(value) => {
                                  setNewScheduleDetails({
                                    ...newScheduleDetails,
                                    [scheduleId]: {
                                      ...details,
                                      workMinutes: value,
                                    },
                                  });
                                }}
                                style={styles.timePicker}
                              >
                                {Array.from({ length: 6 }, (_, i) => (
                                  <Picker.Item
                                    key={i * 10}
                                    label={`${i * 10}`}
                                    value={i * 10}
                                  />
                                ))}
                              </Picker>
                              <Text style={styles.timeUnit}>분</Text>
                            </>
                          )}
                        </View>
                      </View>

                      {/* 시급 */}
                      <View style={styles.detailRow}>
                        <Text style={styles.detailRowLabel}>시급</Text>
                        <TextInput
                          style={styles.wageInput}
                          value={details.hourlyWage}
                          onChangeText={(text) => {
                            setNewScheduleDetails({
                              ...newScheduleDetails,
                              [scheduleId]: {
                                ...details,
                                hourlyWage: text.replace(/[^0-9]/g, ""),
                              },
                            });
                          }}
                          placeholder="11000"
                          keyboardType="numeric"
                        />
                        <Text style={styles.wageUnit}>원/시간</Text>
                      </View>

                      {/* 세금 공제 여부 */}
                      <View style={styles.detailRow}>
                        <Text style={styles.detailRowLabel}>세금 공제</Text>
                        <View style={styles.taxButtonsRow}>
                          <Pressable
                            style={[
                              styles.taxButton,
                              details.taxWithheld && styles.taxButtonActive,
                            ]}
                            onPress={() => {
                              setNewScheduleDetails({
                                ...newScheduleDetails,
                                [scheduleId]: { ...details, taxWithheld: true },
                              });
                            }}
                          >
                            <Text
                              style={[
                                styles.taxButtonText,
                                details.taxWithheld &&
                                  styles.taxButtonTextActive,
                              ]}
                            >
                              Y
                            </Text>
                          </Pressable>
                          <Pressable
                            style={[
                              styles.taxButton,
                              !details.taxWithheld && styles.taxButtonActive,
                            ]}
                            onPress={() => {
                              setNewScheduleDetails({
                                ...newScheduleDetails,
                                [scheduleId]: {
                                  ...details,
                                  taxWithheld: false,
                                },
                              });
                            }}
                          >
                            <Text
                              style={[
                                styles.taxButtonText,
                                !details.taxWithheld &&
                                  styles.taxButtonTextActive,
                              ]}
                            >
                              N
                            </Text>
                          </Pressable>
                        </View>
                      </View>

                      {/* 지급 여부 */}
                      <View style={styles.detailRow}>
                        <Text style={styles.detailRowLabel}>지급 여부</Text>
                        <View style={styles.taxButtonsRow}>
                          <Pressable
                            style={[
                              styles.paidButton,
                              details.paid && styles.paidButtonActive,
                            ]}
                            onPress={() => {
                              setNewScheduleDetails({
                                ...newScheduleDetails,
                                [scheduleId]: { ...details, paid: true },
                              });
                            }}
                          >
                            <Text
                              style={[
                                styles.paidButtonText,
                                details.paid && styles.paidButtonTextActive,
                              ]}
                            >
                              지급완료
                            </Text>
                          </Pressable>
                          <Pressable
                            style={[
                              styles.paidButton,
                              !details.paid && styles.paidButtonActive,
                            ]}
                            onPress={() => {
                              setNewScheduleDetails({
                                ...newScheduleDetails,
                                [scheduleId]: { ...details, paid: false },
                              });
                            }}
                          >
                            <Text
                              style={[
                                styles.paidButtonText,
                                !details.paid && styles.paidButtonTextActive,
                              ]}
                            >
                              미지급
                            </Text>
                          </Pressable>
                        </View>
                      </View>

                      {/* 총 급여 계산 */}
                      {(() => {
                        const totalMinutes =
                          details.workHours * 60 + details.workMinutes;
                        const totalHours = totalMinutes / 60;
                        const hourlyWage = parseInt(details.hourlyWage) || 0;
                        const grossPay = totalHours * hourlyWage;
                        const tax = details.taxWithheld ? grossPay * 0.033 : 0;
                        const netPay = grossPay - tax;

                        return (
                          <View style={styles.paymentSummary}>
                            <View style={styles.paymentRow}>
                              <Text style={styles.paymentLabel}>총 급여</Text>
                              <Text style={styles.paymentValue}>
                                {new Intl.NumberFormat("ko-KR").format(
                                  grossPay
                                )}
                                원
                              </Text>
                            </View>
                            {details.taxWithheld && (
                              <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>
                                  세금 공제 (3.3%)
                                </Text>
                                <Text style={styles.paymentValue}>
                                  -{new Intl.NumberFormat("ko-KR").format(tax)}
                                  원
                                </Text>
                              </View>
                            )}
                            <View
                              style={[
                                styles.paymentRow,
                                styles.paymentRowTotal,
                              ]}
                            >
                              <Text style={styles.paymentLabelTotal}>
                                실수령액
                              </Text>
                              <Text style={styles.paymentValueTotal}>
                                {new Intl.NumberFormat("ko-KR").format(netPay)}
                                원
                              </Text>
                            </View>
                          </View>
                        );
                      })()}
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.scheduleModalFooter}>
              {!isScheduleDetailStep ? (
                <>
                  <Pressable
                    style={styles.scheduleCancelButton}
                    onPress={() => {
                      setShowScheduleModal(false);
                      setSelectedSchedules([]);
                      setNewScheduleDetails({});
                    }}
                  >
                    <Text style={styles.scheduleCancelButtonText}>취소</Text>
                  </Pressable>
                  <Pressable
                    style={styles.scheduleConfirmButton}
                    onPress={() => {
                      if (selectedSchedules.length > 0) {
                        // 선택된 스케줄별 기본 정보 초기화
                        const initialDetails: any = {};
                        selectedSchedules.forEach((scheduleId) => {
                          const schedule = schedules.find(
                            (s) => s.id === scheduleId
                          );
                          if (schedule) {
                            initialDetails[scheduleId] = {
                              workStartDate: schedule.startDate,
                              workEndDate: schedule.endDate,
                              workHours: 0,
                              workMinutes: 0,
                              hourlyWage: "11000",
                              taxWithheld: true,
                              paid: false,
                            };
                          }
                        });
                        setNewScheduleDetails(initialDetails);
                        setIsScheduleDetailStep(true);
                      }
                    }}
                  >
                    <Text style={styles.scheduleConfirmButtonText}>
                      다음 ({selectedSchedules.length})
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    style={styles.scheduleCancelButton}
                    onPress={() => {
                      setIsScheduleDetailStep(false);
                    }}
                  >
                    <Text style={styles.scheduleCancelButtonText}>이전</Text>
                  </Pressable>
                  <Pressable
                    style={styles.scheduleConfirmButton}
                    onPress={() => {
                      // 상세 정보와 함께 근로자에게 스케줄 추가
                      if (selectedWorker && selectedSchedules.length > 0) {
                        const selectedScheduleNames = selectedSchedules
                          .map((scheduleId) => {
                            const schedule = schedules.find(
                              (s) => s.id === scheduleId
                            );
                            return schedule ? schedule.title : "";
                          })
                          .filter((name) => name);

                        // 근로자의 참여 일정에 추가
                        const updatedSchedules = [
                          ...(selectedWorker.schedules || []),
                          ...selectedScheduleNames,
                        ];

                        // 근로자 정보 업데이트 (상세 정보 포함)
                        const updatedWorker = {
                          ...selectedWorker,
                          schedules: updatedSchedules,
                          scheduleDetails: [
                            ...(selectedWorker.scheduleDetails || []),
                            ...selectedSchedules.map((scheduleId) => {
                              const schedule = schedules.find(
                                (s) => s.id === scheduleId
                              );
                              return {
                                id: scheduleId,
                                title: schedule?.title || "",
                                date: schedule?.startDate || "",
                                description: schedule?.description || "",
                                category: schedule?.category || "",
                                ...newScheduleDetails[scheduleId],
                              };
                            }),
                          ],
                        };

                        // 부모 컴포넌트에 업데이트 요청
                        if (onUpdateWorker) {
                          onUpdateWorker(selectedWorker.id, updatedWorker);
                        }

                        // DB에도 저장
                        const db = getDatabase();
                        selectedSchedules.forEach((scheduleId) => {
                          const details = newScheduleDetails[scheduleId];
                          if (details) {
                            db.addWorkerToSchedule(
                              scheduleId,
                              {
                                id: selectedWorker.id,
                                name: selectedWorker.name,
                                phone: selectedWorker.phone,
                                bankAccount: selectedWorker.bankAccount,
                                hourlyWage: parseInt(details.hourlyWage) || 0,
                                taxWithheld: details.taxWithheld,
                              },
                              [
                                {
                                  id: `${scheduleId}-${selectedWorker.id}`,
                                  start: `${details.workStartDate}T09:00:00+09:00`,
                                  end: `${details.workEndDate}T18:00:00+09:00`,
                                },
                              ],
                              details.paid
                            );
                          }
                        });
                      }
                      setShowScheduleModal(false);
                      setIsScheduleDetailStep(false);
                      setSelectedSchedules([]);
                      setNewScheduleDetails({});
                    }}
                  >
                    <Text style={styles.scheduleConfirmButtonText}>완료</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* 스케줄 상세 모달 */}
      <Modal
        visible={showScheduleDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowScheduleDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSchedule && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedSchedule.title}
                  </Text>
                  <Pressable
                    onPress={() => setShowScheduleDetailModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </Pressable>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>날짜</Text>
                    <Text style={styles.detailValue}>
                      {selectedSchedule.date}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>설명</Text>
                    <Text style={styles.detailValue}>
                      {selectedSchedule.description}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>카테고리</Text>
                    <Text style={styles.detailValue}>
                      {selectedSchedule.category}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>참여 근로자</Text>
                    <View style={styles.participantList}>
                      {schedules
                        .find((s) => s.id === selectedSchedule.id)
                        ?.workers?.map((workerInfo: any, index: number) => (
                          <View key={index} style={styles.participantItem}>
                            <Text style={styles.participantName}>
                              {workerInfo.worker.name}
                            </Text>
                            <Text style={styles.participantPhone}>
                              {workerInfo.worker.phone}
                            </Text>
                            <Text style={styles.participantWage}>
                              {workerInfo.worker.hourlyWage.toLocaleString()}
                              원/시간
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  searchContainer: {
    padding: Theme.spacing.xl,
  },
  workerCountText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: Theme.spacing.md,
    fontWeight: "500",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Theme.spacing.md,
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
  },
  workersList: {
    flex: 1,
    paddingHorizontal: Theme.spacing.xl,
    // 웹에서 2-3열 그리드 레이아웃
    ...(Platform.OS === "web" && {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: Theme.spacing.md,
    }),
  },
  workerCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    flexDirection: "column", // 세로 방향으로 변경
    alignItems: "flex-start", // 왼쪽 정렬
    ...Theme.shadows.sm,
    // 웹에서 그리드 아이템
    ...(Platform.OS === "web" && {
      marginBottom: 0,
    }),
  },
  workerInfo: {
    flex: 1,
    width: "100%", // 웹에서 전체 너비 사용
  },
  workerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Theme.spacing.sm,
  },
  workerNameContainer: {
    flex: 1,
  },
  workerName: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  workerPosition: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    fontWeight: Theme.typography.weights.medium,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
  },
  editButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Theme.colors.background.light,
  },
  iconButton: {
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: "transparent",
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Theme.spacing.sm,
  },
  phoneActionButtons: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
  },
  phoneActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8f0fe",
    justifyContent: "center",
    alignItems: "center",
  },
  workPeriodInfo: {
    marginBottom: Theme.spacing.sm,
  },
  workPeriodLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    fontWeight: Theme.typography.weights.medium,
    marginBottom: Theme.spacing.xs,
  },
  workPeriodText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
  },
  workTimeInfo: {
    marginBottom: Theme.spacing.sm,
  },
  workTimeLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    fontWeight: Theme.typography.weights.medium,
    marginBottom: Theme.spacing.xs,
  },
  workTimeText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    lineHeight: 18,
  },
  workerStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: Theme.borderRadius.sm,
    marginRight: Theme.spacing.xs,
  },
  statusText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
  workerPhone: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Theme.spacing.xs,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
  memoContainer: {
    marginBottom: Theme.spacing.sm,
  },
  memoLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  memoPreview: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    fontStyle: "italic",
  },
  memoInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  workerBank: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  workerWage: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.md,
  },
  schedulesContainer: {
    marginBottom: Theme.spacing.sm,
  },
  schedulesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  schedulesLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
  schedulesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.xs,
    flex: 1,
  },
  scheduleTag: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    marginRight: Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.xs,
  },
  scheduleTagText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  scheduleDateText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.tertiary,
    fontWeight: Theme.typography.weights.medium,
  },
  moreSchedulesTag: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    marginRight: Theme.spacing.xs,
    marginBottom: Theme.spacing.xs,
  },
  moreSchedulesText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.inverse,
    fontWeight: Theme.typography.weights.semibold,
  },
  participantList: {
    marginTop: Theme.spacing.sm,
  },
  participantItem: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
  },
  participantName: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  participantPhone: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    marginBottom: 2,
  },
  participantWage: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.success,
    fontWeight: Theme.typography.weights.medium,
  },
  tagsContainer: {
    marginBottom: Theme.spacing.sm,
  },
  tagsLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.xs,
  },
  workTag: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
  },
  workTagText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  removeTagButton: {
    marginLeft: Theme.spacing.xs,
    padding: Theme.spacing.xs,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: Theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.lg,
    width: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  modalTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
  },
  modalCloseButton: {
    padding: Theme.spacing.xs,
  },
  modalBody: {
    padding: Theme.spacing.xl,
  },
  detailSection: {
    marginBottom: Theme.spacing.xl,
  },
  detailLabel: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.sm,
  },
  detailValue: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
  },
  tagsInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    fontSize: Theme.typography.sizes.sm,
  },
  addTagButton: {
    backgroundColor: Theme.colors.success,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm,
    marginLeft: Theme.spacing.sm,
  },
  scheduleWagesList: {
    marginTop: Theme.spacing.sm,
  },
  scheduleWageItem: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.primary,
  },
  scheduleWageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.xs,
  },
  scheduleWageTitle: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    flex: 1,
  },
  scheduleWageHours: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  scheduleWageDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scheduleWageRate: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
  scheduleWageTotal: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.success,
  },
  detailInput: {
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
    backgroundColor: Theme.colors.background,
  },
  bankHint: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.success,
    marginTop: Theme.spacing.xs,
    fontWeight: Theme.typography.weights.medium,
  },
  bankHintSuccess: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.success,
    marginTop: Theme.spacing.xs,
    fontWeight: Theme.typography.weights.semibold,
  },
  bankHintWarning: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.warning,
    marginTop: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
    fontWeight: Theme.typography.weights.medium,
  },
  bankSelectContainer: {
    marginTop: Theme.spacing.sm,
  },
  picker: {
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
  },
  accountInputContainer: {
    flexDirection: "column",
    gap: Theme.spacing.sm,
  },
  bankLabel: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    alignSelf: "flex-start",
    minWidth: 80,
    alignItems: "center",
  },
  bankLabelText: {
    color: Theme.colors.text.inverse,
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.semibold,
  },
  detailInputWithBank: {
    // 은행 라벨과 분리되었으므로 기본 스타일 사용
  },
  detailInputWithoutBank: {
    // 은행이 감지되지 않았을 때의 스타일
    borderColor: Theme.colors.border.medium,
  },
  taxButtonsContainer: {
    flexDirection: "row",
    gap: Theme.spacing.md,
  },
  taxButton: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 2,
    borderColor: Theme.colors.border.light,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
  },
  taxButtonActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.surface,
  },
  taxButtonText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.secondary,
  },
  taxButtonTextActive: {
    color: Theme.colors.primary,
  },
  modalFooter: {
    padding: Theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
    flexDirection: "row",
    gap: Theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: Theme.colors.primary,
  },
  saveButtonText: {
    color: Theme.colors.text.inverse,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
  },
  deleteButton: {
    backgroundColor: "#ef4444",
  },
  deleteButtonText: {
    color: Theme.colors.text.inverse,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
  },
  // 새로운 스타일들
  workPeriodContainer: {
    backgroundColor: Theme.colors.background.light,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
  workPeriodText: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
    textAlign: "center",
  },
  toggleContainer: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
  },
  toggleButton: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    backgroundColor: Theme.colors.background,
  },
  toggleButtonActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  toggleButtonText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.secondary,
  },
  toggleButtonTextActive: {
    color: Theme.colors.text.inverse,
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    flexWrap: "wrap", // 웹에서 줄바꿈 허용
    justifyContent: "center", // 중앙 정렬
    maxWidth: "100%", // 컨테이너 최대 너비 제한
  },
  timeInput: {
    width: 50, // 더 작은 고정 너비로 설정
    textAlign: "center",
    paddingHorizontal: Theme.spacing.xs,
    fontSize: Theme.typography.sizes.sm, // 폰트 크기 줄임
  },
  timeUnitText: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
    fontWeight: Theme.typography.weights.medium,
  },
  // 날짜별 근무시간 관련 스타일
  dailyWorkTimeItem: {
    backgroundColor: Theme.colors.background.light,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
  dailyWorkDateText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  dailyTimeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    flexWrap: "wrap", // 웹에서 줄바꿈 허용
  },
  dailyTimeInput: {
    flex: 1,
    textAlign: "center",
    minWidth: 80, // 최소 너비 보장
    maxWidth: 100, // 최대 너비 제한
  },
  timeSeparatorText: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
    fontWeight: Theme.typography.weights.medium,
  },
  // 시간/분 드롭다운 관련 스타일
  timeSelectContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    flex: 1,
  },
  timeLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    fontWeight: Theme.typography.weights.medium,
    minWidth: 30,
  },
  timeSelect: {
    flex: 1,
    padding: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
    fontSize: Theme.typography.sizes.sm,
    backgroundColor: Theme.colors.background.primary,
  },
  timePicker: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
  },
  // 2열 레이아웃 스타일
  workersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  workerCard: {
    width: Platform.OS === "web" ? "48%" : "100%",
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
    minHeight: 200,
  },
  // 은행/계좌 정보 스타일
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  bankBadge: {
    backgroundColor: Theme.colors.primary.light,
    color: Theme.colors.primary.dark,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.semibold,
  },
  bankAccountText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    fontFamily: "monospace",
  },
  // 확장 상세 스타일
  expandedDetails: {
    marginTop: Theme.spacing.sm,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
  },
  detailRow: {
    marginBottom: Theme.spacing.sm,
    padding: Theme.spacing.sm,
    backgroundColor: Theme.colors.background.light,
    borderRadius: Theme.borderRadius.sm,
  },
  detailTitle: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  detailSub: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    lineHeight: 16,
  },
  // 참여 일정 헤더 스타일
  schedulesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  expandButton: {
    padding: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
  },
  // 상세 행 헤더 스타일
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Theme.spacing.xs,
  },
  // 지급여부 토글 버튼 스타일
  paidToggle: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
    minWidth: 60,
    alignItems: "center",
  },
  paidToggleText: {
    color: "#ffffff",
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.semibold,
  },
  // 스케줄 선택 모달 스타일
  schedulesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Theme.spacing.sm,
  },
  addScheduleButton: {
    padding: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: "#f3f4f6",
  },
  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  scheduleItemContent: {
    flex: 1,
  },
  scheduleItemTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
  },
  scheduleItemDate: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  scheduleItemDescription: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.textSecondary,
  },
  // 일정 선택 모달 스타일
  scheduleModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Theme.spacing.lg,
  },
  scheduleModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: Theme.borderRadius.lg,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  scheduleModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  scheduleModalTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
  },
  scheduleModalCloseButton: {
    padding: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
  },
  scheduleSearchContainer: {
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
  },
  scheduleSearchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: Theme.typography.sizes.md,
    backgroundColor: "#f9fafb",
  },
  scheduleModalBody: {
    maxHeight: 400,
    paddingHorizontal: Theme.spacing.lg,
  },
  scheduleItemSelected: {
    backgroundColor: "#eff6ff",
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  scheduleItemTitleSelected: {
    color: "#1d4ed8",
    fontWeight: Theme.typography.weights.bold,
  },
  scheduleModalFooter: {
    flexDirection: "row",
    padding: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: Theme.spacing.md,
  },
  scheduleCancelButton: {
    flex: 1,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  scheduleCancelButtonText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
    color: "#6b7280",
  },
  scheduleConfirmButton: {
    flex: 1,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: "#3b82f6",
    alignItems: "center",
  },
  scheduleConfirmButtonText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
    color: "#ffffff",
  },
  // 스케줄 상세 정보 입력 화면 스타일
  scheduleDetailCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
  scheduleDetailTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  scheduleDetailDate: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.lg,
  },
  detailRow: {
    marginBottom: Theme.spacing.md,
  },
  detailRowLabel: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  dateInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  dateInput: {
    flex: 1,
    padding: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
    fontSize: Theme.typography.sizes.sm,
  },
  dateSeparator: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  timeUnit: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  timePicker: {
    width: 80,
    height: 40,
  },
  wageInput: {
    flex: 1,
    padding: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
    fontSize: Theme.typography.sizes.sm,
  },
  wageUnit: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginLeft: Theme.spacing.sm,
  },
  taxButtonsRow: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
  },
  taxButton: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.card,
  },
  taxButtonActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  taxButtonText: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.secondary,
  },
  taxButtonTextActive: {
    color: Theme.colors.text.inverse,
  },
  paidButton: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.card,
  },
  paidButtonActive: {
    backgroundColor: Theme.colors.success,
    borderColor: Theme.colors.success,
  },
  paidButtonText: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.secondary,
  },
  paidButtonTextActive: {
    color: Theme.colors.text.inverse,
  },
  paymentSummary: {
    marginTop: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  paymentRowTotal: {
    marginTop: Theme.spacing.sm,
    paddingTop: Theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.medium,
  },
  paymentLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  paymentValue: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  paymentLabelTotal: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.bold,
  },
  paymentValueTotal: {
    fontSize: Theme.typography.sizes.lg,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.bold,
  },
});
