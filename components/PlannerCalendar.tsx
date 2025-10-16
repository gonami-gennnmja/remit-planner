import { Text } from "@/components/Themed";
import { Schedule, ScheduleCategory } from "@/models/types";
import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Clipboard,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { PanGestureHandler, State } from "react-native-gesture-handler";

function getCategoryColor(category: ScheduleCategory): string {
  const colors: Record<ScheduleCategory, string> = {
    education: "#8b5cf6",
    meeting: "#3b82f6",
    event: "#ef4444",
    others: "#6b7280",
  };
  return colors[category] || colors.others;
}

function getSchedulePosition(
  schedule: Schedule,
  hourHeight: number
): { top: number; height: number } {
  const times = schedule.workers.flatMap((w) =>
    w.periods.map((p) => ({
      start: dayjs(p.start),
      end: dayjs(p.end),
    }))
  );

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
    hourlyWage: 0,
    taxWithheld: true,
  });
  // 정적 테스트 데이터
  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const today = dayjs().format("YYYY-MM-DD");
    const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");

    return [
      {
        id: "1",
        title: "수학 과외",
        date: today,
        description: "고등학교 2학년 수학 과외",
        category: "education",
        workers: [
          {
            worker: {
              id: "w1",
              name: "김선생",
              phone: "010-1234-5678",
              bankAccount: "123-456-789",
              hourlyWage: 50000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "p1",
                start: `${today}T14:00:00+09:00`,
                end: `${today}T16:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      {
        id: "2",
        title: "영어 회화",
        date: today,
        description: "성인 영어 회화 수업",
        category: "education",
        workers: [
          {
            worker: {
              id: "w2",
              name: "Sarah Johnson",
              phone: "010-9876-5432",
              bankAccount: "987-654-321",
              hourlyWage: 80000,
              taxWithheld: false,
            },
            periods: [
              {
                id: "p2",
                start: `${today}T19:00:00+09:00`,
                end: `${today}T21:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      {
        id: "3",
        title: "프로젝트 회의",
        date: tomorrow,
        description: "웹 개발 프로젝트 진행 회의",
        category: "meeting",
        workers: [
          {
            worker: {
              id: "w3",
              name: "이개발",
              phone: "010-5555-1234",
              bankAccount: "555-123-456",
              hourlyWage: 100000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "p3",
                start: `${tomorrow}T10:00:00+09:00`,
                end: `${tomorrow}T12:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
    ];
  });
  const [loading, setLoading] = useState(false);

  const translateY = new Animated.Value(0);

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

  const monthMarks = useMemo(() => {
    const marks: Record<
      string,
      { dots: { color: string }[]; marked?: boolean }
    > = {};

    schedules.forEach((schedule: Schedule) => {
      const date = dayjs(schedule.date).format("YYYY-MM-DD");
      if (!marks[date]) {
        marks[date] = { dots: [] };
      }
      marks[date].dots.push({
        color: getCategoryColor(schedule.category),
      });
      marks[date].marked = true;
    });

    return marks;
  }, [schedules]);

  const selectedDateSchedules = useMemo(() => {
    return schedules
      .filter((s) => s.date === selectedDate)
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

  const addWorkerToSchedule = (scheduleId: string, worker: any) => {
    setSchedules((prevSchedules) =>
      prevSchedules.map((schedule) => {
        if (schedule.id === scheduleId) {
          const newWorkerId = `w${Date.now()}`;
          const newWorkerInfo = {
            worker: {
              id: newWorkerId,
              name: worker.name,
              phone: worker.phone,
              bankAccount: worker.bankAccount,
              hourlyWage: worker.hourlyWage,
              taxWithheld: worker.taxWithheld,
            },
            periods: [
              {
                id: `p${Date.now()}`,
                start: `${schedule.date}T09:00:00+09:00`,
                end: `${schedule.date}T17:00:00+09:00`,
              },
            ],
            paid: false,
          };
          return {
            ...schedule,
            workers: [...schedule.workers, newWorkerInfo],
          };
        }
        return schedule;
      })
    );
  };

  const handleAddWorker = () => {
    if (
      !newWorker.name ||
      !newWorker.phone ||
      !newWorker.bankAccount ||
      newWorker.hourlyWage <= 0
    ) {
      Alert.alert("오류", "모든 필드를 올바르게 입력해주세요.");
      return;
    }

    // 현재 선택된 스케줄에 근로자 추가
    if (selectedScheduleId) {
      addWorkerToSchedule(selectedScheduleId, newWorker);
      setShowAddWorkerModal(false);
      setNewWorker({
        name: "",
        phone: "",
        bankAccount: "",
        hourlyWage: 0,
        taxWithheld: true,
      });
      Alert.alert("성공", "근로자가 추가되었습니다.");
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
            todayTextColor: "#2563eb",
            calendarBackground: "white",
            textSectionTitleColor: "#6b7280",
            dayTextColor: "#1f2937",
            textDisabledColor: "#d1d5db",
            arrowColor: "#2563eb",
            monthTextColor: "#1f2937",
            indicatorColor: "#2563eb",
            textDayFontWeight: "500",
            textMonthFontWeight: "600",
            textDayHeaderFontWeight: "600",
          }}
          dayComponent={({ date }) => {
            const key = date?.dateString ?? "";
            const daily = schedules.filter((s) => s.date === key);
            const sorted = daily.slice().sort((a, b) => {
              const aStart = a.workers
                .flatMap((w) => w.periods.map((p) => dayjs(p.start)))
                .sort((x, y) => x.valueOf() - y.valueOf())[0];
              const bStart = b.workers
                .flatMap((w) => w.periods.map((p) => dayjs(p.start)))
                .sort((x, y) => x.valueOf() - y.valueOf())[0];
              return (aStart?.valueOf() ?? 0) - (bStart?.valueOf() ?? 0);
            });

            const handleDayPress = () => {
              setSelectedDate(key);
              setSelectedScheduleId(null);
              setModalType("timetable");
              setTimeout(() => {
                showModal();
              }, 0);
            };

            return (
              <Pressable
                style={{ flex: 1, minHeight: 80, padding: 2 }}
                onPress={handleDayPress}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    textAlign: "center",
                    marginBottom: 4,
                  }}
                >
                  {date?.day}
                </Text>
                <View style={{ flex: 1, gap: 2 }}>
                  {sorted.slice(0, 3).map((schedule, index) => (
                    <Pressable
                      key={schedule.id}
                      onPress={(e) => {
                        e.stopPropagation();
                        onSchedulePress(schedule.id);
                      }}
                      style={{
                        backgroundColor: getCategoryColor(schedule.category),
                        borderRadius: 4,
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
                  ))}
                  {sorted.length > 3 && (
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#6b7280",
                        textAlign: "center",
                      }}
                    >
                      +{sorted.length - 3} more
                    </Text>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
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
                          const schedule = schedules.find(
                            (s) => s.id === selectedScheduleId
                          );
                          if (!schedule)
                            return <Text>스케쥴을 찾을 수 없습니다.</Text>;
                          return (
                            <View>
                              <Text
                                style={{
                                  fontSize: 24,
                                  fontWeight: "bold",
                                  marginBottom: 16,
                                }}
                              >
                                {schedule.title}
                              </Text>
                              <Text style={{ fontSize: 16, marginBottom: 16 }}>
                                {dayjs(schedule.date).format(
                                  "YYYY년 M월 D일 dddd"
                                )}
                              </Text>
                              <Text style={{ fontSize: 16, marginBottom: 16 }}>
                                {schedule.description}
                              </Text>

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
                                      onPress={() =>
                                        setShowAddWorkerModal(true)
                                      }
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
                                  <View
                                    key={index}
                                    style={{
                                      backgroundColor: "#f8f9fa",
                                      padding: 16,
                                      borderRadius: 8,
                                      marginBottom: 12,
                                    }}
                                  >
                                    {/* 근로자 이름 */}
                                    <Text
                                      style={{
                                        fontSize: 18,
                                        fontWeight: "600",
                                        marginBottom: 8,
                                      }}
                                    >
                                      {workerInfo.worker.name}
                                    </Text>

                                    {/* 포지션 */}
                                    <Text
                                      style={{
                                        fontSize: 14,
                                        color: "#6b7280",
                                        marginBottom: 6,
                                      }}
                                    >
                                      포지션:{" "}
                                      {workerInfo.worker.name.includes("선생")
                                        ? "강사"
                                        : workerInfo.worker.name.includes(
                                            "개발"
                                          )
                                        ? "개발자"
                                        : workerInfo.worker.name.includes(
                                            "이벤트"
                                          )
                                        ? "이벤트 담당"
                                        : "근로자"}
                                    </Text>

                                    {/* 근무여부 */}
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        marginBottom: 8,
                                      }}
                                    >
                                      <View
                                        style={{
                                          width: 8,
                                          height: 8,
                                          borderRadius: 4,
                                          backgroundColor: workerInfo.paid
                                            ? "#10b981"
                                            : "#f59e0b",
                                          marginRight: 6,
                                        }}
                                      />
                                      <Text
                                        style={{
                                          fontSize: 14,
                                          color: workerInfo.paid
                                            ? "#10b981"
                                            : "#f59e0b",
                                          fontWeight: "500",
                                        }}
                                      >
                                        {workerInfo.paid
                                          ? "근무완료"
                                          : "근무예정"}
                                      </Text>
                                    </View>

                                    {/* 전화번호와 연락 버튼들 */}
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
                                          fontSize: 14,
                                          color: "#1f2937",
                                          flex: 1,
                                        }}
                                      >
                                        {workerInfo.worker.phone}
                                      </Text>
                                      <View
                                        style={{ flexDirection: "row", gap: 8 }}
                                      >
                                        <Pressable
                                          onPress={() =>
                                            makePhoneCall(
                                              workerInfo.worker.phone
                                            )
                                          }
                                          style={{
                                            backgroundColor: "#2563eb",
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                            borderRadius: 4,
                                          }}
                                        >
                                          <Text
                                            style={{
                                              color: "white",
                                              fontSize: 12,
                                            }}
                                          >
                                            📞
                                          </Text>
                                        </Pressable>
                                        <Pressable
                                          onPress={() =>
                                            sendSMS(workerInfo.worker.phone)
                                          }
                                          style={{
                                            backgroundColor: "#10b981",
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                            borderRadius: 4,
                                          }}
                                        >
                                          <Text
                                            style={{
                                              color: "white",
                                              fontSize: 12,
                                            }}
                                          >
                                            💬
                                          </Text>
                                        </Pressable>
                                        <Pressable
                                          onPress={() =>
                                            showContactOptions(
                                              workerInfo.worker.phone
                                            )
                                          }
                                          style={{
                                            backgroundColor: "#6b7280",
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                            borderRadius: 4,
                                          }}
                                        >
                                          <Text
                                            style={{
                                              color: "white",
                                              fontSize: 12,
                                            }}
                                          >
                                            ⋯
                                          </Text>
                                        </Pressable>
                                      </View>
                                    </View>

                                    {/* 시급 및 근무시간 */}
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                      }}
                                    >
                                      <Text
                                        style={{
                                          fontSize: 12,
                                          color: "#6b7280",
                                        }}
                                      >
                                        시급:{" "}
                                        {workerInfo.worker.hourlyWage.toLocaleString()}
                                        원
                                      </Text>
                                      <Text
                                        style={{
                                          fontSize: 12,
                                          color: "#6b7280",
                                        }}
                                      >
                                        근무시간:{" "}
                                        {(() => {
                                          const totalHours =
                                            workerInfo.periods.reduce(
                                              (total, period) => {
                                                const start = dayjs(
                                                  period.start
                                                );
                                                const end = dayjs(period.end);
                                                return (
                                                  total +
                                                  end.diff(start, "hour", true)
                                                );
                                              },
                                              0
                                            );
                                          return `${totalHours.toFixed(1)}시간`;
                                        })()}
                                      </Text>
                                    </View>
                                  </View>
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
                                  onPress={() => setShowAddWorkerModal(true)}
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
                                          📞 {workerInfo.worker.phone}
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
                                        <Text
                                          style={{
                                            fontSize: 12,
                                            color: "#1f2937",
                                            flex: 1,
                                          }}
                                        >
                                          {workerInfo.worker.bankAccount}
                                        </Text>
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
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 12,
              padding: 20,
              width: "90%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              새 근로자 추가
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}>
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
              <Text style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}>
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
                value={newWorker.phone}
                onChangeText={(text) =>
                  setNewWorker({ ...newWorker, phone: text })
                }
                placeholder="010-1234-5678"
                keyboardType="phone-pad"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}>
                계좌번호
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 6,
                  padding: 12,
                  fontSize: 16,
                }}
                value={newWorker.bankAccount}
                onChangeText={(text) =>
                  setNewWorker({ ...newWorker, bankAccount: text })
                }
                placeholder="123-456-789"
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}>
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
                value={newWorker.hourlyWage.toString()}
                onChangeText={(text) => {
                  const wage = parseInt(text) || 0;
                  setNewWorker({ ...newWorker, hourlyWage: wage });
                }}
                placeholder="50000"
                keyboardType="numeric"
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, marginBottom: 8, color: "#374151" }}>
                세금공제
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={() =>
                    setNewWorker({ ...newWorker, taxWithheld: true })
                  }
                  style={{
                    backgroundColor: newWorker.taxWithheld
                      ? "#2563eb"
                      : "#e5e7eb",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 6,
                    flex: 1,
                  }}
                >
                  <Text
                    style={{
                      color: newWorker.taxWithheld ? "white" : "#6b7280",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    Y (3.3% 공제)
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    setNewWorker({ ...newWorker, taxWithheld: false })
                  }
                  style={{
                    backgroundColor: !newWorker.taxWithheld
                      ? "#2563eb"
                      : "#e5e7eb",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 6,
                    flex: 1,
                  }}
                >
                  <Text
                    style={{
                      color: !newWorker.taxWithheld ? "white" : "#6b7280",
                      textAlign: "center",
                      fontWeight: "600",
                    }}
                  >
                    N (공제 없음)
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
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
        </View>
      </Modal>
    </View>
  );
}
