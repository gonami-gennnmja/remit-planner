import DatePicker from "@/components/DatePicker";
import { FileUpload } from "@/components/FileUpload";
import { Text } from "@/components/Themed";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import { useResponsive } from "@/hooks/useResponsive";
import { Client, Schedule, ScheduleCategory } from "@/models/types";
import { createScheduleActivity } from "@/utils/activityUtils";
import { getCurrentSupabaseUser } from "@/utils/supabaseAuth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
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
import { WebView } from "react-native-webview";
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
}

// 스텝 정의
const STEPS = {
  BASIC_INFO: 1,
  DATE_TIME: 2,
  LOCATION: 3,
  CONTRACT: 4,
  DOCUMENTS: 5,
  REVIEW: 6,
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
}: MultiStepScheduleModalProps) {
  const { screenData, isMobile, isTablet, isDesktop, getResponsiveValue } =
    useResponsive();
  const { colors } = useTheme();

  // 현재 스텝 상태
  const [currentStep, setCurrentStep] = useState<Step>(STEPS.BASIC_INFO);

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
    clientId: undefined,
    contractAmount: 0,
    contractType: "written",
    contractContent: "",
  });

  // 임시저장 상태
  const [draftData, setDraftData] = useState<DraftSchedule | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);

  // 카테고리 및 클라이언트 데이터
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [clients, setClients] = useState<Client[]>([]);

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
  // iOS 초기 진입 시 1 -> 2단계 레이아웃 재계산을 위한 키
  const [dateStepKey, setDateStepKey] = useState(0);

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
      const nextStep = (currentStep + 1) as Step;
      setCurrentStep(nextStep);
      saveDraft(nextStep);
    }
  };

  // 이전 스텝으로 이동
  const goToPreviousStep = () => {
    if (currentStep > STEPS.BASIC_INFO) {
      const prevStep = (currentStep - 1) as Step;
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
        clientId: undefined,
        contractAmount: 0,
        contractType: "written",
        contractContent: "",
      });
      setCurrentStep(STEPS.BASIC_INFO);
      loadDraft();
      loadCategories();
      loadClients();
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
      setClients(clientList);
    } catch (error) {
      console.error("❌ Failed to load clients:", error);
    }
  };

  // 최종 저장
  const handleSave = async () => {
    try {
      const db = getDatabase();
      const currentUser = await getCurrentSupabaseUser();

      if (!currentUser) {
        Alert.alert("오류", "로그인이 필요합니다.");
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
            onSave();
            onClose();
          },
        },
      ]);
    } catch (error) {
      console.error("Failed to create schedule:", error);
      Alert.alert("오류", "일정 추가에 실패했습니다.");
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
              if (dayjs(date).isAfter(dayjs(formData.endDate))) {
                setFormData({ ...formData, startDate: date, endDate: date });
              } else {
                setFormData({ ...formData, startDate: date });
              }
              if (!formData.allDay && !formData.uniformTime) {
                ensureScheduleTimesForRange(date, formData.endDate);
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
              setFormData({ ...formData, endDate: date });
              if (!formData.allDay && !formData.uniformTime) {
                ensureScheduleTimesForRange(formData.startDate, date);
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
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>매일 시간 동일</Text>
            <Pressable
              onPress={() => {
                const next = !formData.uniformTime;
                setFormData({ ...formData, uniformTime: next });
                if (!next && formData.startDate !== formData.endDate) {
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

          {formData.uniformTime ? (
            <View style={styles.dateTimeRow}>
              <View style={styles.dateCol}>
                <DatePicker
                  label="시작시간"
                  value={`2000-01-01 ${formData.startTime}`}
                  onDateChange={(date) => {
                    setTimeout(() => {
                      const selectedStartTime = dayjs(date).format("HH:mm");
                      setFormData((prev) => ({
                        ...prev,
                        startTime: selectedStartTime,
                      }));
                    }, 0);
                  }}
                  placeholder="시작시간 선택"
                  mode="time"
                />
              </View>
              <View style={styles.dateCol}>
                <DatePicker
                  label="종료시간"
                  value={`2000-01-02 ${formData.endTime}`}
                  onDateChange={(date) => {
                    setTimeout(() => {
                      const selectedEndTime = dayjs(date).format("HH:mm");
                      setFormData((prev) => ({
                        ...prev,
                        endTime: selectedEndTime,
                      }));
                    }, 0);
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
                          value={`2000-01-01 ${t.startTime}`}
                          onDateChange={(date) => {
                            setTimeout(() => {
                              updateScheduleTime(
                                t.workDate,
                                "startTime",
                                dayjs(date).format("HH:mm")
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
                          value={`2000-01-01 ${t.endTime}`}
                          onDateChange={(date) => {
                            setTimeout(() => {
                              updateScheduleTime(
                                t.workDate,
                                "endTime",
                                dayjs(date).format("HH:mm")
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
        <Text style={styles.inputLabel}>위치명</Text>
        <TextInput
          style={styles.textInput}
          placeholder="위치명을 입력해주세요 (예: 화성교육청)"
          value={formData.location}
          onChangeText={(text) => setFormData({ ...formData, location: text })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>주소</Text>
        <View style={styles.addressRow}>
          <TextInput
            style={[styles.textInput, styles.addressInput]}
            placeholder="주소를 입력하거나 검색해주세요"
            value={formData.address}
            onChangeText={(text) => setFormData({ ...formData, address: text })}
          />
          <Pressable
            style={[
              styles.addressSearchButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => setShowAddressSearch(true)}
          >
            <Ionicons name="search" size={20} color="white" />
          </Pressable>
        </View>

        {/* 주소 검색 WebView (모바일) */}
        {showAddressSearch && Platform.OS !== "web" && (
          <View
            style={{
              marginTop: 12,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: "#f9fafb",
                borderBottomWidth: 1,
                borderBottomColor: "#e5e7eb",
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}
              >
                주소 검색
              </Text>
              <Pressable onPress={() => setShowAddressSearch(false)}>
                <Ionicons name="close" size={20} color="#666" />
              </Pressable>
            </View>
            <WebView
              source={{
                html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; overflow: hidden; }
    #wrap { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="wrap"></div>
  <script src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
  <script>
    (function() {
      var searchQuery = "${(formData.address || "")
        .replace(/"/g, '\\"')
        .replace(/\n/g, " ")
        .trim()}";
      new daum.Postcode({
        oncomplete: function(data) {
          var addr = data.roadAddress || data.jibunAddress;
          if (data.buildingName) { addr += ' (' + data.buildingName + ')'; }
          if (window.ReactNativeWebView) {
            var message = JSON.stringify({ address: addr });
            window.ReactNativeWebView.postMessage(message);
          }
        },
        width: '100%',
        height: '100%'
      }).embed(document.getElementById('wrap'), { q: searchQuery, autoClose: true });
    })();
  </script>
</body>
</html>
                `,
              }}
              style={{ width: "100%", height: 480 }}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.address) {
                    setFormData((prev) => ({ ...prev, address: data.address }));
                    setShowAddressSearch(false);
                  }
                } catch {}
              }}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
              scalesPageToFit={false}
              scrollEnabled
              nestedScrollEnabled
            />
          </View>
        )}
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
          <Text style={styles.inputLabel}>계약금액 *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="계약금액을 입력하세요"
            value={formData.contractAmount?.toString() || ""}
            onChangeText={(text) => {
              const amount = parseInt(text.replace(/[^0-9]/g, "")) || 0;
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
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>일정 저장</Text>
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
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
});
