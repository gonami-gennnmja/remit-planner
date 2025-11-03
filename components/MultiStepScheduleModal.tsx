import DatePicker from "@/components/DatePicker";
import { FileUpload } from "@/components/FileUpload";
import { Text } from "@/components/Themed";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import { useResponsive } from "@/hooks/useResponsive";
import { Client, Schedule, ScheduleCategory, Worker } from "@/models/types";
import { createScheduleActivity } from "@/utils/activityUtils";
import { getCurrentSupabaseUser } from "@/utils/supabaseAuth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { SketchPicker } from "react-color";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
// @ts-ignore - react-native-color-wheel doesn't have type definitions
import { ColorWheel } from "react-native-color-wheel";

interface MultiStepScheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  initialStartDate?: string;
  initialEndDate?: string;
  initialIsMultiDay?: boolean;
  modalType?: "bottomSheet" | "centerPopup";
  initialStep?: Step;
  initialClientId?: string;
}

// 스텝 정의
const STEPS = {
  BASIC_INFO: 1,
  DATE_TIME: 2,
  LOCATION: 3,
  CONTRACT: 4,
  WORKERS: 5,
  DOCUMENTS: 6,
  REVIEW: 7,
} as const;

type Step = (typeof STEPS)[keyof typeof STEPS];

// 임시저장 데이터 타입
interface DraftSchedule {
  id?: string;
  step: Step;
  data: Partial<ScheduleFormData>;
  lastSaved: string;
}

// 폼 데이터 타입
interface ScheduleFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  category: ScheduleCategory;
  location: string;
  address: string;
  uniformTime: boolean;
  scheduleTimes: Array<{
    workDate: string;
    startTime: string;
    endTime: string;
  }>;
  documentsFolderPath: string;
  hasAttachments: boolean;
  memo: string;
  // 스케줄 타입
  scheduleType: "personal" | "business";
  // 계약 관련 필드
  clientId?: string;
  contractAmount?: number;
  contractType?: "written" | "verbal" | "text";
  contractContent?: string;
}

// 웹용 색상 선택 컴포넌트
function WebColorPicker({
  color,
  onColorChange,
}: {
  color: string;
  onColorChange: (color: string) => void;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      <SketchPicker
        color={color}
        onChangeComplete={(colorResult: any) => {
          onColorChange(colorResult.hex);
        }}
        width="100%"
      />
    </View>
  );
}

// 앱용 색상 선택 컴포넌트
function AppColorPicker({
  color,
  onColorChange,
}: {
  color: string;
  onColorChange: (color: string) => void;
}) {
  const [selectedColor, setSelectedColor] = React.useState(color || "#FF6B6B");
  const { screenData } = useResponsive();
  const screenWidth = screenData.width;

  const hsvToHex = (hsv: any): string => {
    if (typeof hsv === "string") return hsv;
    if (!hsv || typeof hsv !== "object") return selectedColor;

    let { h, s, v } = hsv;
    while (h < 0) h += 360;
    h = h % 360;

    const hueNormalized = h / 360;
    const satNormalized = s / 100;
    const valNormalized = v / 100;

    let r = 0,
      g = 0,
      b = 0;
    const i = Math.floor(hueNormalized * 6);
    const f = hueNormalized * 6 - i;
    const p = valNormalized * (1 - satNormalized);
    const q = valNormalized * (1 - f * satNormalized);
    const t = valNormalized * (1 - (1 - f) * satNormalized);

    switch (i % 6) {
      case 0:
        r = valNormalized;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = valNormalized;
        b = p;
        break;
      case 2:
        r = p;
        g = valNormalized;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = valNormalized;
        break;
      case 4:
        r = t;
        g = p;
        b = valNormalized;
        break;
      case 5:
        r = valNormalized;
        g = p;
        b = q;
        break;
    }

    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const wheelSize = Math.min(screenWidth - 120, 240);

  const getTextColor = (hexColor: string): string => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000" : "#fff";
  };

  return (
    <View style={{ marginBottom: 8 }}>
      <View
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        style={{
          width: wheelSize,
          height: wheelSize,
          alignSelf: "center",
          marginBottom: 12,
          overflow: "visible",
        }}
      >
        <ColorWheel
          initialColor={selectedColor}
          onColorChange={(color: any) => {
            const hexColor = hsvToHex(color);
            setSelectedColor(hexColor);
          }}
          onColorChangeComplete={(color: any) => {
            const hexColor = hsvToHex(color);
            setSelectedColor(hexColor);
          }}
          style={{
            width: wheelSize,
            height: wheelSize,
            margin: 0,
            padding: 0,
          }}
          thumbSize={30}
          thumbStyle={{
            height: 30,
            width: 30,
            borderRadius: 15,
            borderWidth: 3,
            borderColor: "white",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 5,
          }}
        />
      </View>

      <Pressable
        style={{
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 8,
          alignItems: "center",
          marginHorizontal: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
          backgroundColor: selectedColor,
        }}
        onPress={() => {
          onColorChange(selectedColor);
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: getTextColor(selectedColor),
          }}
        >
          색상 선택
        </Text>
      </Pressable>
    </View>
  );
}

export default function MultiStepScheduleModal({
  visible,
  onClose,
  onSave,
  initialStartDate,
  initialEndDate,
  initialIsMultiDay = false,
  modalType = "centerPopup",
  initialStep = STEPS.BASIC_INFO,
  initialClientId,
}: MultiStepScheduleModalProps) {
  const { screenData, isMobile, isTablet, isDesktop, getResponsiveValue } =
    useResponsive();
  const { colors } = useTheme();
  const router = useRouter();

  // 현재 스텝 상태
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);

  // 현재 스텝 상태
  const [formData, setFormData] = useState<ScheduleFormData>({
    title: "",
    description: "",
    startDate: initialStartDate || dayjs().format("YYYY-MM-DD"),
    endDate: initialEndDate || dayjs().format("YYYY-MM-DD"),
    startTime: "09:00",
    endTime: "18:00",
    allDay: false,
    category: "" as ScheduleCategory,
    location: "",
    address: "",
    uniformTime: true,
    scheduleTimes: [],
    documentsFolderPath: "",
    hasAttachments: false,
    memo: "",
    scheduleType: "business", // 기본값은 업무 스케줄
    clientId: initialClientId || undefined,
    contractAmount: 0,
    contractType: "written",
    contractContent: "",
  });

  // 임시저장 상태
  const [draftData, setDraftData] = useState<DraftSchedule | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 카테고리 및 클라이언트 데이터
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [workerSearchQuery, setWorkerSearchQuery] = useState("");
  const [showAddWorkerForm, setShowAddWorkerForm] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState("");
  const [newWorkerPhone, setNewWorkerPhone] = useState("");
  // 근로자별 날짜 추가 DatePicker 상태
  const [showDatePickerForWorker, setShowDatePickerForWorker] = useState<
    string | null
  >(null);
  const [tempDateForWorker, setTempDateForWorker] = useState<Date>(new Date());

  // 카테고리 추가 UI 상태
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#8b5cf6");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [previewColor, setPreviewColor] = useState("#8b5cf6");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  // 주소 검색 상태
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [webAddressSearchReady, setWebAddressSearchReady] = useState(false);
  // iOS 초기 진입 시 1 -> 2단계 레이아웃 재계산을 위한 키
  const [dateStepKey, setDateStepKey] = useState(0);

  // 근로자 배치(선택/일자별 시간)
  type WorkerDailyAssignment = {
    workDate: string;
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  const [pickedWorkers, setPickedWorkers] = useState<
    Array<{
      workerId: string;
      hourlyWage?: number;
      startTime?: string;
      endTime?: string;
      uniformTime?: boolean;
    }>
  >([]);
  const [workerAssignments, setWorkerAssignments] = useState<
    Record<string, WorkerDailyAssignment[]>
  >({});
  // 각 근로자별 uniformTime 설정
  const [workerUniformTime, setWorkerUniformTime] = useState<
    Record<string, boolean>
  >({});

  // 일별 시간 편집 헬퍼
  const ensureScheduleTimesForRange = (start: string, end: string) => {
    const days: Array<{
      workDate: string;
      startTime: string;
      endTime: string;
    }> = [];
    let d = dayjs(start);
    const last = dayjs(end);
    while (d.isSameOrBefore(last, "day")) {
      const workDate = d.format("YYYY-MM-DD");
      const existing = formData.scheduleTimes.find(
        (t) => t.workDate === workDate
      );
      days.push({
        workDate,
        startTime: existing?.startTime || formData.startTime || "09:00",
        endTime: existing?.endTime || formData.endTime || "18:00",
      });
      d = d.add(1, "day");
    }
    setFormData((prev) => ({ ...prev, scheduleTimes: days }));
  };

  const updateScheduleTime = (
    workDate: string,
    key: "startTime" | "endTime",
    value: string
  ) => {
    setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        scheduleTimes: prev.scheduleTimes.map((t) =>
          t.workDate === workDate ? { ...t, [key]: value } : t
        ),
      }));
    }, 0);
  };

  const removeScheduleTime = (workDate: string) => {
    setFormData((prev) => ({
      ...prev,
      scheduleTimes: prev.scheduleTimes.filter((t) => t.workDate !== workDate),
    }));
  };

  // ScrollView ref
  const scrollViewRef = React.useRef<ScrollView>(null);
  const categoryViewRef = React.useRef<View>(null);

  // 스텝별 진행률 계산
  const getStepProgress = () => {
    const totalSteps = Object.keys(STEPS).length;
    return ((currentStep - 1) / (totalSteps - 1)) * 100;
  };

  // 1 -> 2단계 진입 시 레이아웃 재계산 트리거
  useEffect(() => {
    if (currentStep === STEPS.DATE_TIME) {
      const t = setTimeout(() => setDateStepKey((k) => k + 1), 0);
      return () => clearTimeout(t);
    }
  }, [currentStep]);

  // 스텝별 제목
  const getStepTitle = (step: Step): string => {
    switch (step) {
      case STEPS.BASIC_INFO:
        return "기본 정보";
      case STEPS.DATE_TIME:
        return "날짜 및 시간";
      case STEPS.LOCATION:
        return "장소 정보";
      case STEPS.CONTRACT:
        return "계약 정보";
      case STEPS.WORKERS:
        return "근로자 배치";
      case STEPS.DOCUMENTS:
        return "첨부파일";
      case STEPS.REVIEW:
        return "최종 확인";
      default:
        return "";
    }
  };

  // 스텝별 유효성 검사
  const validateStep = (step: Step): boolean => {
    switch (step) {
      case STEPS.BASIC_INFO:
        return formData.title.trim() !== "" && formData.category !== "";
      case STEPS.DATE_TIME:
        return formData.startDate !== "" && formData.endDate !== "";
      case STEPS.LOCATION:
        return true; // 장소는 선택사항
      case STEPS.CONTRACT:
        return (
          formData.scheduleType === "personal" ||
          (formData.contractAmount !== undefined && formData.contractAmount > 0)
        );
      case STEPS.WORKERS:
        // 근로자 선택이 없으면 통과
        if (pickedWorkers.length === 0) return true;
        
        // 선택된 근로자 중 날짜가 전체 비활성화된 근로자가 있는지 확인
        for (const worker of pickedWorkers) {
          const assignments = workerAssignments[worker.workerId] || [];
          const enabledDates = assignments.filter((d) => d.enabled);
          if (enabledDates.length === 0) {
            return false;
          }
        }
        return true;
      case STEPS.DOCUMENTS:
        return true; // 첨부파일은 선택사항
      case STEPS.REVIEW:
        return true;
      default:
        return false;
    }
  };

  // 다음 스텝으로 이동
  const goToNextStep = () => {
    if (currentStep < STEPS.REVIEW) {
      let nextStep: Step;

      // 개인 스케줄인 경우 4, 5, 6단계를 건너뛰기
      if (formData.scheduleType === "personal") {
        if (currentStep === STEPS.LOCATION) {
          // 3단계에서 바로 7단계로
          nextStep = STEPS.REVIEW;
        } else {
          nextStep = (currentStep + 1) as Step;
        }
      } else {
        // 업무 스케줄은 모든 단계 진행
        nextStep = (currentStep + 1) as Step;
      }

      setCurrentStep(nextStep);
      saveDraft(nextStep);
    }
  };

  // 이전 스텝으로 이동
  const goToPreviousStep = () => {
    if (currentStep > STEPS.BASIC_INFO) {
      let prevStep: Step;

      // 개인 스케줄인 경우 4, 5, 6단계를 건너뛰기
      if (formData.scheduleType === "personal") {
        if (currentStep === STEPS.REVIEW) {
          // 7단계에서 이전하면 3단계로
          prevStep = STEPS.LOCATION;
        } else {
          prevStep = (currentStep - 1) as Step;
        }
      } else {
        // 업무 스케줄은 모든 단계 진행
        prevStep = (currentStep - 1) as Step;
      }

      setCurrentStep(prevStep);
    }
  };

  // 공통 스토리지 헬퍼 (웹: localStorage, 앱: AsyncStorage)
  const storage = {
    async getItem(key: string): Promise<string | null> {
      if (Platform.OS === "web") {
        try {
          // @ts-ignore
          return window?.localStorage?.getItem(key) ?? null;
        } catch {
          return null;
        }
      }
      try {
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    },
    async setItem(key: string, value: string): Promise<void> {
      if (Platform.OS === "web") {
        try {
          // @ts-ignore
          window?.localStorage?.setItem(key, value);
        } catch {}
        return;
      }
      try {
        await AsyncStorage.setItem(key, value);
      } catch {}
    },
    async removeItem(key: string): Promise<void> {
      if (Platform.OS === "web") {
        try {
          // @ts-ignore
          window?.localStorage?.removeItem(key);
        } catch {}
        return;
      }
      try {
        await AsyncStorage.removeItem(key);
      } catch {}
    },
  };

  // 임시저장
  const saveDraft = async (step?: Step) => {
    if (isDraftSaving) return;

    setIsDraftSaving(true);
    try {
      const db = getDatabase();
      const currentUser = await getCurrentSupabaseUser();

      if (!currentUser) return;

      const draft: DraftSchedule = {
        id: draftData?.id || `draft-${Date.now()}`,
        step: step || currentStep,
        data: formData,
        lastSaved: new Date().toISOString(),
      };

      // 로컬 임시저장 (플랫폼별 스토리지)
      const stored = (await storage.getItem("schedule_drafts")) || "[]";
      const drafts = JSON.parse(stored);
      const existingIndex = drafts.findIndex(
        (d: DraftSchedule) => d.id === draft.id
      );

      if (existingIndex >= 0) {
        drafts[existingIndex] = draft;
      } else {
        drafts.push(draft);
      }
      await storage.setItem("schedule_drafts", JSON.stringify(drafts));
      setDraftData(draft);
      setLastAutoSave(dayjs().format("HH:mm:ss"));
    } catch (error) {
      console.error("Failed to save draft:", error);
    } finally {
      setIsDraftSaving(false);
    }
  };

  // 임시저장 불러오기
  const loadDraft = async () => {
    try {
      const stored = (await storage.getItem("schedule_drafts")) || "[]";
      const drafts = JSON.parse(stored);
      if (drafts.length > 0) {
        const latestDraft = drafts[drafts.length - 1];
        setDraftData(latestDraft);
        setFormData((prev) => ({ ...prev, ...latestDraft.data }));
        setCurrentStep(latestDraft.step);
        setLastAutoSave(dayjs(latestDraft.lastSaved).format("HH:mm:ss"));
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  };

  // 임시저장 삭제
  const clearDraft = async () => {
    try {
      await storage.removeItem("schedule_drafts");
      setDraftData(null);
      setLastAutoSave(null);
    } catch (error) {
      console.error("Failed to clear draft:", error);
    }
  };

  // 자동 저장 (30초마다)
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(interval);
  }, [visible, formData]);

  // 웹 환경에서 주소 검색 초기화
  useEffect(() => {
    if (Platform.OS === "web" && showAddressSearch) {
      const loadDaumPostcode = async () => {
        if (typeof window === "undefined" || typeof document === "undefined") {
          return;
        }

        // 이미 로드되어 있는지 확인
        if ((window as any).daum && (window as any).daum.Postcode) {
          setWebAddressSearchReady(true);
          return;
        }

        const script = document.createElement("script");
        script.src =
          "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
        script.onload = () => {
          setWebAddressSearchReady(true);
        };
        script.onerror = () => {
          console.error("다음 우편번호 서비스 로드 실패");
        };
        document.head.appendChild(script);
      };

      loadDaumPostcode();
    }
  }, [showAddressSearch]);

  // 웹 환경에서 주소 검색 실행
  useEffect(() => {
    if (Platform.OS === "web" && showAddressSearch && webAddressSearchReady) {
      const containerId = "daum-postcode-container-multistep";
      let container = document.getElementById(containerId);

      if (!container) {
        container = document.createElement("div");
        container.id = containerId;
        container.style.width = "100%";
        container.style.height = "100%";
        const parentElement = document.querySelector(
          '[data-testid="address-search-web-container"]'
        );
        if (parentElement) {
          parentElement.appendChild(container);
        }
      }

      const daum = (window as any).daum;
      if (!daum || !daum.Postcode || !container) {
        return;
      }

      // 기존 인스턴스 정리
      container.innerHTML = "";

      const postcode = new daum.Postcode({
        oncomplete: function (data: any) {
          const addr = data.roadAddress || data.jibunAddress;
          const fullAddress = data.buildingName
            ? `${addr} (${data.buildingName})`
            : addr;
          setFormData((prev) => ({
            ...prev,
            address: fullAddress,
            location: fullAddress,
          }));
          setShowAddressSearch(false);
        },
        width: "100%",
        height: "100%",
      });

      postcode.embed(container, {
        q: formData.address || "",
        autoClose: false,
      });

      return () => {
        // cleanup - 모달이 닫힐 때 정리
        if (container) {
          container.innerHTML = "";
          const parent = container.parentElement;
          if (parent) {
            parent.removeChild(container);
          }
        }
      };
    } else if (Platform.OS === "web" && !showAddressSearch) {
      // 모달이 닫힐 때도 정리
      const containerId = "daum-postcode-container-multistep";
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = "";
        const parent = container.parentElement;
        if (parent) {
          parent.removeChild(container);
        }
      }
      setWebAddressSearchReady(false);
    }
  }, [webAddressSearchReady, showAddressSearch, formData.address]);

  // 주소 검색 결과 확인 (모바일용)
  useEffect(() => {
    if (!visible || Platform.OS === "web") return;

    let mounted = true;

    const checkSelectedAddress = async () => {
      try {
        const address = await AsyncStorage.getItem("selectedAddress");
        if (address && mounted) {
          console.log("✅ 저장된 주소 발견:", address);
          setFormData((prev) => ({
            ...prev,
            address: address,
            location: address,
          }));
          // 사용 후 삭제
          await AsyncStorage.removeItem("selectedAddress");
        }
      } catch (error) {
        console.error("❌ 주소 확인 오류:", error);
      }
    };

    // 주소 검색 화면에서 돌아왔을 때 확인을 위해 주기적으로 체크
    const interval = setInterval(checkSelectedAddress, 1000);

    // 모달이 열릴 때 즉시 한 번 확인
    checkSelectedAddress();

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [visible]);

  // 초기화
  useEffect(() => {
    if (visible) {
      setFormData({
        title: "",
        description: "",
        startDate: initialStartDate || dayjs().format("YYYY-MM-DD"),
        endDate: initialEndDate || dayjs().format("YYYY-MM-DD"),
        startTime: "09:00",
        endTime: "18:00",
        allDay: false,
        category: "" as ScheduleCategory,
        location: "",
        address: "",
        uniformTime: true,
        scheduleTimes: [],
        documentsFolderPath: "",
        hasAttachments: false,
        memo: "",
        scheduleType: "business",
        clientId: initialClientId || undefined,
        contractAmount: 0,
        contractType: "written",
        contractContent: "",
      });
      setCurrentStep(initialStep);
      // 근로자 관련 상태 초기화
      setPickedWorkers([]);
      setWorkerAssignments({});
      setWorkerUniformTime({});
      setWorkerSearchQuery("");
      setShowAddWorkerForm(false);
      setNewWorkerName("");
      setNewWorkerPhone("");
      setShowDatePickerForWorker(null);
      loadDraft();
      loadCategories();
      loadClients();
      loadWorkers();
    }
  }, [visible, initialStartDate, initialEndDate, initialIsMultiDay]);

  const loadCategories = async () => {
    try {
      const db = getDatabase();
      const cats = await db.getAllCategories();
      setCategories(cats);
    } catch (error) {
      console.error("❌ Failed to load categories:", error);
    }
  };

  const loadClients = async () => {
    try {
      const db = getDatabase();
      const clientList = await db.getAllClients();
      // 최신순으로 정렬 (맨 위에 최신 거래처가 오도록)
      const sortedClients = [...clientList].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      setClients(sortedClients);
    } catch (error) {
      console.error("❌ Failed to load clients:", error);
    }
  };

  const loadWorkers = async () => {
    try {
      const db = getDatabase();
      const workerList = await db.getAllWorkers();
      // 최신순으로 정렬 (맨 위에 최신 근로자가 오도록)
      const sortedWorkers = [...workerList].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      setAllWorkers(sortedWorkers);
    } catch (error) {
      console.error("❌ Failed to load workers:", error);
    }
  };

  // 최종 저장
  const handleSave = async () => {
    // 이미 저장 중이면 중복 실행 방지
    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      const db = getDatabase();
      const currentUser = await getCurrentSupabaseUser();

      if (!currentUser) {
        Alert.alert("오류", "로그인이 필요합니다.");
        setIsSaving(false);
        return;
      }

      const newSchedule: Schedule = {
        id: `schedule-${Date.now()}`,
        userId: currentUser.id,
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        category: formData.category,
        location: formData.location,
        address: formData.address,
        uniformTime: formData.uniformTime,
        documentsFolderPath: formData.documentsFolderPath,
        hasAttachments: formData.hasAttachments,
        contractAmount: formData.contractAmount || 0,
        scheduleType: formData.scheduleType,
        clientId: formData.clientId,
        allWagesPaid: false,
        revenueStatus: "pending",
        memo: formData.memo,
        workers: [],
      };

      const scheduleId = await db.createSchedule(newSchedule);

      // 계약 정보 저장
      if (formData.contractAmount && formData.contractAmount > 0) {
        const contract = {
          id: `contract-${Date.now()}`,
          scheduleId,
          contractType: formData.contractType || "written",
          contractDirection: "sent" as const,
          contractAmount: formData.contractAmount,
          contractContent: formData.contractContent,
          contractStatus: "draft" as const,
        };
        await db.createScheduleContract(contract);
      }

      // 근로자 배치 저장 (선택/배치 정보가 있는 경우에만)
      if (pickedWorkers.length > 0) {
        for (const w of pickedWorkers) {
          const isWorkerUniformTime = workerUniformTime[w.workerId] ?? true;
          const daily = workerAssignments[w.workerId] || [];
          const enabledDates = daily.filter((d) => d.enabled);

          // 참여 날짜가 없으면 건너뜀
          if (enabledDates.length === 0) {
            continue;
          }

          // 실제 참여 날짜 범위 계산
          const sortedDates = enabledDates
            .map((d) => d.workDate)
            .sort((a, b) => (a < b ? -1 : 1));
          const actualStartDate = sortedDates[0];
          const actualEndDate = sortedDates[sortedDates.length - 1];

          const scheduleWorkerId = `sw_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          // 근로자-스케줄 연결 생성
          await db.createScheduleWorker({
            id: scheduleWorkerId,
            scheduleId,
            workerId: w.workerId,
            workStartDate: actualStartDate, // 실제 참여 시작일
            workEndDate: actualEndDate, // 실제 참여 종료일
            uniformTime: isWorkerUniformTime,
            hourlyWage: w.hourlyWage ?? undefined,
            fuelAllowance: 0,
            otherAllowance: 0,
            overtimeEnabled: false,
            nightShiftEnabled: false,
            taxWithheld: true,
            wagePaid: false,
            fuelPaid: false,
            otherPaid: false,
          });

          // 선택된 모든 날짜에 대해 workPeriod 생성
          for (const d of enabledDates) {
            const workPeriodId = `wp_${Date.now()}_${Math.random()
              .toString(36)
              .substr(2, 9)}`;

            let periodStartTime: string;
            let periodEndTime: string;

            if (isWorkerUniformTime) {
              // uniformTime이 true면 선택된 시간 사용 (모든 날짜 동일)
              periodStartTime = w.startTime || formData.startTime || "09:00";
              periodEndTime = w.endTime || formData.endTime || "18:00";
            } else {
              // uniformTime이 false면 각 날짜별 시간 사용
              periodStartTime = d.startTime;
              periodEndTime = d.endTime;
            }

            await db.createWorkPeriod({
              id: workPeriodId,
              scheduleWorkerId,
              workDate: d.workDate,
              startTime: periodStartTime,
              endTime: periodEndTime,
              breakDuration: 0,
              overtimeHours: 0,
            });
          }
        }
      }

      // 활동 생성
      await createScheduleActivity(
        newSchedule.id,
        newSchedule.title,
        newSchedule.description
      );

      // 임시저장 삭제
      clearDraft();

      Alert.alert("성공", "일정이 추가되었습니다.", [
        {
          text: "확인",
          onPress: () => {
            setIsSaving(false);
            onSave();
            onClose();
          },
        },
      ]);
    } catch (error) {
      console.error("Failed to create schedule:", error);
      Alert.alert("오류", "일정 추가에 실패했습니다.");
      setIsSaving(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    if (draftData) {
      Alert.alert(
        "임시저장된 내용이 있습니다",
        "임시저장된 내용을 삭제하고 나가시겠습니까?",
        [
          { text: "계속 편집", style: "cancel" },
          {
            text: "삭제하고 나가기",
            onPress: () => {
              clearDraft();
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  // 스텝별 렌더링
  const renderStepContent = () => {
    switch (currentStep) {
      case STEPS.BASIC_INFO:
        return renderBasicInfoStep();
      case STEPS.DATE_TIME:
        return renderDateTimeStep();
      case STEPS.LOCATION:
        return renderLocationStep();
      case STEPS.CONTRACT:
        return renderContractStep();
      case STEPS.WORKERS:
        return renderWorkersStep();
      case STEPS.DOCUMENTS:
        return renderDocumentsStep();
      case STEPS.REVIEW:
        return renderReviewStep();
      default:
        return null;
    }
  };

  // 기본 정보 스텝
  const renderBasicInfoStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>스케줄 타입 *</Text>
        <View style={styles.scheduleTypeContainer}>
          <Pressable
            style={[
              styles.scheduleTypeButton,
              {
                backgroundColor:
                  formData.scheduleType === "personal"
                    ? colors.primary
                    : "#f5f5f5",
                borderColor:
                  formData.scheduleType === "personal"
                    ? colors.primary
                    : "transparent",
              },
            ]}
            onPress={() =>
              setFormData({ ...formData, scheduleType: "personal" })
            }
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={formData.scheduleType === "personal" ? "white" : "#666"}
            />
            <Text
              style={[
                styles.scheduleTypeText,
                {
                  color:
                    formData.scheduleType === "personal" ? "white" : "#666",
                },
              ]}
            >
              개인 스케줄
            </Text>
            <Text
              style={[
                styles.scheduleTypeSubtext,
                {
                  color:
                    formData.scheduleType === "personal"
                      ? "rgba(255,255,255,0.8)"
                      : "#999",
                },
              ]}
            >
              회식, 약속 등
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.scheduleTypeButton,
              {
                backgroundColor:
                  formData.scheduleType === "business"
                    ? colors.primary
                    : "#f5f5f5",
                borderColor:
                  formData.scheduleType === "business"
                    ? colors.primary
                    : "transparent",
              },
            ]}
            onPress={() =>
              setFormData({ ...formData, scheduleType: "business" })
            }
          >
            <Ionicons
              name="business-outline"
              size={20}
              color={formData.scheduleType === "business" ? "white" : "#666"}
            />
            <Text
              style={[
                styles.scheduleTypeText,
                {
                  color:
                    formData.scheduleType === "business" ? "white" : "#666",
                },
              ]}
            >
              업무 스케줄
            </Text>
            <Text
              style={[
                styles.scheduleTypeSubtext,
                {
                  color:
                    formData.scheduleType === "business"
                      ? "rgba(255,255,255,0.8)"
                      : "#999",
                },
              ]}
            >
              수익 발생, 근로자 배치
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>일정명 *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="일정명을 입력하세요"
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>설명</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="일정에 대한 설명을 입력하세요"
          value={formData.description}
          onChangeText={(text) =>
            setFormData({ ...formData, description: text })
          }
          multiline
          numberOfLines={3}
          onFocus={() => {
            // 키보드가 올라올 때 설명 칸이 가려지지 않도록 스크롤
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 250);
          }}
        />
      </View>

      <View style={styles.inputGroup} ref={categoryViewRef}>
        <View style={styles.categoryHeader}>
          <Text style={styles.inputLabel}>카테고리 *</Text>
          <Pressable
            style={styles.addCategoryButton}
            onPress={() => {
              const next = !showAddCategoryForm;
              setShowAddCategoryForm(next);
              if (next) {
                // 폼을 열 때 키보드 닫고 카테고리 영역으로 스크롤
                Keyboard.dismiss();
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                }, 50);
              }
            }}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text
              style={[styles.addCategoryButtonText, { color: colors.primary }]}
            >
              추가
            </Text>
          </Pressable>
        </View>

        {/* 카테고리 검색 */}
        <TextInput
          style={[styles.textInput, { marginBottom: 8 }]}
          placeholder="카테고리 검색"
          value={categorySearchQuery}
          onChangeText={setCategorySearchQuery}
        />

        <View style={styles.categoryContainer}>
          {categories
            .filter((c) =>
              categorySearchQuery
                ? c.name
                    .toLowerCase()
                    .includes(categorySearchQuery.toLowerCase())
                : true
            )
            .slice(0, showAllCategories ? undefined : 3)
            .map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: "#f5f5f5",
                    borderColor:
                      formData.category === category.name
                        ? category.color
                        : "transparent",
                    borderWidth: formData.category === category.name ? 2 : 0,
                  },
                ]}
                onPress={() =>
                  setFormData({
                    ...formData,
                    category: category.name as ScheduleCategory,
                  })
                }
              >
                <View style={styles.categoryTag}>
                  <View
                    style={[
                      styles.categoryColorDot,
                      { backgroundColor: category.color },
                    ]}
                  />
                  <Text style={styles.categoryButtonText}>{category.name}</Text>
                </View>
              </Pressable>
            ))}
          {/* 더 보기/접기 */}
          {categories.filter((c) =>
            categorySearchQuery
              ? c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
              : true
          ).length > 3 &&
            !showAllCategories && (
              <Pressable
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: "#f3f4f6",
                }}
                onPress={() => setShowAllCategories(true)}
              >
                <Text style={{ color: "#374151" }}>
                  +
                  {categories.filter((c) =>
                    categorySearchQuery
                      ? c.name
                          .toLowerCase()
                          .includes(categorySearchQuery.toLowerCase())
                      : true
                  ).length - 3}
                  개 더 보기
                </Text>
              </Pressable>
            )}
          {categories.filter((c) =>
            categorySearchQuery
              ? c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
              : true
          ).length > 3 &&
            showAllCategories && (
              <Pressable
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: "#f3f4f6",
                }}
                onPress={() => setShowAllCategories(false)}
              >
                <Text style={{ color: "#374151" }}>접기</Text>
              </Pressable>
            )}
        </View>

        {showAddCategoryForm && (
          <View style={styles.addCategoryForm}>
            <TextInput
              style={styles.categoryNameInput}
              placeholder="카테고리 이름"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />

            <Text style={[styles.inputLabel, { marginBottom: 8 }]}>
              색상 선택
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {[
                "#FFB3BA",
                "#FFDFBA",
                "#FFFFBA",
                "#BAFFC9",
                "#BAE1FF",
                "#E6B3FF",
              ].map((color) => (
                <Pressable
                  key={color}
                  style={[
                    {
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 2,
                      borderColor:
                        newCategoryColor === color ? "#333" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: color,
                    },
                  ]}
                  onPress={() => {
                    setNewCategoryColor(color);
                    setShowColorPicker(false);
                  }}
                >
                  {newCategoryColor === color && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </Pressable>
              ))}

              {customColors.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    {
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 2,
                      borderColor:
                        newCategoryColor === color ? "#333" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: color,
                    },
                  ]}
                  onPress={() => {
                    setNewCategoryColor(color);
                    setShowColorPicker(false);
                  }}
                >
                  {newCategoryColor === color && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </Pressable>
              ))}

              <Pressable
                style={[
                  {
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    borderWidth: 2,
                    borderStyle: "dashed",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: showColorPicker ? "#f0f0f0" : "#fff",
                    borderColor: showColorPicker ? "#333" : "#e5e7eb",
                  },
                ]}
                onPress={() => setShowColorPicker(!showColorPicker)}
              >
                <Ionicons
                  name={showColorPicker ? "close" : "add"}
                  size={20}
                  color={showColorPicker ? "#333" : "#999"}
                />
              </Pressable>
            </View>

            {showColorPicker && (
              <View style={{ marginBottom: 12 }}>
                {Platform.OS === "web" ? (
                  <WebColorPicker
                    color={previewColor}
                    onColorChange={(color: string) => {
                      setNewCategoryColor(color);
                      setPreviewColor(color);
                      if (!customColors.includes(color)) {
                        setCustomColors((prev) => [...prev, color]);
                      }
                      setShowColorPicker(false);
                    }}
                  />
                ) : (
                  <AppColorPicker
                    color={previewColor}
                    onColorChange={(color: string) => {
                      setNewCategoryColor(color);
                      setPreviewColor(color);
                      if (!customColors.includes(color)) {
                        setCustomColors((prev) => [...prev, color]);
                      }
                      setShowColorPicker(false);
                    }}
                  />
                )}
              </View>
            )}

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <Pressable
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: "#e5e7eb",
                }}
                onPress={() => {
                  setShowAddCategoryForm(false);
                  setNewCategoryName("");
                  setNewCategoryColor("#8b5cf6");
                  setPreviewColor("#8b5cf6");
                  setShowColorPicker(false);
                }}
              >
                <Text style={{ color: "#374151", fontWeight: "600" }}>
                  취소
                </Text>
              </Pressable>
              <Pressable
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.primary,
                }}
                onPress={async () => {
                  if (!newCategoryName.trim()) {
                    Alert.alert("오류", "카테고리 이름을 입력해주세요.");
                    return;
                  }
                  try {
                    const db = getDatabase();
                    const newCategory = {
                      id: `cat_${Date.now()}`,
                      name: newCategoryName.trim(),
                      color: newCategoryColor,
                    };
                    await db.createCategory(newCategory as any);
                    setNewCategoryName("");
                    setNewCategoryColor("#8b5cf6");
                    setPreviewColor("#8b5cf6");
                    setShowColorPicker(false);
                    setShowAddCategoryForm(false);
                    // 새 목록 로드
                    loadCategories();
                    Alert.alert(
                      "성공",
                      `"${newCategory.name}" 카테고리가 추가되었습니다.`
                    );
                  } catch (e) {
                    Alert.alert("오류", "카테고리 추가에 실패했습니다.");
                  }
                }}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>추가</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  // 날짜 및 시간 스텝
  const renderDateTimeStep = () => (
    <View key={`date-step-${dateStepKey}`} style={styles.stepContent}>
      <View style={styles.dateTimeRow}>
        <View style={styles.dateCol}>
          <DatePicker
            label="시작일 *"
            value={formData.startDate}
            onDateChange={(date) => {
              const newStartDate = date;
              const currentEndDate = formData.endDate;
              const isSameDate = dayjs(newStartDate).isSame(
                dayjs(currentEndDate),
                "day"
              );

              if (dayjs(newStartDate).isAfter(dayjs(currentEndDate))) {
                setFormData({
                  ...formData,
                  startDate: newStartDate,
                  endDate: newStartDate,
                  uniformTime: true, // 같은 날짜일 때는 항상 uniformTime을 true로
                });
              } else {
                setFormData({
                  ...formData,
                  startDate: newStartDate,
                  uniformTime: isSameDate ? true : formData.uniformTime, // 같은 날짜면 true
                });
              }
              if (!formData.allDay && !formData.uniformTime) {
                ensureScheduleTimesForRange(newStartDate, currentEndDate);
              }
            }}
            placeholder="시작일 선택"
            mode="date"
          />
        </View>
        <View style={styles.dateCol}>
          <DatePicker
            label="종료일 *"
            value={formData.endDate}
            onDateChange={(date) => {
              if (dayjs(date).isBefore(dayjs(formData.startDate))) {
                Alert.alert("오류", "종료일은 시작일보다 늦어야 합니다.");
                return;
              }
              const newEndDate = date;
              const isSameDate = dayjs(formData.startDate).isSame(
                dayjs(newEndDate),
                "day"
              );
              setFormData({
                ...formData,
                endDate: newEndDate,
                uniformTime: isSameDate ? true : formData.uniformTime, // 같은 날짜면 true
              });
              if (!formData.allDay && !formData.uniformTime) {
                ensureScheduleTimesForRange(formData.startDate, newEndDate);
              }
            }}
            placeholder="종료일 선택"
            mode="date"
            minDate={formData.startDate}
          />
        </View>
      </View>

      {/* 하루 종일 설정 */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>하루 종일</Text>
        <Pressable
          onPress={() => setFormData({ ...formData, allDay: !formData.allDay })}
          style={[
            styles.toggle,
            { backgroundColor: formData.allDay ? colors.primary : "#cbd5e1" },
          ]}
        >
          <View
            style={[
              styles.toggleThumb,
              { marginLeft: formData.allDay ? 20 : 0 },
            ]}
          />
        </Pressable>
      </View>

      {!formData.allDay && (
        <>
          {formData.startDate !== formData.endDate && (
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>매일 시간 동일</Text>
              <Pressable
                onPress={() => {
                  const next = !formData.uniformTime;
                  setFormData({ ...formData, uniformTime: next });
                  if (!next) {
                    ensureScheduleTimesForRange(
                      formData.startDate,
                      formData.endDate
                    );
                  }
                }}
                style={[
                  styles.toggle,
                  {
                    backgroundColor: formData.uniformTime
                      ? colors.primary
                      : "#cbd5e1",
                  },
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    { marginLeft: formData.uniformTime ? 20 : 0 },
                  ]}
                />
              </Pressable>
            </View>
          )}

          {formData.uniformTime ? (
            <View style={styles.dateTimeRow}>
              <View style={styles.dateCol}>
                <DatePicker
                  label="시작시간"
                  value={`2000-01-01 ${formData.startTime || "09:00"}`}
                  onDateChange={(date) => {
                    // DatePicker의 time 모드는 이미 "HH:mm" 형식 문자열을 반환합니다
                    const selectedStartTime =
                      typeof date === "string" && date.includes(":")
                        ? date
                        : dayjs(date).format("HH:mm");
                    setFormData((prev) => ({
                      ...prev,
                      startTime: selectedStartTime,
                    }));
                  }}
                  placeholder="시작시간 선택"
                  mode="time"
                />
              </View>
              <View style={styles.dateCol}>
                <DatePicker
                  label="종료시간"
                  value={`2000-01-01 ${formData.endTime || "18:00"}`}
                  onDateChange={(date) => {
                    // DatePicker의 time 모드는 이미 "HH:mm" 형식 문자열을 반환합니다
                    const selectedEndTime =
                      typeof date === "string" && date.includes(":")
                        ? date
                        : dayjs(date).format("HH:mm");
                    setFormData((prev) => ({
                      ...prev,
                      endTime: selectedEndTime,
                    }));
                  }}
                  placeholder="종료시간 선택"
                  mode="time"
                />
              </View>
            </View>
          ) : (
            formData.startDate !== formData.endDate && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.inputLabel}>일별 시간 설정</Text>
                {formData.scheduleTimes.map((t) => (
                  <View key={t.workDate} style={{ marginBottom: 8 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#374151",
                          fontWeight: "600",
                        }}
                      >
                        {dayjs(t.workDate).format("MM월 DD일 (ddd)")}
                      </Text>
                      <Pressable onPress={() => removeScheduleTime(t.workDate)}>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#ef4444"
                        />
                      </Pressable>
                    </View>
                    <View style={styles.dateTimeRow}>
                      <View style={styles.dateCol}>
                        <DatePicker
                          label="시작시간"
                          value={`2000-01-01 ${t.startTime || "09:00"}`}
                          onDateChange={(date) => {
                            // DatePicker의 time 모드는 이미 "HH:mm" 형식 문자열을 반환합니다
                            const selectedStartTime =
                              typeof date === "string" && date.includes(":")
                                ? date
                                : dayjs(date).format("HH:mm");
                            setTimeout(() => {
                              updateScheduleTime(
                                t.workDate,
                                "startTime",
                                selectedStartTime
                              );
                            }, 0);
                          }}
                          placeholder="시작시간"
                          mode="time"
                        />
                      </View>
                      <View style={styles.dateCol}>
                        <DatePicker
                          label="종료시간"
                          value={`2000-01-01 ${t.endTime || "18:00"}`}
                          onDateChange={(date) => {
                            // DatePicker의 time 모드는 이미 "HH:mm" 형식 문자열을 반환합니다
                            const selectedEndTime =
                              typeof date === "string" && date.includes(":")
                                ? date
                                : dayjs(date).format("HH:mm");
                            setTimeout(() => {
                              updateScheduleTime(
                                t.workDate,
                                "endTime",
                                selectedEndTime
                              );
                            }, 0);
                          }}
                          placeholder="종료시간"
                          mode="time"
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )
          )}
        </>
      )}
    </View>
  );

  // 장소 정보 스텝
  const renderLocationStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>주소</Text>
        <View style={styles.addressRow}>
          <TextInput
            style={[styles.textInput, styles.addressInput]}
            placeholder={
              Platform.OS === "web"
                ? "주소를 입력하거나 검색해주세요 (예: 경기도 화성시 화성교육청)"
                : "주소를 입력해주세요 (예: 경기도 화성시 화성교육청)"
            }
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />
          {Platform.OS === "web" && (
            <Pressable
              style={[
                styles.addressSearchButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                setShowAddressSearch(true);
              }}
            >
              <Ionicons name="search" size={20} color="white" />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>메모</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="추가 메모를 입력하세요"
          value={formData.memo}
          onChangeText={(text) => setFormData({ ...formData, memo: text })}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* 주소 검색 모달 (별도 Modal로 분리) */}
      <Modal
        visible={showAddressSearch}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddressSearch(false)}
      >
        <View style={styles.addressSearchModalOverlay}>
          <View style={styles.addressSearchModalContent}>
            <View style={styles.addressSearchModalHeader}>
              <Text style={styles.addressSearchModalTitle}>주소 검색</Text>
              <Pressable
                onPress={() => setShowAddressSearch(false)}
                style={styles.addressSearchModalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>
            {Platform.OS === "web" ? (
              <View
                style={styles.addressSearchWebContainer}
                data-testid="address-search-web-container"
              >
                {webAddressSearchReady ? null : (
                  <Text style={{ padding: 16, color: "#666" }}>
                    주소 검색 서비스를 불러오는 중...
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.addressSearchWebContainer}>
                <Text style={{ padding: 16, color: "#666" }}>
                  앱에서는 현재 주소 검색을 지원하지 않습니다. 입력란에 직접
                  입력해주세요.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );

  // 계약 정보 스텝
  const renderContractStep = () => {
    // 개인 스케줄인 경우 계약 정보는 건너뛰기
    if (formData.scheduleType === "personal") {
      return (
        <View style={styles.stepContent}>
          <View style={styles.skipStepContainer}>
            <Ionicons
              name="checkmark-circle"
              size={64}
              color={colors.primary}
            />
            <Text style={styles.skipStepTitle}>개인 스케줄</Text>
            <Text style={styles.skipStepSubtitle}>
              개인 스케줄은 계약 정보가 필요하지 않습니다.
            </Text>
            <Text style={styles.skipStepDescription}>
              회식, 약속, 개인 일정 등은 수익 계산에 포함되지 않습니다.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.stepContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>거래처</Text>
          <View style={styles.clientSelector}>
            <Pressable
              style={styles.clientButton}
              onPress={() => setShowClientSelector(true)}
            >
              <Text style={styles.clientButtonText}>
                {formData.clientId
                  ? clients.find((c) => c.id === formData.clientId)?.name ||
                    "거래처 선택"
                  : "거래처 선택"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </Pressable>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>계약금액 * (원)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="계약금액을 입력하세요"
            value={
              formData.contractAmount && formData.contractAmount > 0
                ? formData.contractAmount.toLocaleString()
                : ""
            }
            onChangeText={(text) => {
              // 숫자만 추출
              const numericValue = text.replace(/[^0-9]/g, "");
              const amount = numericValue ? parseInt(numericValue, 10) : 0;
              setFormData({ ...formData, contractAmount: amount });
            }}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>계약 유형</Text>
          <View style={styles.contractTypeContainer}>
            {[
              {
                value: "written",
                label: "서면",
                icon: "document-text-outline",
              },
              { value: "verbal", label: "구두", icon: "mic-outline" },
              { value: "text", label: "텍스트", icon: "chatbubble-outline" },
            ].map((type) => (
              <Pressable
                key={type.value}
                style={[
                  styles.contractTypeButton,
                  {
                    backgroundColor:
                      formData.contractType === type.value
                        ? colors.primary
                        : "#f5f5f5",
                    borderColor:
                      formData.contractType === type.value
                        ? colors.primary
                        : "transparent",
                  },
                ]}
                onPress={() =>
                  setFormData({ ...formData, contractType: type.value as any })
                }
              >
                <Ionicons
                  name={type.icon as any}
                  size={20}
                  color={
                    formData.contractType === type.value ? "white" : "#666"
                  }
                />
                <Text
                  style={[
                    styles.contractTypeText,
                    {
                      color:
                        formData.contractType === type.value ? "white" : "#666",
                    },
                  ]}
                >
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>계약 내용</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="계약 내용을 입력하세요"
            value={formData.contractContent}
            onChangeText={(text) =>
              setFormData({ ...formData, contractContent: text })
            }
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
    );
  };

  // 근로자 배치 스텝
  const renderWorkersStep = () => {
    // 개인 스케줄인 경우 근로자 배치는 건너뛰기
    if (formData.scheduleType === "personal") {
      return (
        <View style={styles.stepContent}>
          <View style={styles.skipStepContainer}>
            <Ionicons name="person-outline" size={64} color={colors.primary} />
            <Text style={styles.skipStepTitle}>개인 스케줄</Text>
            <Text style={styles.skipStepSubtitle}>
              개인 스케줄에는 근로자 배치가 필요하지 않습니다.
            </Text>
            <Text style={styles.skipStepDescription}>
              회식, 약속, 개인 일정 등은 근로자 없이 진행됩니다.
            </Text>
          </View>
        </View>
      );
    }

    const filteredWorkers = allWorkers.filter((w) =>
      workerSearchQuery
        ? w.name.toLowerCase().includes(workerSearchQuery.toLowerCase())
        : true
    );

    // 선택된 근로자 확인
    const isWorkerSelected = (workerId: string) => {
      return pickedWorkers.some((pw) => pw.workerId === workerId);
    };

    // 근로자 선택/해제
    const toggleWorker = (worker: Worker) => {
      if (isWorkerSelected(worker.id)) {
        // 제거
        setPickedWorkers((prev) =>
          prev.filter((pw) => pw.workerId !== worker.id)
        );
        setWorkerAssignments((prev) => {
          const next = { ...prev };
          delete next[worker.id];
          return next;
        });
        setWorkerUniformTime((prev) => {
          const next = { ...prev };
          delete next[worker.id];
          return next;
        });
      } else {
        // 추가
        const defaultStartTime = formData.uniformTime
          ? formData.startTime
          : formData.scheduleTimes[0]?.startTime || "09:00";
        const defaultEndTime = formData.uniformTime
          ? formData.endTime
          : formData.scheduleTimes[0]?.endTime || "18:00";

        setPickedWorkers((prev) => [
          ...prev,
          {
            workerId: worker.id,
            hourlyWage: worker.hourlyWage,
            startTime: defaultStartTime,
            endTime: defaultEndTime,
            uniformTime: true,
          },
        ]);
        setWorkerUniformTime((prev) => ({ ...prev, [worker.id]: true }));

        // 모든 날짜를 초기화하고 기본적으로 모두 활성화
        const initializeWorkerDates = () => {
          const assignments: WorkerDailyAssignment[] = [];
          let d = dayjs(formData.startDate);
          const last = dayjs(formData.endDate);

          while (d.isSameOrBefore(last, "day")) {
            const workDate = d.format("YYYY-MM-DD");
            const scheduleTime = formData.scheduleTimes.find(
              (st) => st.workDate === workDate
            );

            assignments.push({
              workDate,
              enabled: true, // 기본적으로 모두 활성화
              startTime:
                scheduleTime?.startTime ||
                (formData.uniformTime ? formData.startTime : "09:00"),
              endTime:
                scheduleTime?.endTime ||
                (formData.uniformTime ? formData.endTime : "18:00"),
            });
            d = d.add(1, "day");
          }

          return assignments;
        };

        const assignments = initializeWorkerDates();
        setWorkerAssignments((prev) => ({
          ...prev,
          [worker.id]: assignments,
        }));
      }
    };

    // 근로자 시급 업데이트
    const updateWorkerWage = (workerId: string, text: string) => {
      const amount = parseInt(text.replace(/[^0-9]/g, "")) || 0;
      setPickedWorkers((prev) =>
        prev.map((pw) =>
          pw.workerId === workerId ? { ...pw, hourlyWage: amount } : pw
        )
      );
    };

    // 근로자 uniformTime 토글
    const toggleWorkerUniformTime = (workerId: string) => {
      const current = workerUniformTime[workerId] ?? true;
      const next = !current;
      setWorkerUniformTime((prev) => ({ ...prev, [workerId]: next }));

      // uniformTime이 false로 변경될 때 기존 날짜 설정은 유지 (enabled 상태 그대로)
      // assignments는 이미 초기화되어 있으므로 변경 없음

      setPickedWorkers((prev) =>
        prev.map((pw) =>
          pw.workerId === workerId ? { ...pw, uniformTime: next } : pw
        )
      );
    };

    // 근로자 통일 시간 업데이트
    const updateWorkerUniformTimes = (
      workerId: string,
      type: "startTime" | "endTime",
      value: string
    ) => {
      setPickedWorkers((prev) =>
        prev.map((pw) =>
          pw.workerId === workerId ? { ...pw, [type]: value } : pw
        )
      );
    };

    // 근로자 일별 시간 업데이트
    const updateWorkerDailyTime = (
      workerId: string,
      workDate: string,
      type: "startTime" | "endTime",
      value: string
    ) => {
      setWorkerAssignments((prev) => {
        const assignments = prev[workerId] || [];
        const updated = assignments.map((a) =>
          a.workDate === workDate ? { ...a, [type]: value } : a
        );
        return { ...prev, [workerId]: updated };
      });
    };

    // 근로자 일별 활성화/비활성화
    const toggleWorkerDailyEnabled = (workerId: string, workDate: string) => {
      setWorkerAssignments((prev) => {
        const assignments = prev[workerId] || [];
        const updated = assignments.map((a) =>
          a.workDate === workDate ? { ...a, enabled: !a.enabled } : a
        );
        return { ...prev, [workerId]: updated };
      });
    };

    // 근로자 날짜 추가
    const addWorkerDate = (workerId: string, date: string) => {
      setWorkerAssignments((prev) => {
        const assignments = prev[workerId] || [];
        // 이미 존재하는 날짜인지 확인
        const exists = assignments.some((a) => a.workDate === date);
        if (exists) {
          Alert.alert("알림", "이미 추가된 날짜입니다.");
          return prev;
        }

        // 스케줄 시간에서 기본값 가져오기 (있으면)
        const scheduleTime = formData.scheduleTimes.find(
          (st) => st.workDate === date
        );
        const defaultStartTime =
          scheduleTime?.startTime ||
          (formData.uniformTime ? formData.startTime : "09:00");
        const defaultEndTime =
          scheduleTime?.endTime ||
          (formData.uniformTime ? formData.endTime : "18:00");

        const newAssignment: WorkerDailyAssignment = {
          workDate: date,
          enabled: true,
          startTime: defaultStartTime,
          endTime: defaultEndTime,
        };

        // 날짜순으로 정렬하여 추가
        const updated = [...assignments, newAssignment].sort((a, b) => {
          return a.workDate.localeCompare(b.workDate);
        });

        return { ...prev, [workerId]: updated };
      });
      setShowDatePickerForWorker(null);
    };

    return (
      <View style={styles.stepContent}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>근로자 검색</Text>
          <TextInput
            style={styles.textInput}
            placeholder="근로자 이름으로 검색"
            value={workerSearchQuery}
            onChangeText={setWorkerSearchQuery}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>근로자 선택</Text>
          <ScrollView style={{ maxHeight: 300 }}>
            {filteredWorkers.length === 0 ? (
              <View style={{ padding: 16, alignItems: "center" }}>
                <Text style={{ color: "#9ca3af" }}>
                  {workerSearchQuery
                    ? "검색 결과가 없습니다"
                    : "등록된 근로자가 없습니다"}
                </Text>
              </View>
            ) : (
              filteredWorkers.map((worker) => {
                const selected = isWorkerSelected(worker.id);
                const picked = pickedWorkers.find(
                  (pw) => pw.workerId === worker.id
                );
                const isUniformTime = workerUniformTime[worker.id] ?? true;
                const dailyAssignments = workerAssignments[worker.id] || [];

                return (
                  <View key={worker.id} style={{ marginBottom: 12 }}>
                    <Pressable
                      style={[
                        styles.workerItem,
                        {
                          borderColor: selected ? colors.primary : "#e5e7eb",
                          borderWidth: selected ? 2 : 1,
                          backgroundColor: selected ? "#f0f9ff" : "#fff",
                        },
                      ]}
                      onPress={() => toggleWorker(worker)}
                    >
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Ionicons
                            name={
                              selected ? "checkmark-circle" : "ellipse-outline"
                            }
                            size={20}
                            color={selected ? colors.primary : "#9ca3af"}
                          />
                          <Text style={styles.workerName}>{worker.name}</Text>
                        </View>
                        {worker.phone && (
                          <Text style={styles.workerSub}>{worker.phone}</Text>
                        )}
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        <TextInput
                          style={[
                            styles.wageInput,
                            { opacity: selected ? 1 : 0.5 },
                          ]}
                          value={
                            picked?.hourlyWage
                              ? picked.hourlyWage.toLocaleString()
                              : ""
                          }
                          onChangeText={(t) => updateWorkerWage(worker.id, t)}
                          placeholder="시급"
                          keyboardType="numeric"
                          editable={selected}
                        />
                      </View>
                    </Pressable>

                    {/* 선택된 근로자의 시간 설정 */}
                    {selected && (
                      <View
                        style={{
                          marginTop: 8,
                          padding: 12,
                          backgroundColor: "#f9fafb",
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: "#e5e7eb",
                        }}
                      >
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
                              fontSize: 14,
                              fontWeight: "600",
                              color: "#374151",
                            }}
                          >
                            근무 시간 설정
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#6b7280",
                              }}
                            >
                              {isUniformTime ? "동일 시간" : "일별 시간"}
                            </Text>
                            <Pressable
                              onPress={() => toggleWorkerUniformTime(worker.id)}
                              style={[
                                styles.toggle,
                                {
                                  backgroundColor: isUniformTime
                                    ? colors.primary
                                    : "#cbd5e1",
                                },
                              ]}
                            >
                              <View
                                style={[
                                  styles.toggleThumb,
                                  { marginLeft: isUniformTime ? 16 : 0 },
                                ]}
                              />
                            </Pressable>
                          </View>
                        </View>

                        {/* 날짜 선택 (uniformTime 상관없이 항상 표시) */}
                        <View style={{ marginBottom: 12 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "600",
                              color: "#374151",
                              marginBottom: 8,
                            }}
                          >
                            참여 날짜 선택
                          </Text>
                          {dailyAssignments.length > 0 ? (
                            <View
                              style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                gap: 8,
                                alignItems: "center",
                              }}
                            >
                              {dailyAssignments.map((assignment) => (
                                <Pressable
                                  key={assignment.workDate}
                                  onPress={() =>
                                    toggleWorkerDailyEnabled(
                                      worker.id,
                                      assignment.workDate
                                    )
                                  }
                                  style={[
                                    {
                                      paddingHorizontal: 12,
                                      paddingVertical: 8,
                                      borderRadius: 8,
                                      borderWidth: 2,
                                      backgroundColor: assignment.enabled
                                        ? "#f0f9ff"
                                        : "#f9fafb",
                                      borderColor: assignment.enabled
                                        ? colors.primary
                                        : "#e5e7eb",
                                    },
                                  ]}
                                >
                                  <Text
                                    style={{
                                      fontSize: 12,
                                      fontWeight: "500",
                                      color: assignment.enabled
                                        ? colors.primary
                                        : "#9ca3af",
                                    }}
                                  >
                                    {dayjs(assignment.workDate).format("MM/DD")}
                                  </Text>
                                </Pressable>
                              ))}
                              <Pressable
                                onPress={() => {
                                  setTempDateForWorker(new Date());
                                  setShowDatePickerForWorker(worker.id);
                                }}
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 8,
                                  borderWidth: 2,
                                  borderColor: colors.primary,
                                  backgroundColor: "#f0f9ff",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Ionicons
                                  name="add"
                                  size={20}
                                  color={colors.primary}
                                />
                              </Pressable>
                            </View>
                          ) : (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: "#9ca3af",
                                  fontStyle: "italic",
                                }}
                              >
                                날짜를 추가해주세요.
                              </Text>
                              <Pressable
                                onPress={() => {
                                  setTempDateForWorker(new Date());
                                  setShowDatePickerForWorker(worker.id);
                                }}
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 8,
                                  borderWidth: 2,
                                  borderColor: colors.primary,
                                  backgroundColor: "#f0f9ff",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Ionicons
                                  name="add"
                                  size={20}
                                  color={colors.primary}
                                />
                              </Pressable>
                            </View>
                          )}
                        </View>

                        {/* 시간 설정 */}
                        {isUniformTime ? (
                          <View>
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "600",
                                color: "#374151",
                                marginBottom: 8,
                              }}
                            >
                              근무 시간 (선택된 모든 날짜에 동일하게 적용)
                            </Text>
                            <View style={styles.dateTimeRow}>
                              <View style={styles.dateCol}>
                                <DatePicker
                                  label="시작시간"
                                  value={`2000-01-01 ${
                                    picked?.startTime || "09:00"
                                  }`}
                                  onDateChange={(date) => {
                                    const time =
                                      typeof date === "string" &&
                                      date.includes(":")
                                        ? date
                                        : dayjs(date).format("HH:mm");
                                    updateWorkerUniformTimes(
                                      worker.id,
                                      "startTime",
                                      time
                                    );
                                    // 모든 enabled된 날짜의 시간도 함께 업데이트
                                    setWorkerAssignments((prev) => {
                                      const assignments = prev[worker.id] || [];
                                      const updated = assignments.map((a) =>
                                        a.enabled
                                          ? { ...a, startTime: time }
                                          : a
                                      );
                                      return { ...prev, [worker.id]: updated };
                                    });
                                  }}
                                  placeholder="시작시간"
                                  mode="time"
                                />
                              </View>
                              <View style={styles.dateCol}>
                                <DatePicker
                                  label="종료시간"
                                  value={`2000-01-01 ${
                                    picked?.endTime || "18:00"
                                  }`}
                                  onDateChange={(date) => {
                                    const time =
                                      typeof date === "string" &&
                                      date.includes(":")
                                        ? date
                                        : dayjs(date).format("HH:mm");
                                    updateWorkerUniformTimes(
                                      worker.id,
                                      "endTime",
                                      time
                                    );
                                    // 모든 enabled된 날짜의 시간도 함께 업데이트
                                    setWorkerAssignments((prev) => {
                                      const assignments = prev[worker.id] || [];
                                      const updated = assignments.map((a) =>
                                        a.enabled ? { ...a, endTime: time } : a
                                      );
                                      return { ...prev, [worker.id]: updated };
                                    });
                                  }}
                                  placeholder="종료시간"
                                  mode="time"
                                />
                              </View>
                            </View>
                          </View>
                        ) : (
                          <View>
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "600",
                                color: "#374151",
                                marginBottom: 8,
                              }}
                            >
                              일자별 근무 시간 설정
                            </Text>
                            {dailyAssignments.length > 0 &&
                            dailyAssignments.filter((a) => a.enabled).length >
                              0 ? (
                              dailyAssignments
                                .filter((a) => a.enabled)
                                .map((assignment) => (
                                  <View
                                    key={assignment.workDate}
                                    style={{
                                      marginBottom: 12,
                                      padding: 10,
                                      backgroundColor: "#fff",
                                      borderRadius: 6,
                                      borderWidth: 1,
                                      borderColor: "#e5e7eb",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 14,
                                        fontWeight: "600",
                                        color: "#374151",
                                        marginBottom: 8,
                                      }}
                                    >
                                      {dayjs(assignment.workDate).format(
                                        "MM월 DD일 (ddd)"
                                      )}
                                    </Text>
                                    <View style={styles.dateTimeRow}>
                                      <View style={styles.dateCol}>
                                        <DatePicker
                                          label="시작시간"
                                          value={`2000-01-01 ${assignment.startTime}`}
                                          onDateChange={(date) => {
                                            const time =
                                              typeof date === "string" &&
                                              date.includes(":")
                                                ? date
                                                : dayjs(date).format("HH:mm");
                                            updateWorkerDailyTime(
                                              worker.id,
                                              assignment.workDate,
                                              "startTime",
                                              time
                                            );
                                          }}
                                          placeholder="시작시간"
                                          mode="time"
                                        />
                                      </View>
                                      <View style={styles.dateCol}>
                                        <DatePicker
                                          label="종료시간"
                                          value={`2000-01-01 ${assignment.endTime}`}
                                          onDateChange={(date) => {
                                            const time =
                                              typeof date === "string" &&
                                              date.includes(":")
                                                ? date
                                                : dayjs(date).format("HH:mm");
                                            updateWorkerDailyTime(
                                              worker.id,
                                              assignment.workDate,
                                              "endTime",
                                              time
                                            );
                                          }}
                                          placeholder="종료시간"
                                          mode="time"
                                        />
                                      </View>
                                    </View>
                                  </View>
                                ))
                            ) : (
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: "#9ca3af",
                                  textAlign: "center",
                                  padding: 16,
                                  fontStyle: "italic",
                                }}
                              >
                                참여 날짜를 선택해주세요.
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {/* 신규 근로자 추가 폼 */}
            {showAddWorkerForm ? (
              <View
                style={{
                  padding: 12,
                  backgroundColor: "#f9fafb",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  marginTop: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 12,
                  }}
                >
                  신규 근로자 추가
                </Text>
                <View style={{ marginBottom: 8 }}>
                  <Text style={[styles.inputLabel, { marginBottom: 4 }]}>
                    이름 *
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="이름을 입력하세요"
                    value={newWorkerName}
                    onChangeText={setNewWorkerName}
                  />
                </View>
                <View style={{ marginBottom: 12 }}>
                  <Text style={[styles.inputLabel, { marginBottom: 4 }]}>
                    연락처 *
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="연락처를 입력하세요"
                    value={newWorkerPhone}
                    onChangeText={setNewWorkerPhone}
                    keyboardType="phone-pad"
                  />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  <Pressable
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: "#e5e7eb",
                      alignItems: "center",
                    }}
                    onPress={() => {
                      setShowAddWorkerForm(false);
                      setNewWorkerName("");
                      setNewWorkerPhone("");
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      취소
                    </Text>
                  </Pressable>
                  <Pressable
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: colors.primary,
                      alignItems: "center",
                    }}
                    onPress={async () => {
                      if (!newWorkerName.trim() || !newWorkerPhone.trim()) {
                        Alert.alert("오류", "이름과 연락처는 필수입니다.");
                        return;
                      }

                      try {
                        const db = getDatabase();
                        const currentUser = await getCurrentSupabaseUser();

                        if (!currentUser) {
                          Alert.alert("오류", "로그인이 필요합니다.");
                          return;
                        }

                        // 전화번호에서 숫자만 추출
                        const cleanPhone = newWorkerPhone.replace(
                          /[^0-9]/g,
                          ""
                        );

                        const newWorker: Worker = {
                          id: `worker_${Date.now()}`,
                          userId: currentUser.id,
                          name: newWorkerName.trim(),
                          phone: cleanPhone,
                          hourlyWage: 0, // 기본값
                          fuelAllowance: 0,
                          otherAllowance: 0,
                        };

                        await db.createWorker(newWorker);
                        await loadWorkers();

                        // 폼 초기화 및 닫기
                        setShowAddWorkerForm(false);
                        setNewWorkerName("");
                        setNewWorkerPhone("");

                        Alert.alert("성공", "근로자가 추가되었습니다.");
                      } catch (error) {
                        console.error("Failed to add worker:", error);
                        Alert.alert("오류", "근로자 추가에 실패했습니다.");
                      }
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "white",
                      }}
                    >
                      추가
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowAddWorkerForm(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  borderTopWidth: 1,
                  borderTopColor: "#f3f4f6",
                  marginTop: 8,
                }}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: colors.primary,
                  }}
                >
                  신규 근로자 추가
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>

        {pickedWorkers.length > 0 && (
          <View style={[styles.inputGroup, { marginTop: 16 }]}>
            <Text style={styles.inputLabel}>
              선택된 근로자 ({pickedWorkers.length}명)
            </Text>
            {pickedWorkers.map((pw) => {
              const worker = allWorkers.find((w) => w.id === pw.workerId);
              if (!worker) return null;
              return (
                <View
                  key={pw.workerId}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 12,
                    backgroundColor: "#f9fafb",
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "500" }}>
                    {worker.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>
                    {pw.hourlyWage?.toLocaleString() || 0}원/시간
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* 날짜 추가 DatePicker (바로 표시) */}
        {showDatePickerForWorker && Platform.OS === "android" && (
          <DateTimePicker
            value={tempDateForWorker}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              if (
                event.type === "set" &&
                selectedDate &&
                showDatePickerForWorker
              ) {
                const selectedDateStr =
                  dayjs(selectedDate).format("YYYY-MM-DD");
                addWorkerDate(showDatePickerForWorker, selectedDateStr);
              }
              setShowDatePickerForWorker(null);
            }}
          />
        )}
        {showDatePickerForWorker && Platform.OS === "ios" && (
          <Modal
            visible={!!showDatePickerForWorker}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDatePickerForWorker(null)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "flex-end",
              }}
            >
              <Pressable
                style={{ flex: 1 }}
                onPress={() => setShowDatePickerForWorker(null)}
              />
              <View
                style={{
                  backgroundColor: "white",
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  paddingTop: 20,
                  paddingBottom: Platform.OS === "ios" ? 40 : 20,
                  paddingHorizontal: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <Pressable
                    onPress={() => setShowDatePickerForWorker(null)}
                    style={{ padding: 4 }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#666",
                      }}
                    >
                      취소
                    </Text>
                  </Pressable>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    날짜 선택
                  </Text>
                  <Pressable
                    onPress={() => {
                      if (showDatePickerForWorker) {
                        const selectedDateStr =
                          dayjs(tempDateForWorker).format("YYYY-MM-DD");
                        addWorkerDate(showDatePickerForWorker, selectedDateStr);
                      }
                    }}
                    style={{ padding: 4 }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: colors.primary,
                      }}
                    >
                      완료
                    </Text>
                  </Pressable>
                </View>
                <View style={{ alignItems: "center", paddingVertical: 20 }}>
                  <DateTimePicker
                    value={tempDateForWorker}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setTempDateForWorker(selectedDate);
                      }
                    }}
                    textColor="#000000"
                    style={{ width: "100%", height: 216 }}
                    themeVariant="light"
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  };

  // 첨부파일 스텝
  const renderDocumentsStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>첨부파일</Text>
        <FileUpload
          onFileSelect={(file) => {
            setFormData({
              ...formData,
              documentsFolderPath: file.name,
              hasAttachments: true,
            });
          }}
          acceptedTypes={["pdf", "doc", "docx", "jpg", "png"]}
          maxFiles={5}
          documentType="schedule"
        />
      </View>
    </View>
  );

  // 최종 확인 스텝
  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>기본 정보</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>스케줄 타입</Text>
          <Text style={styles.reviewValue}>
            {formData.scheduleType === "personal"
              ? "개인 스케줄"
              : "업무 스케줄"}
          </Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>일정명</Text>
          <Text style={styles.reviewValue}>{formData.title}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>카테고리</Text>
          <Text style={styles.reviewValue}>{formData.category}</Text>
        </View>
        {formData.description && (
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>설명</Text>
            <Text style={styles.reviewValue}>{formData.description}</Text>
          </View>
        )}
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewTitle}>날짜 및 시간</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>기간</Text>
          <Text style={styles.reviewValue}>
            {dayjs(formData.startDate).format("YYYY.MM.DD")} ~{" "}
            {dayjs(formData.endDate).format("YYYY.MM.DD")}
          </Text>
        </View>
        {!formData.allDay && (
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>시간</Text>
            <Text style={styles.reviewValue}>
              {formData.startTime} ~ {formData.endTime}
            </Text>
          </View>
        )}
      </View>

      {formData.scheduleType === "business" && (
        <>
          <View style={styles.reviewSection}>
            <Text style={styles.reviewTitle}>계약 정보</Text>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>계약금액</Text>
              <Text style={styles.reviewValue}>
                {formData.contractAmount?.toLocaleString()}원
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>계약 유형</Text>
              <Text style={styles.reviewValue}>
                {formData.contractType === "written"
                  ? "서면"
                  : formData.contractType === "verbal"
                  ? "구두"
                  : "텍스트"}
              </Text>
            </View>
          </View>

          {pickedWorkers.length > 0 && (
            <View style={styles.reviewSection}>
              <Text style={styles.reviewTitle}>근로자 배치</Text>
              {pickedWorkers.map((pw) => {
                const worker = allWorkers.find((w) => w.id === pw.workerId);
                if (!worker) return null;
                const isUniformTime = workerUniformTime[pw.workerId] ?? true;
                const dailyAssignments = workerAssignments[pw.workerId] || [];

                return (
                  <View
                    key={pw.workerId}
                    style={{
                      marginBottom: 16,
                      padding: 12,
                      backgroundColor: "#f9fafb",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                    }}
                  >
                    <View style={styles.reviewItem}>
                      <Text style={styles.reviewLabel}>이름</Text>
                      <Text style={styles.reviewValue}>{worker.name}</Text>
                    </View>
                    <View style={styles.reviewItem}>
                      <Text style={styles.reviewLabel}>시급</Text>
                      <Text style={styles.reviewValue}>
                        {pw.hourlyWage?.toLocaleString() || 0}원/시간
                      </Text>
                    </View>
                    <View style={styles.reviewItem}>
                      <Text style={styles.reviewLabel}>시간 설정</Text>
                      <Text style={styles.reviewValue}>
                        {isUniformTime ? "동일 시간" : "일별 시간"}
                      </Text>
                    </View>
                    {isUniformTime ? (
                      <View style={styles.reviewItem}>
                        <Text style={styles.reviewLabel}>근무 시간</Text>
                        <Text style={styles.reviewValue}>
                          {pw.startTime || formData.startTime} ~{" "}
                          {pw.endTime || formData.endTime}
                        </Text>
                      </View>
                    ) : (
                      dailyAssignments.filter((a) => a.enabled).length > 0 && (
                        <View style={{ marginTop: 8 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#6b7280",
                              marginBottom: 8,
                            }}
                          >
                            일별 근무 시간:
                          </Text>
                          {dailyAssignments
                            .filter((a) => a.enabled)
                            .map((a) => (
                              <View
                                key={a.workDate}
                                style={{
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  marginBottom: 4,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: "#6b7280",
                                  }}
                                >
                                  {dayjs(a.workDate).format("MM/DD")}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: "#374151",
                                  }}
                                >
                                  {a.startTime} ~ {a.endTime}
                                </Text>
                              </View>
                            ))}
                        </View>
                      )
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View
          style={[
            styles.modalOverlay,
            modalType === "bottomSheet"
              ? styles.modalOverlayBottom
              : styles.modalOverlayCenter,
          ]}
        >
          <View
            style={[
              styles.modalContent,
              modalType === "bottomSheet"
                ? styles.modalContentBottom
                : styles.modalContentCenter,
            ]}
          >
            {/* 헤더 */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                {currentStep > STEPS.BASIC_INFO && (
                  <Pressable
                    onPress={goToPreviousStep}
                    style={styles.backButton}
                  >
                    <Ionicons name="chevron-back" size={24} color="#666" />
                  </Pressable>
                )}
                <View>
                  <Text style={styles.headerTitle}>
                    {getStepTitle(currentStep)}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    {currentStep} / {Object.keys(STEPS).length} 단계
                  </Text>
                </View>
              </View>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            {/* 진행률 바 */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${getStepProgress()}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              {lastAutoSave && (
                <Text style={styles.autoSaveText}>
                  자동저장: {lastAutoSave}
                </Text>
              )}
            </View>

            {/* 스텝 내용 */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={true}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderStepContent()}
            </ScrollView>

            {/* 하단 버튼 */}
            <View style={styles.footer}>
              {currentStep < STEPS.REVIEW ? (
                <Pressable
                  style={[
                    styles.nextButton,
                    {
                      backgroundColor: validateStep(currentStep)
                        ? colors.primary
                        : "#cbd5e1",
                    },
                  ]}
                  onPress={goToNextStep}
                  disabled={!validateStep(currentStep)}
                >
                  <Text
                    style={[
                      styles.nextButtonText,
                      { color: validateStep(currentStep) ? "white" : "#666" },
                    ]}
                  >
                    다음
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={validateStep(currentStep) ? "white" : "#666"}
                  />
                </Pressable>
              ) : (
                <Pressable
                  style={[
                    styles.saveButton,
                    { backgroundColor: isSaving ? "#cbd5e1" : colors.primary },
                  ]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  <Text style={styles.saveButtonText}>
                    {isSaving ? "저장 중..." : "일정 저장"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
        {/* 거래처 선택 모달 */}
        <Modal
          visible={showClientSelector}
          transparent
          animationType="fade"
          onRequestClose={() => setShowClientSelector(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.35)",
              justifyContent: "center",
              padding: 20,
            }}
            onPress={() => setShowClientSelector(false)}
          >
            <Pressable
              style={{
                backgroundColor: "white",
                borderRadius: 12,
                padding: 12,
                maxHeight: "70%",
              }}
              onPress={(e) => e.stopPropagation()}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                거래처 선택
              </Text>
              <TextInput
                style={[styles.textInput, { marginBottom: 8 }]}
                placeholder="거래처 검색"
                value={clientSearchQuery}
                onChangeText={setClientSearchQuery}
              />
              <ScrollView style={{ maxHeight: 400 }}>
                {clients
                  .filter((c) =>
                    clientSearchQuery
                      ? c.name
                          .toLowerCase()
                          .includes(clientSearchQuery.toLowerCase())
                      : true
                  )
                  .map((client) => (
                    <Pressable
                      key={client.id}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: "#f3f4f6",
                      }}
                      onPress={() => {
                        setFormData((prev) => ({
                          ...prev,
                          clientId: client.id,
                        }));
                        setShowClientSelector(false);
                      }}
                    >
                      <Text style={{ fontSize: 16, color: "#111827" }}>
                        {client.name}
                      </Text>
                    </Pressable>
                  ))}

                {/* 신규 거래처 추가 폼 */}
                {showAddClientForm ? (
                  <View
                    style={{
                      padding: 12,
                      backgroundColor: "#f9fafb",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      marginTop: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#374151",
                        marginBottom: 12,
                      }}
                    >
                      신규 거래처 추가
                    </Text>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={[styles.inputLabel, { marginBottom: 4 }]}>
                        거래처명 *
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="거래처명을 입력하세요"
                        value={newClientName}
                        onChangeText={setNewClientName}
                      />
                    </View>
                    <View style={{ marginBottom: 12 }}>
                      <Text style={[styles.inputLabel, { marginBottom: 4 }]}>
                        연락처 *
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="연락처를 입력하세요"
                        value={newClientPhone}
                        onChangeText={setNewClientPhone}
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 8,
                      }}
                    >
                      <Pressable
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 8,
                          backgroundColor: "#e5e7eb",
                          alignItems: "center",
                        }}
                        onPress={() => {
                          setShowAddClientForm(false);
                          setNewClientName("");
                          setNewClientPhone("");
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: "#374151",
                          }}
                        >
                          취소
                        </Text>
                      </Pressable>
                      <Pressable
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 8,
                          backgroundColor: colors.primary,
                          alignItems: "center",
                        }}
                        onPress={async () => {
                          if (!newClientName.trim() || !newClientPhone.trim()) {
                            Alert.alert(
                              "오류",
                              "거래처명과 연락처는 필수입니다."
                            );
                            return;
                          }

                          try {
                            const db = getDatabase();
                            const currentUser = await getCurrentSupabaseUser();

                            if (!currentUser) {
                              Alert.alert("오류", "로그인이 필요합니다.");
                              return;
                            }

                            const newClient: Client = {
                              id: `client_${Date.now()}`,
                              userId: currentUser.id,
                              name: newClientName.trim(),
                              phone: newClientPhone.trim(),
                            };

                            await db.createClient(newClient);
                            await loadClients();

                            // 새로 추가된 거래처를 자동으로 선택
                            setFormData((prev) => ({
                              ...prev,
                              clientId: newClient.id,
                            }));

                            // 폼 초기화 및 닫기
                            setShowAddClientForm(false);
                            setNewClientName("");
                            setNewClientPhone("");
                            setShowClientSelector(false);

                            Alert.alert("성공", "거래처가 추가되었습니다.");
                          } catch (error) {
                            console.error("Failed to add client:", error);
                            Alert.alert("오류", "거래처 추가에 실패했습니다.");
                          }
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: "white",
                          }}
                        >
                          추가
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setShowAddClientForm(true)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                      borderTopWidth: 1,
                      borderTopColor: "#f3f4f6",
                      marginTop: 8,
                    }}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "500",
                        color: colors.primary,
                      }}
                    >
                      신규 거래처 추가
                    </Text>
                  </Pressable>
                )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalOverlayCenter: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalOverlayBottom: {
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 0,
  },
  modalContent: {
    backgroundColor: "white",
    width: "100%",
    overflow: "hidden",
  },
  modalContentCenter: {
    borderRadius: 16,
    maxWidth: 520,
    maxHeight: "90%",
    height: Platform.OS === "web" ? "auto" : "85%",
  },
  modalContentBottom: {
    borderRadius: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxWidth: "100%",
    height: "85%",
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f9fafb",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  autoSaveText: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 80,
  },
  stepContent: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  addCategoryButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  addCategoryForm: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  categoryNameInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: "white",
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dateCol: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  toggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    padding: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  addressRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  addressInput: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  addressSearchButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  clientSelector: {
    marginBottom: 16,
  },
  clientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
  },
  clientButtonText: {
    fontSize: 16,
    color: "#374151",
  },
  contractTypeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  contractTypeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
  },
  contractTypeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  reviewSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  reviewValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  scheduleTypeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  scheduleTypeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    minHeight: 100,
  },
  scheduleTypeText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  scheduleTypeSubtext: {
    fontSize: 12,
    textAlign: "center",
  },
  skipStepContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  skipStepTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  skipStepSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 8,
  },
  skipStepDescription: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },
  addressSearchModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  addressSearchModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "80%",
    maxHeight: 600,
    overflow: "hidden",
  },
  addressSearchModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  addressSearchModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  addressSearchModalCloseButton: {
    padding: 4,
  },
  addressSearchWebContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  workerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderColor: "#e5e7eb",
    borderWidth: 1,
    marginBottom: 8,
  },
  workerName: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },
  workerSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  wageInput: {
    width: 110,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
    textAlign: "right",
    fontSize: 14,
  },
});
