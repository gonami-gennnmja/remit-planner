import AddressSearchModal from "@/components/AddressSearchModal";
import { Text } from "@/components/Themed";
import { Theme } from "@/constants/Theme";
import { getDatabase } from "@/database/platformDatabase";
import { Schedule, ScheduleCategory, Worker } from "@/models/types";
import {
  detectBankFromAccount,
  formatAccountNumber,
  formatNumber,
  formatPhoneNumber,
} from "@/utils/bankUtils";
import {
  openAddressSearch,
  openKakaoMap,
  openMapApp,
  openNaverMap,
} from "@/utils/daumMapApi";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import React, { useEffect, useMemo, useState } from "react";
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
import { Calendar } from "react-native-calendars";
import { PanGestureHandler, State } from "react-native-gesture-handler";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

function getCategoryColor(category: ScheduleCategory): string {
  const colors: Record<ScheduleCategory, string> = {
    education: "#8b5cf6",
    meeting: "#3b82f6",
    event: "#ef4444",
    others: "#6b7280",
  };
  return colors[category] || colors.others;
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
    if (periods.length === 0) return "시간 미정";

    const totalMinutes = periods.reduce((total, period) => {
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
    if (periods.length === 0) return "시간 미정";

    const times = periods.map((p) => ({
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
            style={styles.actionButton}
            onPress={() => onCall(worker.phone)}
          >
            <Ionicons name="call" size={16} color="#3b82f6" />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => onSMS(worker.phone)}
          >
            <Ionicons name="chatbubble" size={16} color="#10b981" />
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
    (w.periods || []).map((p) => ({
      start: dayjs(p.start),
      end: dayjs(p.end),
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

export default function PlannerCalendar() {
  const [selectedDate, setSelectedDate] = useState<string>(
    dayjs().format("YYYY-MM-DD")
  );
  const [currentMonth, setCurrentMonth] = useState<string>(
    dayjs().format("YYYY-MM")
  );

  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [isAddressSearchVisible, setIsAddressSearchVisible] = useState(false);
  const [modalType, setModalType] = useState<
    "timetable" | "detail" | "worker-detail" | null
  >(null);
  const [selectedWorkerIndex, setSelectedWorkerIndex] = useState<number | null>(
    null
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [taxWithheld, setTaxWithheld] = useState(false);
  const [taxRate, setTaxRate] = useState(0.1);
  const [paid, setPaid] = useState(false);
  const [workHours, setWorkHours] = useState<Record<string, number>>({});
  const [workerData, setWorkerData] = useState<Record<string, any>>({});
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorker, setNewWorker] = useState({
    name: "",
    phone: "",
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

  const translateY = new Animated.Value(0);

  // DB에서 스케줄 로드
  useEffect(() => {
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
  }, [currentMonth]);

  const monthMarks = useMemo(() => {
    const marks: Record<
      string,
      { dots: { color: string }[]; marked?: boolean }
    > = {};

    schedules.forEach((schedule: Schedule) => {
      const startDate = dayjs(schedule.startDate);
      const endDate = dayjs(schedule.endDate);

      // 시작일부터 종료일까지 모든 날짜에 마킹
      let currentDate = startDate;
      while (currentDate.isSameOrBefore(endDate, "day")) {
        const dateStr = currentDate.format("YYYY-MM-DD");
        if (!marks[dateStr]) {
          marks[dateStr] = { dots: [] };
        }
        marks[dateStr].dots.push({
          color: getCategoryColor(schedule.category),
        });
        marks[dateStr].marked = true;
        currentDate = currentDate.add(1, "day");
      }
    });

    return marks;
  }, [schedules]);

  const selectedDateSchedules = useMemo(() => {
    return schedules
      .filter((s) => {
        const startDate = dayjs(s.startDate);
        const endDate = dayjs(s.endDate);
        const selected = dayjs(selectedDate);
        return (
          selected.isSameOrAfter(startDate, "day") &&
          selected.isSameOrBefore(endDate, "day")
        );
      })
      .slice()
      .sort((a, b) => {
        const aStart = a.workers
          .flatMap((w) => w.periods.map((p) => dayjs(p.start)))
          .sort((x, y) => x.valueOf() - y.valueOf())[0];
        const bStart = b.workers
          .flatMap((w) => w.periods.map((p) => dayjs(p.start)))
          .sort((x, y) => x.valueOf() - y.valueOf())[0];
        return (aStart?.valueOf() ?? 0) - (bStart?.valueOf() ?? 0);
      });
  }, [schedules, selectedDate]);

  const goToPreviousMonth = () => {
    const newMonth = dayjs(currentMonth).subtract(1, "month").format("YYYY-MM");
    setCurrentMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = dayjs(currentMonth).add(1, "month").format("YYYY-MM");
    setCurrentMonth(newMonth);
  };

  const onSchedulePress = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    setModalType("detail");
    showModal();
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
      workerInfo.periods.reduce((total: number, period: any) => {
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
        : workerInfo.worker.taxWithheld;

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
      await db.removeWorkerFromSchedule(scheduleId, workerId);
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
      const schedule = schedules.find((s) => s.id === scheduleId);
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
        name: worker.name,
        phone: worker.phone,
        bankAccount: worker.bankAccount,
        hourlyWage: worker.hourlyWage,
        taxWithheld: worker.taxWithheld,
        memo: worker.memo || "",
        workStartDate: workStartDate,
        workEndDate: workEndDate,
        workHours: worker.workHours || 0,
        workMinutes: worker.workMinutes || 0,
        isFullPeriodWork: worker.fullPeriod,
        isSameWorkHoursDaily: worker.isWorkHoursSameEveryDay,
        dailyWorkTimes: worker.dailyWorkTimes || [],
        defaultStartTime: worker.workTimes?.[0]?.startTime || "09:00",
        defaultEndTime: worker.workTimes?.[0]?.endTime || "18:00",
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
      await db.addWorkerToSchedule(scheduleId, newWorkerId, periods, false);
      console.log("Worker added to schedule in DB successfully");

      // 3. 로컬 상태 업데이트
      const newWorkerInfo = {
        worker: {
          id: newWorkerId,
          name: worker.name,
          phone: worker.phone,
          bankAccount: worker.bankAccount,
          hourlyWage: worker.hourlyWage,
          taxWithheld: worker.taxWithheld,
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

    if (
      !newWorker.name ||
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
      Alert.alert("오류", "모든 필드를 올바르게 입력해주세요.");
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

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {/* 전체 화면 달력 */}
      <View style={{ flex: 1 }}>
        <Calendar
          current={currentMonth}
          markingType="custom"
          markedDates={{
            ...monthMarks,
            [selectedDate]: {
              ...((monthMarks[selectedDate] ?? { dots: [] }) as any),
              customStyles: {
                container: {
                  backgroundColor: "rgba(37,99,235,0.3)",
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: "#2563eb",
                },
              },
            } as any,
          }}
          theme={{
            selectedDayBackgroundColor: "transparent",
            todayTextColor: Theme.colors.primary,
            calendarBackground: Theme.colors.background,
            textSectionTitleColor: Theme.colors.text.secondary,
            dayTextColor: Theme.colors.text.primary,
            textDisabledColor: Theme.colors.text.tertiary,
            arrowColor: Theme.colors.primary,
            monthTextColor: Theme.colors.text.primary,
            indicatorColor: Theme.colors.primary,
            textDayFontWeight: Theme.typography.weights.medium,
            textMonthFontWeight: Theme.typography.weights.semibold,
            textDayHeaderFontWeight: Theme.typography.weights.semibold,
          }}
          dayComponent={({ date }) => {
            const key = date?.dateString ?? "";
            const daily = schedules.filter((s) => {
              const startDate = dayjs(s.startDate);
              const endDate = dayjs(s.endDate);
              const selected = dayjs(key);
              return (
                selected.isSameOrAfter(startDate, "day") &&
                selected.isSameOrBefore(endDate, "day")
              );
            });
            const sorted = daily.slice().sort((a, b) => {
              const aStart = a.workers
                .flatMap((w) => w.periods.map((p) => dayjs(p.start)))
                .sort((x, y) => x.valueOf() - y.valueOf())[0];
              const bStart = b.workers
                .flatMap((w) => w.periods.map((p) => dayjs(p.start)))
                .sort((x, y) => x.valueOf() - y.valueOf())[0];
              return (aStart?.valueOf() ?? 0) - (bStart?.valueOf() ?? 0);
            });

            // 연속된 일정의 위치를 계산하는 함수
            const getSchedulePosition = (
              schedule: Schedule,
              currentDate: string
            ) => {
              const start = dayjs(schedule.startDate);
              const end = dayjs(schedule.endDate);
              const current = dayjs(currentDate);

              const isFirst = current.isSame(start, "day");
              const isLast = current.isSame(end, "day");
              const isSingle = start.isSame(end, "day");

              return { isFirst, isLast, isSingle };
            };

            const handleDayPress = () => {
              setSelectedDate(key);
              setSelectedScheduleId(null);
              if (Platform.OS === "web") {
                setModalType("timetable");
                setTimeout(() => {
                  showModal();
                }, 0);
              }
              // 앱에서는 모달을 열지 않고 하단에 스케줄 목록만 표시
            };

            if (Platform.OS === "web") {
              // 웹에서는 기존 스타일 사용
              return (
                <Pressable
                  style={{ flex: 1, minHeight: 100, padding: 2 }}
                  onPress={handleDayPress}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "500",
                      textAlign: "center",
                      marginBottom: 4,
                      color: Theme.colors.text.primary,
                    }}
                  >
                    {date?.day}
                  </Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    {sorted.slice(0, 3).map((schedule, index) => {
                      const { isFirst, isLast, isSingle } = getSchedulePosition(
                        schedule,
                        key
                      );

                      return (
                        <Pressable
                          key={schedule.id}
                          onPress={(e) => {
                            e.stopPropagation();
                            onSchedulePress(schedule.id);
                          }}
                          style={{
                            backgroundColor: getCategoryColor(
                              schedule.category
                            ),
                            borderTopLeftRadius: isFirst || isSingle ? 4 : 0,
                            borderBottomLeftRadius: isFirst || isSingle ? 4 : 0,
                            borderTopRightRadius: isLast || isSingle ? 4 : 0,
                            borderBottomRightRadius: isLast || isSingle ? 4 : 0,
                            padding: 2,
                            marginBottom: 1,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              color: "white",
                              fontWeight: "500",
                            }}
                            numberOfLines={1}
                          >
                            {schedule.title}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {sorted.length > 3 && (
                      <Text
                        style={{
                          fontSize: 10,
                          color: Theme.colors.text.tertiary,
                          textAlign: "center",
                        }}
                      >
                        +{sorted.length - 3} more
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            } else {
              // 앱에서는 더 안전한 스타일 사용
              return (
                <View
                  style={{
                    width: "100%",
                    height: 60,
                    padding: 1,
                    justifyContent: "flex-start",
                    alignItems: "center",
                  }}
                >
                  <Pressable
                    onPress={handleDayPress}
                    style={{
                      width: "100%",
                      height: "100%",
                      justifyContent: "flex-start",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        textAlign: "center",
                        marginBottom: 2,
                        color: Theme.colors.text.primary,
                      }}
                    >
                      {date?.day}
                    </Text>
                    <View
                      style={{
                        width: "100%",
                        flex: 1,
                        justifyContent: "flex-start",
                        alignItems: "center",
                      }}
                    >
                      {sorted.slice(0, 2).map((schedule, index) => {
                        const { isFirst, isLast, isSingle } =
                          getSchedulePosition(schedule, key);

                        return (
                          <Pressable
                            key={schedule.id}
                            onPress={(e) => {
                              e.stopPropagation();
                              if (Platform.OS === "web") {
                                onSchedulePress(schedule.id);
                              } else {
                                // 앱에서는 날짜 클릭과 동일하게 처리
                                handleDayPress();
                              }
                            }}
                            style={{
                              backgroundColor: getCategoryColor(
                                schedule.category
                              ),
                              borderTopLeftRadius: isFirst || isSingle ? 2 : 0,
                              borderBottomLeftRadius:
                                isFirst || isSingle ? 2 : 0,
                              borderTopRightRadius: isLast || isSingle ? 2 : 0,
                              borderBottomRightRadius:
                                isLast || isSingle ? 2 : 0,
                              paddingHorizontal: 2,
                              paddingVertical: 1,
                              marginBottom: 1,
                              width: "90%",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 7,
                                color: "white",
                                fontWeight: "500",
                              }}
                              numberOfLines={1}
                            >
                              {schedule.title}
                            </Text>
                          </Pressable>
                        );
                      })}
                      {sorted.length > 2 && (
                        <Text
                          style={{
                            fontSize: 7,
                            color: Theme.colors.text.tertiary,
                            textAlign: "center",
                          }}
                        >
                          +{sorted.length - 2}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                </View>
              );
            }
          }}
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
            setSelectedScheduleId(null);
            if (Platform.OS === "web") {
              setModalType("timetable");
              setTimeout(() => {
                showModal();
              }, 0);
            }
            // 앱에서는 모달을 열지 않고 하단에 스케줄 목록만 표시
          }}
          onMonthChange={(month) => {
            setCurrentMonth(month.dateString);
          }}
          enableSwipeMonths={true}
          hideExtraDays={false}
          showWeekNumbers={false}
          disableMonthChange={false}
        />

        {/* 앱에서만 표시되는 선택된 날짜의 스케줄 목록 */}
        {Platform.OS !== "web" && selectedDate && (
          <View style={styles.mobileScheduleList}>
            <Text style={styles.mobileScheduleListTitle}>
              {dayjs(selectedDate).format("M월 D일 dddd")} 일정
            </Text>
            {(() => {
              const dailySchedules = schedules.filter((s) => {
                const startDate = dayjs(s.startDate);
                const endDate = dayjs(s.endDate);
                const selected = dayjs(selectedDate);
                return (
                  selected.isSameOrAfter(startDate, "day") &&
                  selected.isSameOrBefore(endDate, "day")
                );
              });

              const sortedSchedules = dailySchedules.slice().sort((a, b) => {
                const aStart = a.workers
                  .flatMap((w) => w.periods.map((p) => dayjs(p.start)))
                  .sort((x, y) => x.valueOf() - y.valueOf())[0];
                const bStart = b.workers
                  .flatMap((w) => w.periods.map((p) => dayjs(p.start)))
                  .sort((x, y) => x.valueOf() - y.valueOf())[0];
                return (aStart?.valueOf() ?? 0) - (bStart?.valueOf() ?? 0);
              });

              if (sortedSchedules.length === 0) {
                return (
                  <Text style={styles.noScheduleText}>
                    이 날에는 일정이 없습니다.
                  </Text>
                );
              }

              return (
                <ScrollView
                  style={styles.scheduleScrollView}
                  showsVerticalScrollIndicator={false}
                >
                  {sortedSchedules.map((schedule) => {
                    const scheduleStart = schedule.workers
                      .flatMap((w) => w.periods.map((p) => dayjs(p.start)))
                      .sort((x, y) => x.valueOf() - y.valueOf())[0];
                    const scheduleEnd = schedule.workers
                      .flatMap((w) => w.periods.map((p) => dayjs(p.end)))
                      .sort((x, y) => y.valueOf() - x.valueOf())[0];

                    return (
                      <Pressable
                        key={schedule.id}
                        style={styles.mobileScheduleItem}
                        onPress={() => onSchedulePress(schedule.id)}
                      >
                        <View style={styles.mobileScheduleContent}>
                          <View style={styles.mobileScheduleLeft}>
                            <Text style={styles.mobileScheduleTitle}>
                              {schedule.title}
                            </Text>
                            <Text style={styles.mobileScheduleLocation}>
                              {schedule.address ||
                                schedule.location ||
                                "위치 정보 없음"}
                            </Text>
                            {/* 모바일에서 지도 연동 버튼 */}
                            {(schedule.address || schedule.location) && (
                              <View style={styles.mobileMapButtons}>
                                <Pressable
                                  style={styles.mobileMapButton}
                                  onPress={() => {
                                    const address =
                                      schedule.address || schedule.location!;
                                    if (Platform.OS === "web") {
                                      openKakaoMap(address);
                                    } else {
                                      openMapApp(address, "kakao");
                                    }
                                  }}
                                >
                                  <Ionicons
                                    name="map"
                                    size={12}
                                    color="#FFEB3B"
                                  />
                                  <Text style={styles.mobileMapButtonText}>
                                    카카오맵
                                  </Text>
                                </Pressable>
                                <Pressable
                                  style={styles.mobileMapButton}
                                  onPress={() => {
                                    const address =
                                      schedule.address || schedule.location!;
                                    if (Platform.OS === "web") {
                                      openNaverMap(address);
                                    } else {
                                      openMapApp(address, "naver");
                                    }
                                  }}
                                >
                                  <Ionicons
                                    name="map"
                                    size={12}
                                    color="#03C75A"
                                  />
                                  <Text style={styles.mobileMapButtonText}>
                                    네이버지도
                                  </Text>
                                </Pressable>
                              </View>
                            )}
                          </View>
                          <View style={styles.mobileScheduleRight}>
                            <Text style={styles.mobileScheduleTime}>
                              {scheduleStart
                                ? scheduleStart.format("A h:mm")
                                : "시간 미정"}
                            </Text>
                            <Text style={styles.mobileScheduleTime}>
                              {scheduleEnd
                                ? scheduleEnd.format("A h:mm")
                                : "시간 미정"}
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
        )}
      </View>

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
                    backgroundColor: "#f8f9fa",
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
                  {modalType === "timetable" && (
                    <View style={{ flex: 1 }}>
                      {/* 날짜 헤더 */}
                      <View
                        style={{
                          padding: 16,
                          borderBottomWidth: 1,
                          borderBottomColor: "#e5e7eb",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "600",
                            textAlign: "center",
                          }}
                        >
                          {dayjs(selectedDate).format("YYYY년 M월 D일 dddd")}
                        </Text>
                      </View>

                      {/* 타임테이블 */}
                      <ScrollView style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", minHeight: 960 }}>
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
                                  <Text style={{ fontSize: 11, color: "#666" }}>
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
                                  borderBottomColor: "#e5e7eb",
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
                              const times = schedule.workers.flatMap((w) =>
                                w.periods.map((p) => ({
                                  start: dayjs(p.start),
                                  end: dayjs(p.end),
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
                                  key={schedule.id}
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
                          borderBottomColor: "#e5e7eb",
                        }}
                      >
                        <Pressable
                          onPress={() => {
                            setModalType("timetable");
                            // 현재 선택된 날짜로 타임테이블 표시
                            setSelectedDate(selectedDate);
                          }}
                        >
                          <Text style={{ fontSize: 16, color: "#2563eb" }}>
                            ← 타임테이블로
                          </Text>
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
                            schedules.map((s) => ({ id: s.id, title: s.title }))
                          );
                          const schedule = schedules.find(
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
                                    fontSize: 16,
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
                                {schedules.map((s, index) => (
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
                                  fontSize: 16,
                                  marginBottom: 16,
                                  color: "#374151",
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
                                  fontSize: 16,
                                  marginBottom: 16,
                                  color: "#374151",
                                }}
                              >
                                {schedule.description || "설명이 없습니다."}
                              </Text>

                              {/* 주소 정보 */}
                              <View style={{ marginBottom: 16 }}>
                                <Text
                                  style={{
                                    fontSize: 14,
                                    fontWeight: "600",
                                    color: "#374151",
                                    marginBottom: 8,
                                  }}
                                >
                                  주소
                                </Text>
                                <View style={{ flexDirection: "row", gap: 8 }}>
                                  <TextInput
                                    style={{
                                      flex: 1,
                                      borderWidth: 1,
                                      borderColor: "#d1d5db",
                                      borderRadius: 6,
                                      padding: 12,
                                      fontSize: 14,
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
                                              (s) => s.id === selectedScheduleId
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
                                                    address: result.roadAddress,
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
                                        fontSize: 12,
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
                                        fontSize: 12,
                                        color: "#6b7280",
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
                                              fontSize: 12,
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
                                              fontSize: 12,
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
                                                fontSize: 12,
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
                                      fontSize: 18,
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
                                        const currentSchedule = schedules.find(
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
                                        style={{ color: "white", fontSize: 12 }}
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
                                        style={{ color: "white", fontSize: 12 }}
                                      >
                                        상세보기
                                      </Text>
                                    </Pressable>
                                  </View>
                                </View>

                                {schedule.workers.map((workerInfo, index) => (
                                  <WorkerCard
                                    key={index}
                                    worker={workerInfo.worker}
                                    periods={workerInfo.periods}
                                    paid={workerInfo.paid}
                                    onTogglePaid={(paid) => {
                                      const updatedSchedules = [...schedules];
                                      const scheduleIndex =
                                        updatedSchedules.findIndex(
                                          (s) => s.id === schedule.id
                                        );
                                      if (scheduleIndex !== -1) {
                                        updatedSchedules[scheduleIndex].workers[
                                          index
                                        ].paid = paid;
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
                                ))}
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
                          borderBottomColor: "#e5e7eb",
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
                            return <Text>스케줄 정보를 찾을 수 없습니다.</Text>;
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
                                        currentDate = currentDate.add(1, "day");
                                      }

                                      setNewWorker((prev) => ({
                                        ...prev,
                                        workStartDate: workStartDate,
                                        workEndDate: workEndDate,
                                        dailyWorkPeriods: dailyPeriods,
                                      }));
                                    }
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
                                      fontSize: 14,
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
                                {schedule.workers.map((workerInfo, index) => (
                                  <View
                                    key={index}
                                    style={{
                                      backgroundColor: "#f8f9fa",
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
                                        fontSize: 18,
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
                                          fontSize: 12,
                                          color: "#6b7280",
                                          marginBottom: 4,
                                        }}
                                      >
                                        전화번호
                                      </Text>
                                      <Pressable
                                        onPress={() =>
                                          makePhoneCall(workerInfo.worker.phone)
                                        }
                                      >
                                        <Text
                                          style={{
                                            fontSize: 14,
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
                                          fontSize: 12,
                                          color: "#6b7280",
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
                                            fontSize: 12,
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
                                            fontSize: 12,
                                            color: "#6b7280",
                                          }}
                                        >
                                          원
                                        </Text>
                                      </View>

                                      <Text
                                        style={{
                                          fontSize: 12,
                                          color: "#6b7280",
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
                                            fontSize: 12,
                                            width: 100,
                                          }}
                                          value={formatWorkHours(
                                            workHours[workerInfo.worker.id] ||
                                              workerInfo.periods.reduce(
                                                (
                                                  total: number,
                                                  period: any
                                                ) => {
                                                  const start = dayjs(
                                                    period.start
                                                  );
                                                  const end = dayjs(period.end);
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
                                            const hours = parseWorkHours(text);
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
                                          fontSize: 12,
                                          color: "#6b7280",
                                          marginBottom: 4,
                                        }}
                                      >
                                        급여 계산
                                      </Text>
                                      {(() => {
                                        const pay = calculatePay(workerInfo);
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
                                                fontSize: 12,
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
                                                  fontSize: 12,
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
                                                fontSize: 14,
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
                                          fontSize: 12,
                                          color: "#6b7280",
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
                                              fontSize: 12,
                                              color: "#6b7280",
                                              minWidth: 40,
                                            }}
                                          >
                                            {detectBankFromAccount(
                                              workerInfo.worker.bankAccount
                                            )?.shortName || "은행"}
                                          </Text>
                                          <Text
                                            style={{
                                              fontSize: 12,
                                              color: "#1f2937",
                                              flex: 1,
                                            }}
                                          >
                                            {workerInfo.worker.bankAccount}
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
                                                workerInfo.worker.bankAccount
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
                                                workerInfo.worker.bankAccount
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
                                            fontSize: 12,
                                            color: "#6b7280",
                                            marginBottom: 4,
                                          }}
                                        >
                                          메모
                                        </Text>
                                        <Text
                                          style={{
                                            fontSize: 12,
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
                                            fontSize: 12,
                                            color: "#6b7280",
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
                                                workerData[workerInfo.worker.id]
                                                  ?.taxWithheld !== undefined
                                                  ? workerData[
                                                      workerInfo.worker.id
                                                    ].taxWithheld
                                                  : workerInfo.worker
                                                      .taxWithheld
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
                                                  ]?.taxWithheld !== undefined
                                                    ? workerData[
                                                        workerInfo.worker.id
                                                      ].taxWithheld
                                                    : workerInfo.worker
                                                        .taxWithheld
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
                                                : workerInfo.worker.taxWithheld)
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
                                                  : workerInfo.worker
                                                      .taxWithheld)
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
                                            fontSize: 12,
                                            color: "#6b7280",
                                          }}
                                        >
                                          지급완료
                                        </Text>
                                        <Switch
                                          value={
                                            workerData[workerInfo.worker.id]
                                              ?.paid !== undefined
                                              ? workerData[workerInfo.worker.id]
                                                  .paid
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
                                ))}
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
                style={{
                  fontSize: 18,
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
                <Text
                  style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                >
                  이름
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 16,
                  }}
                  value={newWorker.name}
                  onChangeText={(text) =>
                    setNewWorker({ ...newWorker, name: text })
                  }
                  placeholder="이름을 입력하세요"
                />
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
                    fontSize: 16,
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
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Text
                    style={{ fontSize: 14, color: "#6b7280", minWidth: 60 }}
                  >
                    {detectBankFromAccount(newWorker.bankAccount)?.shortName ||
                      "은행"}
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#d1d5db",
                      borderRadius: 6,
                      padding: 12,
                      fontSize: 16,
                      flex: 1,
                    }}
                    value={formatAccountNumber(newWorker.bankAccount)}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9]/g, "");
                      setNewWorker({ ...newWorker, bankAccount: cleaned });
                    }}
                    placeholder="3333-06-2418525"
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
                    fontSize: 16,
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
                    style={{ fontSize: 14, marginBottom: 8, color: "#374151" }}
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
                    style={{ fontSize: 14, marginBottom: 8, color: "#374151" }}
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
                      <Text style={{ color: "#6b7280", fontSize: 14 }}>~</Text>
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
              {!newWorker.isWorkHoursSameEveryDay && !newWorker.fullPeriod && (
                <View style={{ marginBottom: 16 }}>
                  <Text
                    style={{ fontSize: 14, marginBottom: 8, color: "#374151" }}
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
                              color: "#6b7280",
                              marginBottom: 6,
                              fontWeight: "500",
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
                                  fontSize: 12,
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
                              <Text style={{ color: "#6b7280", fontSize: 12 }}>
                                ~
                              </Text>
                              <TextInput
                                style={{
                                  borderWidth: 1,
                                  borderColor: "#d1d5db",
                                  borderRadius: 4,
                                  padding: 8,
                                  fontSize: 12,
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
                              : dayjs(schedule.startDate).subtract(1, "day");

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
                    fontSize: 16,
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
          </View>

          {/* 하단 버튼들 - 모달 밖으로 이동 */}
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
              onPress={() => setShowAddWorkerModal(false)}
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
              onPress={handleAddWorker}
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
                추가
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 주소 검색 모달 (앱에서만) */}
      <AddressSearchModal
        visible={isAddressSearchVisible}
        onClose={() => setIsAddressSearchVisible(false)}
        onSelectAddress={handleAddressSelect}
        currentAddress={
          selectedScheduleId
            ? schedules.find((s) => s.id === selectedScheduleId)?.address || ""
            : ""
        }
      />
    </View>
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
