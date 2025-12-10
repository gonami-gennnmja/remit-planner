import { Text } from "@/components/Themed";
import { Theme } from "@/constants/Theme";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import { useResponsive } from "@/hooks/useResponsive";
import { getCategoryColor, Schedule, Worker } from "@/models/types";
import { createScheduleCompletionActivities } from "@/utils/activityUtils";
import {
  detectBankFromAccount,
  formatAccountNumber,
  formatNumber,
  formatPhoneNumber,
  KOREAN_BANKS,
} from "@/utils/bankUtils";
import {
  openAddressSearch,
  openKakaoMap,
  openMapApp,
  openNaverMap,
} from "@/utils/daumMapApi";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Clipboard,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { CalendarList, CalendarProvider } from "react-native-calendars";
import { PanGestureHandler, State } from "react-native-gesture-handler";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface PlannerCalendarProps {
  onAddSchedulePress?: (date?: string, endDate?: string) => void;
  filter?: string; // 'upcoming' for upcoming schedules only
}

// 작은 근로자 카드 컴포넌트
function WorkerCard({
  worker,
  periods,
  paid,
  onTogglePaid,
  onCall,
  onSMS,
  onDelete,
}: {
  worker: Worker;
  periods: any[];
  paid: boolean;
  onTogglePaid: (paid: boolean) => void;
  onCall: (phone: string) => void;
  onSMS: (phone: string) => void;
  onDelete?: (workerId: string) => void;
}) {
  const getPosition = (name: string) => {
    if (name.includes("선생") || name.includes("Teacher")) return "강사";
    if (name.includes("개발") || name.includes("Developer")) return "개발자";
    if (name.includes("이벤트") || name.includes("Event")) return "이벤트 담당";
    return "근로자";
  };

  const getWorkTime = (periods: any[]) => {
    if (!periods || periods.length === 0) return "시간 미정";

    const validPeriods = periods.filter((p: any) => p && p.start && p.end);
    if (validPeriods.length === 0) return "시간 미정";

    const totalMinutes = validPeriods.reduce((total, period) => {
      const start = dayjs(period.start);
      const end = dayjs(period.end);
      return total + end.diff(start, "minute");
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}시간 ${minutes}분`;
    } else if (hours > 0) {
      return `${hours}시간`;
    } else {
      return `${minutes}분`;
    }
  };

  const getTimeRange = (periods: any[]) => {
    if (!periods || periods.length === 0) return "시간 미정";

    const validPeriods = periods.filter((p: any) => p && p.start && p.end);
    if (validPeriods.length === 0) return "시간 미정";

    const times = validPeriods.map((p) => ({
      start: dayjs(p.start).format("HH:mm"),
      end: dayjs(p.end).format("HH:mm"),
    }));

    if (times.length === 1) {
      return `${times[0].start} - ${times[0].end}`;
    } else {
      const start = times[0].start;
      const end = times[times.length - 1].end;
      return `${start} - ${end}`;
    }
  };

  return (
    <View style={styles.workerCard}>
      <View style={styles.workerHeader}>
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{worker.name}</Text>
          <Text style={styles.workerPosition}>{getPosition(worker.name)}</Text>
        </View>
        <Switch
          value={paid}
          onValueChange={onTogglePaid}
          trackColor={{ false: "#e5e7eb", true: "#10b981" }}
          thumbColor={paid ? "#ffffff" : "#ffffff"}
          style={styles.paidSwitch}
        />
      </View>

      <View style={styles.workerDetails}>
        <Text style={styles.workTime}>{getWorkTime(periods)}</Text>
        <Text style={styles.timeRange}>{getTimeRange(periods)}</Text>
      </View>

      <View style={styles.workerFooter}>
        <Text style={styles.phoneNumber}>
          {formatPhoneNumber(worker.phone)}
        </Text>
        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => onCall(worker.phone)}
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
            onPress={() => onSMS(worker.phone)}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.6 : 1,
              },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ fontSize: 16 }}>💬</Text>
          </Pressable>
          {onDelete && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: "#ef4444" }]}
              onPress={() => {
                Alert.alert(
                  "근로자 삭제",
                  `${worker.name}님을 이 스케줄에서 제거하시겠습니까?`,
                  [
                    { text: "취소", style: "cancel" },
                    {
                      text: "삭제",
                      style: "destructive",
                      onPress: () => onDelete(worker.id),
                    },
                  ]
                );
              }}
            >
              <Ionicons name="trash" size={16} color="#ffffff" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function getSchedulePosition(
  schedule: Schedule,
  hourHeight: number
): { top: number; height: number } {
  const times = (schedule.workers || []).flatMap((w) =>
    (w.periods || [])
      .filter((p: any) => p && p.startTime && p.endTime)
      .map((p) => ({
        start: dayjs(`${p.workDate} ${p.startTime}`),
        end: dayjs(`${p.workDate} ${p.endTime}`),
      }))
  );

  // times 배열이 비어있으면 기본값 반환
  if (times.length === 0) {
    return { top: 0, height: 40 };
  }

  const start = times.reduce(
    (min: dayjs.Dayjs, t: { start: dayjs.Dayjs; end: dayjs.Dayjs }) =>
      t.start.isBefore(min) ? t.start : min,
    times[0].start
  );
  const end = times.reduce(
    (max: dayjs.Dayjs, t: { start: dayjs.Dayjs; end: dayjs.Dayjs }) =>
      t.end.isAfter(max) ? t.end : max,
    times[0].end
  );

  const startHour = start.hour() + start.minute() / 60;
  const endHour = end.hour() + end.minute() / 60;
  const duration = endHour - startHour;

  return {
    top: startHour * hourHeight,
    height: Math.max(duration * hourHeight, 20),
  };
}

export default function PlannerCalendar({
  onAddSchedulePress,
  filter,
}: PlannerCalendarProps = {}) {
  const [selectedDate, setSelectedDate] = useState<string>(
    dayjs().format("YYYY-MM-DD")
  );
  const { screenData, isMobile, isTablet, isDesktop, getResponsiveValue } =
    useResponsive();
  const { colors } = useTheme();
  const [currentMonth, setCurrentMonth] = useState<string>(
    dayjs().format("YYYY-MM")
  );

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [isAddressSearchVisible, setIsAddressSearchVisible] = useState(false);
  const [modalType, setModalType] = useState<"detail" | "worker-detail" | null>(
    null
  );
  const [selectedWorkerIndex, setSelectedWorkerIndex] = useState<number | null>(
    null
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [taxWithheld, setTaxWithheld] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [taxRate, setTaxRate] = useState(0.1);
  const [paid, setPaid] = useState(false);
  const [workHours, setWorkHours] = useState<Record<string, number>>({});
  const [workerData, setWorkerData] = useState<Record<string, any>>({});
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [workerSearchQuery, setWorkerSearchQuery] = useState("");
  const [showWorkerSearch, setShowWorkerSearch] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [showBankSelection, setShowBankSelection] = useState(false);
  const [markingType, setMarkingType] = useState<"multi-dot" | "multi-period">(
    "multi-dot"
  );
  const [selectedStartDate, setSelectedStartDate] = useState<string>("");
  const [selectedEndDate, setSelectedEndDate] = useState<string>("");
  const [isRangeSelectionMode, setIsRangeSelectionMode] = useState(false);
  const [showYearView, setShowYearView] = useState(false);
  const [currentYear, setCurrentYear] = useState(dayjs().year());
  const nameInputRef = useRef<TextInput>(null);
  const yearScrollViewRef = useRef<ScrollView>(null);
  const [newWorker, setNewWorker] = useState({
    name: "",
    phone: "",
    bankCode: "",
    bankAccount: "",
    hourlyWage: 11000,
    taxWithheld: true,
    memo: "",
    fullPeriod: true,
    workStartDate: "",
    workEndDate: "",
    workTimes: [{ startTime: "09:00", endTime: "18:00" }],
    isWorkHoursSameEveryDay: true,
    dailyWorkPeriods: [] as Array<{
      date: string;
      startTime: string;
      endTime: string;
    }>,
  });
  // DB에서 스케줄 데이터 로드
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  // 필터링된 스케줄 계산
  const filteredSchedules = useMemo(() => {
    if (filter === "upcoming") {
      const today = dayjs();
      return schedules.filter((schedule) => {
        const endDate = dayjs(schedule.endDate);
        return endDate.isSameOrAfter(today, "day");
      });
    }
    return schedules;
  }, [schedules, filter]);

  const translateY = new Animated.Value(0);

  // DB에서 스케줄 로드
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        setLoading(true);
        const db = getDatabase();
        await db.init();

        // 연간 달력을 위해 1년 범위의 스케줄 로드
        const startOfYear = dayjs(currentMonth)
          .startOf("year")
          .format("YYYY-MM-DD");
        const endOfYear = dayjs(currentMonth)
          .endOf("year")
          .format("YYYY-MM-DD");

        const yearSchedules = await db.getSchedulesByDateRange(
          startOfYear,
          endOfYear
        );
        setSchedules(yearSchedules);

        // 완료된 스케줄에 대해 알림 생성
        for (const schedule of yearSchedules) {
          await createScheduleCompletionActivities(schedule);
        }
      } catch (error) {
        console.error("Failed to load schedules:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, [currentMonth]);

  const showModal = () => {
    setModalVisible(true);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const hideModal = () => {
    Animated.timing(translateY, {
      toValue: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setModalType(null);
      setSelectedScheduleId(null);
    });
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      if (event.nativeEvent.translationY > 100) {
        hideModal();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  // DB에서 스케줄 로드 함수
  const loadSchedules = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      await db.init();

      // 현재 월의 스케줄 로드
      const startOfMonth = dayjs(currentMonth)
        .startOf("month")
        .format("YYYY-MM-DD");
      const endOfMonth = dayjs(currentMonth)
        .endOf("month")
        .format("YYYY-MM-DD");

      const monthSchedules = await db.getSchedulesByDateRange(
        startOfMonth,
        endOfMonth
      );
      setSchedules(monthSchedules);
    } catch (error) {
      console.error("Failed to load schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드 및 월 변경 시 스케줄 재로드
  useEffect(() => {
    loadSchedules();
    loadAllWorkers();
  }, [currentMonth]);

  const loadAllWorkers = async () => {
    try {
      const db = getDatabase();
      await db.init();
      const workers = await db.getAllWorkers();
      setAllWorkers(workers);
    } catch (error) {
      console.error("Failed to load workers:", error);
    }
  };

  const monthMarks = useMemo(() => {
    if (markingType === "multi-dot") {
      // Multi-Dot Marking
      const marks: Record<
        string,
        {
          dots: { key: string; color: string; selectedDotColor: string }[];
          marked?: boolean;
        }
      > = {};

      filteredSchedules.forEach((schedule: Schedule) => {
        const startDate = dayjs(schedule.startDate);
        const endDate = dayjs(schedule.endDate);

        // 시작일부터 종료일까지 모든 날짜에 마킹
        let currentDate = startDate;
        while (currentDate.isSameOrBefore(endDate, "day")) {
          const dateStr = currentDate.format("YYYY-MM-DD");
          if (!marks[dateStr]) {
            marks[dateStr] = { dots: [], marked: true };
          }
          marks[dateStr].dots.push({
            key: schedule.instanceId ?? schedule.id,
            color: getCategoryColor(schedule.category),
            selectedDotColor: getCategoryColor(schedule.category),
          });
          currentDate = currentDate.add(1, "day");
        }
      });

      return marks;
    } else {
      // Multi-Period Marking
      const marks: Record<string, any> = {};

      filteredSchedules.forEach((schedule: Schedule) => {
        const startDate = dayjs(schedule.startDate);
        const endDate = dayjs(schedule.endDate);
        const color = getCategoryColor(schedule.category);
        const scheduleId = schedule.instanceId ?? schedule.id;

        let currentDate = startDate;
        while (currentDate.isSameOrBefore(endDate, "day")) {
          const dateStr = currentDate.format("YYYY-MM-DD");
          const isFirst = currentDate.isSame(startDate, "day");
          const isLast = currentDate.isSame(endDate, "day");

          if (!marks[dateStr]) {
            marks[dateStr] = { periods: [] };
          }

          // 각 period에 고유한 key와 태그 색상을 추가
          const periodData: any = {
            key: `${scheduleId}-${dateStr}`, // 날짜와 일정 ID를 조합하여 고유성 보장
            color: color, // 태그 색상 그대로 사용
            textColor: "white",
          };

          if (isFirst && isLast) {
            periodData.startingDay = true;
            periodData.endingDay = true;
          } else if (isFirst) {
            periodData.startingDay = true;
          } else if (isLast) {
            periodData.endingDay = true;
          }

          marks[dateStr].periods.push(periodData);

          currentDate = currentDate.add(1, "day");
        }
      });

      return marks;
    }
  }, [filteredSchedules, markingType]);

  const selectedDateSchedules = useMemo(() => {
    return filteredSchedules
      .filter((s) => {
        const startDate = dayjs(s.startDate);
        const endDate = dayjs(s.endDate);
        const selected = dayjs(selectedDate);

        // 선택된 날짜가 시작일과 종료일 사이에 있는 스케줄만 표시
        return (
          selected.isSameOrAfter(startDate, "day") &&
          selected.isSameOrBefore(endDate, "day")
        );
      })
      .slice()
      .sort((a, b) => {
        const aStart = (a.workers || [])
          .flatMap((w) =>
            (w.periods || [])
              .filter((p: any) => p && p.startTime)
              .map((p: any) =>
                p && p.startTime ? dayjs(`${p.workDate} ${p.startTime}`) : null
              )
              .filter((d: any) => d !== null)
          )
          .sort((x, y) => (x?.valueOf() || 0) - (y?.valueOf() || 0))[0];
        const bStart = (b.workers || [])
          .flatMap((w) =>
            (w.periods || [])
              .filter((p: any) => p && p.startTime)
              .map((p: any) =>
                p && p.startTime ? dayjs(`${p.workDate} ${p.startTime}`) : null
              )
              .filter((d: any) => d !== null)
          )
          .sort((x, y) => (x?.valueOf() || 0) - (y?.valueOf() || 0))[0];
        return (aStart?.valueOf() ?? 0) - (bStart?.valueOf() ?? 0);
      });
  }, [filteredSchedules, selectedDate]);

  const goToPreviousMonth = () => {
    const newMonth = dayjs(currentMonth).subtract(1, "month").format("YYYY-MM");
    setCurrentMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = dayjs(currentMonth).add(1, "month").format("YYYY-MM");
    setCurrentMonth(newMonth);
  };

  const onSchedulePress = (scheduleId: string) => {
    // 상세 화면으로 이동
    const { router } = require("expo-router");
    router.push(`/schedule/${scheduleId}`);
  };

  const makePhoneCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const sendSMS = (phoneNumber: string) => {
    Linking.openURL(`sms:${phoneNumber}`);
  };

  const showContactOptions = (phoneNumber: string) => {
    Alert.alert("연락하기", "어떤 방법으로 연락하시겠습니까?", [
      {
        text: "📞 전화걸기",
        onPress: () => makePhoneCall(phoneNumber),
      },
      {
        text: "💬 문자보내기",
        onPress: () => sendSMS(phoneNumber),
      },
      { text: "취소", style: "cancel" },
    ]);
  };

  const calculatePay = (workerInfo: any, customHours?: number) => {
    const hours =
      customHours ||
      workHours[workerInfo.worker.id] ||
      (workerInfo.periods || [])
        .filter((p: any) => p && p.start && p.end)
        .reduce((total: number, period: any) => {
          const start = dayjs(period.start);
          const end = dayjs(period.end);
          return total + end.diff(start, "hour", true);
        }, 0);

    // workerData에서 시급과 세금공제 여부 가져오기
    const workerDataForId = workerData[workerInfo.worker.id] || {};
    const hourlyWage =
      workerDataForId.hourlyWage || workerInfo.worker.hourlyWage;
    const taxWithheld =
      workerDataForId.taxWithheld !== undefined
        ? workerDataForId.taxWithheld
        : false;

    const grossPay = hourlyWage * hours;

    if (taxWithheld) {
      // 3.3% 공제
      const taxAmount = grossPay * 0.033;
      return {
        gross: grossPay,
        tax: taxAmount,
        net: grossPay - taxAmount,
        taxWithheld: true,
      };
    } else {
      return {
        gross: grossPay,
        tax: 0,
        net: grossPay,
        taxWithheld: false,
      };
    }
  };

  const updateWorkHours = (workerId: string, hours: number) => {
    setWorkHours((prev) => ({
      ...prev,
      [workerId]: hours,
    }));
  };

  const updateWorkerData = (workerId: string, data: any) => {
    setWorkerData((prev) => ({
      ...prev,
      [workerId]: { ...prev[workerId], ...data },
    }));
  };

  const formatWorkHours = (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}시간 ${minutes.toString().padStart(2, "0")}분`;
  };

  const parseWorkHours = (input: string): number => {
    const match = input.match(/(\d+)시간\s*(\d+)?분?/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2] || "0") || 0;
      return hours + minutes / 60;
    }
    return parseFloat(input) || 0;
  };

  const removeWorkerFromSchedule = async (
    scheduleId: string,
    workerId: string
  ) => {
    try {
      console.log("Removing worker from schedule:", scheduleId, workerId);

      const db = getDatabase();

      // 1. DB에서 스케줄-근로자 관계 삭제
      const scheduleWorkers = await db.getScheduleWorkers(scheduleId);
      const scheduleWorker = scheduleWorkers.find(
        (sw) => sw.workerId === workerId
      );
      if (scheduleWorker) {
        await db.deleteScheduleWorker(scheduleWorker.id);
      }
      console.log("Worker removed from schedule in DB successfully");

      // 2. 로컬 상태 업데이트
      // DB에서 최신 데이터 다시 로드
      await loadSchedules();

      console.log("Worker removed from schedule successfully");
    } catch (error) {
      console.error("Failed to remove worker from schedule:", error);
      Alert.alert("오류", "근로자 삭제에 실패했습니다.");
    }
  };

  const addWorkerToSchedule = async (scheduleId: string, worker: any) => {
    try {
      console.log("Adding worker to schedule:", scheduleId, worker);

      const newWorkerId = `w${Date.now()}`;
      const schedule = filteredSchedules.find((s) => s.id === scheduleId);
      if (!schedule) {
        console.error("Schedule not found:", scheduleId);
        return;
      }

      // 근무 기간 결정
      let workStartDate = schedule.startDate;
      let workEndDate = schedule.endDate;

      if (!worker.fullPeriod) {
        workStartDate = worker.workStartDate || schedule.startDate;
        workEndDate = worker.workEndDate || schedule.endDate;
      }

      // 근무 시간에 따른 periods 생성
      let periods = [];

      if (worker.isWorkHoursSameEveryDay) {
        // 매일 동일한 근무시간인 경우
        periods = worker.workTimes.map((workTime: any, index: number) => ({
          id: `p${Date.now()}_${index}`,
          start: `${workStartDate}T${workTime.startTime}:00+09:00`,
          end: `${workStartDate}T${workTime.endTime}:00+09:00`,
        }));
      } else {
        // 매일 다른 근무시간인 경우
        periods = worker.dailyWorkPeriods.map((period: any, index: number) => ({
          id: `p${Date.now()}_${index}`,
          start: `${period.date}T${period.startTime}:00+09:00`,
          end: `${period.date}T${period.endTime}:00+09:00`,
        }));
      }

      // 1. DB에 근로자 생성
      const db = getDatabase();
      const workerData = {
        id: newWorkerId,
        userId: "", // Add missing userId
        name: worker.name,
        phone: worker.phone,
        bankAccount: worker.bankAccount,
        hourlyWage: worker.hourlyWage,
        fuelAllowance: worker.fuelAllowance || 0, // Add missing fuelAllowance
        otherAllowance: worker.otherAllowance || 0, // Add missing otherAllowance
        memo: worker.memo || "",
      };

      console.log("Creating worker in DB:", workerData);
      await db.createWorker(workerData);
      console.log("Worker created in DB successfully");

      // 2. 스케줄에 근로자 연결
      console.log(
        "Adding worker to schedule in DB:",
        scheduleId,
        newWorkerId,
        periods
      );
      // Create schedule-worker relationship
      const scheduleWorkerId = await db.createScheduleWorker({
        id: "",
        scheduleId,
        workerId: newWorkerId,
        workStartDate: periods[0]?.workDate || schedule.startDate,
        workEndDate: periods[periods.length - 1]?.workDate || schedule.endDate,
        uniformTime: false,
        hourlyWage: worker.hourlyWage,
        fuelAllowance: worker.fuelAllowance,
        otherAllowance: worker.otherAllowance,
        overtimeEnabled: false,
        nightShiftEnabled: false,
        taxWithheld: false,
        wagePaid: false,
        fuelPaid: false,
        otherPaid: false,
      });

      // Create work periods
      for (const period of periods) {
        await db.createWorkPeriod({
          id: "",
          scheduleWorkerId,
          workDate: period.workDate,
          startTime: period.startTime,
          endTime: period.endTime,
          breakDuration: period.breakDuration || 0,
          overtimeHours: period.overtimeHours || 0,
        });
      }
      console.log("Worker added to schedule in DB successfully");

      // 3. 로컬 상태 업데이트
      const newWorkerInfo = {
        worker: {
          id: newWorkerId,
          name: worker.name,
          phone: worker.phone,
          bankAccount: worker.bankAccount,
          hourlyWage: worker.hourlyWage,
          taxWithheld: false,
          memo: worker.memo,
        },
        periods: periods,
        paid: false,
        fullPeriod: worker.fullPeriod,
        workStartDate: workStartDate,
        workEndDate: workEndDate,
        workTimes: worker.workTimes,
      };

      // DB에서 최신 데이터 다시 로드
      await loadSchedules();

      console.log("Worker added to schedule successfully");
    } catch (error) {
      console.error("Failed to add worker to schedule:", error);
      Alert.alert("오류", "근로자 추가에 실패했습니다.");
    }
  };

  const handleAddWorker = async () => {
    console.log("=== handleAddWorker 시작 ===");
    console.log("newWorker:", newWorker);
    console.log("selectedScheduleId:", selectedScheduleId);

    // 에러 메시지 초기화
    setValidationError("");

    // 이름 필수값 체크
    if (!newWorker.name || newWorker.name.trim() === "") {
      const errorMsg = "이름을 입력해주세요.";
      setValidationError(errorMsg);
      // 이름 입력 필드에 포커스
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
      return;
    }

    if (
      !newWorker.phone ||
      !newWorker.bankAccount ||
      newWorker.hourlyWage <= 0
    ) {
      console.log("유효성 검사 실패:", {
        name: newWorker.name,
        phone: newWorker.phone,
        bankAccount: newWorker.bankAccount,
        hourlyWage: newWorker.hourlyWage,
      });
      const errorMsg = "모든 필드를 올바르게 입력해주세요.";
      setValidationError(errorMsg);
      if (Platform.OS === "web") {
        alert(errorMsg);
      } else {
        Alert.alert("오류", errorMsg);
      }
      return;
    }

    // 전일정 근무가 아닌 경우 근무 기간 확인
    if (
      !newWorker.fullPeriod &&
      (!newWorker.workStartDate || !newWorker.workEndDate)
    ) {
      console.log("근무 기간 검사 실패:", {
        fullPeriod: newWorker.fullPeriod,
        workStartDate: newWorker.workStartDate,
        workEndDate: newWorker.workEndDate,
      });
      Alert.alert("오류", "근무 기간을 입력해주세요.");
      return;
    }

    // 현재 선택된 스케줄에 근로자 추가
    if (selectedScheduleId) {
      console.log("Adding worker to schedule:", selectedScheduleId, newWorker);
      try {
        await addWorkerToSchedule(selectedScheduleId, newWorker);
        console.log("근로자 추가 성공");
        setShowAddWorkerModal(false);
        setNewWorker({
          name: "",
          phone: "",
          bankCode: "",
          bankAccount: "",
          hourlyWage: 11000,
          taxWithheld: true,
          memo: "",
          fullPeriod: true,
          workStartDate: "",
          workEndDate: "",
          workTimes: [{ startTime: "09:00", endTime: "18:00" }],
          isWorkHoursSameEveryDay: true,
          dailyWorkPeriods: [],
        });

        // DB에서 최신 데이터 다시 로드
        await loadSchedules();

        Alert.alert("성공", "근로자가 추가되었습니다.");
      } catch (error) {
        console.error("근로자 추가 실패:", error);
        Alert.alert("오류", "근로자 추가에 실패했습니다.");
      }
    } else {
      console.log("No selectedScheduleId:", selectedScheduleId);
      Alert.alert("오류", "스케줄이 선택되지 않았습니다.");
    }
  };

  const handleAddressSelect = async (address: string) => {
    console.log("=== PlannerCalendar: 주소 선택됨 ===");
    console.log("받은 주소:", address);
    console.log("선택된 스케줄 ID:", selectedScheduleId);

    if (selectedScheduleId) {
      // DB에 저장
      try {
        const db = getDatabase();
        await db.updateSchedule(selectedScheduleId, { address: address });
        console.log("주소가 DB에 저장되었습니다");

        // DB에서 최신 데이터 다시 로드
        await loadSchedules();
      } catch (error) {
        console.error("주소 저장 오류:", error);
        Alert.alert("오류", "주소 저장에 실패했습니다.");
      }
    } else {
      console.error("선택된 스케줄이 없습니다!");
      Alert.alert("오류", "스케줄이 선택되지 않았습니다.");
    }
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Alert.alert("복사됨", "계좌번호가 클립보드에 복사되었습니다.");
  };

  const openPaymentApp = (bankAccount: string) => {
    Alert.alert("송금하기", "어떤 앱으로 송금하시겠습니까?", [
      {
        text: "카카오뱅크",
        onPress: () => {
          // 카카오뱅크 앱 열기 (실제로는 deep link 사용)
          Linking.openURL(`kakaobank://transfer?account=${bankAccount}`);
        },
      },
      {
        text: "토스뱅크",
        onPress: () => {
          // 토스뱅크 앱 열기 (실제로는 deep link 사용)
          Linking.openURL(`toss://transfer?account=${bankAccount}`);
        },
      },
      { text: "취소", style: "cancel" },
    ]);
  };

  const toggleMarkingType = () => {
    setMarkingType((prev) =>
      prev === "multi-dot" ? "multi-period" : "multi-dot"
    );
  };

  const toggleRangeSelectionMode = () => {
    setIsRangeSelectionMode((prev) => !prev);
    if (isRangeSelectionMode) {
      // 범위 선택 모드 종료시 초기화
      setSelectedStartDate("");
      setSelectedEndDate("");
    }
  };

  const toggleYearView = () => {
    setShowYearView((prev) => !prev);
    if (!showYearView) {
      // 연간 달력으로 전환할 때 현재 선택된 달이 가운데 오도록 스크롤
      setTimeout(() => {
        const currentYear = dayjs(currentMonth).year();
        const todayYear = dayjs().year();
        const yearIndex = currentYear - todayYear + 5; // 현재 연도 기준으로 인덱스 계산

        yearScrollViewRef.current?.scrollTo({
          y: yearIndex * 400, // 현재 연도 위치로 스크롤
          animated: true, // 부드러운 애니메이션으로 이동
        });
      }, 200); // 애니메이션을 위한 대기 시간
    }
  };

  const handleDatePress = (date: any) => {
    const dateString = date.dateString;
    if (isRangeSelectionMode) {
      // 범위 선택 모드
      if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
        // 새로운 범위 시작
        setSelectedStartDate(dateString);
        setSelectedEndDate("");
        setSelectedDate(dateString);
      } else {
        // 범위 종료
        const start = dayjs(selectedStartDate);
        const end = dayjs(dateString);
        if (end.isBefore(start)) {
          // 시작일보다 이전 날짜를 선택한 경우 swap
          setSelectedStartDate(dateString);
          setSelectedEndDate(selectedStartDate);
        } else {
          setSelectedEndDate(dateString);
        }
        setSelectedDate(dateString);
      }
    } else {
      // 단일 날짜 선택 모드
      setSelectedDate(dateString);
      setSelectedScheduleId(null);
      setIsCalendarExpanded(false);
    }
  };

  return (
    <CalendarProvider
      key={`${currentMonth}-${selectedDate}-${showYearView}`} // 강제 리렌더링을 위한 key
      date={selectedDate || currentMonth}
      onDateChanged={(date) => {
        const newDate = dayjs(date);
        setCurrentMonth(newDate.format("YYYY-MM"));
        setSelectedDate(newDate.format("YYYY-MM-DD"));
        setIsCalendarExpanded(false);
      }}
      disabledOpacity={0.6}
    >
      <View style={{ flex: 1, backgroundColor: "white" }}>
        {/* 컨트롤 버튼들 - 연간 달력 모드일 때 숨김 */}
        {!showYearView && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20, // Apple Compact container padding
              paddingVertical: 16,
              backgroundColor: "#f5f5f7", // Apple Compact background
              borderBottomWidth: 1,
              borderBottomColor: "rgba(0, 0, 0, 0.08)", // Subtle divider
              flexWrap: "wrap",
              gap: 10, // Apple Compact card gap
            }}
          >
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                style={{
                  backgroundColor: showYearView ? "#1d1d1f" : "#ffffff", // Apple Compact primary or white
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 10, // Apple Compact button border radius
                  shadowColor: showYearView ? "#000" : "transparent",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: showYearView ? 0.04 : 0, // Apple Compact subtle shadow
                  shadowRadius: 4,
                  elevation: showYearView ? 2 : 0,
                  borderWidth: showYearView ? 0 : 1,
                  borderColor: "#86868b", // Apple Compact secondary text color
                  flexDirection: "row",
                  alignItems: "center",
                }}
                onPress={toggleYearView}
              >
                <Text
                  style={{
                    color: showYearView ? "#ffffff" : "#1d1d1f", // White when active, dark when inactive
                    fontSize: getResponsiveValue(13, 14, 15),
                    fontWeight: "600",
                    fontFamily: "Inter_600SemiBold",
                  }}
                >
                  {dayjs(currentMonth).format("YYYY")}
                </Text>
              </Pressable>

              <Pressable
                style={{
                  backgroundColor: "#ffffff", // Apple Compact white surface
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#86868b",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
                onPress={toggleMarkingType}
              >
                <MaterialCommunityIcons
                  name={
                    markingType === "multi-dot"
                      ? "circle-small"
                      : "calendar-range"
                  }
                  size={18}
                  color="#1d1d1f" // Apple Compact primary
                />
                <Text
                  style={{
                    color: "#1d1d1f", // Apple Compact primary text
                    fontSize: getResponsiveValue(13, 14, 15),
                    fontWeight: "600",
                    fontFamily: "Inter_600SemiBold",
                  }}
                >
                  {markingType === "multi-dot" ? "점" : "기간"}
                </Text>
              </Pressable>

              <Pressable
                style={{
                  backgroundColor: isRangeSelectionMode ? "#1d1d1f" : "#ffffff",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#86868b",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  shadowColor: isRangeSelectionMode ? "#000" : "transparent",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isRangeSelectionMode ? 0.04 : 0,
                  shadowRadius: 4,
                  elevation: isRangeSelectionMode ? 2 : 0,
                }}
                onPress={toggleRangeSelectionMode}
              >
                <MaterialCommunityIcons
                  name={
                    isRangeSelectionMode ? "calendar-check" : "calendar-cursor"
                  }
                  size={18}
                  color={isRangeSelectionMode ? "#ffffff" : "#1d1d1f"}
                />
                <Text
                  style={{
                    color: isRangeSelectionMode ? "#ffffff" : "#1d1d1f",
                    fontSize: getResponsiveValue(13, 14, 15),
                    fontWeight: "600",
                    fontFamily: "Inter_600SemiBold",
                  }}
                >
                  범위
                </Text>
              </Pressable>
            </View>

            {/* 범위 선택 모드일 때만 선택된 날짜 범위 표시 */}
            {isRangeSelectionMode && (selectedStartDate || selectedEndDate) && (
              <Text
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  fontWeight: "500",
                }}
              >
                {selectedStartDate && !selectedEndDate
                  ? `시작: ${dayjs(selectedStartDate).format("M/D")}`
                  : selectedStartDate && selectedEndDate
                  ? `${dayjs(selectedStartDate).format("M/D")} ~ ${dayjs(
                      selectedEndDate
                    ).format("M/D")}`
                  : ""}
              </Text>
            )}
          </View>
        )}

        {/* 연간 달력 또는 월간 달력 */}
        {showYearView ? (
          /* 연간 달력 뷰 */
          <ScrollView
            ref={yearScrollViewRef}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {Array.from({ length: 10 }, (_, yearIndex) => {
              const todayYear = dayjs().year(); // 오늘 날짜의 연도
              const year = todayYear - 5 + yearIndex;
              return (
                <View key={year} style={{ padding: 16, minHeight: 400 }}>
                  {/* 연도 헤더 */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "700",
                        fontFamily: "Inter_700Bold",
                        color: "#1f2937",
                      }}
                    >
                      {year}년
                    </Text>
                    {year === todayYear && (
                      <View
                        style={{
                          backgroundColor: colors.primary,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontSize: 12,
                            fontWeight: "600",
                            fontFamily: "Inter_600SemiBold",
                          }}
                        >
                          올해
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* 12개월 달력 그리드 */}
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    {Array.from({ length: 12 }, (_, monthIndex) => {
                      const month = monthIndex + 1;
                      const monthDate = dayjs(
                        `${year}-${month.toString().padStart(2, "0")}-01`
                      );
                      const monthString = monthDate.format("YYYY-MM");

                      // 해당 월에 스케줄이 있는지 확인
                      const hasSchedules = filteredSchedules.some(
                        (schedule) => {
                          const scheduleStart = dayjs(schedule.startDate);
                          const scheduleEnd = dayjs(schedule.endDate);
                          return (
                            scheduleStart.format("YYYY-MM") === monthString ||
                            scheduleEnd.format("YYYY-MM") === monthString ||
                            (scheduleStart.isBefore(
                              monthDate.endOf("month"),
                              "day"
                            ) &&
                              scheduleEnd.isAfter(
                                monthDate.startOf("month"),
                                "day"
                              ))
                          );
                        }
                      );

                      // 작은 달력 생성
                      const firstDay = monthDate.startOf("month");
                      const lastDay = monthDate.endOf("month");
                      const startDate = firstDay.startOf("week");
                      const endDate = lastDay.endOf("week");
                      const days = [];
                      let current = startDate;
                      while (current.isSameOrBefore(endDate, "day")) {
                        days.push(current);
                        current = current.add(1, "day");
                      }

                      return (
                        <Pressable
                          key={`${year}-${month}`}
                          style={{
                            width: isMobile ? "30%" : isTablet ? "25%" : "20%",
                            aspectRatio: 1.2, // 달력 비율 조정 (더 직사각형으로)
                            backgroundColor: "white",
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: hasSchedules
                              ? colors.primary
                              : "#e5e7eb",
                            padding: 6, // 패딩 증가
                            marginBottom: 8,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 2,
                          }}
                          onPress={() => {
                            // 연간 뷰 종료
                            setShowYearView(false);

                            // 월 업데이트 (1일로 설정하지 않음)
                            setCurrentMonth(monthString);

                            // 선택된 날짜를 해당 월의 첫 번째 날로 설정하되,
                            // 실제로는 해당 월의 모든 일정이 표시되도록 함
                            const firstDayOfMonth =
                              monthDate.format("YYYY-MM-DD");
                            setSelectedDate(firstDayOfMonth);

                            // 달력 축소 (토글 버튼 닫힌 상태)
                            setIsCalendarExpanded(false);

                            // 추가 강제 업데이트 (ExpandableCalendar current prop 반영)
                            setTimeout(() => {
                              setCurrentMonth(monthString);
                            }, 100);
                          }}
                        >
                          {/* 월 헤더 */}
                          <Text
                            style={{
                              fontSize: getResponsiveValue(10, 12, 14),
                              fontWeight: "600",
                              color: hasSchedules ? colors.primary : "#374151",
                              textAlign: "center",
                              marginBottom: 2,
                            }}
                          >
                            {month}월
                          </Text>

                          {/* 요일 헤더 */}
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-around",
                              marginBottom: 2,
                            }}
                          >
                            {["일", "월", "화", "수", "목", "금", "토"].map(
                              (day, index) => (
                                <Text
                                  key={index}
                                  style={{
                                    fontSize: getResponsiveValue(6, 7, 8),
                                    color: "#9ca3af",
                                    fontWeight: "500",
                                    width: getResponsiveValue(8, 10, 12),
                                    textAlign: "center",
                                  }}
                                >
                                  {day}
                                </Text>
                              )
                            )}
                          </View>

                          {/* 날짜들 */}
                          <View
                            style={{
                              flexDirection: "row",
                              flexWrap: "wrap",
                              justifyContent: "space-around",
                            }}
                          >
                            {days.map((day, dayIndex) => {
                              const isCurrentMonth = day.isSame(
                                monthDate,
                                "month"
                              );
                              const isToday = day.isSame(dayjs(), "day");
                              const dayString = day.format("YYYY-MM-DD");
                              const hasScheduleOnDay = schedules.some(
                                (schedule) => {
                                  const scheduleStart = dayjs(
                                    schedule.startDate
                                  );
                                  const scheduleEnd = dayjs(schedule.endDate);
                                  return (
                                    day.isSameOrAfter(scheduleStart, "day") &&
                                    day.isSameOrBefore(scheduleEnd, "day")
                                  );
                                }
                              );

                              return (
                                <View
                                  key={dayIndex}
                                  style={{
                                    width: getResponsiveValue(10, 12, 14),
                                    height: getResponsiveValue(10, 12, 14),
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 1,
                                    borderRadius: 2,
                                    backgroundColor: isToday
                                      ? colors.primary
                                      : hasScheduleOnDay
                                      ? "#e3f2fd"
                                      : "transparent",
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: getResponsiveValue(7, 8, 9),
                                      color: isCurrentMonth
                                        ? isToday
                                          ? "#ffffff"
                                          : hasScheduleOnDay
                                          ? colors.primary
                                          : "#374151"
                                        : "#d1d5db",
                                      fontWeight: isToday ? "700" : "500",
                                    }}
                                  >
                                    {day.format("D")}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>

                          {/* 스케줄 표시 점 */}
                          {hasSchedules && (
                            <View
                              style={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                width: getResponsiveValue(4, 5, 6),
                                height: getResponsiveValue(4, 5, 6),
                                borderRadius: getResponsiveValue(2, 2.5, 3),
                                backgroundColor: colors.primary,
                              }}
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <View
            style={{
              height: getResponsiveValue(350, 400, 450),
              borderBottomWidth: 1,
              borderBottomColor: "rgba(0, 0, 0, 0.08)", // Subtle divider
            }}
          >
            <CalendarList
              current={currentMonth}
              markingType={markingType}
              onDayPress={handleDatePress}
              renderHeader={(date: any) => {
                const monthDate = dayjs(date);
                return (
                  <View
                    style={{
                      width: "100%",
                      backgroundColor: "#ffffff",
                      borderBottomWidth: 1,
                      borderBottomColor: "rgba(0, 0, 0, 0.08)", // Subtle divider
                    }}
                  >
                    <Text
                      style={{
                        fontSize: getResponsiveValue(24, 28, 32),
                        fontWeight: "700",
                        fontFamily: "Inter_700Bold",
                        color: "#111827",
                        paddingLeft: 15,
                        paddingVertical: 10,
                        textAlign: "left",
                      }}
                    >
                      {monthDate.format("MMMM")}
                    </Text>
                  </View>
                );
              }}
              markedDates={(() => {
                const marked = { ...monthMarks };

                // 날짜 범위 선택 표시
                if (isRangeSelectionMode && selectedStartDate) {
                  if (selectedEndDate) {
                    // 범위가 완성된 경우
                    let current = dayjs(selectedStartDate);
                    const end = dayjs(selectedEndDate);
                    while (current.isSameOrBefore(end, "day")) {
                      const dateStr = current.format("YYYY-MM-DD");
                      marked[dateStr] = {
                        ...marked[dateStr],
                        selected: true,
                        selectedColor: colors.primary, // 테마 색상 사용
                        selectedTextColor: "white",
                      };
                      current = current.add(1, "day");
                    }
                  } else {
                    // 시작일만 선택된 경우
                    marked[selectedStartDate] = {
                      ...marked[selectedStartDate],
                      selected: true,
                      selectedColor: colors.primary, // 테마 색상 사용
                      selectedTextColor: "white",
                    };
                  }
                } else if (selectedDate) {
                  // 일반 날짜 선택
                  marked[selectedDate] = {
                    ...((marked[selectedDate] ??
                      (markingType === "multi-dot"
                        ? { dots: [] }
                        : { periods: [] })) as any),
                    selected: true,
                    selectedColor: "rgba(37,99,235,0.3)",
                  } as any;
                }

                // 연간 달력에서 월별 선택 시 해당 월의 첫 번째 날 표시
                if (showYearView === false && currentMonth && !selectedDate) {
                  const firstDayOfMonth =
                    dayjs(currentMonth).format("YYYY-MM-DD");
                  if (!marked[firstDayOfMonth]) {
                    marked[firstDayOfMonth] = {};
                  }
                  marked[firstDayOfMonth] = {
                    ...marked[firstDayOfMonth],
                    selected: true,
                    selectedColor: colors.primary,
                    selectedTextColor: "white",
                  };
                }

                return marked;
              })()}
              pastScrollRange={12}
              futureScrollRange={12}
              scrollEnabled={true}
              showScrollIndicator={false}
              hideArrows={true}
              hideExtraDays={true}
              firstDay={1}
              // 성능 최적화 옵션 - 더 부드러운 스크롤
              removeClippedSubviews={Platform.OS === "android"}
              maxToRenderPerBatch={1}
              windowSize={10}
              initialNumToRender={2}
              updateCellsBatchingPeriod={100}
              scrollEventThrottle={8}
              // 부드러운 스크롤을 위한 추가 옵션
              enableSwipeMonths={true}
              disableMonthChange={false}
              horizontal={false}
              theme={
                {
                  // 기본 색상 - 카테고리별로 다양한 색상 지원
                  backgroundColor: "#ffffff",
                  calendarBackground: "#ffffff",

                  // 선택된 날짜
                  selectedDayBackgroundColor: colors.primary,
                  selectedDayTextColor: "#ffffff",

                  // 오늘 날짜 - 강조
                  todayTextColor: colors.primary,
                  todayBackgroundColor: "#f0f9ff",

                  // 텍스트 색상
                  dayTextColor: "#1f2937",
                  textDisabledColor: "#d1d5db",
                  monthTextColor: "#111827",

                  // 요일 헤더
                  textSectionTitleColor: "#6b7280",
                  textDayHeaderFontSize: 13,
                  textDayHeaderFontWeight: "600",

                  // 날짜 폰트
                  textDayFontSize: 16,
                  textDayFontWeight: "600",
                  textMonthFontSize: 18,
                  textMonthFontWeight: "700",

                  // 점 마커 스타일
                  dotColor: colors.primary,
                  dotStyle: { marginTop: -2 },
                } as any
              }
              onVisibleMonthsChange={(months) => {
                if (months.length > 0) {
                  const newMonth = dayjs(months[0].dateString);
                  const monthString = newMonth.format("YYYY-MM");
                  setCurrentMonth(monthString);

                  // 스크롤 중일 때만 자동으로 날짜 선택 (날짜 클릭이 아닐 때)
                  if (
                    !selectedDate ||
                    !dayjs(selectedDate).isSame(newMonth, "month")
                  ) {
                    const firstDayOfMonth = newMonth
                      .startOf("month")
                      .format("YYYY-MM-DD");
                    setSelectedDate(firstDayOfMonth);
                  }
                }
              }}
              calendarStyle={{
                paddingLeft: 15,
                paddingRight: 15,
              }}
              style={{
                height: getResponsiveValue(350, 400, 450),
              }}
            />
          </View>
        )}

        {/* 선택된 날짜의 스케줄 카드 목록 (접힌 상태) */}
        {selectedDate && !showYearView && !isCalendarExpanded && (
          <View
            style={{
              flex: 1,
              backgroundColor: "#f8f9fa",
            }}
          >
            {/* 헤더와 확장 버튼 */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 8,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text
                  style={{
                    fontSize: getResponsiveValue(18, 20, 22),
                    fontWeight: "600",
                    fontFamily: "Inter_600SemiBold",
                    color: "#1d1d1f", // Apple Compact primary text
                  }}
                >
                  {isRangeSelectionMode && selectedStartDate && selectedEndDate
                    ? `${dayjs(selectedStartDate).format("M월 D일")} ~ ${dayjs(
                        selectedEndDate
                      ).format("M월 D일")} 일정`
                    : dayjs(selectedDate).format("M월 D일 dddd") + " 일정"}
                </Text>

                {onAddSchedulePress && (
                  <Pressable
                    onPress={() => {
                      if (
                        isRangeSelectionMode &&
                        selectedStartDate &&
                        selectedEndDate
                      ) {
                        onAddSchedulePress(selectedStartDate, selectedEndDate);
                      } else {
                        onAddSchedulePress(selectedDate);
                      }
                    }}
                    style={{
                      backgroundColor: "#1d1d1f", // Apple Compact primary
                      borderRadius: 10,
                      width: 32,
                      height: 32,
                      justifyContent: "center",
                      alignItems: "center",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04, // Apple Compact subtle shadow
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Ionicons name="add" size={18} color="white" />
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => setIsCalendarExpanded(true)}
                style={{
                  backgroundColor: "#1d1d1f", // Apple Compact primary
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04, // Apple Compact subtle shadow
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <MaterialCommunityIcons
                  name="chevron-up"
                  size={20}
                  color="white"
                />
              </Pressable>
            </View>

            <ScrollView
              style={{ paddingHorizontal: 16, paddingTop: 8 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {(() => {
                // 선택된 날짜의 스케줄 사용
                const dailySchedules = selectedDateSchedules;

                const sortedSchedules = dailySchedules.slice().sort((a, b) => {
                  const aStart = (a.workers || [])
                    .flatMap((w) =>
                      (w.periods || [])
                        .filter((p: any) => p && p.startTime)
                        .map((p: any) =>
                          p && p.startTime
                            ? dayjs(`${p.workDate} ${p.startTime}`)
                            : null
                        )
                        .filter((d: any) => d !== null)
                    )
                    .sort(
                      (x, y) => (x?.valueOf() || 0) - (y?.valueOf() || 0)
                    )[0];
                  const bStart = (b.workers || [])
                    .flatMap((w) =>
                      (w.periods || [])
                        .filter((p: any) => p && p.startTime)
                        .map((p: any) =>
                          p && p.startTime
                            ? dayjs(`${p.workDate} ${p.startTime}`)
                            : null
                        )
                        .filter((d: any) => d !== null)
                    )
                    .sort(
                      (x, y) => (x?.valueOf() || 0) - (y?.valueOf() || 0)
                    )[0];
                  return (aStart?.valueOf() ?? 0) - (bStart?.valueOf() ?? 0);
                });

                if (sortedSchedules.length === 0) {
                  return (
                    <View
                      style={{
                        padding: 32,
                        alignItems: "center",
                        backgroundColor: "#ffffff", // Apple Compact white surface
                        borderRadius: 14, // Apple Compact card border radius
                        marginBottom: 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: getResponsiveValue(16, 17, 18),
                          color: "#86868b", // Apple Compact secondary text
                          textAlign: "center",
                        }}
                      >
                        이 날에는 일정이 없습니다.
                      </Text>
                    </View>
                  );
                }

                return (
                  <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {sortedSchedules.map((schedule) => {
                      const scheduleStart = (schedule.workers || [])
                        .flatMap((w) =>
                          (w.periods || [])
                            .filter((p: any) => p && p.startTime)
                            .map((p: any) =>
                              p && p.start ? dayjs(p.start) : null
                            )
                            .filter((d: any) => d !== null)
                        )
                        .sort(
                          (x, y) => (x?.valueOf() || 0) - (y?.valueOf() || 0)
                        )[0];
                      const scheduleEnd = (schedule.workers || [])
                        .flatMap((w) =>
                          (w.periods || [])
                            .filter((p: any) => p && p.end)
                            .map((p: any) => (p && p.end ? dayjs(p.end) : null))
                            .filter((d: any) => d !== null)
                        )
                        .sort(
                          (x, y) => (y?.valueOf() || 0) - (x?.valueOf() || 0)
                        )[0];

                      return (
                        <Pressable
                          key={schedule.instanceId ?? schedule.id}
                          style={{
                            backgroundColor: "#ffffff", // Apple Compact white surface
                            borderRadius: 14, // Apple Compact card border radius
                            padding: 16, // Apple Compact card padding
                            marginBottom: 10, // Apple Compact card gap
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.04, // Apple Compact very subtle shadow
                            shadowRadius: 4,
                            elevation: 2,
                          }}
                          onPress={() => onSchedulePress(schedule.id)}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: getResponsiveValue(16, 17, 18),
                                  fontWeight: "600",
                                  color: "#1d1d1f", // Apple Compact primary text
                                  marginBottom: 4,
                                }}
                              >
                                {schedule.title}
                              </Text>
                              <Text
                                style={{
                                  fontSize: getResponsiveValue(14, 15, 16),
                                  color: "#86868b", // Apple Compact secondary text
                                  marginBottom: 8,
                                }}
                              >
                                {schedule.address ||
                                  schedule.location ||
                                  "장소 미정"}
                              </Text>
                              {scheduleStart && scheduleEnd && (
                                <Text
                                  style={{
                                    fontSize: getResponsiveValue(13, 14, 15),
                                    color: "#1d1d1f", // Apple Compact primary text
                                    backgroundColor: "#f5f5f7", // Apple Compact background
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 6,
                                    alignSelf: "flex-start",
                                  }}
                                >
                                  {scheduleStart.format("HH:mm")} -{" "}
                                  {scheduleEnd.format("HH:mm")}
                                </Text>
                              )}
                            </View>
                            <View
                              style={{
                                backgroundColor: getCategoryColor(
                                  schedule.category
                                ),
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                                marginLeft: 8,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: "white",
                                  fontWeight: "500",
                                }}
                              >
                                {schedule.workers?.length || 0}명
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                );
              })()}
            </ScrollView>
          </View>
        )}

        {/* 확장된 카드 리스트 (전체 화면) */}
        {selectedDate && !showYearView && isCalendarExpanded && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#f8f9fa",
              zIndex: 1000,
            }}
          >
            {/* 헤더와 축소 버튼 */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 8,
                backgroundColor: "#ffffff",
                borderBottomWidth: 1,
                borderBottomColor: "rgba(0, 0, 0, 0.08)", // Subtle divider
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text
                  style={{
                    fontSize: getResponsiveValue(18, 20, 22),
                    fontWeight: "600",
                    fontFamily: "Inter_600SemiBold",
                    color: "#1d1d1f", // Apple Compact primary text
                  }}
                >
                  {isRangeSelectionMode && selectedStartDate && selectedEndDate
                    ? `${dayjs(selectedStartDate).format("M월 D일")} ~ ${dayjs(
                        selectedEndDate
                      ).format("M월 D일")} 일정`
                    : dayjs(selectedDate).format("M월 D일 dddd") + " 일정"}
                </Text>

                {onAddSchedulePress && (
                  <Pressable
                    onPress={() => {
                      if (
                        isRangeSelectionMode &&
                        selectedStartDate &&
                        selectedEndDate
                      ) {
                        onAddSchedulePress(selectedStartDate, selectedEndDate);
                      } else {
                        onAddSchedulePress(selectedDate);
                      }
                    }}
                    style={{
                      backgroundColor: "#1d1d1f", // Apple Compact primary
                      borderRadius: 10,
                      width: 32,
                      height: 32,
                      justifyContent: "center",
                      alignItems: "center",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04, // Apple Compact subtle shadow
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Ionicons name="add" size={18} color="white" />
                  </Pressable>
                )}
              </View>

              <Pressable
                onPress={() => setIsCalendarExpanded(false)}
                style={{
                  backgroundColor: "#1d1d1f", // Apple Compact primary
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04, // Apple Compact subtle shadow
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={20}
                  color="white"
                />
              </Pressable>
            </View>

            {/* 카드 리스트 */}
            <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
              {(() => {
                // 범위 선택 모드일 경우 범위 내의 모든 스케줄 표시
                const dailySchedules = filteredSchedules.filter((s) => {
                  const scheduleStart = dayjs(s.startDate);
                  const scheduleEnd = dayjs(s.endDate);

                  if (
                    isRangeSelectionMode &&
                    selectedStartDate &&
                    selectedEndDate
                  ) {
                    const rangeStart = dayjs(selectedStartDate);
                    const rangeEnd = dayjs(selectedEndDate);
                    return (
                      scheduleStart.isSameOrBefore(rangeEnd, "day") &&
                      scheduleEnd.isSameOrAfter(rangeStart, "day")
                    );
                  } else {
                    const selected = dayjs(selectedDate);
                    return (
                      selected.isSameOrAfter(scheduleStart, "day") &&
                      selected.isSameOrBefore(scheduleEnd, "day")
                    );
                  }
                });

                const sortedSchedules = dailySchedules.slice().sort((a, b) => {
                  const aStart = (a.workers || [])
                    .flatMap((w) =>
                      (w.periods || [])
                        .filter((p: any) => p && p.startTime)
                        .map((p: any) =>
                          p && p.startTime
                            ? dayjs(`${p.workDate} ${p.startTime}`)
                            : null
                        )
                        .filter((d: any) => d !== null)
                    )
                    .sort(
                      (x, y) => (x?.valueOf() || 0) - (y?.valueOf() || 0)
                    )[0];
                  const bStart = (b.workers || [])
                    .flatMap((w) =>
                      (w.periods || [])
                        .filter((p: any) => p && p.startTime)
                        .map((p: any) =>
                          p && p.startTime
                            ? dayjs(`${p.workDate} ${p.startTime}`)
                            : null
                        )
                        .filter((d: any) => d !== null)
                    )
                    .sort(
                      (x, y) => (x?.valueOf() || 0) - (y?.valueOf() || 0)
                    )[0];
                  return (aStart?.valueOf() ?? 0) - (bStart?.valueOf() ?? 0);
                });

                if (sortedSchedules.length === 0) {
                  return (
                    <View
                      style={{
                        padding: 32,
                        alignItems: "center",
                        backgroundColor: "#ffffff", // Apple Compact white surface
                        borderRadius: 14, // Apple Compact card border radius
                        marginBottom: 16,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: getResponsiveValue(16, 17, 18),
                          color: "#86868b", // Apple Compact secondary text
                          textAlign: "center",
                        }}
                      >
                        이 날에는 일정이 없습니다.
                      </Text>
                    </View>
                  );
                }

                return (
                  <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {sortedSchedules.map((schedule) => {
                      const scheduleStart = (schedule.workers || [])
                        .flatMap((w) =>
                          (w.periods || [])
                            .filter((p: any) => p && p.startTime)
                            .map((p: any) =>
                              p && p.start ? dayjs(p.start) : null
                            )
                            .filter((d: any) => d !== null)
                        )
                        .sort(
                          (x, y) => (x?.valueOf() || 0) - (y?.valueOf() || 0)
                        )[0];
                      const scheduleEnd = (schedule.workers || [])
                        .flatMap((w) =>
                          (w.periods || [])
                            .filter((p: any) => p && p.end)
                            .map((p: any) => (p && p.end ? dayjs(p.end) : null))
                            .filter((d: any) => d !== null)
                        )
                        .sort(
                          (x, y) => (y?.valueOf() || 0) - (x?.valueOf() || 0)
                        )[0];

                      return (
                        <Pressable
                          key={schedule.instanceId ?? schedule.id}
                          style={{
                            backgroundColor: "#ffffff", // Apple Compact white surface
                            borderRadius: 14, // Apple Compact card border radius
                            padding: 16, // Apple Compact card padding
                            marginBottom: 10, // Apple Compact card gap
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.04, // Apple Compact very subtle shadow
                            shadowRadius: 4,
                            elevation: 2,
                          }}
                          onPress={() => onSchedulePress(schedule.id)}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: getResponsiveValue(16, 17, 18),
                                  fontWeight: "600",
                                  color: "#1d1d1f", // Apple Compact primary text
                                  marginBottom: 4,
                                }}
                              >
                                {schedule.title}
                              </Text>
                              <Text
                                style={{
                                  fontSize: getResponsiveValue(14, 15, 16),
                                  color: "#86868b", // Apple Compact secondary text
                                  marginBottom: 8,
                                }}
                              >
                                {schedule.address ||
                                  schedule.location ||
                                  "장소 미정"}
                              </Text>
                              {scheduleStart && scheduleEnd && (
                                <Text
                                  style={{
                                    fontSize: getResponsiveValue(13, 14, 15),
                                    color: "#1d1d1f", // Apple Compact primary text
                                    backgroundColor: "#f5f5f7", // Apple Compact background
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 6,
                                    alignSelf: "flex-start",
                                  }}
                                >
                                  {scheduleStart.format("HH:mm")} -{" "}
                                  {scheduleEnd.format("HH:mm")}
                                </Text>
                              )}
                            </View>
                            <View
                              style={{
                                backgroundColor: getCategoryColor(
                                  schedule.category
                                ),
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                                marginLeft: 8,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: "white",
                                  fontWeight: "500",
                                }}
                              >
                                {schedule.workers?.length || 0}명
                              </Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                );
              })()}
            </View>
          </View>
        )}

        {/* 중복된 하단 일정 화면 제거 */}
        {false && Platform.OS !== "web" && selectedDate && (
          <View style={styles.mobileScheduleList}>
            <Text style={styles.mobileScheduleListTitle}>
              {dayjs(selectedDate).format("M월 D일 dddd")} 일정
            </Text>
            {(() => {})()}
          </View>
        )}

        {/* 모달 */}
        {modalVisible && (
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              transform: [{ translateY }],
            }}
          >
            <PanGestureHandler
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={onHandlerStateChange}
            >
              <Animated.View
                style={{
                  flex: 1,
                  justifyContent: "flex-end",
                  transform: [{ translateY }],
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "white",
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    overflow: "hidden",
                  }}
                >
                  {/* 드래그 핸들러 */}
                  <View
                    style={{
                      height: 30,
                      justifyContent: "center",
                      alignItems: "center",
                      borderTopLeftRadius: 20,
                      borderTopRightRadius: 20,
                      backgroundColor: "#f5f5f7", // Apple Compact background
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 4,
                        backgroundColor: "#9ca3af",
                        borderRadius: 2,
                      }}
                    />
                  </View>

                  {/* 모달 내용 */}
                  <View style={{ flex: 1 }}>
                    {false && (
                      <View style={{ flex: 1 }}>
                        {/* 날짜 헤더 */}
                        <View
                          style={{
                            padding: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: "rgba(0, 0, 0, 0.08)", // Subtle divider
                          }}
                        >
                          <Text
                            style={{
                              fontSize: getResponsiveValue(18, 20, 22),
                              fontWeight: "600",
                              fontFamily: "Inter_600SemiBold",
                              textAlign: "center",
                            }}
                          >
                            {dayjs(selectedDate).format("YYYY년 M월 D일 dddd")}
                          </Text>
                        </View>

                        {/* 타임테이블 */}
                        <ScrollView style={{ flex: 1 }}>
                          <View
                            style={{ flexDirection: "row", minHeight: 960 }}
                          >
                            {/* 시간 라벨 */}
                            <View
                              style={{ width: 60, backgroundColor: "#f8f9fa" }}
                            >
                              {Array.from({ length: 24 }, (_, i) => {
                                const hour = i;
                                return (
                                  <View
                                    key={hour}
                                    style={{
                                      height: 40,
                                      justifyContent: "center",
                                      paddingLeft: 8,
                                    }}
                                  >
                                    <Text
                                      style={{ fontSize: 11, color: "#666" }}
                                    >
                                      {hour.toString().padStart(2, "0")}:00
                                    </Text>
                                  </View>
                                );
                              })}
                            </View>

                            {/* 타임테이블 영역 */}
                            <View
                              style={{
                                flex: 1,
                                position: "relative",
                                minHeight: 960,
                              }}
                            >
                              {/* 시간 라인 */}
                              {Array.from({ length: 24 }, (_, i) => (
                                <View
                                  key={i}
                                  style={{
                                    height: 40,
                                    borderBottomWidth: 1,
                                    borderBottomColor: "rgba(0, 0, 0, 0.08)", // Subtle divider
                                  }}
                                />
                              ))}

                              {/* 스케줄 블럭들 */}
                              {selectedDateSchedules.map((schedule, index) => {
                                const position = getSchedulePosition(
                                  schedule,
                                  40
                                );

                                // 시간 범위가 0~23시 내에 있는지 확인
                                if (position.top < 0 || position.top > 920) {
                                  return null;
                                }

                                // 겹치는 스케줄들을 찾아서 위치 계산
                                const overlappingSchedules =
                                  selectedDateSchedules.filter((s, i) => {
                                    if (i === index) return false;
                                    const otherPos = getSchedulePosition(s, 40);
                                    return !(
                                      position.top + position.height <=
                                        otherPos.top ||
                                      position.top >=
                                        otherPos.top + otherPos.height
                                    );
                                  });

                                const totalOverlapping =
                                  overlappingSchedules.length + 1;
                                const blockWidth = 100 / totalOverlapping - 2;
                                const blockLeft =
                                  (index % totalOverlapping) *
                                    (100 / totalOverlapping) +
                                  1;

                                // 시작/종료 시간 표시
                                const times = (schedule.workers || []).flatMap(
                                  (w) =>
                                    (w.periods || []).map((p) => ({
                                      start: dayjs(
                                        `${p.workDate} ${p.startTime}`
                                      ),
                                      end: dayjs(`${p.workDate} ${p.endTime}`),
                                    }))
                                );
                                const start = times.reduce(
                                  (
                                    min: dayjs.Dayjs,
                                    t: { start: dayjs.Dayjs; end: dayjs.Dayjs }
                                  ) => (t.start.isBefore(min) ? t.start : min),
                                  times[0].start
                                );
                                const end = times.reduce(
                                  (
                                    max: dayjs.Dayjs,
                                    t: { start: dayjs.Dayjs; end: dayjs.Dayjs }
                                  ) => (t.end.isAfter(max) ? t.end : max),
                                  times[0].end
                                );

                                return (
                                  <Pressable
                                    key={schedule.instanceId ?? schedule.id}
                                    onPress={() => onSchedulePress(schedule.id)}
                                    style={{
                                      position: "absolute",
                                      top: position.top,
                                      height: Math.max(position.height, 20),
                                      left: `${blockLeft}%`,
                                      width: `${blockWidth}%`,
                                      backgroundColor: getCategoryColor(
                                        schedule.category
                                      ),
                                      borderRadius: 6,
                                      padding: 4,
                                      margin: 1,
                                      shadowColor: "#000",
                                      shadowOffset: { width: 0, height: 1 },
                                      shadowOpacity: 0.2,
                                      shadowRadius: 2,
                                      elevation: 2,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        fontWeight: "600",
                                        color: "white",
                                        lineHeight: 12,
                                      }}
                                      numberOfLines={1}
                                    >
                                      {schedule.title}
                                    </Text>
                                    <Text
                                      style={{
                                        fontSize: 9,
                                        color: "white",
                                        lineHeight: 10,
                                        marginTop: 1,
                                      }}
                                      numberOfLines={1}
                                    >
                                      {start.format("HH:mm")} -{" "}
                                      {end.format("HH:mm")}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          </View>
                        </ScrollView>
                      </View>
                    )}

                    {modalType === "detail" && selectedScheduleId && (
                      <View style={{ flex: 1 }}>
                        {/* 상세 헤더 */}
                        <View
                          style={{
                            padding: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: "rgba(0, 0, 0, 0.08)", // Subtle divider
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <View style={{ flex: 1 }} />
                          <Pressable
                            onPress={() => {
                              // 스케줄 수정 모달 열기
                              setShowEditModal(true);
                            }}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: "#2563eb",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons
                              name="create-outline"
                              size={20}
                              color="white"
                            />
                          </Pressable>
                        </View>

                        {/* 상세 내용 */}
                        <View style={{ padding: 16 }}>
                          {(() => {
                            console.log(
                              "Selected Schedule ID:",
                              selectedScheduleId
                            );
                            console.log(
                              "Available schedules:",
                              filteredSchedules.map((s) => ({
                                id: s.id,
                                title: s.title,
                              }))
                            );
                            const schedule = filteredSchedules.find(
                              (s) => s.id === selectedScheduleId
                            );
                            if (!schedule) {
                              console.log(
                                "Schedule not found for ID:",
                                selectedScheduleId
                              );
                              return (
                                <View>
                                  <Text
                                    style={{
                                      fontSize: getResponsiveValue(16, 17, 18),
                                      color: "#ef4444",
                                      marginBottom: 16,
                                    }}
                                  >
                                    스케쥴을 찾을 수 없습니다. (ID:{" "}
                                    {selectedScheduleId})
                                  </Text>
                                  <Text
                                    style={{ fontSize: 14, color: "#6b7280" }}
                                  >
                                    사용 가능한 스케쥴:
                                  </Text>
                                  {filteredSchedules.map((s, index) => (
                                    <Text
                                      key={index}
                                      style={{ fontSize: 12, color: "#6b7280" }}
                                    >
                                      - {s.title} (ID: {s.id})
                                    </Text>
                                  ))}
                                </View>
                              );
                            }
                            return (
                              <View>
                                <Text
                                  style={{
                                    fontSize: 24,
                                    fontWeight: "bold",
                                    marginBottom: 16,
                                    color: "#1f2937",
                                  }}
                                >
                                  {schedule.title}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: getResponsiveValue(16, 17, 18),
                                    marginBottom: 16,
                                    color: "#1d1d1f", // Apple Compact primary text
                                  }}
                                >
                                  {schedule.startDate === schedule.endDate
                                    ? dayjs(schedule.startDate).format(
                                        "YYYY년 M월 D일 dddd"
                                      )
                                    : `${dayjs(schedule.startDate).format(
                                        "M월 D일"
                                      )} - ${dayjs(schedule.endDate).format(
                                        "M월 D일"
                                      )}`}
                                </Text>
                                <Text
                                  style={{
                                    fontSize: getResponsiveValue(16, 17, 18),
                                    marginBottom: 16,
                                    color: "#1d1d1f", // Apple Compact primary text
                                  }}
                                >
                                  {schedule.description || "설명이 없습니다."}
                                </Text>

                                {/* 주소 정보 */}
                                <View style={{ marginBottom: 16 }}>
                                  <Text
                                    style={{
                                      fontSize: getResponsiveValue(14, 15, 16),
                                      fontWeight: "600",
                                      color: "#1d1d1f", // Apple Compact primary text
                                      marginBottom: 8,
                                    }}
                                  >
                                    주소
                                  </Text>
                                  <View
                                    style={{ flexDirection: "row", gap: 8 }}
                                  >
                                    <TextInput
                                      style={{
                                        flex: 1,
                                        borderWidth: 1,
                                        borderColor: "#d1d5db",
                                        borderRadius: 6,
                                        padding: 12,
                                        fontSize: getResponsiveValue(
                                          14,
                                          15,
                                          16
                                        ),
                                        backgroundColor: "white",
                                      }}
                                      value={schedule.address || ""}
                                      onChangeText={(text) => {
                                        setSchedules((prevSchedules) =>
                                          prevSchedules.map((s) =>
                                            s.id === selectedScheduleId
                                              ? { ...s, address: text }
                                              : s
                                          )
                                        );
                                      }}
                                      onBlur={async () => {
                                        // 입력이 끝나면 DB에 저장
                                        if (selectedScheduleId) {
                                          try {
                                            const db = getDatabase();
                                            const currentSchedule =
                                              schedules.find(
                                                (s) =>
                                                  s.id === selectedScheduleId
                                              );
                                            if (currentSchedule) {
                                              await db.updateSchedule(
                                                selectedScheduleId,
                                                {
                                                  address:
                                                    currentSchedule.address,
                                                }
                                              );
                                              console.log(
                                                "주소가 DB에 저장되었습니다"
                                              );
                                            }
                                          } catch (error) {
                                            console.error(
                                              "주소 저장 오류:",
                                              error
                                            );
                                          }
                                        }
                                      }}
                                      placeholder="주소를 입력하세요"
                                    />
                                    <Pressable
                                      style={{
                                        backgroundColor: "#2563eb",
                                        paddingHorizontal: 12,
                                        paddingVertical: 12,
                                        borderRadius: 6,
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                      onPress={() => {
                                        if (Platform.OS === "web") {
                                          // 웹에서는 기존 방식 사용
                                          openAddressSearch((result) => {
                                            setSchedules((prevSchedules) =>
                                              prevSchedules.map((s) =>
                                                s.id === selectedScheduleId
                                                  ? {
                                                      ...s,
                                                      address:
                                                        result.roadAddress,
                                                    }
                                                  : s
                                              )
                                            );
                                            Alert.alert(
                                              "주소 선택",
                                              `선택된 주소: ${result.roadAddress}`
                                            );
                                          });
                                        } else {
                                          // 앱에서는 WebView 모달 사용
                                          setIsAddressSearchVisible(true);
                                        }
                                      }}
                                    >
                                      <Text
                                        style={{
                                          color: "white",
                                          fontSize: getResponsiveValue(
                                            12,
                                            13,
                                            14
                                          ),
                                          fontWeight: "600",
                                        }}
                                      >
                                        주소 검색
                                      </Text>
                                    </Pressable>
                                  </View>

                                  {/* 지도 연동 버튼들 */}
                                  {(schedule.address || schedule.location) && (
                                    <View style={{ marginTop: 8 }}>
                                      <Text
                                        style={{
                                          fontSize: getResponsiveValue(
                                            12,
                                            13,
                                            14
                                          ),
                                          color: "#86868b", // Apple Compact secondary text
                                          marginBottom: 8,
                                        }}
                                      >
                                        지도에서 보기
                                      </Text>
                                      <View
                                        style={{ flexDirection: "row", gap: 8 }}
                                      >
                                        <Pressable
                                          style={{
                                            backgroundColor: "#FFEB3B",
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            borderRadius: 6,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flex: 1,
                                          }}
                                          onPress={() => {
                                            const address =
                                              schedule.address ||
                                              schedule.location!;
                                            if (Platform.OS === "web") {
                                              openKakaoMap(address);
                                            } else {
                                              openMapApp(address, "kakao");
                                            }
                                          }}
                                        >
                                          <View
                                            style={{
                                              flexDirection: "row",
                                              alignItems: "center",
                                              gap: 4,
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: getResponsiveValue(
                                                  12,
                                                  13,
                                                  14
                                                ),
                                                fontWeight: "600",
                                                color: "#000",
                                              }}
                                            >
                                              카카오맵
                                            </Text>
                                            <Ionicons
                                              name="map"
                                              size={14}
                                              color="#000"
                                            />
                                          </View>
                                        </Pressable>

                                        <Pressable
                                          style={{
                                            backgroundColor: "#03C75A",
                                            paddingHorizontal: 12,
                                            paddingVertical: 8,
                                            borderRadius: 6,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flex: 1,
                                          }}
                                          onPress={() => {
                                            const address =
                                              schedule.address ||
                                              schedule.location!;
                                            if (Platform.OS === "web") {
                                              openNaverMap(address);
                                            } else {
                                              openMapApp(address, "naver");
                                            }
                                          }}
                                        >
                                          <View
                                            style={{
                                              flexDirection: "row",
                                              alignItems: "center",
                                              gap: 4,
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: getResponsiveValue(
                                                  12,
                                                  13,
                                                  14
                                                ),
                                                fontWeight: "600",
                                                color: "#fff",
                                              }}
                                            >
                                              네이버지도
                                            </Text>
                                            <Ionicons
                                              name="map"
                                              size={14}
                                              color="#fff"
                                            />
                                          </View>
                                        </Pressable>

                                        {Platform.OS !== "web" && (
                                          <Pressable
                                            style={{
                                              backgroundColor: "#4285F4",
                                              paddingHorizontal: 12,
                                              paddingVertical: 8,
                                              borderRadius: 6,
                                              alignItems: "center",
                                              justifyContent: "center",
                                              flex: 1,
                                            }}
                                            onPress={() => {
                                              const address =
                                                schedule.address ||
                                                schedule.location!;
                                              openMapApp(address, "google");
                                            }}
                                          >
                                            <View
                                              style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 4,
                                              }}
                                            >
                                              <Text
                                                style={{
                                                  fontSize: getResponsiveValue(
                                                    12,
                                                    13,
                                                    14
                                                  ),
                                                  fontWeight: "600",
                                                  color: "#fff",
                                                }}
                                              >
                                                구글맵
                                              </Text>
                                              <Ionicons
                                                name="map"
                                                size={14}
                                                color="#fff"
                                              />
                                            </View>
                                          </Pressable>
                                        )}
                                      </View>
                                    </View>
                                  )}
                                </View>

                                {/* 일하는 사람들 간단 정보 */}
                                <View style={{ marginTop: 16 }}>
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
                                        fontSize: getResponsiveValue(
                                          18,
                                          20,
                                          22
                                        ),
                                        fontWeight: "600",
                                      }}
                                    >
                                      일하는 사람들
                                    </Text>
                                    <View
                                      style={{ flexDirection: "row", gap: 8 }}
                                    >
                                      <Pressable
                                        onPress={() => {
                                          console.log(
                                            "Opening add worker modal for schedule:",
                                            selectedScheduleId
                                          );
                                          const currentSchedule =
                                            schedules.find(
                                              (s) => s.id === selectedScheduleId
                                            );
                                          if (currentSchedule) {
                                            // 근무 기간 생성
                                            const workStartDate =
                                              currentSchedule.startDate;
                                            const workEndDate =
                                              currentSchedule.endDate;
                                            const startDate =
                                              dayjs(workStartDate);
                                            const endDate = dayjs(workEndDate);
                                            const dailyPeriods: Array<{
                                              date: string;
                                              startTime: string;
                                              endTime: string;
                                            }> = [];

                                            let currentDate = startDate;
                                            while (
                                              currentDate.isSameOrBefore(
                                                endDate,
                                                "day"
                                              )
                                            ) {
                                              dailyPeriods.push({
                                                date: currentDate.format(
                                                  "YYYY-MM-DD"
                                                ),
                                                startTime: "09:00",
                                                endTime: "18:00",
                                              });
                                              currentDate = currentDate.add(
                                                1,
                                                "day"
                                              );
                                            }

                                            setNewWorker((prev) => ({
                                              ...prev,
                                              workStartDate: workStartDate,
                                              workEndDate: workEndDate,
                                              dailyWorkPeriods: dailyPeriods,
                                            }));
                                          }
                                          setValidationError("");
                                          setShowAddWorkerModal(true);
                                        }}
                                        style={{
                                          backgroundColor: "#10b981",
                                          paddingHorizontal: 12,
                                          paddingVertical: 6,
                                          borderRadius: 6,
                                        }}
                                      >
                                        <Text
                                          style={{
                                            color: "white",
                                            fontSize: getResponsiveValue(
                                              12,
                                              13,
                                              14
                                            ),
                                          }}
                                        >
                                          + 추가
                                        </Text>
                                      </Pressable>
                                      <Pressable
                                        onPress={() => {
                                          setModalType("worker-detail");
                                          setSelectedWorkerIndex(0); // 첫 번째 근로자로 초기화
                                        }}
                                        style={{
                                          backgroundColor: "#2563eb",
                                          paddingHorizontal: 12,
                                          paddingVertical: 6,
                                          borderRadius: 6,
                                        }}
                                      >
                                        <Text
                                          style={{
                                            color: "white",
                                            fontSize: getResponsiveValue(
                                              12,
                                              13,
                                              14
                                            ),
                                          }}
                                        >
                                          상세보기
                                        </Text>
                                      </Pressable>
                                    </View>
                                  </View>

                                  {(schedule.workers || []).map(
                                    (workerInfo, index) => (
                                      <WorkerCard
                                        key={index}
                                        worker={workerInfo.worker}
                                        periods={workerInfo.periods}
                                        paid={workerInfo.paid}
                                        onTogglePaid={(paid) => {
                                          const updatedSchedules = [
                                            ...schedules,
                                          ];
                                          const scheduleIndex =
                                            updatedSchedules.findIndex(
                                              (s) => s.id === schedule.id
                                            );
                                          if (scheduleIndex !== -1) {
                                            if (
                                              updatedSchedules[scheduleIndex]
                                                .workers
                                            ) {
                                              updatedSchedules[
                                                scheduleIndex
                                              ].workers![index].paid = paid;
                                            }
                                            setSchedules(updatedSchedules);
                                          }
                                        }}
                                        onCall={(phone) => {
                                          const url = `tel:${phone}`;
                                          Linking.openURL(url).catch(() => {
                                            Alert.alert(
                                              "오류",
                                              "전화 앱을 열 수 없습니다."
                                            );
                                          });
                                        }}
                                        onSMS={(phone) => {
                                          const url = `sms:${phone}`;
                                          Linking.openURL(url).catch(() => {
                                            Alert.alert(
                                              "오류",
                                              "메시지 앱을 열 수 없습니다."
                                            );
                                          });
                                        }}
                                        onDelete={async (workerId) => {
                                          await removeWorkerFromSchedule(
                                            schedule.id,
                                            workerId
                                          );
                                        }}
                                      />
                                    )
                                  )}
                                </View>
                              </View>
                            );
                          })()}
                        </View>
                      </View>
                    )}

                    {modalType === "worker-detail" && selectedScheduleId && (
                      <View style={{ flex: 1 }}>
                        {/* 상세 헤더 */}
                        <View
                          style={{
                            padding: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: "rgba(0, 0, 0, 0.08)", // Subtle divider
                          }}
                        >
                          <Pressable
                            onPress={() => {
                              setModalType("detail");
                              setSelectedWorkerIndex(null);
                            }}
                          >
                            <Text style={{ fontSize: 16, color: "#2563eb" }}>
                              ← 스케줄 상세로
                            </Text>
                          </Pressable>
                        </View>

                        {/* 일하는 사람들 그리드 */}
                        <ScrollView style={{ flex: 1, padding: 16 }}>
                          {(() => {
                            const schedule = schedules.find(
                              (s) => s.id === selectedScheduleId
                            );
                            if (!schedule) {
                              return (
                                <Text>스케줄 정보를 찾을 수 없습니다.</Text>
                              );
                            }

                            return (
                              <View>
                                <View
                                  style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 16,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 20,
                                      fontWeight: "bold",
                                    }}
                                  >
                                    일하는 사람들 관리
                                  </Text>
                                  <Pressable
                                    onPress={() => {
                                      console.log(
                                        "Opening add worker modal for schedule:",
                                        selectedScheduleId
                                      );
                                      const currentSchedule = schedules.find(
                                        (s) => s.id === selectedScheduleId
                                      );
                                      if (currentSchedule) {
                                        // 근무 기간 생성
                                        const workStartDate =
                                          currentSchedule.startDate;
                                        const workEndDate =
                                          currentSchedule.endDate;
                                        const startDate = dayjs(workStartDate);
                                        const endDate = dayjs(workEndDate);
                                        const dailyPeriods: Array<{
                                          date: string;
                                          startTime: string;
                                          endTime: string;
                                        }> = [];

                                        let currentDate = startDate;
                                        while (
                                          currentDate.isSameOrBefore(
                                            endDate,
                                            "day"
                                          )
                                        ) {
                                          dailyPeriods.push({
                                            date: currentDate.format(
                                              "YYYY-MM-DD"
                                            ),
                                            startTime: "09:00",
                                            endTime: "18:00",
                                          });
                                          currentDate = currentDate.add(
                                            1,
                                            "day"
                                          );
                                        }

                                        setNewWorker((prev) => ({
                                          ...prev,
                                          workStartDate: workStartDate,
                                          workEndDate: workEndDate,
                                          dailyWorkPeriods: dailyPeriods,
                                        }));
                                      }
                                      setValidationError("");
                                      setShowAddWorkerModal(true);
                                    }}
                                    style={{
                                      backgroundColor: "#10b981",
                                      paddingHorizontal: 12,
                                      paddingVertical: 8,
                                      borderRadius: 6,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "white",
                                        fontSize: getResponsiveValue(
                                          14,
                                          15,
                                          16
                                        ),
                                        fontWeight: "600",
                                      }}
                                    >
                                      + 근로자 추가
                                    </Text>
                                  </Pressable>
                                </View>

                                {/* 그리드 레이아웃 */}
                                <View
                                  style={{
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                    justifyContent: "space-between",
                                    gap: 12,
                                  }}
                                >
                                  {(schedule.workers || []).map(
                                    (workerInfo, index) => (
                                      <View
                                        key={index}
                                        style={{
                                          backgroundColor: "#f5f5f7", // Apple Compact background
                                          padding: 16,
                                          borderRadius: 12,
                                          width: "48%",
                                          minHeight: 200,
                                          borderWidth: 1,
                                          borderColor: "#e5e7eb",
                                        }}
                                      >
                                        {/* 근로자 이름 */}
                                        <Text
                                          style={{
                                            fontSize: getResponsiveValue(
                                              18,
                                              20,
                                              22
                                            ),
                                            fontWeight: "600",
                                            marginBottom: 12,
                                            textAlign: "center",
                                          }}
                                        >
                                          {workerInfo.worker.name}
                                        </Text>

                                        {/* 전화번호 */}
                                        <View style={{ marginBottom: 12 }}>
                                          <Text
                                            style={{
                                              fontSize: getResponsiveValue(
                                                12,
                                                13,
                                                14
                                              ),
                                              color: "#86868b", // Apple Compact secondary text
                                              marginBottom: 4,
                                            }}
                                          >
                                            전화번호
                                          </Text>
                                          <Pressable
                                            onPress={() =>
                                              makePhoneCall(
                                                workerInfo.worker.phone
                                              )
                                            }
                                          >
                                            <Text
                                              style={{
                                                fontSize: getResponsiveValue(
                                                  14,
                                                  15,
                                                  16
                                                ),
                                                color: "#2563eb",
                                                textDecorationLine: "underline",
                                              }}
                                            >
                                              📞{" "}
                                              {formatPhoneNumber(
                                                workerInfo.worker.phone
                                              )}
                                            </Text>
                                          </Pressable>
                                        </View>

                                        {/* 시급 및 근무시간 */}
                                        <View style={{ marginBottom: 12 }}>
                                          <Text
                                            style={{
                                              fontSize: getResponsiveValue(
                                                12,
                                                13,
                                                14
                                              ),
                                              color: "#86868b", // Apple Compact secondary text
                                              marginBottom: 4,
                                            }}
                                          >
                                            시급
                                          </Text>
                                          <View
                                            style={{
                                              flexDirection: "row",
                                              alignItems: "center",
                                              gap: 8,
                                              marginBottom: 12,
                                            }}
                                          >
                                            <TextInput
                                              style={{
                                                borderWidth: 1,
                                                borderColor: "#d1d5db",
                                                borderRadius: 4,
                                                padding: 6,
                                                backgroundColor: "white",
                                                fontSize: getResponsiveValue(
                                                  12,
                                                  13,
                                                  14
                                                ),
                                                width: 80,
                                              }}
                                              value={(
                                                workerData[workerInfo.worker.id]
                                                  ?.hourlyWage ||
                                                workerInfo.worker.hourlyWage
                                              ).toLocaleString()}
                                              onChangeText={(text: string) => {
                                                const wage = parseInt(
                                                  text.replace(/,/g, "")
                                                );
                                                if (!isNaN(wage)) {
                                                  updateWorkerData(
                                                    workerInfo.worker.id,
                                                    {
                                                      hourlyWage: wage,
                                                    }
                                                  );
                                                }
                                              }}
                                              keyboardType="numeric"
                                              placeholder="시급"
                                            />
                                            <Text
                                              style={{
                                                fontSize: getResponsiveValue(
                                                  12,
                                                  13,
                                                  14
                                                ),
                                                color: "#86868b", // Apple Compact secondary text
                                              }}
                                            >
                                              원
                                            </Text>
                                          </View>

                                          <Text
                                            style={{
                                              fontSize: getResponsiveValue(
                                                12,
                                                13,
                                                14
                                              ),
                                              color: "#86868b", // Apple Compact secondary text
                                              marginBottom: 4,
                                            }}
                                          >
                                            근무시간 (시간+분)
                                          </Text>
                                          <View
                                            style={{
                                              flexDirection: "row",
                                              alignItems: "center",
                                              gap: 8,
                                            }}
                                          >
                                            <TextInput
                                              style={{
                                                borderWidth: 1,
                                                borderColor: "#d1d5db",
                                                borderRadius: 4,
                                                padding: 6,
                                                backgroundColor: "white",
                                                fontSize: getResponsiveValue(
                                                  12,
                                                  13,
                                                  14
                                                ),
                                                width: 100,
                                              }}
                                              value={formatWorkHours(
                                                workHours[
                                                  workerInfo.worker.id
                                                ] ||
                                                  workerInfo.periods.reduce(
                                                    (
                                                      total: number,
                                                      period: any
                                                    ) => {
                                                      const start = dayjs(
                                                        period.start
                                                      );
                                                      const end = dayjs(
                                                        period.end
                                                      );
                                                      return (
                                                        total +
                                                        end.diff(
                                                          start,
                                                          "hour",
                                                          true
                                                        )
                                                      );
                                                    },
                                                    0
                                                  )
                                              )}
                                              onChangeText={(text: string) => {
                                                const hours =
                                                  parseWorkHours(text);
                                                if (!isNaN(hours)) {
                                                  updateWorkHours(
                                                    workerInfo.worker.id,
                                                    hours
                                                  );
                                                }
                                              }}
                                              placeholder="2시간 00분"
                                            />
                                          </View>
                                        </View>

                                        {/* 급여 계산 */}
                                        <View style={{ marginBottom: 12 }}>
                                          <Text
                                            style={{
                                              fontSize: getResponsiveValue(
                                                12,
                                                13,
                                                14
                                              ),
                                              color: "#86868b", // Apple Compact secondary text
                                              marginBottom: 4,
                                            }}
                                          >
                                            급여 계산
                                          </Text>
                                          {(() => {
                                            const pay =
                                              calculatePay(workerInfo);
                                            return (
                                              <View
                                                style={{
                                                  backgroundColor: "#f0f9ff",
                                                  padding: 8,
                                                  borderRadius: 4,
                                                }}
                                              >
                                                <Text
                                                  style={{
                                                    fontSize:
                                                      getResponsiveValue(
                                                        12,
                                                        13,
                                                        14
                                                      ),
                                                    color: "#1f2937",
                                                    marginBottom: 2,
                                                  }}
                                                >
                                                  총 급여:{" "}
                                                  {pay.gross.toLocaleString()}원
                                                </Text>
                                                {pay.taxWithheld && (
                                                  <Text
                                                    style={{
                                                      fontSize:
                                                        getResponsiveValue(
                                                          12,
                                                          13,
                                                          14
                                                        ),
                                                      color: "#dc2626",
                                                      marginBottom: 2,
                                                    }}
                                                  >
                                                    세금 공제 (3.3%): -
                                                    {pay.tax.toLocaleString()}원
                                                  </Text>
                                                )}
                                                <Text
                                                  style={{
                                                    fontSize:
                                                      getResponsiveValue(
                                                        14,
                                                        15,
                                                        16
                                                      ),
                                                    color: "#059669",
                                                    fontWeight: "600",
                                                  }}
                                                >
                                                  실수령액:{" "}
                                                  {pay.net.toLocaleString()}원
                                                </Text>
                                              </View>
                                            );
                                          })()}
                                        </View>

                                        {/* 계좌번호 및 송금 */}
                                        <View style={{ marginBottom: 12 }}>
                                          <Text
                                            style={{
                                              fontSize: getResponsiveValue(
                                                12,
                                                13,
                                                14
                                              ),
                                              color: "#86868b", // Apple Compact secondary text
                                              marginBottom: 4,
                                            }}
                                          >
                                            계좌번호
                                          </Text>
                                          <View
                                            style={{
                                              flexDirection: "row",
                                              alignItems: "center",
                                              justifyContent: "space-between",
                                            }}
                                          >
                                            <View
                                              style={{
                                                flex: 1,
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 8,
                                              }}
                                            >
                                              <Text
                                                style={{
                                                  fontSize: getResponsiveValue(
                                                    12,
                                                    13,
                                                    14
                                                  ),
                                                  color: "#86868b", // Apple Compact secondary text
                                                  minWidth: 40,
                                                }}
                                              >
                                                {detectBankFromAccount(
                                                  workerInfo.worker
                                                    .bankAccount || ""
                                                )?.shortName || "은행"}
                                              </Text>
                                              <Text
                                                style={{
                                                  fontSize: getResponsiveValue(
                                                    12,
                                                    13,
                                                    14
                                                  ),
                                                  color: "#1f2937",
                                                  flex: 1,
                                                }}
                                              >
                                                {formatAccountNumber(
                                                  workerInfo.worker
                                                    .bankAccount || ""
                                                ) ||
                                                  workerInfo.worker
                                                    .bankAccount ||
                                                  ""}
                                              </Text>
                                            </View>
                                            <View
                                              style={{
                                                flexDirection: "row",
                                                gap: 4,
                                              }}
                                            >
                                              <Pressable
                                                onPress={() =>
                                                  copyToClipboard(
                                                    workerInfo.worker
                                                      .bankAccount || ""
                                                  )
                                                }
                                                style={{
                                                  backgroundColor: "#2563eb",
                                                  paddingHorizontal: 6,
                                                  paddingVertical: 2,
                                                  borderRadius: 4,
                                                }}
                                              >
                                                <Text
                                                  style={{
                                                    color: "white",
                                                    fontSize: 10,
                                                  }}
                                                >
                                                  복사
                                                </Text>
                                              </Pressable>
                                              <Pressable
                                                onPress={() =>
                                                  openPaymentApp(
                                                    workerInfo.worker
                                                      .bankAccount || ""
                                                  )
                                                }
                                                style={{
                                                  backgroundColor: "#10b981",
                                                  paddingHorizontal: 6,
                                                  paddingVertical: 2,
                                                  borderRadius: 4,
                                                }}
                                              >
                                                <Text
                                                  style={{
                                                    color: "white",
                                                    fontSize: 10,
                                                  }}
                                                >
                                                  송금
                                                </Text>
                                              </Pressable>
                                            </View>
                                          </View>
                                        </View>

                                        {/* 메모 */}
                                        {workerInfo.worker.memo && (
                                          <View style={{ marginBottom: 12 }}>
                                            <Text
                                              style={{
                                                fontSize: getResponsiveValue(
                                                  12,
                                                  13,
                                                  14
                                                ),
                                                color: "#86868b", // Apple Compact secondary text
                                                marginBottom: 4,
                                              }}
                                            >
                                              메모
                                            </Text>
                                            <Text
                                              style={{
                                                fontSize: getResponsiveValue(
                                                  12,
                                                  13,
                                                  14
                                                ),
                                                color: "#1f2937",
                                                fontStyle: "italic",
                                              }}
                                            >
                                              {workerInfo.worker.memo}
                                            </Text>
                                          </View>
                                        )}

                                        {/* 급여 설정 */}
                                        <View
                                          style={{
                                            borderTopWidth: 1,
                                            borderTopColor: "#e5e7eb",
                                            paddingTop: 8,
                                          }}
                                        >
                                          <View
                                            style={{
                                              flexDirection: "row",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                              marginBottom: 8,
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: getResponsiveValue(
                                                  12,
                                                  13,
                                                  14
                                                ),
                                                color: "#86868b", // Apple Compact secondary text
                                              }}
                                            >
                                              세금공제 (3.3%)
                                            </Text>
                                            <View
                                              style={{
                                                flexDirection: "row",
                                                gap: 8,
                                              }}
                                            >
                                              <Pressable
                                                onPress={() => {
                                                  updateWorkerData(
                                                    workerInfo.worker.id,
                                                    {
                                                      taxWithheld: true,
                                                    }
                                                  );
                                                }}
                                                style={{
                                                  backgroundColor: (
                                                    workerData[
                                                      workerInfo.worker.id
                                                    ]?.taxWithheld !== undefined
                                                      ? workerData[
                                                          workerInfo.worker.id
                                                        ].taxWithheld
                                                      : false
                                                  )
                                                    ? "#2563eb"
                                                    : "#e5e7eb",
                                                  paddingHorizontal: 8,
                                                  paddingVertical: 4,
                                                  borderRadius: 4,
                                                }}
                                              >
                                                <Text
                                                  style={{
                                                    color: (
                                                      workerData[
                                                        workerInfo.worker.id
                                                      ]?.taxWithheld !==
                                                      undefined
                                                        ? workerData[
                                                            workerInfo.worker.id
                                                          ].taxWithheld
                                                        : false
                                                    )
                                                      ? "white"
                                                      : "#6b7280",
                                                    fontSize: 10,
                                                    fontWeight: "600",
                                                  }}
                                                >
                                                  Y
                                                </Text>
                                              </Pressable>
                                              <Pressable
                                                onPress={() => {
                                                  updateWorkerData(
                                                    workerInfo.worker.id,
                                                    {
                                                      taxWithheld: false,
                                                    }
                                                  );
                                                }}
                                                style={{
                                                  backgroundColor: !(workerData[
                                                    workerInfo.worker.id
                                                  ]?.taxWithheld !== undefined
                                                    ? workerData[
                                                        workerInfo.worker.id
                                                      ].taxWithheld
                                                    : false)
                                                    ? "#2563eb"
                                                    : "#e5e7eb",
                                                  paddingHorizontal: 8,
                                                  paddingVertical: 4,
                                                  borderRadius: 4,
                                                }}
                                              >
                                                <Text
                                                  style={{
                                                    color: !(workerData[
                                                      workerInfo.worker.id
                                                    ]?.taxWithheld !== undefined
                                                      ? workerData[
                                                          workerInfo.worker.id
                                                        ].taxWithheld
                                                      : false)
                                                      ? "white"
                                                      : "#6b7280",
                                                    fontSize: 10,
                                                    fontWeight: "600",
                                                  }}
                                                >
                                                  N
                                                </Text>
                                              </Pressable>
                                            </View>
                                          </View>

                                          <View
                                            style={{
                                              flexDirection: "row",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                            }}
                                          >
                                            <Text
                                              style={{
                                                fontSize: getResponsiveValue(
                                                  12,
                                                  13,
                                                  14
                                                ),
                                                color: "#86868b", // Apple Compact secondary text
                                              }}
                                            >
                                              지급완료
                                            </Text>
                                            <Switch
                                              value={
                                                workerData[workerInfo.worker.id]
                                                  ?.paid !== undefined
                                                  ? workerData[
                                                      workerInfo.worker.id
                                                    ].paid
                                                  : workerInfo.paid
                                              }
                                              onValueChange={(value) => {
                                                updateWorkerData(
                                                  workerInfo.worker.id,
                                                  {
                                                    paid: value,
                                                  }
                                                );
                                              }}
                                              style={{
                                                transform: [
                                                  { scaleX: 0.8 },
                                                  { scaleY: 0.8 },
                                                ],
                                              }}
                                            />
                                          </View>
                                        </View>
                                      </View>
                                    )
                                  )}
                                </View>
                              </View>
                            );
                          })()}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>
              </Animated.View>
            </PanGestureHandler>
          </Animated.View>
        )}

        {/* 새 근로자 추가 모달 */}
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
                borderRadius: Platform.OS === "web" ? 16 : 0,
                borderTopLeftRadius: Platform.OS === "web" ? 16 : 20,
                borderTopRightRadius: Platform.OS === "web" ? 16 : 20,
                width: "100%",
                maxWidth: Platform.OS === "web" ? 520 : "100%",
                maxHeight: Platform.OS === "web" ? "90%" : "85%",
                minHeight: Platform.OS === "web" ? "auto" : "60%",
                overflow: "hidden",
                ...(Platform.OS === "web" && {
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }),
              }}
            >
              {/* 헤더 */}
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(0, 0, 0, 0.08)", // Subtle divider
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: getResponsiveValue(18, 20, 22),
                    fontWeight: "bold",
                    color: "#1f2937",
                  }}
                >
                  새 근로자 추가
                </Text>
                <Pressable
                  onPress={() => setShowAddWorkerModal(false)}
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
                <View style={{ marginBottom: 16 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: "#374151" }}>
                      이름 <Text style={{ color: "#ef4444" }}>*</Text>
                    </Text>
                    <Pressable
                      onPress={() => setShowWorkerSearch(true)}
                      style={{
                        backgroundColor: "#2563eb",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons name="search" size={14} color="white" />
                      <Text
                        style={{
                          color: "white",
                          fontSize: 12,
                          fontWeight: "500",
                        }}
                      >
                        검색
                      </Text>
                    </Pressable>
                  </View>
                  <TextInput
                    ref={nameInputRef}
                    style={{
                      borderWidth: 1,
                      borderColor:
                        validationError && validationError.includes("이름")
                          ? "#ef4444"
                          : "#d1d5db",
                      borderRadius: 6,
                      padding: 12,
                      fontSize: getResponsiveValue(16, 17, 18),
                    }}
                    value={newWorker.name}
                    onChangeText={(text) => {
                      setNewWorker({ ...newWorker, name: text });
                      // 입력 시 에러 메시지 초기화
                      if (validationError && validationError.includes("이름")) {
                        setValidationError("");
                      }
                    }}
                    placeholder="이름을 입력하세요"
                  />
                  {validationError && validationError.includes("이름") && (
                    <Text
                      style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}
                    >
                      {validationError}
                    </Text>
                  )}
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                  >
                    전화번호
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#d1d5db",
                      borderRadius: 6,
                      padding: 12,
                      fontSize: getResponsiveValue(16, 17, 18),
                    }}
                    value={formatPhoneNumber(newWorker.phone)}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, "");
                      setNewWorker({ ...newWorker, phone: cleaned });
                    }}
                    placeholder="010-1234-5678"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                  >
                    계좌번호
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Pressable
                      style={{
                        minWidth: 80,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: "#d1d5db",
                        borderRadius: 6,
                        backgroundColor: "white",
                      }}
                      onPress={() => {
                        // 항상 은행 선택 모달 열기
                        setShowBankSelection(true);
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6b7280",
                          textAlign: "center",
                        }}
                      >
                        {(() => {
                          // 수동으로 선택된 은행이 있으면 우선 표시
                          if (newWorker.bankCode) {
                            return (
                              KOREAN_BANKS.find(
                                (bank) => bank.code === newWorker.bankCode
                              )?.shortName || "은행"
                            );
                          }
                          // 수동 선택이 없으면 자동 감지된 은행 표시
                          const detectedBank = detectBankFromAccount(
                            newWorker.bankAccount
                          );
                          if (detectedBank) {
                            return detectedBank.shortName;
                          }
                          return "은행 선택";
                        })()}
                      </Text>
                    </Pressable>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: "#d1d5db",
                        borderRadius: 6,
                        padding: 12,
                        fontSize: getResponsiveValue(16, 17, 18),
                        flex: 1,
                      }}
                      value={newWorker.bankAccount}
                      onChangeText={(text) => {
                        // 숫자만 저장, 하이픈은 표시용으로만 사용
                        const cleaned = text.replace(/[^0-9]/g, "");
                        setNewWorker({
                          ...newWorker,
                          bankAccount: cleaned,
                          // 계좌번호가 변경되면 수동 선택된 은행 초기화
                          bankCode: "",
                        });
                      }}
                      placeholder="계좌번호를 입력하세요"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                  >
                    시급 (원)
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#d1d5db",
                      borderRadius: 6,
                      padding: 12,
                      fontSize: getResponsiveValue(16, 17, 18),
                    }}
                    value={formatNumber(newWorker.hourlyWage)}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, "");
                      const wage = parseInt(cleaned) || 0;
                      setNewWorker({ ...newWorker, hourlyWage: wage });
                    }}
                    placeholder="11,000"
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{ fontSize: 14, marginBottom: 8, color: "#374151" }}
                  >
                    세금공제
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <Pressable
                      onPress={() =>
                        setNewWorker({ ...newWorker, taxWithheld: true })
                      }
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: newWorker.taxWithheld
                            ? "#2563eb"
                            : "#d1d5db",
                          backgroundColor: newWorker.taxWithheld
                            ? "#2563eb"
                            : "white",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {newWorker.taxWithheld && (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "white",
                            }}
                          />
                        )}
                      </View>
                      <Text style={{ fontSize: 14, color: "#374151" }}>Y</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setNewWorker({ ...newWorker, taxWithheld: false })
                      }
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: !newWorker.taxWithheld
                            ? "#2563eb"
                            : "#d1d5db",
                          backgroundColor: !newWorker.taxWithheld
                            ? "#2563eb"
                            : "white",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {!newWorker.taxWithheld && (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "white",
                            }}
                          />
                        )}
                      </View>
                      <Text style={{ fontSize: 14, color: "#374151" }}>N</Text>
                    </Pressable>
                  </View>
                </View>

                {/* 전일정 근무 여부 */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{ fontSize: 14, marginBottom: 8, color: "#374151" }}
                  >
                    전일정 근무
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <Pressable
                      onPress={() =>
                        setNewWorker({ ...newWorker, fullPeriod: true })
                      }
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: newWorker.fullPeriod
                            ? "#2563eb"
                            : "#d1d5db",
                          backgroundColor: newWorker.fullPeriod
                            ? "#2563eb"
                            : "white",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {newWorker.fullPeriod && (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "white",
                            }}
                          />
                        )}
                      </View>
                      <Text style={{ fontSize: 14, color: "#374151" }}>Y</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setNewWorker({ ...newWorker, fullPeriod: false })
                      }
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: !newWorker.fullPeriod
                            ? "#2563eb"
                            : "#d1d5db",
                          backgroundColor: !newWorker.fullPeriod
                            ? "#2563eb"
                            : "white",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {!newWorker.fullPeriod && (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "white",
                            }}
                          />
                        )}
                      </View>
                      <Text style={{ fontSize: 14, color: "#374151" }}>N</Text>
                    </Pressable>
                  </View>
                </View>

                {/* 근무 기간 선택 (전일정 근무가 N일 때만 표시) */}
                {!newWorker.fullPeriod && (
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        marginBottom: 8,
                        color: "#1d1d1f", // Apple Compact primary text
                      }}
                    >
                      근무 기간
                    </Text>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            marginBottom: 4,
                            color: "#6b7280",
                          }}
                        >
                          시작일
                        </Text>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: "#d1d5db",
                            borderRadius: 6,
                            padding: 12,
                            fontSize: 14,
                          }}
                          value={newWorker.workStartDate}
                          onChangeText={(text) =>
                            setNewWorker({ ...newWorker, workStartDate: text })
                          }
                          placeholder="YYYY-MM-DD"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            marginBottom: 4,
                            color: "#6b7280",
                          }}
                        >
                          종료일
                        </Text>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: "#d1d5db",
                            borderRadius: 6,
                            padding: 12,
                            fontSize: 14,
                          }}
                          value={newWorker.workEndDate}
                          onChangeText={(text) =>
                            setNewWorker({ ...newWorker, workEndDate: text })
                          }
                          placeholder="YYYY-MM-DD"
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* 근무시간 매일 동일한지 */}
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{ fontSize: 14, marginBottom: 8, color: "#374151" }}
                  >
                    근무시간 매일 동일한지
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <Pressable
                      onPress={() =>
                        setNewWorker({
                          ...newWorker,
                          isWorkHoursSameEveryDay: true,
                        })
                      }
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: newWorker.isWorkHoursSameEveryDay
                            ? "#2563eb"
                            : "#d1d5db",
                          backgroundColor: newWorker.isWorkHoursSameEveryDay
                            ? "#2563eb"
                            : "white",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {newWorker.isWorkHoursSameEveryDay && (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "white",
                            }}
                          />
                        )}
                      </View>
                      <Text style={{ fontSize: 14, color: "#374151" }}>Y</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setNewWorker({
                          ...newWorker,
                          isWorkHoursSameEveryDay: false,
                        })
                      }
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: !newWorker.isWorkHoursSameEveryDay
                            ? "#2563eb"
                            : "#d1d5db",
                          backgroundColor: !newWorker.isWorkHoursSameEveryDay
                            ? "#2563eb"
                            : "white",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {!newWorker.isWorkHoursSameEveryDay && (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: "white",
                            }}
                          />
                        )}
                      </View>
                      <Text style={{ fontSize: 14, color: "#374151" }}>N</Text>
                    </Pressable>
                  </View>
                </View>

                {/* 근무 시간 - 매일 동일한 경우 */}
                {newWorker.isWorkHoursSameEveryDay && (
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        marginBottom: 8,
                        color: "#1d1d1f", // Apple Compact primary text
                      }}
                    >
                      근무 시간
                    </Text>
                    {newWorker.workTimes.map((workTime, index) => (
                      <View
                        key={index}
                        style={{
                          flexDirection: "row",
                          gap: 8,
                          marginBottom: 8,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: "#d1d5db",
                            borderRadius: 6,
                            padding: 12,
                            fontSize: 14,
                            width: 80,
                            minWidth: 80,
                            maxWidth: 100,
                          }}
                          value={workTime.startTime}
                          onChangeText={(text) => {
                            const newWorkTimes = [...newWorker.workTimes];
                            newWorkTimes[index].startTime = text;
                            setNewWorker({
                              ...newWorker,
                              workTimes: newWorkTimes,
                            });
                          }}
                          placeholder="09:00"
                        />
                        <Text style={{ color: "#6b7280", fontSize: 14 }}>
                          ~
                        </Text>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: "#d1d5db",
                            borderRadius: 6,
                            padding: 12,
                            fontSize: 14,
                            width: 80,
                            minWidth: 80,
                            maxWidth: 100,
                          }}
                          value={workTime.endTime}
                          onChangeText={(text) => {
                            const newWorkTimes = [...newWorker.workTimes];
                            newWorkTimes[index].endTime = text;
                            setNewWorker({
                              ...newWorker,
                              workTimes: newWorkTimes,
                            });
                          }}
                          placeholder="18:00"
                        />
                        {newWorker.workTimes.length > 1 && (
                          <Pressable
                            onPress={() => {
                              const newWorkTimes = newWorker.workTimes.filter(
                                (_, i) => i !== index
                              );
                              setNewWorker({
                                ...newWorker,
                                workTimes: newWorkTimes,
                              });
                            }}
                            style={{
                              backgroundColor: "#ef4444",
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              borderRadius: 6,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text style={{ color: "white", fontSize: 12 }}>
                              삭제
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    ))}
                    <Pressable
                      onPress={() => {
                        setNewWorker({
                          ...newWorker,
                          workTimes: [
                            ...newWorker.workTimes,
                            { startTime: "09:00", endTime: "18:00" },
                          ],
                        });
                      }}
                      style={{
                        backgroundColor: "#10b981",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 6,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "white", fontSize: 12 }}>
                        시간 추가
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* 날짜별 근무 시간 - 매일 다른 경우 */}
                {!newWorker.isWorkHoursSameEveryDay &&
                  !newWorker.fullPeriod && (
                    <View style={{ marginBottom: 16 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          marginBottom: 8,
                          color: "#1d1d1f", // Apple Compact primary text
                        }}
                      >
                        날짜별 근무 시간
                      </Text>
                      <View
                        style={{
                          borderWidth: 1,
                          borderColor: "#e5e7eb",
                          borderRadius: 6,
                          padding: 12,
                          backgroundColor: "#f9fafb",
                          maxHeight: 200,
                        }}
                      >
                        <ScrollView
                          showsVerticalScrollIndicator={true}
                          contentContainerStyle={{ paddingRight: 8 }}
                        >
                          {newWorker.dailyWorkPeriods.map((period, index) => (
                            <View
                              key={index}
                              style={{
                                borderWidth: 1,
                                borderColor: "#d1d5db",
                                borderRadius: 4,
                                padding: 8,
                                marginBottom: 8,
                                backgroundColor: "white",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  color: "#86868b", // Apple Compact secondary text
                                  marginBottom: 6,
                                  fontWeight: "500",
                                  fontFamily: "Inter_500Medium",
                                }}
                              >
                                {dayjs(period.date).format("MM월 DD일")}
                              </Text>
                              <View
                                style={{
                                  flexDirection: "row",
                                  gap: 8,
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                }}
                              >
                                <View
                                  style={{
                                    flexDirection: "row",
                                    gap: 8,
                                    alignItems: "center",
                                    flex: 1,
                                  }}
                                >
                                  <TextInput
                                    style={{
                                      borderWidth: 1,
                                      borderColor: "#d1d5db",
                                      borderRadius: 4,
                                      padding: 8,
                                      fontSize: getResponsiveValue(12, 13, 14),
                                      width: 70,
                                      textAlign: "center",
                                    }}
                                    value={period.startTime}
                                    onChangeText={(text) => {
                                      const newPeriods = [
                                        ...newWorker.dailyWorkPeriods,
                                      ];
                                      newPeriods[index].startTime = text;
                                      setNewWorker({
                                        ...newWorker,
                                        dailyWorkPeriods: newPeriods,
                                      });
                                    }}
                                    placeholder="09:00"
                                  />
                                  <Text
                                    style={{ color: "#6b7280", fontSize: 12 }}
                                  >
                                    ~
                                  </Text>
                                  <TextInput
                                    style={{
                                      borderWidth: 1,
                                      borderColor: "#d1d5db",
                                      borderRadius: 4,
                                      padding: 8,
                                      fontSize: getResponsiveValue(12, 13, 14),
                                      width: 70,
                                      textAlign: "center",
                                    }}
                                    value={period.endTime}
                                    onChangeText={(text) => {
                                      const newPeriods = [
                                        ...newWorker.dailyWorkPeriods,
                                      ];
                                      newPeriods[index].endTime = text;
                                      setNewWorker({
                                        ...newWorker,
                                        dailyWorkPeriods: newPeriods,
                                      });
                                    }}
                                    placeholder="18:00"
                                  />
                                </View>

                                {/* 삭제 버튼 */}
                                {newWorker.dailyWorkPeriods.length > 1 && (
                                  <Pressable
                                    onPress={() => {
                                      const newPeriods =
                                        newWorker.dailyWorkPeriods.filter(
                                          (_, i) => i !== index
                                        );
                                      setNewWorker({
                                        ...newWorker,
                                        dailyWorkPeriods: newPeriods,
                                      });
                                    }}
                                    style={{
                                      backgroundColor: "#ef4444",
                                      paddingHorizontal: 8,
                                      paddingVertical: 4,
                                      borderRadius: 4,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "white",
                                        fontSize: 10,
                                        fontWeight: "500",
                                      }}
                                    >
                                      삭제
                                    </Text>
                                  </Pressable>
                                )}
                              </View>
                            </View>
                          ))}
                        </ScrollView>

                        {/* 시간 추가 버튼 */}
                        <Pressable
                          onPress={() => {
                            // 현재 스케줄의 날짜 범위를 가져와서 다음 날짜 추가
                            const schedule = schedules.find(
                              (s) => s.id === selectedScheduleId
                            );
                            if (schedule) {
                              const lastDate =
                                newWorker.dailyWorkPeriods.length > 0
                                  ? dayjs(
                                      newWorker.dailyWorkPeriods[
                                        newWorker.dailyWorkPeriods.length - 1
                                      ].date
                                    )
                                  : dayjs(schedule.startDate).subtract(
                                      1,
                                      "day"
                                    );

                              const nextDate = lastDate.add(1, "day");

                              // 스케줄 종료일을 넘지 않도록 체크
                              if (
                                nextDate.isSameOrBefore(
                                  dayjs(schedule.endDate),
                                  "day"
                                )
                              ) {
                                setNewWorker({
                                  ...newWorker,
                                  dailyWorkPeriods: [
                                    ...newWorker.dailyWorkPeriods,
                                    {
                                      date: nextDate.format("YYYY-MM-DD"),
                                      startTime: "09:00",
                                      endTime: "18:00",
                                    },
                                  ],
                                });
                              } else {
                                Alert.alert(
                                  "알림",
                                  "스케줄 종료일을 넘을 수 없습니다."
                                );
                              }
                            }
                          }}
                          style={{
                            backgroundColor: "#10b981",
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 6,
                            alignItems: "center",
                            marginTop: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: "white",
                              fontSize: 12,
                              fontWeight: "500",
                            }}
                          >
                            + 시간 추가
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                {/* 메모 필드 - 맨 아래로 이동 */}
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
                      fontSize: getResponsiveValue(16, 17, 18),
                      minHeight: 80,
                      textAlignVertical: "top",
                    }}
                    value={newWorker.memo}
                    onChangeText={(text) =>
                      setNewWorker({ ...newWorker, memo: text })
                    }
                    placeholder="메모를 입력하세요"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>

              {/* 하단 버튼 영역 - 모달 내부로 이동 */}
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 20,
                  borderTopWidth: 1,
                  borderTopColor: "#e5e7eb",
                  backgroundColor: "white",
                }}
              >
                <Pressable
                  onPress={handleAddWorker}
                  style={{
                    backgroundColor: "#10b981",
                    paddingVertical: 10,
                    borderRadius: 6,
                    width: "100%",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      textAlign: "center",
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    추가
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* 은행 선택 모달 */}
        <Modal
          visible={showBankSelection}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowBankSelection(false)}
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
                borderRadius: Platform.OS === "web" ? 16 : 0,
                borderTopLeftRadius: Platform.OS === "web" ? 16 : 20,
                borderTopRightRadius: Platform.OS === "web" ? 16 : 20,
                width: "100%",
                maxWidth: Platform.OS === "web" ? 500 : "100%",
                maxHeight: Platform.OS === "web" ? "80%" : "70%",
                overflow: "hidden",
              }}
            >
              {/* 헤더 */}
              <View
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(0, 0, 0, 0.08)", // Subtle divider
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: getResponsiveValue(18, 20, 22),
                    fontWeight: "bold",
                    color: "#1f2937",
                  }}
                >
                  은행 선택
                </Text>
                <Pressable
                  onPress={() => setShowBankSelection(false)}
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

              {/* 은행 목록 */}
              <ScrollView style={{ flex: 1 }}>
                {KOREAN_BANKS.map((bank) => (
                  <Pressable
                    key={bank.code}
                    onPress={() => {
                      setNewWorker({ ...newWorker, bankCode: bank.code });
                      setShowBankSelection(false);
                    }}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 16,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f3f4f6",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontSize: getResponsiveValue(16, 17, 18),
                          fontWeight: "500",
                          color: "#1f2937",
                        }}
                      >
                        {bank.name}
                      </Text>
                      <Text style={{ fontSize: 14, color: "#6b7280" }}>
                        {bank.shortName}
                      </Text>
                    </View>
                    {newWorker.bankCode === bank.code && (
                      <Ionicons name="checkmark" size={20} color="#10b981" />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* 스케줄 수정 모달 */}
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
                borderRadius: 16,
                width: Platform.OS === "web" ? "90%" : "100%",
                maxWidth: Platform.OS === "web" ? 500 : undefined,
                maxHeight: Platform.OS === "web" ? "90%" : "85%",
                minHeight: Platform.OS === "web" ? 400 : "60%",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(0, 0, 0, 0.08)", // Subtle divider
                }}
              >
                <Text
                  style={{
                    fontSize: getResponsiveValue(18, 20, 22),
                    fontWeight: "bold",
                    color: "#1f2937",
                  }}
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

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20 }}
              >
                <Text
                  style={{ fontSize: 16, color: "#6b7280", marginBottom: 20 }}
                >
                  스케줄 수정 기능은 곧 추가됩니다.
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* 근로자 검색 모달 */}
        <Modal
          visible={showWorkerSearch}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowWorkerSearch(false)}
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
                  borderBottomColor: "rgba(0, 0, 0, 0.08)", // Subtle divider
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: getResponsiveValue(18, 20, 22),
                    fontWeight: "600",
                    fontFamily: "Inter_600SemiBold",
                    color: "#111827",
                  }}
                >
                  근로자 검색
                </Text>
                <Pressable
                  onPress={() => setShowWorkerSearch(false)}
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

              {/* 검색 입력 */}
              <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 6,
                    padding: 12,
                    fontSize: getResponsiveValue(16, 17, 18),
                  }}
                  value={workerSearchQuery}
                  onChangeText={setWorkerSearchQuery}
                  placeholder="이름 또는 전화번호로 검색하세요"
                />
              </View>

              {/* 근로자 목록 */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                showsVerticalScrollIndicator={true}
              >
                {allWorkers
                  .filter((worker) => {
                    const query = workerSearchQuery.toLowerCase();
                    return (
                      worker.name.toLowerCase().includes(query) ||
                      worker.phone.includes(query)
                    );
                  })
                  .map((worker) => (
                    <Pressable
                      key={worker.id}
                      onPress={() => {
                        setNewWorker({
                          ...newWorker,
                          name: worker.name,
                          phone: worker.phone,
                          bankAccount: worker.bankAccount || "",
                          hourlyWage: worker.hourlyWage,
                          taxWithheld: false,
                          memo: worker.memo || "",
                        });
                        setShowWorkerSearch(false);
                        setWorkerSearchQuery("");
                      }}
                      style={{
                        padding: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: "#f3f4f6",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: getResponsiveValue(16, 17, 18),
                            fontWeight: "500",
                            color: "#111827",
                          }}
                        >
                          {worker.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6b7280",
                            marginTop: 2,
                          }}
                        >
                          {formatPhoneNumber(worker.phone)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#9ca3af",
                            marginTop: 2,
                          }}
                        >
                          {formatNumber(worker.hourlyWage)}원/시간
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#9ca3af"
                      />
                    </Pressable>
                  ))}

                {allWorkers.filter((worker) => {
                  const query = workerSearchQuery.toLowerCase();
                  return (
                    worker.name.toLowerCase().includes(query) ||
                    worker.phone.includes(query)
                  );
                }).length === 0 && (
                  <View style={{ padding: 20, alignItems: "center" }}>
                    <Text style={{ fontSize: 14, color: "#6b7280" }}>
                      검색 결과가 없습니다
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* 주소 검색 모달 (앱에서만) - AddressSearchModal 제거됨 */}
        {/* <AddressSearchModal
          visible={isAddressSearchVisible}
          onClose={() => setIsAddressSearchVisible(false)}
          onSelectAddress={handleAddressSelect}
          currentAddress={
            selectedScheduleId
              ? filteredSchedules.find((s) => s.id === selectedScheduleId)?.address ||
                ""
              : ""
          }
        /> */}
      </View>
    </CalendarProvider>
  );
}

const styles = StyleSheet.create({
  workerCard: {
    backgroundColor: Theme.colors.card,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
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
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: 2,
  },
  workerPosition: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
  paidSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  workerDetails: {
    marginBottom: Theme.spacing.sm,
  },
  workTime: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.primary,
    marginBottom: 2,
  },
  timeRange: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
  workerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  phoneNumber: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  // 모바일 스케줄 목록 스타일
  mobileScheduleList: {
    backgroundColor: Theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    maxHeight: 300,
  },
  mobileScheduleListTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  noScheduleText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    paddingVertical: Theme.spacing.lg,
  },
  scheduleScrollView: {
    maxHeight: 250,
  },
  mobileScheduleItem: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  mobileScheduleContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Theme.spacing.md,
  },
  mobileScheduleLeft: {
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  mobileScheduleTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: 4,
  },
  mobileScheduleLocation: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  mobileScheduleRight: {
    alignItems: "flex-end",
  },
  mobileScheduleTime: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.primary,
    marginBottom: 2,
  },
  mobileMapButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  mobileMapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
  },
  mobileMapButtonText: {
    fontSize: 10,
    color: "#374151",
    fontWeight: "500",
  },
});
