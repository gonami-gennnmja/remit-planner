import CommonHeader from "@/components/CommonHeader";
import { ContractModal } from "@/components/ContractModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Theme } from "@/constants/Theme";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import {
  Client,
  Schedule,
  ScheduleContract,
  ScheduleTime,
} from "@/models/types";
import {
  formatAccountNumber,
  formatPhoneNumber,
  KOREAN_BANKS,
} from "@/utils/bankUtils";
import { listFiles, pickAndUploadImage } from "@/utils/fileUpload";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
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
import { WebView } from "react-native-webview";

export default function ScheduleDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    category: "",
    location: "",
    address: "",
    uniformTime: true,
    scheduleTimes: [] as Array<{
      workDate: string;
      startTime: string;
      endTime: string;
      breakDuration: number;
    }>,
    documentsFolderPath: "",
    hasAttachments: false,
    clientId: "",
    memo: "",
  });
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [scheduleTimes, setScheduleTimes] = useState<ScheduleTime[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>("");
  const [isPreviewImage, setIsPreviewImage] = useState(false);
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [selectedWorkerIndex, setSelectedWorkerIndex] = useState<number>(-1);
  const [workerEditData, setWorkerEditData] = useState({
    hourlyWage: "",
    fuelAllowance: "",
    otherAllowance: "",
    taxWithheld: false,
    nightShiftEnabled: false,
  });
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [availableWorkers, setAvailableWorkers] = useState<any[]>([]);
  const [workerSearchQuery, setWorkerSearchQuery] = useState("");
  const [showNewWorkerModal, setShowNewWorkerModal] = useState(false);
  const [newWorkerData, setNewWorkerData] = useState({
    name: "",
    phone: "",
    hourlyWage: "15,000",
    bankAccount: "",
    selectedBank: "",
    idCardImageUrl: "",
    memo: "",
  });
  const [detectedBank, setDetectedBank] = useState<any>(null);
  const [showBankSelection, setShowBankSelection] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  // 계약서 관련 상태
  const [contracts, setContracts] = useState<ScheduleContract[]>([]);
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractDirection, setContractDirection] = useState<
    "sent" | "received"
  >("sent");

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const db = getDatabase();
        await db.init();

        const scheduleData = await db.getSchedule(id as string);
        setSchedule(scheduleData);

        if (scheduleData) {
          setEditData({
            title: scheduleData.title,
            description: scheduleData.description || "",
            startDate: scheduleData.startDate,
            endDate: scheduleData.endDate,
            category: scheduleData.category || "",
            location: scheduleData.location || "",
            address: scheduleData.address || "",
            uniformTime: scheduleData.uniformTime ?? true,
            scheduleTimes: [],
            documentsFolderPath: scheduleData.documentsFolderPath || "",
            hasAttachments: scheduleData.hasAttachments || false,
            clientId: scheduleData.clientId || "",
            memo: scheduleData.memo || "",
          });
          setIsMultiDay(scheduleData.startDate !== scheduleData.endDate);

          // 일별 시간 정보 로드
          const times = await db.getScheduleTimes(id as string);
          setScheduleTimes(times);

          // 첨부 문서 로드
          if (scheduleData.documentsFolderPath) {
            setLoadingFiles(true);
            const filesResult = await listFiles(
              "remit-planner-files",
              scheduleData.documentsFolderPath
            );
            if (filesResult.success && filesResult.files) {
              setDocuments(filesResult.files);
            }
            setLoadingFiles(false);
          }

          // 계약서 로드
          await loadContracts();
        }
      } catch (error) {
        console.error("Failed to load schedule:", error);
      }
    };

    const loadClients = async () => {
      try {
        const db = getDatabase();
        const clientsData = await db.getAllClients();
        setClients(clientsData);
      } catch (error) {
        console.error("Failed to load clients:", error);
      }
    };

    if (id) {
      loadSchedule();
      loadClients();
    }
  }, [id]);

  const loadContracts = async () => {
    try {
      const db = getDatabase();
      const contractsData = await db.getScheduleContracts(id as string);
      setContracts(contractsData);
    } catch (error) {
      console.error("Failed to load contracts:", error);
    }
  };

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "#6b7280";
      case "sent":
        return "#3b82f6";
      case "received":
        return "#10b981";
      case "approved":
        return "#059669";
      case "rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getContractStatusText = (status: string) => {
    switch (status) {
      case "draft":
        return "초안";
      case "sent":
        return "발송";
      case "received":
        return "수신";
      case "approved":
        return "승인";
      case "rejected":
        return "거절";
      default:
        return "알 수 없음";
    }
  };

  const handleContractSaved = (contract: ScheduleContract) => {
    setContracts((prev) => [contract, ...prev]);
    // 스케줄의 계약금액 업데이트
    if (schedule) {
      setSchedule({
        ...schedule,
        contractAmount: contract.contractAmount,
      });
    }
  };

  const handleEditSchedule = async () => {
    try {
      const db = getDatabase();
      await db.init();

      const updatedSchedule: Schedule = {
        ...schedule!,
        title: editData.title,
        description: editData.description,
        startDate: editData.startDate,
        endDate: isMultiDay ? editData.endDate : editData.startDate,
        category: editData.category,
        address: editData.address,
        clientId: editData.clientId || undefined,
        memo: editData.memo,
        updatedAt: new Date().toISOString(),
      };

      await db.updateSchedule(id as string, updatedSchedule);
      setSchedule(updatedSchedule);
      setShowEditModal(false);

      Alert.alert("성공", "일정이 수정되었습니다.");
    } catch (error) {
      console.error("Failed to update schedule:", error);
      Alert.alert("오류", "일정 수정에 실패했습니다.");
    }
  };

  if (!schedule) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <LoadingSpinner message="일정 정보를 불러오는 중..." />
      </View>
    );
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case "education":
        return "교육";
      case "event":
        return "이벤트";
      case "meeting":
        return "회의";
      default:
        return "기타";
    }
  };

  const getWorkPeriods = (schedule: Schedule) => {
    const allPeriods = schedule.workers?.flatMap((w) => w.periods || []) || [];
    if (allPeriods.length === 0)
      return { start: "시간 미정", end: "시간 미정" };

    const startTimes = allPeriods
      .filter((p) => p && p.startTime) // null/undefined 체크
      .map((p) => {
        // workDate와 startTime을 합쳐서 Date 객체 생성
        const dateTime = `${p.workDate} ${p.startTime}`;
        return dayjs(dateTime);
      })
      .sort((a, b) => a.diff(b));

    const endTimes = allPeriods
      .filter((p) => p && p.endTime) // null/undefined 체크
      .map((p) => {
        // workDate와 endTime을 합쳐서 Date 객체 생성
        const dateTime = `${p.workDate} ${p.endTime}`;
        return dayjs(dateTime);
      })
      .sort((a, b) => b.diff(a));

    return {
      start: allPeriods.length > 0 ? allPeriods[0].startTime : "시간 미정",
      end:
        allPeriods.length > 0
          ? allPeriods[allPeriods.length - 1].endTime
          : "시간 미정",
    };
  };

  const periods = getWorkPeriods(schedule);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <CommonHeader
        title="스케줄 상세"
        leftButton={{
          icon: "arrow-back",
          onPress: () => router.back(),
        }}
        rightButton={{
          icon: "create-outline",
          onPress: () => setShowEditModal(true),
        }}
      />

      <ScrollView style={styles.content}>
        {/* 스케줄 정보 */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleTitle}>{schedule.title}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {getCategoryText(schedule.category)}
              </Text>
            </View>
          </View>

          <Text style={styles.scheduleDate}>
            {dayjs(schedule.startDate).format("YYYY년 M월 D일")}
            {schedule.startDate !== schedule.endDate &&
              ` ~ ${dayjs(schedule.endDate).format("M월 D일")}`}
          </Text>

          {schedule.description && (
            <Text style={styles.description}>{schedule.description}</Text>
          )}

          {schedule.clientId && (
            <View style={styles.infoRow}>
              <Ionicons
                name="business-outline"
                size={16}
                color={Theme.colors.text.secondary}
              />
              <Text style={styles.infoText}>
                거래처:{" "}
                {clients.find((c) => c.id === schedule.clientId)?.name ||
                  "알 수 없음"}
              </Text>
            </View>
          )}

          {schedule.location && (
            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={Theme.colors.text.secondary}
              />
              <Text style={styles.infoText}>{schedule.location}</Text>
            </View>
          )}

          {schedule.address && (
            <View style={styles.infoRow}>
              <Ionicons
                name="map-outline"
                size={16}
                color={Theme.colors.text.secondary}
              />
              <Text style={styles.infoText}>{schedule.address}</Text>
            </View>
          )}

          {/* 첨부파일 여부 */}
          {schedule.hasAttachments && (
            <View style={styles.infoRow}>
              <Ionicons
                name="attach-outline"
                size={16}
                color={Theme.colors.primary}
              />
              <Text style={[styles.infoText, { color: Theme.colors.primary }]}>
                첨부파일 있음
              </Text>
            </View>
          )}

          {/* 일별 시간 설정 여부 */}
          {!schedule.uniformTime && (
            <View style={styles.infoRow}>
              <Ionicons
                name="time-outline"
                size={16}
                color={Theme.colors.text.secondary}
              />
              <Text style={styles.infoText}>일별 시간 설정됨</Text>
            </View>
          )}

          {/* 계약금액 */}
          {schedule.contractAmount && schedule.contractAmount > 0 && (
            <View style={styles.infoRow}>
              <Ionicons
                name="cash-outline"
                size={16}
                color={Theme.colors.primary}
              />
              <Text style={[styles.infoText, { color: Theme.colors.primary }]}>
                계약금액: {schedule.contractAmount.toLocaleString()}원
              </Text>
            </View>
          )}

          <View style={styles.timeRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color={Theme.colors.text.secondary}
            />
            <Text style={styles.timeText}>
              {periods.start} - {periods.end}
            </Text>
          </View>

          {schedule.memo && (
            <View style={styles.memoRow}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color={Theme.colors.text.secondary}
              />
              <Text style={styles.memoText}>{schedule.memo}</Text>
            </View>
          )}
        </View>

        {/* 첨부 문서 */}
        {schedule.hasAttachments && (
          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>첨부 문서</Text>
            {loadingFiles ? (
              <Text style={styles.loadingText}>문서 목록 불러오는 중...</Text>
            ) : documents.length > 0 ? (
              documents.map((file, index) => (
                <Pressable
                  key={index}
                  style={styles.documentItem}
                  onPress={async () => {
                    const { supabase } = await import("@/lib/supabase");
                    const { data } = supabase.storage
                      .from("remit-planner-files")
                      .getPublicUrl(
                        `${schedule.documentsFolderPath}/${file.name}`
                      );

                    if (!data?.publicUrl) return;

                    // 파일 타입 확인
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                      file.name
                    );
                    const isPDF = /\.pdf$/i.test(file.name);
                    const isExcel = /\.(xls|xlsx)$/i.test(file.name);
                    const isWord = /\.(doc|docx)$/i.test(file.name);
                    const isPowerPoint = /\.(ppt|pptx)$/i.test(file.name);
                    const isDocument = isExcel || isWord || isPowerPoint;

                    if (isImage) {
                      // 이미지는 바로 미리보기
                      setPreviewUrl(data.publicUrl);
                      setPreviewFileName(file.name);
                      setIsPreviewImage(true);
                      setPreviewModal(true);
                    } else if (isPDF || isDocument) {
                      // PDF 및 문서는 다운로드/미리보기 선택
                      Alert.alert("파일 보기", file.name, [
                        { text: "취소", style: "cancel" },
                        {
                          text: "미리보기",
                          onPress: () => {
                            setPreviewUrl(data.publicUrl);
                            setPreviewFileName(file.name);
                            setIsPreviewImage(false); // 문서는 WebView 사용
                            setPreviewModal(true);
                          },
                        },
                        {
                          text: "다운로드",
                          onPress: () => Linking.openURL(data.publicUrl),
                        },
                      ]);
                    } else {
                      // 기타 파일은 다운로드만
                      Alert.alert(
                        "파일 다운로드",
                        `${file.name}\n다운로드하시겠습니까?`,
                        [
                          { text: "취소", style: "cancel" },
                          {
                            text: "다운로드",
                            onPress: () => Linking.openURL(data.publicUrl),
                          },
                        ]
                      );
                    }
                  }}
                >
                  <Ionicons
                    name="document-text"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.documentName}>{file.name}</Text>
                  <Text style={styles.documentSize}>
                    {(file.metadata?.size / 1024).toFixed(1)} KB
                  </Text>
                </Pressable>
              ))
            ) : (
              <View
                style={{
                  padding: 12,
                  backgroundColor: "#f9fafb",
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: "#6b7280",
                    textAlign: "center",
                  }}
                >
                  첨부된 파일이 없습니다
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 일별 시간 정보 */}
        {!schedule.uniformTime && scheduleTimes.length > 0 && (
          <View style={styles.timesSection}>
            <Text style={styles.sectionTitle}>일별 근무 시간</Text>
            {scheduleTimes.map((time, index) => (
              <View key={index} style={styles.timeItem}>
                <Text style={styles.timeDate}>
                  {dayjs(time.workDate).format("M월 D일")}
                </Text>
                <Text style={styles.timeValue}>
                  {time.startTime} - {time.endTime}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 계약서 관리 섹션 */}
        <View style={styles.contractSection}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={styles.sectionTitle}>계약서 관리</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => {
                  setContractDirection("sent");
                  setShowContractModal(true);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#3b82f6",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
              </Pressable>
              <Pressable
                onPress={() => {
                  setContractDirection("received");
                  setShowContractModal(true);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#10b981",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="download-outline" size={16} color="#fff" />
              </Pressable>
            </View>
          </View>

          {contracts.length > 0 ? (
            <View style={styles.contractsList}>
              {contracts.map((contract) => (
                <View key={contract.id} style={styles.contractCard}>
                  <View style={styles.contractHeader}>
                    <View style={styles.contractType}>
                      <Ionicons
                        name={
                          contract.contractType === "written"
                            ? "document-text-outline"
                            : contract.contractType === "verbal"
                            ? "mic-outline"
                            : "chatbubble-outline"
                        }
                        size={16}
                        color="#fff"
                      />
                      <Text style={styles.contractTypeText}>
                        {contract.contractType === "written"
                          ? "작성"
                          : contract.contractType === "verbal"
                          ? "구두"
                          : "텍스트"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.contractStatus,
                        {
                          backgroundColor: getContractStatusColor(
                            contract.contractStatus
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.contractStatusText}>
                        {getContractStatusText(contract.contractStatus)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.contractInfo}>
                    <Text style={styles.contractAmount}>
                      {contract.contractAmount.toLocaleString()}원
                    </Text>
                    <Text style={styles.contractDirection}>
                      {contract.contractDirection === "sent" ? "발송" : "수신"}
                    </Text>
                  </View>

                  {contract.contractContent && (
                    <Text style={styles.contractContent} numberOfLines={2}>
                      {contract.contractContent}
                    </Text>
                  )}

                  <Text style={styles.contractDate}>
                    {dayjs(contract.createdAt).format("YYYY.MM.DD")}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContracts}>
              <Ionicons name="document-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyContractsText}>
                등록된 계약서가 없습니다
              </Text>
              <Text style={styles.emptyContractsSubtext}>
                계약서를 작성하거나 수신해보세요
              </Text>
            </View>
          )}
        </View>

        {/* 근로자 목록 */}
        <View style={styles.workersSection}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={styles.sectionTitle}>참여 근로자</Text>
            <Pressable
              onPress={async () => {
                try {
                  const db = getDatabase();
                  await db.init();

                  // 전체 근로자 목록 가져오기
                  const allWorkers = await db.getAllWorkers();

                  // 이미 참여 중인 근로자 ID 목록
                  const participatingWorkerIds = new Set(
                    schedule.workers?.map((w) => w.worker.id) || []
                  );

                  // 참여하지 않은 근로자만 필터링
                  const filteredWorkers = allWorkers.filter(
                    (worker) => !participatingWorkerIds.has(worker.id)
                  );

                  setAvailableWorkers(filteredWorkers);
                  setWorkerSearchQuery("");
                  setShowAddWorkerModal(true);
                } catch (error) {
                  console.error("Failed to load workers:", error);
                  Alert.alert("오류", "근로자 목록을 불러오는데 실패했습니다");
                }
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.primary,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="add" size={20} color="white" />
            </Pressable>
          </View>
          {schedule.workers?.map((workerInfo, index) => (
            <Pressable
              key={index}
              style={styles.workerCard}
              onPress={() => {
                // 근로자 상세 모달 열기
                setSelectedWorkerIndex(index);
                const workerInfo = schedule.workers?.[index];
                if (workerInfo) {
                  // 근무 시간 확인 (22:00 이후가 있는지)
                  const hasNightHours = workerInfo.periods?.some((period) => {
                    if (
                      !period.startTime ||
                      !period.endTime ||
                      !period.workDate
                    )
                      return false;
                    const startHour = parseInt(period.startTime.split(":")[0]);
                    const endHour = parseInt(period.endTime.split(":")[0]);
                    return startHour >= 22 || endHour <= 6;
                  });

                  setWorkerEditData({
                    hourlyWage: (workerInfo.worker.hourlyWage || 0).toString(),
                    fuelAllowance: (
                      (workerInfo as any).fuelAllowance || 0
                    ).toString(),
                    otherAllowance: (
                      (workerInfo as any).otherAllowance || 0
                    ).toString(),
                    taxWithheld: workerInfo.taxWithheld || false,
                    nightShiftEnabled: hasNightHours || false,
                  });
                }
                setShowWorkerModal(true);
              }}
            >
              <View style={styles.workerHeader}>
                <Text style={styles.workerName}>{workerInfo.worker.name}</Text>
                <View
                  style={[
                    styles.paidBadge,
                    {
                      backgroundColor: workerInfo.paid
                        ? Theme.colors.success
                        : Theme.colors.warning,
                    },
                  ]}
                >
                  <Text style={styles.paidText}>
                    {workerInfo.paid ? "지급완료" : "미지급"}
                  </Text>
                </View>
              </View>

              <View style={styles.workerDetails}>
                <Text style={styles.workerPhone}>
                  {formatPhoneNumber(workerInfo.worker.phone)}
                </Text>
                <Text style={styles.workerWage}>
                  {new Intl.NumberFormat("ko-KR").format(
                    workerInfo.worker.hourlyWage
                  )}
                  원/시간
                </Text>
              </View>

              {/* 근무 기간별 상세 */}
              {(() => {
                if (!workerInfo.periods || workerInfo.periods.length === 0) {
                  return (
                    <View
                      style={{
                        padding: 12,
                        backgroundColor: "#f9fafb",
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                          textAlign: "center",
                        }}
                      >
                        근무 기간 정보가 없습니다
                      </Text>
                    </View>
                  );
                }

                // 모든 기간이 유효한지 확인
                const validPeriods = workerInfo.periods.filter(
                  (period) =>
                    period.startTime &&
                    period.endTime &&
                    period.workDate &&
                    dayjs(`${period.workDate} ${period.startTime}`).isValid() &&
                    dayjs(`${period.workDate} ${period.endTime}`).isValid()
                );

                // 유효한 기간이 없으면
                if (validPeriods.length === 0) {
                  return (
                    <View style={styles.periodsList}>
                      <View style={styles.periodItem}>
                        <Text style={styles.periodText}>
                          근무 시간 정보 없음
                        </Text>
                      </View>
                    </View>
                  );
                }

                // 모든 기간의 시간이 동일한지 확인
                const firstPeriod = validPeriods[0];
                const allSameTime = validPeriods.every(
                  (period) =>
                    period.startTime === firstPeriod.startTime &&
                    period.endTime === firstPeriod.endTime
                );

                // 매일 시간이 동일하면 한 줄로 표시
                if (allSameTime && validPeriods.length > 1) {
                  const sortedDates = validPeriods
                    .map((p) => dayjs(p.workDate))
                    .sort((a, b) => a.diff(b));
                  const startDate = sortedDates[0];
                  const endDate = sortedDates[sortedDates.length - 1];

                  const totalHours = validPeriods.reduce((sum, period) => {
                    const start = dayjs(
                      `${period.workDate} ${period.startTime}`
                    );
                    const end = dayjs(`${period.workDate} ${period.endTime}`);
                    return (
                      sum +
                      end.diff(start, "hour", true) -
                      (period.breakDuration || 0) / 60
                    );
                  }, 0);

                  const grossPay =
                    (workerInfo.worker.hourlyWage || 0) *
                    Math.max(0, totalHours);

                  const dateRange =
                    startDate.format("M월 D일") === endDate.format("M월 D일")
                      ? startDate.format("M월 D일")
                      : `${startDate.format("M월 D일")} ~ ${endDate.format(
                          "M월 D일"
                        )}`;

                  return (
                    <View style={styles.periodsList}>
                      <View style={styles.periodItem}>
                        <Text style={styles.periodText}>
                          {dateRange} {firstPeriod.startTime} -{" "}
                          {firstPeriod.endTime}
                        </Text>
                        <Text style={styles.periodHours}>
                          근무시간: {totalHours.toFixed(1)}시간 /{" "}
                          {new Intl.NumberFormat("ko-KR").format(
                            Math.round(grossPay)
                          )}
                          원
                        </Text>
                        {firstPeriod.breakDuration &&
                          firstPeriod.breakDuration > 0 && (
                            <Text style={styles.periodBreak}>
                              휴게시간: {firstPeriod.breakDuration}분
                            </Text>
                          )}
                      </View>
                    </View>
                  );
                }

                // 각 기간별로 표시
                return (
                  <View style={styles.periodsList}>
                    {validPeriods.map((period, periodIndex) => {
                      const start = dayjs(
                        `${period.workDate} ${period.startTime}`
                      );
                      const end = dayjs(`${period.workDate} ${period.endTime}`);
                      const hours =
                        end.diff(start, "hour", true) -
                        (period.breakDuration || 0) / 60;
                      const grossPay =
                        (workerInfo.worker.hourlyWage || 0) *
                        Math.max(0, hours);

                      return (
                        <View key={periodIndex} style={styles.periodItem}>
                          <Text style={styles.periodText}>
                            {dayjs(period.workDate).format("M월 D일")}{" "}
                            {period.startTime} - {period.endTime}
                          </Text>
                          <Text style={styles.periodHours}>
                            근무시간: {hours.toFixed(1)}시간 /{" "}
                            {new Intl.NumberFormat("ko-KR").format(
                              Math.round(grossPay)
                            )}
                            원
                          </Text>
                          {period.breakDuration && period.breakDuration > 0 && (
                            <Text style={styles.periodBreak}>
                              휴게시간: {period.breakDuration}분
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })()}

              {/* 총 급여 요약 */}
              {workerInfo.periods &&
                workerInfo.periods.length > 0 &&
                (() => {
                  const totalHours = workerInfo.periods.reduce(
                    (sum, period) => {
                      if (
                        !period.startTime ||
                        !period.endTime ||
                        !period.workDate
                      )
                        return sum;
                      const start = dayjs(
                        `${period.workDate} ${period.startTime}`
                      );
                      const end = dayjs(`${period.workDate} ${period.endTime}`);
                      if (!start.isValid() || !end.isValid()) return sum;
                      const hours =
                        end.diff(start, "hour", true) -
                        (period.breakDuration || 0) / 60;
                      return sum + Math.max(0, hours);
                    },
                    0
                  );

                  const totalPay =
                    totalHours * (workerInfo.worker.hourlyWage || 0);

                  return (
                    <View style={styles.totalPayRow}>
                      <View style={styles.totalPayInfo}>
                        <Text style={styles.totalPayLabel}>총 근무시간</Text>
                        <Text style={styles.totalPayValue}>
                          {totalHours.toFixed(1)}시간
                        </Text>
                      </View>
                      <View style={styles.totalPayDivider} />
                      <View style={styles.totalPayInfo}>
                        <Text style={styles.totalPayLabel}>총 급여</Text>
                        <Text
                          style={[
                            styles.totalPayValue,
                            { color: colors.primary },
                          ]}
                        >
                          {new Intl.NumberFormat("ko-KR").format(
                            Math.round(Math.max(0, totalPay))
                          )}
                          원
                        </Text>
                      </View>
                    </View>
                  );
                })()}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* 수정 모달 */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: Platform.OS === "web" ? "center" : "flex-end",
            alignItems: "center",
            padding: Platform.OS === "web" ? 20 : 0,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: Platform.OS === "web" ? 12 : 0,
              borderTopLeftRadius: Platform.OS === "web" ? 12 : 20,
              borderTopRightRadius: Platform.OS === "web" ? 12 : 20,
              width: "100%",
              maxWidth: Platform.OS === "web" ? 500 : "100%",
              maxHeight: Platform.OS === "web" ? "90%" : "85%",
              minHeight: Platform.OS === "web" ? "auto" : "60%",
              overflow: "hidden",
            }}
          >
            {/* 헤더 */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#e5e7eb",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}
              >
                일정 수정
              </Text>
              <Pressable
                onPress={() => setShowEditModal(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: "#f3f4f6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={20} color="#6b7280" />
              </Pressable>
            </View>

            {/* 스크롤 가능한 콘텐츠 */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
              showsVerticalScrollIndicator={true}
            >
              {/* 제목 */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                >
                  제목 *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 16,
                  }}
                  value={editData.title}
                  onChangeText={(text) =>
                    setEditData({ ...editData, title: text })
                  }
                  placeholder="일정 제목을 입력하세요"
                />
              </View>

              {/* 설명 */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                >
                  설명
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 16,
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                  value={editData.description}
                  onChangeText={(text) =>
                    setEditData({ ...editData, description: text })
                  }
                  placeholder="일정 설명을 입력하세요"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* 거래처 선택 */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                >
                  거래처
                </Text>
                <Pressable
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 6,
                    padding: 12,
                    backgroundColor: "#f9fafb",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onPress={() => setShowClientModal(true)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <Ionicons
                      name="business-outline"
                      size={20}
                      color="#6b7280"
                    />
                    <Text
                      style={{
                        marginLeft: 8,
                        fontSize: 16,
                        color: editData.clientId ? "#374151" : "#9ca3af",
                        flex: 1,
                      }}
                    >
                      {editData.clientId
                        ? clients.find((c) => c.id === editData.clientId)
                            ?.name || "알 수 없음"
                        : "거래처를 선택하세요"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                </Pressable>
              </View>

              {/* 날짜 및 시간 */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, marginBottom: 8, color: "#374151" }}
                >
                  날짜 및 시간
                </Text>

                {/* 여러 날에 걸친 일정 체크박스 */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Pressable
                    onPress={() => setIsMultiDay(!isMultiDay)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginRight: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: isMultiDay ? "#2563eb" : "#d1d5db",
                        backgroundColor: isMultiDay ? "#2563eb" : "white",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 8,
                      }}
                    >
                      {isMultiDay && (
                        <Ionicons name="checkmark" size={12} color="white" />
                      )}
                    </View>
                    <Text style={{ fontSize: 14, color: "#374151" }}>
                      여러 날에 걸친 일정
                    </Text>
                  </Pressable>
                </View>

                {/* 시작일 */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{ fontSize: 12, marginBottom: 4, color: "#6b7280" }}
                  >
                    시작일 *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#d1d5db",
                      borderRadius: 6,
                      padding: 12,
                      fontSize: 14,
                    }}
                    value={editData.startDate}
                    onChangeText={(text) =>
                      setEditData({ ...editData, startDate: text })
                    }
                    placeholder="YYYY-MM-DD"
                  />
                </View>

                {/* 종료일 (여러 날에 걸친 일정일 때만) */}
                {isMultiDay && (
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        marginBottom: 4,
                        color: "#6b7280",
                      }}
                    >
                      종료일 *
                    </Text>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: "#d1d5db",
                        borderRadius: 6,
                        padding: 12,
                        fontSize: 14,
                      }}
                      value={editData.endDate}
                      onChangeText={(text) =>
                        setEditData({ ...editData, endDate: text })
                      }
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                )}
              </View>

              {/* 카테고리 */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                >
                  카테고리
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 16,
                  }}
                  value={editData.category}
                  onChangeText={(text) =>
                    setEditData({ ...editData, category: text })
                  }
                  placeholder="카테고리를 입력하세요"
                />
              </View>

              {/* 주소 */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                >
                  주소
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 16,
                  }}
                  value={editData.address}
                  onChangeText={(text) =>
                    setEditData({ ...editData, address: text })
                  }
                  placeholder="주소를 입력하세요"
                />
              </View>

              {/* 메모 */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                >
                  메모
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 16,
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                  value={editData.memo}
                  onChangeText={(text) =>
                    setEditData({ ...editData, memo: text })
                  }
                  placeholder="메모를 입력하세요"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* 근로자 섹션 */}
              <View style={{ marginBottom: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    참여 근로자
                  </Text>
                  <Text
                    style={{ fontSize: 14, color: Theme.colors.text.secondary }}
                  >
                    {schedule?.workers?.length || 0}명
                  </Text>
                </View>

                {schedule?.workers?.map((workerInfo, index) => (
                  <Pressable
                    key={index}
                    style={{
                      backgroundColor: "#f9fafb",
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                    }}
                    onPress={() => {
                      // 근로자 상세 모달 열기
                      setSelectedWorkerIndex(index);
                      const workerInfo = schedule.workers?.[index];
                      if (workerInfo) {
                        // 근무 시간 확인 (22:00 이후가 있는지)
                        const hasNightHours = workerInfo.periods?.some(
                          (period) => {
                            if (
                              !period.startTime ||
                              !period.endTime ||
                              !period.workDate
                            )
                              return false;
                            const startHour = parseInt(
                              period.startTime.split(":")[0]
                            );
                            const endHour = parseInt(
                              period.endTime.split(":")[0]
                            );
                            return startHour >= 22 || endHour <= 6;
                          }
                        );

                        setWorkerEditData({
                          hourlyWage: (
                            workerInfo.worker.hourlyWage || 0
                          ).toString(),
                          fuelAllowance: (
                            (workerInfo as any).fuelAllowance || 0
                          ).toString(),
                          otherAllowance: (
                            (workerInfo as any).otherAllowance || 0
                          ).toString(),
                          taxWithheld: workerInfo.taxWithheld || false,
                          nightShiftEnabled: hasNightHours || false,
                        });
                      }
                      setShowWorkerModal(true);
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: 8,
                      }}
                    >
                      {workerInfo.worker.name}
                    </Text>

                    {/* 지급 상태 토글 */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ fontSize: 13, color: "#6b7280" }}>
                        지급 상태
                      </Text>
                      <Pressable
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                        onPress={async () => {
                          // 지급 상태 토글
                          const db = getDatabase();
                          await db.init();

                          // 일단 구조를 유지하면서 지급 상태만 변경
                          const updatedSchedule = {
                            ...schedule!,
                            workers: schedule!.workers?.map((w, i) =>
                              i === index ? { ...w, paid: !w.paid } : w
                            ),
                          };

                          await db.updateSchedule(
                            id as string,
                            updatedSchedule
                          );
                          setSchedule(updatedSchedule);
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: workerInfo.paid
                              ? "#10b981"
                              : "#d1d5db",
                            justifyContent: "center",
                            alignItems: workerInfo.paid
                              ? "flex-end"
                              : "flex-start",
                            paddingHorizontal: 4,
                          }}
                        >
                          <View
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 9,
                              backgroundColor: "white",
                            }}
                          />
                        </View>
                        <Text
                          style={{
                            fontSize: 13,
                            color: workerInfo.paid ? "#10b981" : "#6b7280",
                            fontWeight: "500",
                          }}
                        >
                          {workerInfo.paid ? "지급완료" : "미지급"}
                        </Text>
                      </Pressable>
                    </View>
                  </Pressable>
                ))}

                {(!schedule?.workers || schedule.workers.length === 0) && (
                  <View
                    style={{
                      backgroundColor: "#f9fafb",
                      borderRadius: 8,
                      padding: 24,
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="people-outline" size={32} color="#9ca3af" />
                    <Text
                      style={{
                        marginTop: 8,
                        fontSize: 14,
                        color: "#6b7280",
                      }}
                    >
                      등록된 근로자가 없습니다
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* 하단 버튼들 */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderTopWidth: 1,
                borderTopColor: "#e5e7eb",
                flexDirection: "row",
                gap: 12,
                backgroundColor: "white",
              }}
            >
              <Pressable
                onPress={() => setShowEditModal(false)}
                style={{
                  backgroundColor: "#6b7280",
                  paddingVertical: 12,
                  borderRadius: 6,
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  취소
                </Text>
              </Pressable>
              <Pressable
                onPress={handleEditSchedule}
                style={{
                  backgroundColor: "#10b981",
                  paddingVertical: 12,
                  borderRadius: 6,
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  수정
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 거래처 선택 모달 */}
      <Modal
        visible={showClientModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClientModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          {/* 헤더 */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
            }}
          >
            <Pressable
              style={{ padding: 8 }}
              onPress={() => setShowClientModal(false)}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}>
              거래처 선택
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* 검색 */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: "#f5f5f5",
            }}
          >
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 16,
                paddingVertical: 8,
              }}
              placeholder="거래처명으로 검색"
              value={clientSearchQuery}
              onChangeText={setClientSearchQuery}
            />
            {clientSearchQuery.length > 0 && (
              <Pressable onPress={() => setClientSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </Pressable>
            )}
          </View>

          {/* 거래처 목록 */}
          <ScrollView style={{ flex: 1 }}>
            {/* 거래처 없음 옵션 */}
            <Pressable
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 16,
                margin: 16,
                marginBottom: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04, // Apple Compact very subtle shadow
                shadowRadius: 4,
                elevation: 3,
                borderWidth: editData.clientId === "" ? 2 : 0,
                borderColor:
                  editData.clientId === "" ? colors.primary : "transparent",
              }}
              onPress={() => {
                setEditData({ ...editData, clientId: "" });
                setShowClientModal(false);
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={20}
                    color="#6b7280"
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      marginLeft: 8,
                      color: "#374151",
                    }}
                  >
                    거래처 없음
                  </Text>
                </View>
                {editData.clientId === "" && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </View>
            </Pressable>

            {/* 거래처 목록 */}
            {clients
              .filter(
                (client) =>
                  client.name
                    .toLowerCase()
                    .includes(clientSearchQuery.toLowerCase()) ||
                  (client.contactPerson &&
                    client.contactPerson
                      .toLowerCase()
                      .includes(clientSearchQuery.toLowerCase()))
              )
              .map((client) => (
                <Pressable
                  key={client.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    padding: 16,
                    marginHorizontal: 16,
                    marginBottom: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04, // Apple Compact very subtle shadow
                    shadowRadius: 4,
                    elevation: 3,
                    borderWidth: editData.clientId === client.id ? 2 : 0,
                    borderColor:
                      editData.clientId === client.id
                        ? colors.primary
                        : "transparent",
                  }}
                  onPress={() => {
                    setEditData({ ...editData, clientId: client.id });
                    setShowClientModal(false);
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Ionicons name="business" size={20} color="#007AFF" />
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            marginLeft: 8,
                          }}
                        >
                          {client.name || "이름 없음"}
                        </Text>
                      </View>

                      {/* 담당자 정보 */}
                      {client.contactPerson && (
                        <View style={{ marginBottom: 8 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 4,
                            }}
                          >
                            <Ionicons name="person" size={16} color="#666" />
                            <Text
                              style={{
                                fontSize: 14,
                                color: "#666",
                                marginLeft: 6,
                              }}
                            >
                              담당자: {client.contactPerson}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* 연락처 */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Ionicons name="call" size={16} color="#666" />
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#666",
                            marginLeft: 6,
                          }}
                        >
                          {client.phone}
                        </Text>
                      </View>
                    </View>
                    {editData.clientId === client.id && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </View>
                </Pressable>
              ))}

            {clients.filter(
              (client) =>
                client.name
                  .toLowerCase()
                  .includes(clientSearchQuery.toLowerCase()) ||
                (client.contactPerson &&
                  client.contactPerson
                    .toLowerCase()
                    .includes(clientSearchQuery.toLowerCase()))
            ).length === 0 && (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  padding: 32,
                }}
              >
                <Ionicons name="business-outline" size={64} color="#ccc" />
                <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>
                  {clientSearchQuery
                    ? "검색 결과가 없습니다"
                    : "등록된 거래처가 없습니다"}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* 파일 미리보기 모달 */}
      <Modal
        visible={previewModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* 헤더 */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              paddingTop: Platform.OS === "ios" ? 60 : 20,
              paddingHorizontal: 20,
              paddingBottom: 20,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "white", fontSize: 16, fontWeight: "600" }}
              numberOfLines={1}
            >
              {previewFileName}
            </Text>
            <Pressable
              onPress={() => setPreviewModal(false)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
          </View>

          {/* 미리보기 콘텐츠 */}
          {previewUrl && (
            <>
              {isPreviewImage ? (
                // 이미지 미리보기
                <Image
                  source={{ uri: previewUrl }}
                  style={{
                    width: "100%",
                    height: "100%",
                    resizeMode: "contain",
                  }}
                />
              ) : (
                // 문서 미리보기 (Google Docs Viewer 사용)
                <WebView
                  source={{
                    uri: `https://docs.google.com/viewer?url=${encodeURIComponent(
                      previewUrl
                    )}&embedded=true`,
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  startInLoadingState={true}
                  scalesPageToFit={true}
                />
              )}
            </>
          )}

          {/* 하단 버튼 */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 20,
              paddingBottom: Platform.OS === "ios" ? 40 : 20,
            }}
          >
            <Pressable
              onPress={async () => {
                if (previewUrl) {
                  await Linking.openURL(previewUrl);
                }
              }}
              style={{
                backgroundColor: "white",
                padding: 16,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}
              >
                다운로드
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 근로자 상세 모달 */}
      <Modal
        visible={showWorkerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWorkerModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "90%",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.04, // Apple Compact very subtle shadow
              shadowRadius: 4,
              elevation: 16,
            }}
          >
            {selectedWorkerIndex >= 0 &&
              schedule?.workers?.[selectedWorkerIndex] && (
                <>
                  {/* 헤더 */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: 20,
                      borderBottomWidth: 1,
                      borderBottomColor: "#e5e7eb",
                      marginBottom: 24,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 24,
                          fontWeight: "700",
                          color: "#111827",
                        }}
                      >
                        {schedule.workers[selectedWorkerIndex].worker.name}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 8,
                          gap: 8,
                        }}
                      >
                        <Text style={{ fontSize: 14, color: "#6b7280" }}>
                          {formatPhoneNumber(
                            schedule.workers[selectedWorkerIndex].worker.phone
                          )}
                        </Text>
                        <Pressable
                          onPress={() => {
                            if (schedule?.workers?.[selectedWorkerIndex]) {
                              Linking.openURL(
                                `tel:${schedule.workers[selectedWorkerIndex].worker.phone}`
                              );
                            }
                          }}
                          style={({ pressed }) => [
                            {
                              opacity: pressed ? 0.6 : 1,
                            },
                          ]}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={{ fontSize: 18 }}>📞</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            if (schedule?.workers?.[selectedWorkerIndex]) {
                              Linking.openURL(
                                `sms:${schedule.workers[selectedWorkerIndex].worker.phone}`
                              );
                            }
                          }}
                          style={({ pressed }) => [
                            {
                              opacity: pressed ? 0.6 : 1,
                            },
                          ]}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text style={{ fontSize: 18 }}>💬</Text>
                        </Pressable>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => setShowWorkerModal(false)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: "#f3f4f6",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="close" size={20} color="#6b7280" />
                    </Pressable>
                  </View>

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{ maxHeight: "70%" }}
                  >
                    {/* 급여 정보 섹션 */}
                    <View style={{ marginBottom: 28 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#111827",
                          marginBottom: 16,
                        }}
                      >
                        급여 정보
                      </Text>

                      {/* 시급 */}
                      <View
                        style={{
                          backgroundColor: "#fff",
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 12,
                          borderWidth: 1,
                          borderColor: "#e5e7eb",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              flex: 1,
                            }}
                          >
                            <Ionicons
                              name="cash-outline"
                              size={20}
                              color="#6b7280"
                            />
                            <Text
                              style={{
                                fontSize: 15,
                                color: "#111827",
                                fontWeight: "600",
                                marginLeft: 8,
                              }}
                            >
                              시급
                            </Text>
                          </View>

                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <TextInput
                              style={{
                                fontSize: 15,
                                fontWeight: "600",
                                color: "#111827",
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                borderRadius: 6,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                width: 80,
                                textAlign: "right",
                                backgroundColor: "#f9fafb",
                              }}
                              value={
                                workerEditData.hourlyWage
                                  ? new Intl.NumberFormat("ko-KR").format(
                                      parseInt(workerEditData.hourlyWage) || 0
                                    )
                                  : ""
                              }
                              onChangeText={(text) => {
                                const numericText = text.replace(/,/g, "");
                                setWorkerEditData({
                                  ...workerEditData,
                                  hourlyWage: numericText,
                                });
                              }}
                              placeholder="0"
                              keyboardType="numeric"
                            />
                            <Text
                              style={{
                                fontSize: 13,
                                color: "#6b7280",
                              }}
                            >
                              원/시간
                            </Text>
                            <Pressable
                              onPress={async () => {
                                const workerInfo =
                                  schedule?.workers?.[selectedWorkerIndex];
                                if (!workerInfo) return;
                                const db = getDatabase();
                                await db.init();

                                const updatedSchedule = {
                                  ...schedule!,
                                  workers: schedule!.workers?.map((w, i) =>
                                    i === selectedWorkerIndex
                                      ? { ...w, wagePaid: !w.wagePaid }
                                      : w
                                  ),
                                };

                                await db.updateSchedule(
                                  id as string,
                                  updatedSchedule
                                );
                                setSchedule(updatedSchedule);
                              }}
                            >
                              <View
                                style={{
                                  width: 44,
                                  height: 24,
                                  borderRadius: 12,
                                  backgroundColor: (
                                    schedule.workers[selectedWorkerIndex] as any
                                  ).wagePaid
                                    ? "#10b981"
                                    : "#d1d5db",
                                  justifyContent: "center",
                                  alignItems: (
                                    schedule.workers[selectedWorkerIndex] as any
                                  ).wagePaid
                                    ? "flex-end"
                                    : "flex-start",
                                  paddingHorizontal: 2,
                                }}
                              >
                                <View
                                  style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    backgroundColor: "white",
                                  }}
                                />
                              </View>
                            </Pressable>
                          </View>
                        </View>
                      </View>

                      {/* 유류비 */}
                      <View
                        style={{
                          backgroundColor: "#fff",
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 12,
                          borderWidth: 1,
                          borderColor: "#e5e7eb",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              flex: 1,
                            }}
                          >
                            <Ionicons
                              name="car-outline"
                              size={20}
                              color="#6b7280"
                            />
                            <Text
                              style={{
                                fontSize: 15,
                                color: "#111827",
                                fontWeight: "600",
                                marginLeft: 8,
                              }}
                            >
                              유류비
                            </Text>
                          </View>

                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <TextInput
                              style={{
                                fontSize: 15,
                                fontWeight: "600",
                                color: "#111827",
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                borderRadius: 6,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                width: 80,
                                textAlign: "right",
                                backgroundColor: "#f9fafb",
                              }}
                              value={
                                workerEditData.fuelAllowance
                                  ? new Intl.NumberFormat("ko-KR").format(
                                      parseInt(workerEditData.fuelAllowance) ||
                                        0
                                    )
                                  : ""
                              }
                              onChangeText={(text) => {
                                const numericText = text.replace(/,/g, "");
                                setWorkerEditData({
                                  ...workerEditData,
                                  fuelAllowance: numericText,
                                });
                              }}
                              placeholder="0"
                              keyboardType="numeric"
                            />
                            <Text
                              style={{
                                fontSize: 13,
                                color: "#6b7280",
                              }}
                            >
                              원
                            </Text>
                            <Pressable
                              onPress={async () => {
                                const workerInfo =
                                  schedule?.workers?.[selectedWorkerIndex];
                                if (!workerInfo) return;
                                const db = getDatabase();
                                await db.init();

                                const updatedSchedule = {
                                  ...schedule!,
                                  workers: schedule!.workers?.map((w, i) =>
                                    i === selectedWorkerIndex
                                      ? { ...w, fuelPaid: !w.fuelPaid }
                                      : w
                                  ),
                                };

                                await db.updateSchedule(
                                  id as string,
                                  updatedSchedule
                                );
                                setSchedule(updatedSchedule);
                              }}
                            >
                              <View
                                style={{
                                  width: 44,
                                  height: 24,
                                  borderRadius: 12,
                                  backgroundColor: (
                                    schedule.workers[selectedWorkerIndex] as any
                                  ).fuelPaid
                                    ? "#10b981"
                                    : "#d1d5db",
                                  justifyContent: "center",
                                  alignItems: (
                                    schedule.workers[selectedWorkerIndex] as any
                                  ).fuelPaid
                                    ? "flex-end"
                                    : "flex-start",
                                  paddingHorizontal: 2,
                                }}
                              >
                                <View
                                  style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    backgroundColor: "white",
                                  }}
                                />
                              </View>
                            </Pressable>
                          </View>
                        </View>
                      </View>

                      {/* 기타비용 */}
                      <View
                        style={{
                          backgroundColor: "#fff",
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 12,
                          borderWidth: 1,
                          borderColor: "#e5e7eb",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              flex: 1,
                            }}
                          >
                            <Ionicons
                              name="wallet-outline"
                              size={20}
                              color="#6b7280"
                            />
                            <Text
                              style={{
                                fontSize: 15,
                                color: "#111827",
                                fontWeight: "600",
                                marginLeft: 8,
                              }}
                            >
                              기타비용
                            </Text>
                          </View>

                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <TextInput
                              style={{
                                fontSize: 15,
                                fontWeight: "600",
                                color: "#111827",
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                borderRadius: 6,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                width: 80,
                                textAlign: "right",
                                backgroundColor: "#f9fafb",
                              }}
                              value={
                                workerEditData.otherAllowance
                                  ? new Intl.NumberFormat("ko-KR").format(
                                      parseInt(workerEditData.otherAllowance) ||
                                        0
                                    )
                                  : ""
                              }
                              onChangeText={(text) => {
                                const numericText = text.replace(/,/g, "");
                                setWorkerEditData({
                                  ...workerEditData,
                                  otherAllowance: numericText,
                                });
                              }}
                              placeholder="0"
                              keyboardType="numeric"
                            />
                            <Text
                              style={{
                                fontSize: 13,
                                color: "#6b7280",
                              }}
                            >
                              원
                            </Text>
                            <Pressable
                              onPress={async () => {
                                const workerInfo =
                                  schedule?.workers?.[selectedWorkerIndex];
                                if (!workerInfo) return;
                                const db = getDatabase();
                                await db.init();

                                const updatedSchedule = {
                                  ...schedule!,
                                  workers: schedule!.workers?.map((w, i) =>
                                    i === selectedWorkerIndex
                                      ? { ...w, otherPaid: !w.otherPaid }
                                      : w
                                  ),
                                };

                                await db.updateSchedule(
                                  id as string,
                                  updatedSchedule
                                );
                                setSchedule(updatedSchedule);
                              }}
                            >
                              <View
                                style={{
                                  width: 44,
                                  height: 24,
                                  borderRadius: 12,
                                  backgroundColor: (
                                    schedule.workers[selectedWorkerIndex] as any
                                  ).otherPaid
                                    ? "#10b981"
                                    : "#d1d5db",
                                  justifyContent: "center",
                                  alignItems: (
                                    schedule.workers[selectedWorkerIndex] as any
                                  ).otherPaid
                                    ? "flex-end"
                                    : "flex-start",
                                  paddingHorizontal: 2,
                                }}
                              >
                                <View
                                  style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    backgroundColor: "white",
                                  }}
                                />
                              </View>
                            </Pressable>
                          </View>
                        </View>
                      </View>

                      {/* 세금 공제 */}
                      <View
                        style={{
                          backgroundColor: "#fff",
                          borderRadius: 12,
                          padding: 16,
                          borderWidth: 1,
                          borderColor: "#e5e7eb",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 12,
                          }}
                        >
                          <Ionicons
                            name="document-text-outline"
                            size={20}
                            color="#6b7280"
                          />
                          <Text
                            style={{
                              fontSize: 14,
                              color: "#6b7280",
                              marginLeft: 8,
                            }}
                          >
                            세금 공제
                          </Text>
                        </View>
                        <Pressable
                          onPress={() =>
                            setWorkerEditData({
                              ...workerEditData,
                              taxWithheld: !workerEditData.taxWithheld,
                            })
                          }
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingVertical: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "600",
                              color: "#111827",
                            }}
                          >
                            {workerEditData.taxWithheld
                              ? "3.3% 공제함"
                              : "공제 안함"}
                          </Text>
                          <View
                            style={{
                              width: 50,
                              height: 28,
                              borderRadius: 14,
                              backgroundColor: workerEditData.taxWithheld
                                ? "#10b981"
                                : "#d1d5db",
                              justifyContent: "center",
                              alignItems: workerEditData.taxWithheld
                                ? "flex-end"
                                : "flex-start",
                              paddingHorizontal: 3,
                            }}
                          >
                            <View
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 11,
                                backgroundColor: "white",
                              }}
                            />
                          </View>
                        </Pressable>
                      </View>
                    </View>

                    {/* 야간 수당 섹션 */}
                    {(() => {
                      const workerInfo = schedule.workers[selectedWorkerIndex];
                      const periods = workerInfo.periods || [];

                      // 22시 이후 근무 시간 확인
                      const hasNightHours = periods.some((period) => {
                        if (
                          !period.startTime ||
                          !period.endTime ||
                          !period.workDate
                        )
                          return false;
                        const startHour = parseInt(
                          period.startTime.split(":")[0]
                        );
                        const endHour = parseInt(period.endTime.split(":")[0]);
                        return (
                          startHour >= 22 ||
                          endHour <= 6 ||
                          (startHour < endHour && startHour >= 22)
                        );
                      });

                      if (!hasNightHours) return null;

                      // 야간 수당 적용 시간 계산 (22:00~06:00)
                      const calculateNightHours = () => {
                        let totalNightHours = 0;
                        periods.forEach((period) => {
                          if (
                            !period.startTime ||
                            !period.endTime ||
                            !period.workDate
                          )
                            return;
                          const start = dayjs(
                            `${period.workDate} ${period.startTime}`
                          );
                          const end = dayjs(
                            `${period.workDate} ${period.endTime}`
                          );
                          const startHour = start.hour();
                          const endHour = end.hour();

                          // 22시 이후 또는 6시 이전 시간 계산
                          if (startHour >= 22 || endHour <= 6) {
                            totalNightHours += end.diff(start, "hour", true);
                          } else if (startHour < endHour && startHour >= 22) {
                            // 하루를 넘기는 경우
                            const nightStart = start;
                            const nextDay6Am = start
                              .add(1, "day")
                              .startOf("day")
                              .add(6, "hour");
                            totalNightHours += nextDay6Am.diff(
                              nightStart,
                              "hour",
                              true
                            );
                          }
                        });
                        return totalNightHours;
                      };

                      const nightHours = calculateNightHours();

                      // 총 급여 계산 (시급 + 유류비 + 기타비용)
                      const totalPay = (() => {
                        const hourlyWage =
                          parseInt(workerEditData.hourlyWage) || 0;
                        const fuelAllowance =
                          parseInt(workerEditData.fuelAllowance) || 0;
                        const otherAllowance =
                          parseInt(workerEditData.otherAllowance) || 0;

                        const totalHours = periods.reduce((sum, period) => {
                          if (
                            !period.startTime ||
                            !period.endTime ||
                            !period.workDate
                          )
                            return sum;
                          const start = dayjs(
                            `${period.workDate} ${period.startTime}`
                          );
                          const end = dayjs(
                            `${period.workDate} ${period.endTime}`
                          );
                          if (!start.isValid() || !end.isValid()) return sum;
                          const hours =
                            end.diff(start, "hour", true) -
                            (period.breakDuration || 0) / 60;
                          return sum + Math.max(0, hours);
                        }, 0);

                        const basePay = totalHours * hourlyWage;
                        return basePay + fuelAllowance + otherAllowance;
                      })();

                      // 토글 비활성화 조건
                      const isToggleDisabled =
                        totalPay === 0 || isNaN(totalPay);

                      return (
                        <View style={{ marginBottom: 28 }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "600",
                              color: "#111827",
                              marginBottom: 16,
                            }}
                          >
                            야간 수당
                          </Text>
                          <View
                            style={{
                              backgroundColor: "#fff",
                              borderRadius: 12,
                              padding: 16,
                              borderWidth: 1,
                              borderColor: "#e5e7eb",
                              marginBottom: 12,
                              opacity: isToggleDisabled ? 0.5 : 1,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 12,
                              }}
                            >
                              <Ionicons
                                name="moon-outline"
                                size={20}
                                color="#6b7280"
                              />
                              <Text
                                style={{
                                  fontSize: 14,
                                  color: "#6b7280",
                                  marginLeft: 8,
                                }}
                              >
                                야간 수당 적용 여부
                              </Text>
                            </View>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 12,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 15,
                                  fontWeight: "600",
                                  color: "#111827",
                                }}
                              >
                                {workerEditData.nightShiftEnabled
                                  ? "적용함"
                                  : "적용 안함"}
                              </Text>
                              <View
                                style={{
                                  width: 50,
                                  height: 28,
                                  borderRadius: 14,
                                  backgroundColor:
                                    workerEditData.nightShiftEnabled
                                      ? "#10b981"
                                      : "#d1d5db",
                                  justifyContent: "center",
                                  alignItems: workerEditData.nightShiftEnabled
                                    ? "flex-end"
                                    : "flex-start",
                                  paddingHorizontal: 3,
                                }}
                              >
                                <View
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 11,
                                    backgroundColor: "white",
                                  }}
                                />
                              </View>
                            </View>
                            <Pressable
                              onPress={() => {
                                if (isToggleDisabled) return;
                                setWorkerEditData({
                                  ...workerEditData,
                                  nightShiftEnabled:
                                    !workerEditData.nightShiftEnabled,
                                });
                              }}
                              disabled={isToggleDisabled}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                backgroundColor: "#f9fafb",
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: isToggleDisabled
                                  ? "#e5e7eb"
                                  : "#e5e7eb",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 14,
                                  color: isToggleDisabled
                                    ? "#9ca3af"
                                    : "#111827",
                                }}
                              >
                                적용 안함
                              </Text>
                              <View
                                style={{
                                  width: 50,
                                  height: 28,
                                  borderRadius: 14,
                                  backgroundColor:
                                    workerEditData.nightShiftEnabled
                                      ? "#10b981"
                                      : "#d1d5db",
                                  justifyContent: "center",
                                  alignItems: workerEditData.nightShiftEnabled
                                    ? "flex-end"
                                    : "flex-start",
                                  paddingHorizontal: 3,
                                }}
                              >
                                <View
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 11,
                                    backgroundColor: "white",
                                  }}
                                />
                              </View>
                            </Pressable>
                            {workerEditData.nightShiftEnabled && (
                              <View
                                style={{
                                  marginTop: 12,
                                  padding: 12,
                                  backgroundColor: "#f9fafb",
                                  borderRadius: 8,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 13,
                                    color: "#6b7280",
                                    marginBottom: 4,
                                  }}
                                >
                                  야간 수당 적용 시간
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 16,
                                    fontWeight: "600",
                                    color: "#111827",
                                  }}
                                >
                                  {nightHours.toFixed(1)}시간
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: "#9ca3af",
                                    marginTop: 4,
                                  }}
                                >
                                  (22:00 ~ 06:00)
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      );
                    })()}

                    {/* 근무 정보 섹션 */}
                    {(() => {
                      const workerInfo = schedule.workers[selectedWorkerIndex];
                      const periods = workerInfo.periods || [];

                      if (periods.length === 0) {
                        return (
                          <View style={{ marginBottom: 28 }}>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "600",
                                color: "#111827",
                                marginBottom: 16,
                              }}
                            >
                              근무 정보
                            </Text>
                            <View
                              style={{
                                backgroundColor: "#fff",
                                padding: 20,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Ionicons
                                name="time-outline"
                                size={32}
                                color="#d1d5db"
                              />
                              <Text
                                style={{
                                  fontSize: 14,
                                  color: "#6b7280",
                                  marginTop: 12,
                                }}
                              >
                                근무 시간 정보 없음
                              </Text>
                            </View>
                          </View>
                        );
                      }

                      const validPeriods = periods.filter(
                        (p) =>
                          p.startTime &&
                          p.endTime &&
                          p.workDate &&
                          dayjs(`${p.workDate} ${p.startTime}`).isValid() &&
                          dayjs(`${p.workDate} ${p.endTime}`).isValid()
                      );

                      if (validPeriods.length === 0) {
                        return (
                          <View style={{ marginBottom: 28 }}>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "600",
                                color: "#111827",
                                marginBottom: 16,
                              }}
                            >
                              근무 정보
                            </Text>
                            <View
                              style={{
                                backgroundColor: "#fff",
                                padding: 20,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Ionicons
                                name="time-outline"
                                size={32}
                                color="#d1d5db"
                              />
                              <Text
                                style={{
                                  fontSize: 14,
                                  color: "#6b7280",
                                  marginTop: 12,
                                }}
                              >
                                근무 시간 정보 없음
                              </Text>
                            </View>
                          </View>
                        );
                      }

                      const firstPeriod = validPeriods[0];
                      const allSameTime = validPeriods.every(
                        (p) =>
                          p.startTime === firstPeriod.startTime &&
                          p.endTime === firstPeriod.endTime
                      );

                      if (allSameTime && validPeriods.length > 1) {
                        const sortedDates = validPeriods
                          .map((p) => dayjs(p.workDate))
                          .sort((a, b) => a.diff(b));
                        const startDate = sortedDates[0];
                        const endDate = sortedDates[sortedDates.length - 1];

                        const dateRange =
                          startDate.format("M월 D일") ===
                          endDate.format("M월 D일")
                            ? startDate.format("M월 D일")
                            : `${startDate.format(
                                "M월 D일"
                              )} ~ ${endDate.format("M월 D일")}`;

                        return (
                          <View style={{ marginBottom: 28 }}>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "600",
                                color: "#111827",
                                marginBottom: 16,
                              }}
                            >
                              근무 정보
                            </Text>
                            <View
                              style={{
                                backgroundColor: "#fff",
                                padding: 16,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                }}
                              >
                                <Ionicons
                                  name="calendar-outline"
                                  size={20}
                                  color="#6b7280"
                                />
                                <Text
                                  style={{
                                    fontSize: 14,
                                    color: "#111827",
                                    marginLeft: 8,
                                  }}
                                >
                                  {dateRange}
                                </Text>
                              </View>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  marginTop: 8,
                                }}
                              >
                                <Ionicons
                                  name="time-outline"
                                  size={20}
                                  color="#6b7280"
                                />
                                <Text
                                  style={{
                                    fontSize: 14,
                                    color: "#111827",
                                    marginLeft: 8,
                                  }}
                                >
                                  {firstPeriod.startTime} -{" "}
                                  {firstPeriod.endTime}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      }

                      return (
                        <View style={{ marginBottom: 28 }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "600",
                              color: "#111827",
                              marginBottom: 16,
                            }}
                          >
                            근무 정보
                          </Text>
                          {validPeriods.map((period, idx) => (
                            <View
                              key={idx}
                              style={{
                                backgroundColor: "#fff",
                                padding: 16,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                marginBottom: 12,
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                }}
                              >
                                <Ionicons
                                  name="calendar-outline"
                                  size={20}
                                  color="#6b7280"
                                />
                                <Text
                                  style={{
                                    fontSize: 14,
                                    color: "#111827",
                                    marginLeft: 8,
                                  }}
                                >
                                  {dayjs(period.workDate).format(
                                    "M월 D일 (ddd)"
                                  )}
                                </Text>
                              </View>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  marginTop: 8,
                                }}
                              >
                                <Ionicons
                                  name="time-outline"
                                  size={20}
                                  color="#6b7280"
                                />
                                <Text
                                  style={{
                                    fontSize: 14,
                                    color: "#111827",
                                    marginLeft: 8,
                                  }}
                                >
                                  {period.startTime} - {period.endTime}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    })()}
                  </ScrollView>
                  {/* 하단 버튼 */}
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: "#e5e7eb",
                      paddingTop: 16,
                      marginTop: 16,
                    }}
                  >
                    <Pressable
                      onPress={async () => {
                        try {
                          const db = getDatabase();
                          await db.init();

                          const workerInfo =
                            schedule!.workers?.[selectedWorkerIndex];
                          if (!workerInfo) {
                            Alert.alert(
                              "오류",
                              "근로자 정보를 찾을 수 없습니다"
                            );
                            return;
                          }

                          // scheduleWorkerId 가져오기
                          const scheduleWorkerId = (workerInfo as any)
                            .scheduleWorkerId;
                          if (!scheduleWorkerId) {
                            Alert.alert(
                              "오류",
                              "스케줄 근로자 ID를 찾을 수 없습니다"
                            );
                            return;
                          }

                          // DB에 업데이트
                          await db.updateScheduleWorker(scheduleWorkerId, {
                            hourlyWage:
                              parseInt(workerEditData.hourlyWage) || 0,
                            fuelAllowance:
                              parseInt(workerEditData.fuelAllowance) || 0,
                            otherAllowance:
                              parseInt(workerEditData.otherAllowance) || 0,
                            taxWithheld: workerEditData.taxWithheld,
                            nightShiftEnabled: workerEditData.nightShiftEnabled,
                          } as any);

                          // 메모리 상태 업데이트
                          const updatedWorkers = schedule!.workers?.map(
                            (w, i) => {
                              if (i === selectedWorkerIndex) {
                                return {
                                  ...w,
                                  hourlyWage:
                                    parseInt(workerEditData.hourlyWage) ||
                                    w.worker.hourlyWage,
                                  fuelAllowance:
                                    parseInt(workerEditData.fuelAllowance) || 0,
                                  otherAllowance:
                                    parseInt(workerEditData.otherAllowance) ||
                                    0,
                                  taxWithheld: workerEditData.taxWithheld,
                                  nightShiftEnabled:
                                    workerEditData.nightShiftEnabled,
                                } as any;
                              }
                              return w;
                            }
                          );

                          const updatedSchedule = {
                            ...schedule!,
                            workers: updatedWorkers,
                          };

                          setSchedule(updatedSchedule);
                          Alert.alert("완료", "근로자 정보가 저장되었습니다");
                          setShowWorkerModal(false);
                        } catch (error) {
                          console.error("Failed to save worker info:", error);
                          Alert.alert("오류", "저장에 실패했습니다");
                        }
                      }}
                      style={{
                        backgroundColor: "#10b981",
                        paddingVertical: 14,
                        borderRadius: 12,
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "700",
                          fontSize: 16,
                        }}
                      >
                        저장
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        Alert.alert(
                          "근로자 삭제",
                          "이 근로자를 이 스케줄에서 제외하시겠습니까?",
                          [
                            { text: "취소", style: "cancel" },
                            {
                              text: "삭제",
                              style: "destructive",
                              onPress: async () => {
                                try {
                                  const db = getDatabase();
                                  await db.init();

                                  const workerInfo =
                                    schedule!.workers?.[selectedWorkerIndex];
                                  if (!workerInfo) {
                                    Alert.alert(
                                      "오류",
                                      "근로자 정보를 찾을 수 없습니다"
                                    );
                                    return;
                                  }

                                  // scheduleWorkerId 가져오기
                                  const scheduleWorkerId = (workerInfo as any)
                                    .scheduleWorkerId;
                                  if (!scheduleWorkerId) {
                                    Alert.alert(
                                      "오류",
                                      "스케줄 근로자 ID를 찾을 수 없습니다"
                                    );
                                    return;
                                  }

                                  // DB에서 삭제
                                  await db.deleteScheduleWorker(
                                    scheduleWorkerId
                                  );

                                  // 메모리 상태 업데이트
                                  const updatedSchedule = {
                                    ...schedule!,
                                    workers: schedule!.workers?.filter(
                                      (_, i) => i !== selectedWorkerIndex
                                    ),
                                  };

                                  setSchedule(updatedSchedule);
                                  setShowWorkerModal(false);
                                  Alert.alert(
                                    "완료",
                                    "근로자가 제외되었습니다"
                                  );
                                } catch (error) {
                                  console.error(
                                    "Failed to remove worker:",
                                    error
                                  );
                                  Alert.alert(
                                    "오류",
                                    "근로자 삭제에 실패했습니다"
                                  );
                                }
                              },
                            },
                          ]
                        );
                      }}
                      style={{
                        backgroundColor: "#fee2e2",
                        paddingVertical: 14,
                        borderRadius: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#ef4444",
                          fontWeight: "700",
                          fontSize: 16,
                        }}
                      >
                        스케줄에서 제외
                      </Text>
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
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: Platform.OS === "web" ? "center" : "flex-end",
            alignItems: "center",
            padding: Platform.OS === "web" ? 20 : 0,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: Platform.OS === "web" ? 12 : 0,
              borderTopLeftRadius: Platform.OS === "web" ? 12 : 20,
              borderTopRightRadius: Platform.OS === "web" ? 12 : 20,
              width: "100%",
              maxWidth: Platform.OS === "web" ? 600 : undefined,
              height: Platform.OS === "web" ? "80%" : "85%",
              padding: 20,
            }}
          >
            {/* 헤더 */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#e5e7eb",
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#1d1d1f",
                }}
              >
                근로자 추가
              </Text>
              <Pressable
                onPress={() => setShowAddWorkerModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            {/* 검색 입력 및 신규 추가 버튼 */}
            <View style={{ marginBottom: 20, gap: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#f3f4f6",
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  height: 48,
                }}
              >
                <Ionicons name="search" size={20} color="#9ca3af" />
                <TextInput
                  value={workerSearchQuery}
                  onChangeText={setWorkerSearchQuery}
                  placeholder="근로자 검색..."
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    color: "#1d1d1f",
                  }}
                  placeholderTextColor="#9ca3af"
                />
                {workerSearchQuery.length > 0 && (
                  <Pressable
                    onPress={() => setWorkerSearchQuery("")}
                    style={{
                      width: 24,
                      height: 24,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => {
                  setShowAddWorkerModal(false);
                  setShowNewWorkerModal(true);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  gap: 8,
                }}
              >
                <Ionicons name="person-add" size={20} color="white" />
                <Text
                  style={{
                    color: "white",
                    fontSize: 16,
                    fontWeight: "700",
                  }}
                >
                  신규 근로자 추가
                </Text>
              </Pressable>
            </View>

            {/* 근로자 목록 */}
            <ScrollView style={{ flex: 1 }}>
              {availableWorkers
                .filter((worker) =>
                  worker.name
                    .toLowerCase()
                    .includes(workerSearchQuery.toLowerCase())
                )
                .map((worker) => (
                  <Pressable
                    key={worker.id}
                    onPress={async () => {
                      try {
                        const db = getDatabase();
                        await db.init();

                        // 스케줄 근로자 추가
                        const scheduleWorkerId = await db.createScheduleWorker({
                          id: `sw_${Date.now()}_${Math.random()
                            .toString(36)
                            .substr(2, 9)}`,
                          scheduleId: schedule.id,
                          workerId: worker.id,
                          workStartDate: schedule.startDate,
                          workEndDate: schedule.endDate,
                          uniformTime: schedule.uniformTime ?? true,
                          hourlyWage: worker.hourlyWage || 0,
                          fuelAllowance: 0,
                          otherAllowance: 0,
                          overtimeEnabled: true,
                          nightShiftEnabled: false,
                          taxWithheld: true,
                          wagePaid: false,
                          fuelPaid: false,
                          otherPaid: false,
                        });

                        // 근무 기간 추가 (기본값)
                        await db.createWorkPeriod({
                          id: `wp_${Date.now()}_${Math.random()
                            .toString(36)
                            .substr(2, 9)}`,
                          scheduleWorkerId: scheduleWorkerId,
                          workDate: schedule.startDate,
                          startTime: "09:00",
                          endTime: "18:00",
                          breakDuration: 60,
                          overtimeHours: 0,
                        });

                        // 스케줄 새로고침
                        const updatedSchedule = await db.getSchedule(
                          schedule.id
                        );
                        setSchedule(updatedSchedule);
                        setShowAddWorkerModal(false);
                        Alert.alert("완료", "근로자가 추가되었습니다");
                      } catch (error) {
                        console.error("Failed to add worker:", error);
                        Alert.alert("오류", "근로자 추가에 실패했습니다");
                      }
                    }}
                    style={{
                      backgroundColor: "#fff",
                      padding: 16,
                      borderRadius: 12,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          backgroundColor: "#f3f4f6",
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 12,
                        }}
                      >
                        <Text style={{ fontSize: 24 }}>👤</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: "#1d1d1f",
                          }}
                        >
                          {worker.name}
                        </Text>
                        <Text style={{ fontSize: 13, color: "#6b7280" }}>
                          {worker.phone || "전화번호 미등록"}
                        </Text>
                      </View>
                      <Ionicons
                        name="add-circle-outline"
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                  </Pressable>
                ))}

              {availableWorkers.filter((worker) =>
                worker.name
                  .toLowerCase()
                  .includes(workerSearchQuery.toLowerCase())
              ).length === 0 && (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 40,
                  }}
                >
                  <Text style={{ fontSize: 14, color: "#6b7280" }}>
                    추가할 수 있는 근로자가 없습니다
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 신규 근로자 추가 모달 */}
      <Modal
        visible={showNewWorkerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNewWorkerModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: Platform.OS === "web" ? "center" : "flex-end",
            alignItems: "center",
            padding: Platform.OS === "web" ? 20 : 0,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: Platform.OS === "web" ? 12 : 0,
              borderTopLeftRadius: Platform.OS === "web" ? 12 : 20,
              borderTopRightRadius: Platform.OS === "web" ? 12 : 20,
              width: "100%",
              maxWidth: Platform.OS === "web" ? 600 : undefined,
              height: Platform.OS === "web" ? "90%" : "90%",
              padding: 20,
            }}
          >
            {/* 헤더 */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#e5e7eb",
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#1d1d1f",
                }}
              >
                신규 근로자 추가
              </Text>
              <Pressable
                onPress={() => {
                  setShowNewWorkerModal(false);
                  setNewWorkerData({
                    name: "",
                    phone: "",
                    hourlyWage: "15,000",
                    bankAccount: "",
                    selectedBank: "",
                    idCardImageUrl: "",
                    memo: "",
                  });
                  setDetectedBank(null);
                  setUploadedFileName("");
                }}
                style={{
                  width: 32,
                  height: 32,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }}>
              {/* 이름 */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  이름 *
                </Text>
                <TextInput
                  value={newWorkerData.name}
                  onChangeText={(text) =>
                    setNewWorkerData({ ...newWorkerData, name: text })
                  }
                  placeholder="이름 입력"
                  style={{
                    backgroundColor: "#f3f4f6",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: "#1d1d1f",
                  }}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* 전화번호 */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  전화번호 *
                </Text>
                <TextInput
                  value={newWorkerData.phone}
                  onChangeText={(text) => {
                    // 숫자만 추출
                    const numbers = text.replace(/[^0-9]/g, "");
                    // 최대 11자리
                    const limited = numbers.slice(0, 11);
                    // 자동 포맷팅
                    const formatted = formatPhoneNumber(limited);
                    setNewWorkerData({ ...newWorkerData, phone: formatted });
                  }}
                  placeholder="010-1234-5678"
                  keyboardType="phone-pad"
                  maxLength={13}
                  style={{
                    backgroundColor: "#f3f4f6",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: "#1d1d1f",
                  }}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* 시급 */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  시급 (원) *
                </Text>
                <TextInput
                  value={newWorkerData.hourlyWage}
                  onChangeText={(text) => {
                    // 숫자만 추출
                    const numbers = text.replace(/[^0-9]/g, "");
                    // 천 단위 콤마 추가하여 표시
                    const formatted = numbers.replace(
                      /\B(?=(\d{3})+(?!\d))/g,
                      ","
                    );
                    setNewWorkerData({
                      ...newWorkerData,
                      hourlyWage: formatted,
                    });
                  }}
                  placeholder="15,000"
                  keyboardType="number-pad"
                  style={{
                    backgroundColor: "#f3f4f6",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: "#1d1d1f",
                  }}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* 사진 업로드 */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  신분증 사진
                </Text>
                <Pressable
                  onPress={async () => {
                    try {
                      const result = await pickAndUploadImage({
                        bucket: "files",
                        folder: "workers",
                        fileType: "image",
                        maxSize: 5,
                      });

                      if (result.success && result.url) {
                        // 파일명 추출 (경로에서 마지막 부분만)
                        const fileName =
                          result.path?.split("/").pop() || "uploaded.jpg";
                        setUploadedFileName(fileName);
                        setNewWorkerData({
                          ...newWorkerData,
                          idCardImageUrl: result.url,
                        });
                      } else if (result.error) {
                        Alert.alert("오류", result.error);
                      }
                    } catch (error) {
                      console.error("Failed to upload image:", error);
                      Alert.alert("오류", "사진 업로드에 실패했습니다");
                    }
                  }}
                  style={{
                    backgroundColor: "#f3f4f6",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Ionicons name="camera-outline" size={24} color="#6b7280" />
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#1d1d1f",
                      flex: 1,
                    }}
                  >
                    {uploadedFileName || "사진 선택"}
                  </Text>
                  {newWorkerData.idCardImageUrl && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#10b981"
                    />
                  )}
                </Pressable>
              </View>

              {/* 계좌번호 */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  계좌번호 (선택)
                </Text>

                {/* 은행 선택 */}
                <View
                  style={{
                    backgroundColor: "#f3f4f6",
                    borderRadius: 12,
                    marginBottom: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                  }}
                >
                  <Picker
                    selectedValue={newWorkerData.selectedBank}
                    onValueChange={(value) => {
                      setNewWorkerData({
                        ...newWorkerData,
                        selectedBank: value,
                      });
                      const selectedBank = KOREAN_BANKS.find(
                        (b) => b.code === value
                      );
                      setDetectedBank(selectedBank || null);
                    }}
                    style={{ height: 48, color: "#1d1d1f" }}
                  >
                    <Picker.Item label="은행 선택" value="" />
                    {KOREAN_BANKS.map((bank) => (
                      <Picker.Item
                        key={bank.code}
                        label={bank.name}
                        value={bank.code}
                      />
                    ))}
                  </Picker>
                </View>

                {/* 계좌번호 입력 */}
                <TextInput
                  value={newWorkerData.bankAccount}
                  onChangeText={(text) => {
                    // 숫자만 추출
                    const numbers = text.replace(/[^0-9]/g, "");
                    // 선택된 은행의 포맷 적용
                    let formatted = numbers;
                    if (newWorkerData.selectedBank) {
                      formatted = formatAccountNumber(
                        numbers,
                        newWorkerData.selectedBank
                      );
                    } else if (detectedBank) {
                      formatted = formatAccountNumber(
                        numbers,
                        detectedBank.code
                      );
                    } else {
                      formatted = formatAccountNumber(numbers);
                    }
                    setNewWorkerData({
                      ...newWorkerData,
                      bankAccount: formatted,
                    });
                  }}
                  placeholder={
                    detectedBank
                      ? `계좌번호 입력 (예: ${detectedBank.example})`
                      : "은행 선택 후 계좌번호 입력"
                  }
                  keyboardType="number-pad"
                  style={{
                    backgroundColor: "#f3f4f6",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: "#1d1d1f",
                  }}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* 메모 */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  메모
                </Text>
                <TextInput
                  value={newWorkerData.memo}
                  onChangeText={(text) =>
                    setNewWorkerData({ ...newWorkerData, memo: text })
                  }
                  placeholder="메모 입력 (선택)"
                  multiline
                  numberOfLines={3}
                  style={{
                    backgroundColor: "#f3f4f6",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: "#1d1d1f",
                    minHeight: 80,
                  }}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </ScrollView>

            {/* 저장 버튼 */}
            <Pressable
              onPress={async () => {
                if (!newWorkerData.name || !newWorkerData.phone) {
                  Alert.alert("입력 오류", "이름과 전화번호는 필수 항목입니다");
                  return;
                }

                try {
                  const db = getDatabase();
                  await db.init();

                  // 현재 사용자 정보 가져오기
                  const { getCurrentUser } = await import("@/utils/authUtils");
                  const user = await getCurrentUser();
                  if (!user) {
                    Alert.alert("오류", "로그인 정보를 찾을 수 없습니다");
                    return;
                  }

                  // 전화번호에서 숫자만 추출
                  const cleanPhone = newWorkerData.phone.replace(/[^0-9]/g, "");
                  const cleanBankAccount = newWorkerData.bankAccount
                    ? newWorkerData.bankAccount.replace(/[^0-9]/g, "")
                    : "";

                  // 신규 근로자 생성
                  const newWorkerId = await db.createWorker({
                    id: `worker_${Date.now()}_${Math.random()
                      .toString(36)
                      .substr(2, 9)}`,
                    userId: user.id,
                    name: newWorkerData.name,
                    phone: cleanPhone,
                    bankAccount: cleanBankAccount || undefined,
                    hourlyWage:
                      parseInt(newWorkerData.hourlyWage.replace(/,/g, "")) || 0,
                    fuelAllowance: 0, // 스케줄별 설정
                    otherAllowance: 0, // 스케줄별 설정
                    idCardImageUrl: newWorkerData.idCardImageUrl || undefined,
                    idCardImagePath: newWorkerData.idCardImageUrl || undefined,
                    memo: newWorkerData.memo || undefined,
                  });

                  // 시급에서 콤마 제거하여 저장
                  const hourlyWageValue =
                    parseInt(newWorkerData.hourlyWage.replace(/,/g, "")) || 0;

                  // 스케줄 근로자 추가
                  const scheduleWorkerId = await db.createScheduleWorker({
                    id: `sw_${Date.now()}_${Math.random()
                      .toString(36)
                      .substr(2, 9)}`,
                    scheduleId: schedule.id,
                    workerId: newWorkerId,
                    workStartDate: schedule.startDate,
                    workEndDate: schedule.endDate,
                    uniformTime: schedule.uniformTime ?? true,
                    hourlyWage: hourlyWageValue,
                    fuelAllowance: 0,
                    otherAllowance: 0,
                    overtimeEnabled: true,
                    nightShiftEnabled: false,
                    taxWithheld: true,
                    wagePaid: false,
                    fuelPaid: false,
                    otherPaid: false,
                  });

                  // 근무 기간 추가 (기본값)
                  await db.createWorkPeriod({
                    id: `wp_${Date.now()}_${Math.random()
                      .toString(36)
                      .substr(2, 9)}`,
                    scheduleWorkerId: scheduleWorkerId,
                    workDate: schedule.startDate,
                    startTime: "09:00",
                    endTime: "18:00",
                    breakDuration: 60,
                    overtimeHours: 0,
                  });

                  // 스케줄 새로고침
                  const updatedSchedule = await db.getSchedule(schedule.id);
                  setSchedule(updatedSchedule);

                  // 모달 닫기 및 데이터 초기화
                  setShowNewWorkerModal(false);
                  setNewWorkerData({
                    name: "",
                    phone: "",
                    hourlyWage: "15,000",
                    bankAccount: "",
                    selectedBank: "",
                    idCardImageUrl: "",
                    memo: "",
                  });
                  setDetectedBank(null);
                  setUploadedFileName("");

                  Alert.alert("완료", "근로자가 추가되었습니다");
                } catch (error) {
                  console.error("Failed to add new worker:", error);
                  Alert.alert("오류", "근로자 추가에 실패했습니다");
                }
              }}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
                marginTop: 20,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                저장
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 계약서 모달 */}
      <ContractModal
        visible={showContractModal}
        onClose={() => setShowContractModal(false)}
        scheduleId={id as string}
        contractDirection={contractDirection}
        onContractSaved={handleContractSaved}
      />
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
    padding: Theme.spacing.xl,
  },
  scheduleCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  scheduleTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  categoryText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    fontWeight: Theme.typography.weights.medium,
  },
  scheduleDate: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  description: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.md,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  infoText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  timeText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
    fontWeight: Theme.typography.weights.medium,
  },
  memoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  memoText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginLeft: Theme.spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  workersSection: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
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
  },
  paidBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  paidText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.inverse,
    fontWeight: Theme.typography.weights.medium,
  },
  workerDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  workerPhone: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  workerWage: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  periodsList: {
    gap: Theme.spacing.xs,
  },
  periodItem: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
  },
  periodText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
  periodHours: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
    marginTop: 4,
  },
  periodBreak: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.tertiary,
    marginTop: 2,
  },
  totalPayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
  },
  totalPayInfo: {
    flex: 1,
    alignItems: "center",
  },
  totalPayDivider: {
    width: 1,
    height: 30,
    backgroundColor: Theme.colors.border.light,
  },
  totalPayLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    marginBottom: 4,
  },
  totalPayValue: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
  },
  documentsSection: {
    marginBottom: Theme.spacing.xl,
  },
  documentItem: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
  documentName: {
    flex: 1,
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
  },
  documentSize: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
  loadingText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    padding: Theme.spacing.lg,
  },
  timesSection: {
    marginBottom: Theme.spacing.xl,
  },
  timeItem: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
  timeDate: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.primary,
  },
  timeValue: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  contractSection: {
    marginBottom: Theme.spacing.xl,
  },
  contractsList: {
    gap: Theme.spacing.md,
  },
  contractCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
  contractHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  contractType: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
  },
  contractTypeText: {
    fontSize: Theme.typography.sizes.xs,
    color: "#fff",
    marginLeft: Theme.spacing.xs,
    fontWeight: Theme.typography.weights.medium,
  },
  contractStatus: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
  },
  contractStatusText: {
    fontSize: Theme.typography.sizes.xs,
    color: "#fff",
    fontWeight: Theme.typography.weights.medium,
  },
  contractInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  contractAmount: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
  },
  contractDirection: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  contractContent: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.sm,
    lineHeight: 20,
  },
  contractDate: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
  emptyContracts: {
    alignItems: "center",
    paddingVertical: Theme.spacing.xl,
  },
  emptyContractsText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.secondary,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  emptyContractsSubtext: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
});
