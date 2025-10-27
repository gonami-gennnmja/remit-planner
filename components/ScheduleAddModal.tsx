import DatePicker from "@/components/DatePicker";
import FileUpload from "@/components/FileUpload";
import { Text } from "@/components/Themed";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import { useResponsive } from "@/hooks/useResponsive";
import { Schedule, ScheduleCategory, ScheduleTime } from "@/models/types";
import { createScheduleActivity } from "@/utils/activityUtils";
import { getCurrentSupabaseUser } from "@/utils/supabaseAuth";
import { Ionicons } from "@expo/vector-icons";
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

interface ScheduleAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  initialStartDate?: string;
  initialEndDate?: string;
  initialIsMultiDay?: boolean;
  modalType?: "bottomSheet" | "centerPopup"; // 모달 형태 선택
}

// 웹용 색상 선택 컴포넌트 (react-color)
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

// 앱용 색상 선택 컴포넌트 (react-native-color-wheel 사용)
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

  // 색상이 변경될 때마다 로그 출력
  React.useEffect(() => {
    console.log("📍 선택된 색상:", selectedColor);
  }, [selectedColor]);

  // HSV를 HEX로 변환하는 함수
  const hsvToHex = (hsv: any): string => {
    if (typeof hsv === "string") return hsv;
    if (!hsv || typeof hsv !== "object") return selectedColor;

    let { h, s, v } = hsv;

    // 음수 각도를 0-360 범위로 정규화
    while (h < 0) {
      h += 360;
    }
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

    const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    console.log("🎨 HSV → HEX 변환:", hsv, "→", hexColor);
    return hexColor;
  };

  const wheelSize = Math.min(screenWidth - 120, 240);

  // 색상의 밝기를 계산하여 텍스트 색상 결정
  const getTextColor = (hexColor: string): string => {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const textColor = brightness > 128 ? "#000" : "#fff";
    console.log(
      "💡 밝기 계산:",
      hexColor,
      "→ brightness:",
      brightness,
      "→ textColor:",
      textColor
    );
    return textColor;
  };

  return (
    <View style={{ marginBottom: 8 }}>
      {/* 색상환 - 터치 이벤트가 부모로 전파되지 않도록 View로 감싸기 */}
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

      {/* 색상 선택 버튼 */}
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
          console.log("🔘 버튼 클릭 - 전송할 색상:", selectedColor);
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
          이 색상 선택
        </Text>
      </Pressable>
    </View>
  );
}

export default function ScheduleAddModal({
  visible,
  onClose,
  onSave,
  initialStartDate,
  initialEndDate,
  initialIsMultiDay = false,
  modalType = "centerPopup", // 기본값: 중앙 팝업
}: ScheduleAddModalProps) {
  const { screenData, isMobile, isTablet, isDesktop, getResponsiveValue } =
    useResponsive();
  const { colors } = useTheme();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: initialStartDate || dayjs().format("YYYY-MM-DD"),
    endDate: initialEndDate || dayjs().format("YYYY-MM-DD"),
    startTime: "09:00",
    endTime: "18:00",
    allDay: false, // 하루 종일 여부
    category: "" as ScheduleCategory,
    location: "",
    address: "",
    uniformTime: true, // 일정 시간이 동일한지 여부
    scheduleTimes: [] as Array<{
      workDate: string;
      startTime: string;
      endTime: string;
    }>,
    documentsFolderPath: "",
    hasAttachments: false,
    memo: "",
  });
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [showAddressSearch, setShowAddressSearch] = useState(false);

  // 카테고리 추가 UI 상태
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#8b5cf6");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>([]); // 커스텀 색상 목록
  const [previewColor, setPreviewColor] = useState("#8b5cf6"); // 색상 미리보기용
  const [showAllCategories, setShowAllCategories] = useState(false);

  // ScrollView ref
  const scrollViewRef = React.useRef<ScrollView>(null);
  const categoryViewRef = React.useRef<View>(null);

  // 카테고리 추가 폼이 열릴 때 자동으로 스크롤
  useEffect(() => {
    if (
      showAddCategoryForm &&
      categoryViewRef.current &&
      scrollViewRef.current
    ) {
      setTimeout(() => {
        categoryViewRef.current?.measure(
          (x, y, width, height, pageX, pageY) => {
            // 카테고리 이름 입력 칸이 모달 상단에 오도록 충분히 스크롤
            scrollViewRef.current?.scrollTo({ y: pageY - 50, animated: true });
          }
        );
      }, 150);
    }
  }, [showAddCategoryForm]);

  // 주소 검색이 열릴 때 자동으로 스크롤
  useEffect(() => {
    if (showAddressSearch && scrollViewRef.current) {
      setTimeout(() => {
        // 장소 섹션으로 스크롤 (주소 입력창이 상단에 보이도록)
        scrollViewRef.current?.scrollTo({ y: 580, animated: true });
      }, 100);
    }
  }, [showAddressSearch]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (visible) {
      // 모달이 열릴 때 초기값 설정
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
      });
      // 모달이 열릴 때마다 카테고리 다시 로드
      loadCategories();
    }
  }, [visible, initialStartDate, initialEndDate, initialIsMultiDay]);

  // 일별 시간 설정이 변경될 때 scheduleTimes 업데이트
  useEffect(() => {
    const isMultiDay = formData.startDate !== formData.endDate;
    if (isMultiDay && !formData.uniformTime) {
      const times = generateScheduleTimes();
      setFormData((prev) => ({
        ...prev,
        scheduleTimes: times,
      }));
    }
  }, [formData.uniformTime, formData.startDate, formData.endDate]);

  const loadCategories = async () => {
    try {
      const db = getDatabase();
      const cats = await db.getAllCategories();
      setCategories(cats);
      if (cats.length === 0) {
        console.warn(
          "⚠️ 카테고리가 비어있습니다! DB에 카테고리를 추가해주세요."
        );
      }
    } catch (error) {
      console.error("❌ Failed to load categories:", error);
    }
  };

  // 일별 시간 설정 함수들
  const generateScheduleTimes = () => {
    const isMultiDay = formData.startDate !== formData.endDate;
    if (!isMultiDay || formData.uniformTime) return [];

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const times = [];

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const workDate = d.toISOString().split("T")[0];
      times.push({
        workDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
      });
    }

    return times;
  };

  const updateScheduleTime = (
    workDate: string,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setFormData((prev) => {
      const updatedTimes = prev.scheduleTimes.map((time) => {
        if (time.workDate === workDate) {
          return { ...time, [field]: value };
        }
        return time;
      });
      return {
        ...prev,
        scheduleTimes: updatedTimes,
      };
    });
  };

  const addScheduleTime = (workDate: string) => {
    setFormData((prev) => ({
      ...prev,
      scheduleTimes: [
        ...prev.scheduleTimes,
        {
          workDate,
          startTime: "09:00",
          endTime: "18:00",
        },
      ],
    }));
  };

  const removeScheduleTime = (workDate: string) => {
    setFormData((prev) => ({
      ...prev,
      scheduleTimes: prev.scheduleTimes.filter(
        (time) => time.workDate !== workDate
      ),
    }));
  };

  // 카테고리 추가 폼 토글
  const handleAddCategory = () => {
    setShowAddCategoryForm(!showAddCategoryForm);
    if (!showAddCategoryForm) {
      setNewCategoryName("");
      setNewCategoryColor("#8b5cf6");
    }
  };

  // 카테고리 생성
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("오류", "카테고리 이름을 입력해주세요.");
      return;
    }

    try {
      const db = getDatabase();

      const newCategory = {
        id: `cat-${Date.now()}`,
        name: newCategoryName.trim(),
        color: newCategoryColor,
      };

      await db.createCategory(newCategory);

      // 폼 닫기 및 초기화
      setShowAddCategoryForm(false);
      setNewCategoryName("");
      setNewCategoryColor("#8b5cf6");

      // 카테고리 목록 새로고침
      await loadCategories();

      Alert.alert("성공", `"${newCategoryName}" 카테고리가 추가되었습니다.`);
    } catch (error: any) {
      console.error("Failed to create category:", error);
      if (
        error.message?.includes("duplicate") ||
        error.message?.includes("unique")
      ) {
        Alert.alert("오류", "이미 존재하는 카테고리 이름입니다.");
      } else {
        Alert.alert("오류", "카테고리 추가에 실패했습니다.");
      }
    }
  };

  // 카테고리 추가 취소
  const handleCancelAddCategory = () => {
    setShowAddCategoryForm(false);
    setNewCategoryName("");
    setNewCategoryColor("#8b5cf6");
    setPreviewColor("#8b5cf6");
    setShowColorPicker(false);
  };

  // 모달이 닫힐 때 모든 상태 초기화
  const resetCategoryForm = () => {
    setShowAddCategoryForm(false);
    setNewCategoryName("");
    setNewCategoryColor("#8b5cf6");
    setPreviewColor("#8b5cf6");
    setShowColorPicker(false);
  };

  const resetAddressSearch = () => {
    setShowAddressSearch(false);
  };

  // 주소 검색 핸들러
  const handleAddressSelect = (address: string) => {
    setFormData({ ...formData, address });
    setShowAddressSearch(false);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert("오류", "일정명을 입력해주세요.");
      return;
    }

    if (!formData.startDate) {
      Alert.alert("오류", "시작일을 선택해주세요.");
      return;
    }

    if (!formData.endDate) {
      Alert.alert("오류", "종료일을 선택해주세요.");
      return;
    }

    // 종료일이 시작일보다 빠른지 확인
    if (dayjs(formData.endDate).isBefore(dayjs(formData.startDate))) {
      Alert.alert("오류", "종료일은 시작일보다 늦어야 합니다.");
      return;
    }

    const isMultiDay = formData.startDate !== formData.endDate;

    // 시간 유효성 검사 - onDateChange에서 이미 자동 조정하므로 제거

    try {
      const db = getDatabase();
      const currentUser = await getCurrentSupabaseUser();

      if (!currentUser) {
        Alert.alert("오류", "로그인이 필요합니다.");
        return;
      }

      const isMultiDay = formData.startDate !== formData.endDate;

      const newSchedule: Schedule = {
        id: `schedule-${Date.now()}`,
        userId: currentUser.id,
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: isMultiDay ? formData.endDate : formData.startDate,
        category: formData.category,
        location: formData.location,
        address: formData.address,
        uniformTime: formData.uniformTime,
        documentsFolderPath: formData.documentsFolderPath,
        hasAttachments: formData.hasAttachments,
        allWagesPaid: false,
        revenueStatus: "pending",
        memo: formData.memo,
        workers: [],
      };

      const scheduleId = await db.createSchedule(newSchedule);

      // schedule_times 테이블에 시간 정보 저장
      if (!formData.allDay) {
        // 일별 시간이 다른 경우
        if (!formData.uniformTime && formData.scheduleTimes.length > 0) {
          for (const timeEntry of formData.scheduleTimes) {
            const [startHour, startMin] = timeEntry.startTime
              .split(":")
              .map(Number);
            const [endHour, endMin] = timeEntry.endTime.split(":").map(Number);
            const isOvernight =
              startHour * 60 + startMin > endHour * 60 + endMin;

            if (isOvernight) {
              // 밤샘 일정: 첫날 22:00~23:59, 다음날 00:00~01:00으로 분리 저장
              const workDateObj = new Date(timeEntry.workDate);

              // 첫날 저장
              const firstDayData: ScheduleTime = {
                id: `schedule-time-${Date.now()}-${timeEntry.workDate}-1`,
                scheduleId,
                workDate: timeEntry.workDate,
                startTime: timeEntry.startTime,
                endTime: "23:59",
                breakDuration: 0,
              };
              await db.createScheduleTime(firstDayData);

              // 다음날 저장
              const nextDay = new Date(workDateObj);
              nextDay.setDate(nextDay.getDate() + 1);
              const nextDayStr = nextDay.toISOString().split("T")[0];

              const nextDayData: ScheduleTime = {
                id: `schedule-time-${Date.now()}-${nextDayStr}-2`,
                scheduleId,
                workDate: nextDayStr,
                startTime: "00:00",
                endTime: timeEntry.endTime,
                breakDuration: 0,
              };
              await db.createScheduleTime(nextDayData);
            } else {
              // 일반 일정: 그대로 저장
              const scheduleTimeData: ScheduleTime = {
                id: `schedule-time-${Date.now()}-${timeEntry.workDate}`,
                scheduleId,
                workDate: timeEntry.workDate,
                startTime: timeEntry.startTime,
                endTime: timeEntry.endTime,
                breakDuration: 0,
              };
              await db.createScheduleTime(scheduleTimeData);
            }
          }
        } else {
          // 일별 시간이 동일한 경우
          const startDate = new Date(formData.startDate);
          const endDate = new Date(formData.endDate);
          const [startHour, startMin] = formData.startTime
            .split(":")
            .map(Number);
          const [endHour, endMin] = formData.endTime.split(":").map(Number);
          const isOvernight = startHour * 60 + startMin > endHour * 60 + endMin;

          for (
            let d = new Date(startDate);
            d <= endDate;
            d.setDate(d.getDate() + 1)
          ) {
            const workDate = d.toISOString().split("T")[0];

            if (isOvernight) {
              // 첫날이면 22:00~23:59, 마지막날이면 00:00~01:00
              const isFirstDay =
                d.toISOString().split("T")[0] === formData.startDate;
              const isLastDay =
                d.toISOString().split("T")[0] ===
                endDate.toISOString().split("T")[0];

              if (isFirstDay) {
                // 첫날: 22:00 ~ 23:59
                const scheduleTimeData: ScheduleTime = {
                  id: `schedule-time-${Date.now()}-${workDate}-1`,
                  scheduleId,
                  workDate,
                  startTime: formData.startTime,
                  endTime: "23:59",
                  breakDuration: 0,
                };
                await db.createScheduleTime(scheduleTimeData);
              } else if (isLastDay) {
                // 마지막날: 00:00 ~ 01:00
                const scheduleTimeData: ScheduleTime = {
                  id: `schedule-time-${Date.now()}-${workDate}-2`,
                  scheduleId,
                  workDate,
                  startTime: "00:00",
                  endTime: formData.endTime,
                  breakDuration: 0,
                };
                await db.createScheduleTime(scheduleTimeData);
              }
            } else {
              // 일반 일정: 그대로 저장
              const scheduleTimeData: ScheduleTime = {
                id: `schedule-time-${Date.now()}-${workDate}`,
                scheduleId,
                workDate,
                startTime: formData.startTime,
                endTime: formData.endTime,
                breakDuration: 0,
              };
              await db.createScheduleTime(scheduleTimeData);
            }
          }
        }
      } else {
        // 하루 종일인 경우: 각 날짜에 00:00 ~ 23:59로 저장
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);

        for (
          let d = new Date(startDate);
          d <= endDate;
          d.setDate(d.getDate() + 1)
        ) {
          const workDate = d.toISOString().split("T")[0];

          const scheduleTimeData: ScheduleTime = {
            id: `schedule-time-${Date.now()}-${workDate}`,
            scheduleId,
            workDate,
            startTime: "00:00",
            endTime: "23:59",
            breakDuration: 0,
          };

          await db.createScheduleTime(scheduleTimeData);
        }
      }

      // 활동 생성
      await createScheduleActivity(
        newSchedule.id,
        newSchedule.title,
        newSchedule.description
      );

      Alert.alert("성공", "일정이 추가되었습니다.", [
        {
          text: "확인",
          onPress: () => {
            onSave();
            onClose();
          },
        },
      ]);

      // 폼 초기화
      setFormData({
        title: "",
        description: "",
        startDate: dayjs().format("YYYY-MM-DD"),
        endDate: dayjs().format("YYYY-MM-DD"),
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
      });
    } catch (error) {
      console.error("Failed to create schedule:", error);
      Alert.alert("오류", "일정 추가에 실패했습니다.");
    }
  };

  const handleDirectAddressSearch = () => {
    console.log("🔍 주소 검색 버튼 클릭됨, Platform:", Platform.OS);

    if (Platform.OS === "web") {
      // 웹에서 직접 다음 우편번호 서비스 열기
      const script = document.createElement("script");
      script.src =
        "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.onload = () => {
        // 팝업 창으로 열기
        const popup = window.open(
          "",
          "postcodePopup",
          "width=500,height=600,scrollbars=yes,resizable=yes"
        );

        if (popup) {
          // 팝업 창에 HTML 작성
          popup.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>주소 검색</title>
              <style>
                body { margin: 0; padding: 0; }
                #postcode { width: 100%; height: 100vh; }
              </style>
            </head>
            <body>
              <div id="postcode"></div>
            </body>
            </html>
          `);
          popup.document.close();

          // 팝업이 완전히 로드된 후 다음 우편번호 서비스 초기화
          popup.onload = () => {
            // @ts-ignore
            new window.daum.Postcode({
              oncomplete: function (data: any) {
                console.log("팝업에서 선택된 주소:", data);

                let selectedAddress = "";
                if (data.roadAddress) {
                  selectedAddress = data.roadAddress;
                } else if (data.jibunAddress) {
                  selectedAddress = data.jibunAddress;
                } else if (data.address) {
                  selectedAddress = data.address;
                }

                if (data.buildingName) {
                  selectedAddress += ` (${data.buildingName})`;
                }

                // 선택된 주소를 폼 데이터에 설정
                setFormData({ ...formData, address: selectedAddress });
                popup.close();
              },
              onclose: function (state: string) {
                console.log("팝업 닫힘:", state);
                if (state === "FORCE_CLOSE") {
                  popup.close();
                }
              },
            }).embed(popup.document.getElementById("postcode"));
          };
        }
      };

      script.onerror = () => {
        Alert.alert("오류", "주소 검색 서비스를 불러올 수 없습니다.");
      };

      document.head.appendChild(script);
    } else {
      // 모바일에서는 모달 내부에 주소 검색 표시
      console.log("📱 모바일: 주소 검색 UI 열기");
      setShowAddressSearch(true);
      Keyboard.dismiss();
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          resetCategoryForm();
          resetAddressSearch();
          onClose();
        }}
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
              <View style={styles.addModalHeader}>
                <Text style={styles.addModalTitle}>새 일정 추가</Text>
                <Pressable
                  onPress={() => {
                    resetCategoryForm();
                    resetAddressSearch();
                    onClose();
                  }}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </Pressable>
              </View>

              <ScrollView
                ref={scrollViewRef}
                style={styles.addModalContent}
                contentContainerStyle={styles.addModalContentContainer}
                showsVerticalScrollIndicator={true}
                bounces={false}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={true}
              >
                {/* 기본 정보 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>기본 정보</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>일정명 *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="일정명을 입력하세요"
                      value={formData.title}
                      onChangeText={(text) =>
                        setFormData({ ...formData, title: text })
                      }
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
                    />
                  </View>

                  <View ref={categoryViewRef} style={styles.inputGroup}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.inputLabel}>카테고리</Text>
                      <Pressable
                        style={styles.addCategoryButton}
                        onPress={handleAddCategory}
                      >
                        <Ionicons name="add" size={16} color={colors.primary} />
                        <Text
                          style={[
                            styles.addCategoryButtonText,
                            { color: colors.primary },
                          ]}
                        >
                          추가
                        </Text>
                      </Pressable>
                    </View>
                    <View style={styles.categoryContainer}>
                      {(showAllCategories
                        ? categories
                        : categories.slice(0, 3)
                      ).map((category) => (
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
                              borderWidth:
                                formData.category === category.name ? 2 : 0,
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
                            <Text
                              style={[
                                styles.categoryButtonText,
                                {
                                  color: "#333",
                                },
                              ]}
                            >
                              {category.name}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                      {categories.length > 3 && !showAllCategories && (
                        <Pressable
                          style={styles.showMoreCategoryButton}
                          onPress={() => setShowAllCategories(true)}
                        >
                          <Text style={styles.showMoreCategoryText}>
                            +{categories.length - 3}개 더 보기
                          </Text>
                        </Pressable>
                      )}
                      {categories.length > 3 && showAllCategories && (
                        <Pressable
                          style={styles.showLessCategoryButton}
                          onPress={() => setShowAllCategories(false)}
                        >
                          <Text style={styles.showLessCategoryText}>접기</Text>
                        </Pressable>
                      )}
                    </View>

                    {/* 카테고리 추가 폼 */}
                    {showAddCategoryForm && (
                      <View style={styles.addCategoryForm}>
                        <TextInput
                          style={styles.categoryNameInput}
                          placeholder="카테고리 이름"
                          placeholderTextColor="#9ca3af"
                          value={newCategoryName}
                          onChangeText={setNewCategoryName}
                          autoFocus
                        />

                        {/* 색상 선택 */}
                        <Text style={styles.colorPickerLabel}>색상 선택</Text>

                        {/* 색상 옵션들 */}
                        <View style={styles.colorPicker}>
                          {/* 프리셋 색상 - 파스텔 톤 */}
                          {[
                            "#FFB3BA", // 파스텔 핑크
                            "#FFDFBA", // 파스텔 오렌지
                            "#FFFFBA", // 파스텔 옐로우
                            "#BAFFC9", // 파스텔 그린
                            "#BAE1FF", // 파스텔 블루
                            "#E6B3FF", // 파스텔 퍼플
                          ].map((color) => (
                            <Pressable
                              key={color}
                              style={[
                                styles.colorOption,
                                { backgroundColor: color },
                                newCategoryColor === color &&
                                  styles.colorOptionSelected,
                              ]}
                              onPress={() => {
                                setNewCategoryColor(color);
                                setShowColorPicker(false);
                              }}
                            >
                              {newCategoryColor === color && (
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color="white"
                                />
                              )}
                            </Pressable>
                          ))}

                          {/* 커스텀 색상들 */}
                          {customColors.map((color) => (
                            <Pressable
                              key={color}
                              style={[
                                styles.colorOption,
                                { backgroundColor: color },
                                newCategoryColor === color &&
                                  styles.colorOptionSelected,
                              ]}
                              onPress={() => {
                                setNewCategoryColor(color);
                                setShowColorPicker(false);
                              }}
                            >
                              {newCategoryColor === color && (
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color="white"
                                />
                              )}
                            </Pressable>
                          ))}

                          {/* 색상 추가 버튼 (+ 아이콘) */}
                          <Pressable
                            style={[
                              styles.colorOption,
                              {
                                backgroundColor: showColorPicker
                                  ? "#f0f0f0"
                                  : "#fff",
                                borderWidth: 2,
                                borderColor: showColorPicker
                                  ? "#333"
                                  : "#e5e7eb",
                                borderStyle: "dashed",
                              },
                            ]}
                            onPress={() => {
                              setShowColorPicker(!showColorPicker);
                              if (!showColorPicker) {
                                // 색상환을 열 때 키보드 닫기
                                Keyboard.dismiss();
                              }
                            }}
                          >
                            <Ionicons
                              name={showColorPicker ? "close" : "add"}
                              size={24}
                              color={showColorPicker ? "#333" : "#999"}
                            />
                          </Pressable>
                        </View>

                        {/* 색상환 확장 영역 */}
                        {showColorPicker && (
                          <View style={styles.colorPickerExpanded}>
                            {Platform.OS === "web" ? (
                              <WebColorPicker
                                color={previewColor}
                                onColorChange={(color: string) => {
                                  // 웹에서도 바로 색상 적용
                                  setNewCategoryColor(color);
                                  setPreviewColor(color);

                                  // 커스텀 색상에 추가 (중복 방지)
                                  if (!customColors.includes(color)) {
                                    setCustomColors((prev) => [...prev, color]);
                                  }

                                  // 색상환 닫기
                                  setShowColorPicker(false);
                                }}
                              />
                            ) : (
                              <AppColorPicker
                                color={previewColor}
                                onColorChange={(color: string) => {
                                  // 앱에서는 바로 색상 적용
                                  setNewCategoryColor(color);
                                  setPreviewColor(color);

                                  // 커스텀 색상에 추가 (중복 방지)
                                  if (!customColors.includes(color)) {
                                    setCustomColors((prev) => [...prev, color]);
                                  }

                                  // 색상환 닫기
                                  setShowColorPicker(false);
                                }}
                              />
                            )}
                          </View>
                        )}

                        {/* 추가/취소 버튼 */}
                        <View style={styles.addCategoryFormButtons}>
                          <Pressable
                            style={styles.categoryFormCancelButton}
                            onPress={handleCancelAddCategory}
                          >
                            <Text style={styles.categoryFormCancelButtonText}>
                              취소
                            </Text>
                          </Pressable>
                          <Pressable
                            style={[
                              styles.categoryFormAddButton,
                              { backgroundColor: colors.primary },
                            ]}
                            onPress={handleCreateCategory}
                          >
                            <Text style={styles.categoryFormAddButtonText}>
                              추가
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                </View>

                {/* 날짜 및 시간 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>날짜 및 시간</Text>

                  <View style={styles.dateTimeRow}>
                    <View style={{ flex: 1 }}>
                      <DatePicker
                        label="시작일"
                        value={formData.startDate}
                        onDateChange={(date) => {
                          // 시작일이 종료일보다 늦으면 종료일도 같이 변경
                          if (dayjs(date).isAfter(dayjs(formData.endDate))) {
                            setFormData({
                              ...formData,
                              startDate: date,
                              endDate: date,
                            });
                          } else {
                            setFormData({ ...formData, startDate: date });
                          }
                        }}
                        placeholder="시작일 선택"
                        mode="date"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <DatePicker
                        label="종료일"
                        value={formData.endDate}
                        onDateChange={(date) => {
                          if (dayjs(date).isBefore(dayjs(formData.startDate))) {
                            Alert.alert(
                              "오류",
                              "종료일은 시작일보다 늦어야 합니다."
                            );
                            return;
                          }
                          setFormData({ ...formData, endDate: date });
                        }}
                        placeholder="종료일 선택"
                        mode="date"
                        minDate={formData.startDate}
                      />
                    </View>
                  </View>

                  {/* 하루 종일 토글 */}
                  <View
                    style={{
                      marginTop: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "500" }}>
                      하루 종일
                    </Text>
                    <Pressable
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          allDay: !prev.allDay,
                        }))
                      }
                      style={[
                        {
                          width: 50,
                          height: 30,
                          borderRadius: 15,
                          padding: 2,
                          backgroundColor: formData.allDay
                            ? colors.primary
                            : "#cbd5e1",
                          flexDirection: "row",
                          alignItems: "center",
                        },
                      ]}
                    >
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: "white",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 3,
                          marginLeft: formData.allDay ? 20 : 0,
                        }}
                      />
                    </Pressable>
                  </View>

                  {/* 시간 입력 - 하루 종일이 아닐 때만 */}
                  {!formData.allDay && (
                    <View style={styles.dateTimeRow}>
                      <View style={{ flex: 1 }}>
                        <DatePicker
                          label="시작시간"
                          value={`2000-01-01 ${formData.startTime}`}
                          onDateChange={(date) => {
                            const selectedStartTime =
                              dayjs(date).format("HH:mm");
                            setFormData({
                              ...formData,
                              startTime: selectedStartTime,
                            });
                          }}
                          placeholder="시작시간 선택"
                          mode="time"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <DatePicker
                          label="종료시간"
                          value={
                            formData.endTime
                              ? `2000-01-02 ${formData.endTime}`
                              : "2000-01-02 18:00"
                          }
                          onDateChange={(date) => {
                            const selectedEndTime = dayjs(date).format("HH:mm");

                            // 종료시간이 시작시간보다 이르면 종료일을 하루 늘림
                            const [startHour, startMin] = formData.startTime
                              .split(":")
                              .map(Number);
                            const [endHour, endMin] = selectedEndTime
                              .split(":")
                              .map(Number);
                            const isOvernight =
                              startHour * 60 + startMin > endHour * 60 + endMin;

                            if (isOvernight) {
                              // 종료일을 하루 늘림
                              const newEndDate = dayjs(formData.endDate)
                                .add(1, "day")
                                .format("YYYY-MM-DD");
                              setFormData({
                                ...formData,
                                endDate: newEndDate,
                                endTime: selectedEndTime,
                              });
                            } else {
                              setFormData({
                                ...formData,
                                endTime: selectedEndTime,
                              });
                            }
                          }}
                          placeholder="종료시간 선택"
                          mode="time"
                        />
                      </View>
                    </View>
                  )}

                  {/* 일정 시간 동일 여부 토글 - 여러 날인 경우에만 */}
                  {formData.startDate !== formData.endDate && (
                    <View
                      style={{
                        marginTop: 16,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: "500" }}>
                        매일 시간 동일
                      </Text>
                      <Pressable
                        onPress={() =>
                          setFormData((prev) => ({
                            ...prev,
                            uniformTime: !prev.uniformTime,
                          }))
                        }
                        style={[
                          {
                            width: 50,
                            height: 30,
                            borderRadius: 15,
                            padding: 2,
                            backgroundColor: formData.uniformTime
                              ? colors.primary
                              : "#cbd5e1",
                            flexDirection: "row",
                            alignItems: "center",
                          },
                        ]}
                      >
                        <View
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            backgroundColor: "white",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 3,
                            marginLeft: formData.uniformTime ? 20 : 0,
                          }}
                        />
                      </Pressable>
                    </View>
                  )}

                  {/* 일별 시간 설정 */}
                  {formData.startDate !== formData.endDate &&
                    !formData.uniformTime &&
                    formData.scheduleTimes.length > 0 && (
                      <View style={styles.scheduleTimesSection}>
                        <Text style={styles.sectionTitle}>일별 시간 설정</Text>
                        {formData.scheduleTimes.map((time, index) => (
                          <View
                            key={time.workDate}
                            style={styles.scheduleTimeItem}
                          >
                            <View style={styles.scheduleTimeHeader}>
                              <Text style={styles.scheduleTimeDate}>
                                {dayjs(time.workDate).format("MM월 DD일 (ddd)")}
                              </Text>
                              <Pressable
                                style={styles.removeTimeButton}
                                onPress={() =>
                                  removeScheduleTime(time.workDate)
                                }
                              >
                                <Ionicons
                                  name="close-circle"
                                  size={20}
                                  color="#ef4444"
                                />
                              </Pressable>
                            </View>

                            <View style={styles.timeInputRow}>
                              <View style={styles.timeInputGroup}>
                                <DatePicker
                                  label="시작시간"
                                  value={`2000-01-01 ${time.startTime}`}
                                  onDateChange={(date) => {
                                    const selectedStartTime =
                                      dayjs(date).format("HH:mm");
                                    updateScheduleTime(
                                      time.workDate,
                                      "startTime",
                                      selectedStartTime
                                    );
                                  }}
                                  placeholder="시작시간"
                                  mode="time"
                                />
                              </View>

                              <View style={styles.timeInputGroup}>
                                <DatePicker
                                  label="종료시간"
                                  value={
                                    time.endTime
                                      ? `2000-01-01 ${time.endTime}`
                                      : `2000-01-01 18:00`
                                  }
                                  onDateChange={(date) => {
                                    const selectedEndTime =
                                      dayjs(date).format("HH:mm");
                                    updateScheduleTime(
                                      time.workDate,
                                      "endTime",
                                      selectedEndTime
                                    );
                                  }}
                                  placeholder="종료시간"
                                  mode="time"
                                />
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                </View>

                {/* 장소 정보 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>장소</Text>

                  <View style={styles.inputGroup}>
                    <View>
                      <Text style={styles.inputLabel}>위치명</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="위치명을 입력해주세요 (예: 화성교육청)"
                        value={formData.location}
                        onChangeText={(text) =>
                          setFormData({ ...formData, location: text })
                        }
                        placeholderTextColor="#9ca3af"
                      />
                    </View>

                    <View style={styles.addressRow}>
                      <TextInput
                        style={[styles.textInput, styles.addressInput]}
                        placeholder="주소를 입력하거나 검색해주세요"
                        value={formData.address}
                        onChangeText={(text) =>
                          setFormData({ ...formData, address: text })
                        }
                        placeholderTextColor="#9ca3af"
                      />
                      <Pressable
                        style={[
                          styles.addressSearchButton,
                          { backgroundColor: colors.primary },
                        ]}
                        onPress={handleDirectAddressSearch}
                      >
                        <Ionicons name="search" size={20} color="white" />
                      </Pressable>
                    </View>

                    {/* 주소 검색 WebView */}
                    {showAddressSearch && Platform.OS !== "web" && (
                      <View style={styles.addressSearchExpanded}>
                        <View style={styles.addressSearchHeader}>
                          <Text style={styles.addressSearchTitle}>
                            주소 검색
                          </Text>
                          <Pressable
                            style={styles.addressSearchCloseButton}
                            onPress={() => setShowAddressSearch(false)}
                          >
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
      var searchQuery = "${formData.address
        .replace(/"/g, '\\"')
        .replace(/\n/g, " ")
        .trim()}";
      
      new daum.Postcode({
        oncomplete: function(data) {
          console.log('🏠 주소 선택됨:', data);
          var addr = data.roadAddress || data.jibunAddress;
          if (data.buildingName) {
            addr += ' (' + data.buildingName + ')';
          }
          
          console.log('📤 전송할 주소:', addr);
          console.log('🔍 ReactNativeWebView 존재:', !!window.ReactNativeWebView);
          
          if (window.ReactNativeWebView) {
            var message = JSON.stringify({ address: addr });
            console.log('📨 메시지 전송 시도:', message);
            window.ReactNativeWebView.postMessage(message);
            console.log('📨 메시지 전송 완료');
          } else {
            console.error('❌ ReactNativeWebView가 없습니다!');
          }
        },
        width: '100%',
        height: '100%'
      }).embed(document.getElementById('wrap'), {
        q: searchQuery,
        autoClose: true
      });
    })();
  </script>
</body>
</html>
                              `,
                          }}
                          style={{ width: "100%", height: 600 }}
                          onMessage={(event) => {
                            console.log(
                              "🔍 WebView 메시지 수신:",
                              event.nativeEvent.data
                            );
                            try {
                              const data = JSON.parse(event.nativeEvent.data);
                              console.log("📋 파싱된 데이터:", data);
                              if (data.address) {
                                console.log("✅ 주소 선택됨:", data.address);
                                setFormData((prev) => ({
                                  ...prev,
                                  address: data.address,
                                }));
                                setShowAddressSearch(false);
                              }
                            } catch (error) {
                              console.error("❌ 주소 파싱 오류:", error);
                            }
                          }}
                          javaScriptEnabled={true}
                          domStorageEnabled={true}
                          originWhitelist={["*"]}
                          scalesPageToFit={false}
                          scrollEnabled={true}
                          nestedScrollEnabled={true}
                          onError={(error) =>
                            console.error("WebView 오류:", error)
                          }
                          onLoadEnd={() => {
                            console.log("✅ WebView 로드 완료");
                            console.log(
                              "🔍 ReactNativeWebView 사용 가능:",
                              true
                            );
                          }}
                        />
                      </View>
                    )}
                  </View>
                </View>

                {/* 메모 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>메모</Text>

                  <View style={styles.inputGroup}>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      placeholder="추가 메모를 입력하세요"
                      value={formData.memo}
                      onChangeText={(text) =>
                        setFormData({ ...formData, memo: text })
                      }
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>

                {/* 첨부파일 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>첨부파일</Text>

                  <View style={styles.inputGroup}>
                    <FileUpload
                      type="document"
                      currentUrl=""
                      currentPath=""
                      onUpload={(url, path) => {
                        setFormData({
                          ...formData,
                          documentsFolderPath: path,
                          hasAttachments: true,
                        });
                      }}
                      onDelete={() => {
                        setFormData({
                          ...formData,
                          documentsFolderPath: "",
                          hasAttachments: false,
                        });
                      }}
                      options={{
                        bucket: "remit-planner-files",
                        folder: `schedules/${formData.title || "temp"}`,
                        fileType: "document",
                        maxSize: 20, // 20MB
                      }}
                      placeholder="설명서, 안내사항, 계약서 등을 업로드하세요"
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.addModalButtons}>
                <Pressable
                  style={styles.addCancelButton}
                  onPress={() => {
                    resetCategoryForm();
                    resetAddressSearch();
                    onClose();
                  }}
                >
                  <Text style={styles.addCancelButtonText}>취소</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.addSaveButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleSave}
                >
                  <Text style={styles.addSaveButtonText}>저장</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  // 중앙 팝업 스타일 (스케줄 관리, 일정 관리)
  modalOverlayCenter: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  // 하단 토스트 스타일 (메인 화면 오늘 일정)
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
  // 중앙 팝업 컨텐츠 스타일
  modalContentCenter: {
    borderRadius: 16,
    maxWidth: 520,
    maxHeight: "90%",
    height: Platform.OS === "web" ? "auto" : "85%",
  },
  // 하단 토스트 컨텐츠 스타일
  modalContentBottom: {
    borderRadius: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxWidth: "100%",
    height: "85%",
    maxHeight: "85%",
  },
  addModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  addModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  addModalContent: {
    flex: 1,
  },
  addModalContentContainer: {
    padding: 20,
    paddingBottom: 80, // 하단 버튼 공간 확보
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  },
  // 카테고리 추가 폼 스타일
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
  colorPickerLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  colorPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  colorPreviewText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    justifyContent: "space-between",
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
    // 앱에서 원형으로 보이도록 수정
    aspectRatio: 1,
  },
  colorOptionSelected: {
    borderColor: "#333",
    borderWidth: 3,
  },
  colorPickerExpanded: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  colorPickerConfirmButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  colorPickerConfirmText: {
    fontSize: 16,
    fontWeight: "700",
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
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  colorGridItem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorGridItemSelected: {
    borderColor: "#333",
    borderWidth: 3,
  },
  addCategoryFormButtons: {
    flexDirection: "row",
    gap: 8,
  },
  categoryFormCancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
  },
  categoryFormCancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  categoryFormAddButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  categoryFormAddButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "white",
  },
  checkboxContainer: {
    marginVertical: 16,
    paddingVertical: 8,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkboxText: {
    fontSize: 16,
    color: "#374151",
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    alignItems: "flex-start",
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
  addressSearchExpanded: {
    marginTop: 12,
    height: 450,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  addressSearchHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  addressSearchTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  addressSearchCloseButton: {
    padding: 4,
  },
  addModalButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  addCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  addCancelButtonText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  addSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addSaveButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
  // 체크박스 스타일
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  // 일별 시간 설정 스타일
  scheduleTimesSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  scheduleTimeItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  scheduleTimeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  scheduleTimeDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  removeTimeButton: {
    padding: 4,
  },
  timeInputRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 6,
    fontWeight: "500",
  },
  breakInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: "white",
    textAlign: "center",
  },
  showMoreCategoryButton: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    marginTop: 8,
  },
  showMoreCategoryText: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  showLessCategoryButton: {
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    marginTop: 8,
  },
  showLessCategoryText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
});
