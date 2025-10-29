// @ts-nocheck
import MonthlyPayrollModal from "@/components/MonthlyPayrollModal";
import MultiStepScheduleModal from "@/components/MultiStepScheduleModal";
import StaffWorkStatusModal from "@/components/StaffWorkStatusModal";
import TodayScheduleModal from "@/components/TodayScheduleModal";
import UnpaidScheduleModal from "@/components/UnpaidScheduleModal";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import { useResponsive } from "@/hooks/useResponsive";
import { Schedule } from "@/models/types";
import { getCurrentUser, User } from "@/utils/authUtils";
import { formatPhoneNumber } from "@/utils/bankUtils";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const isWeb = Platform.OS === "web";
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// 활동 갯수 표시 헬퍼 함수
const formatActivityCount = (count: number): string => {
  return count > 10 ? "10+" : count.toString();
};

interface Activity {
  id: string;
  type: "schedule" | "worker" | "payment" | "revenue";
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
  relatedId?: string;
  isRead?: boolean;
  isDeleted?: boolean;
}

// 드래그로 삭제할 수 있는 활동 아이템 컴포넌트
const SwipeableActivityItem = ({
  activity,
  onDelete,
  onViewDetails,
  colors,
  formatActivityTime,
}: {
  activity: Activity;
  onDelete: (id: string) => void;
  onViewDetails: (activity: Activity) => void;
  colors: any;
  formatActivityTime: (timestamp: string) => string;
}) => {
  const translateX = new Animated.Value(0);
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  // 스와이프 제스처 (푸시 알림처럼)
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10;
    },
    onPanResponderGrant: () => {},
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        const maxDrag = -80; // 삭제 버튼 너비
        const dragValue = Math.max(gestureState.dx, maxDrag);
        translateX.setValue(dragValue);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      const deleteThreshold = -65; // 많이 드래그하면 바로 삭제

      if (gestureState.dx < deleteThreshold) {
        // 많이 드래그 → 바로 삭제
        Animated.timing(translateX, {
          toValue: -screenWidth,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onDelete(activity.id);
        });
      } else if (gestureState.dx < -30) {
        // 조금 드래그 → 삭제 버튼 표시 (완전히 보이도록)
        setShowDeleteButton(true);
        Animated.spring(translateX, {
          toValue: -80,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
      } else {
        // 원래 위치로 복귀
        setShowDeleteButton(false);
        Animated.spring(translateX, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const content = (
    <Pressable
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        padding: 16,
        borderRadius: 14,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
        gap: 12,
      }}
      onPress={() => onViewDetails(activity)}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: `${activity.color}20`,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons
          name={activity.icon as any}
          size={24}
          color={activity.color}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#1d1d1f" }}>
          {activity.title}
        </Text>
        <Text style={{ fontSize: 14, color: "#86868b", marginTop: 2 }}>
          {activity.description}
        </Text>
        <Text style={{ fontSize: 12, color: "#86868b", marginTop: 4 }}>
          {formatActivityTime(activity.timestamp)}
        </Text>
      </View>
      {!activity.isRead && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.primary,
          }}
        />
      )}
    </Pressable>
  );

  // 삭제 버튼 (드래그했을 때 보이는 버튼) - Apple Compact 스타일
  const deleteButton = (
    <Pressable
      style={{
        position: "absolute",
        right: -80,
        width: 80,
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f7", // Apple Compact 배경색
      }}
      onPress={() => {
        setShowDeleteButton(false);
        translateX.setValue(0);
        Animated.spring(translateX, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }).start();
        onDelete(activity.id);
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: "#ffffff",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Ionicons name="trash" size={24} color="#86868b" />
      </View>
      <Text
        style={{
          color: "#86868b",
          fontSize: 12,
          marginTop: 4,
          fontWeight: "500",
        }}
      >
        삭제
      </Text>
    </Pressable>
  );

  const wrappedContent = (
    <View style={{ position: "relative" }}>
      {content}
      {showDeleteButton && deleteButton}
    </View>
  );

  if (isWeb) {
    return content;
  }

  return (
    <Animated.View
      style={{
        transform: [{ translateX }],
      }}
      {...panResponder.panHandlers}
    >
      {wrappedContent}
    </Animated.View>
  );
};

// 웹용 알림 패널 컴포넌트
const WebNotificationPanel = ({
  activities,
  onDelete,
  onClose,
  onViewDetails,
  colors,
  formatActivityTime,
}: {
  activities: Activity[];
  onDelete: (id: string) => void;
  onClose: () => void;
  onViewDetails: (activity: Activity) => void;
  colors: any;
  formatActivityTime: (timestamp: string) => string;
}) => {
  if (!isWeb) return null;

  return (
    <View style={styles.webNotificationPanel}>
      {/* 배경 오버레이 */}
      <Pressable style={styles.webNotificationOverlay} onPress={onClose} />

      {/* 알림 패널 */}
      <View
        style={[
          styles.webNotificationContent,
          { backgroundColor: colors.surface },
        ]}
      >
        <View
          style={[
            styles.webNotificationHeader,
            { backgroundColor: colors.surface },
          ]}
        >
          <Text style={[styles.webNotificationTitle, { color: colors.text }]}>
            최근 활동
          </Text>
          <Pressable onPress={onClose} style={styles.webNotificationClose}>
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView style={styles.webNotificationList}>
          {activities.length === 0 ? (
            <View style={styles.webNotificationEmpty}>
              <Text
                style={[
                  styles.webNotificationEmptyText,
                  { color: colors.textSecondary },
                ]}
              >
                최근 활동이 없습니다
              </Text>
            </View>
          ) : (
            activities.map((activity) => (
              <SwipeableActivityItem
                key={activity.id}
                activity={activity}
                onDelete={onDelete}
                onViewDetails={onViewDetails}
                colors={colors}
                formatActivityTime={formatActivityTime}
              />
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default function MainScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showWebNotificationPanel, setShowWebNotificationPanel] =
    useState(false);
  const { screenData, isMobile, isTablet, isDesktop, getResponsiveValue } =
    useResponsive();
  const { colors } = useTheme();

  // 모달 상태
  const [showTodaySchedule, setShowTodaySchedule] = useState(false);
  const [showTodayWorkers, setShowTodayWorkers] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [showWorkerDetail, setShowWorkerDetail] = useState(false);
  const [showMonthlyPayroll, setShowMonthlyPayroll] = useState(false);
  const [showStaffWorkStatus, setShowStaffWorkStatus] = useState(false);
  const [showUnpaidSchedule, setShowUnpaidSchedule] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);

  // 월 급여/미수금 카드 토글 상태
  const [showPayrollAmount, setShowPayrollAmount] = useState(false);
  const [showUncollectedAmount, setShowUncollectedAmount] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 데이터베이스 초기화
        const db = getDatabase();
        await db.init();

        loadCurrentUser();
        loadSchedules();
        loadWorkers();
        loadClients();
        await initializeActivities(); // 초기 활동 생성 및 로드
      } catch (error) {
        console.error("Failed to initialize app:", error);
      }
    };

    initializeApp();
  }, []);

  // 화면이 포커스될 때마다 스케줄, 활동, 사용자 정보 새로고침
  useFocusEffect(
    useCallback(() => {
      loadSchedules();
      loadWorkers();
      loadClients();
      loadRecentActivitiesFromDB();
      loadCurrentUser(); // 사용자 정보 새로고침
    }, [])
  );

  // 활동 초기화 (알림 생성 없이 DB에서만 로드)
  const initializeActivities = async () => {
    try {
      // DB에서 기존 활동만 로드 (새로 생성하지 않음)
      await loadRecentActivitiesFromDB();
    } catch (error) {
      console.error("Failed to initialize activities:", error);
      await loadRecentActivitiesFromDB();
    }
  };

  const loadCurrentUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  };

  const loadSchedules = async () => {
    try {
      const db = getDatabase();

      // 오늘 일정만 최적화된 쿼리로 가져오기
      const today = dayjs().format("YYYY-MM-DD");
      const todaySchedules = await db.getTodaySchedules(today);
      setSchedules(todaySchedules);
    } catch (error) {
      console.error("Failed to load schedules:", error);
      setSchedules([]);
    }
  };

  const loadWorkers = async () => {
    try {
      const db = getDatabase();
      const workerList = await db.getAllWorkers();
      setWorkers(workerList);
    } catch (error) {
      console.error("Failed to load workers:", error);
      setWorkers([]);
    }
  };

  const loadClients = async () => {
    try {
      const db = getDatabase();
      const clientList = await db.getAllClients();
      setClients(clientList);
    } catch (error) {
      console.error("Failed to load clients:", error);
      setClients([]);
    }
  };

  // 실제 DB에서 활동 로드
  const loadRecentActivitiesFromDB = async () => {
    try {
      const db = getDatabase();
      const dbActivities = await db.getRecentActivities(20); // 초기 20개 로드

      // DB에 활동이 없으면 빈 배열 표시
      if (dbActivities.length === 0) {
        setRecentActivities([]);
        return;
      }

      // DB 활동을 UI에 맞는 형식으로 변환 (Supabase에서 이미 삭제된 활동은 제외됨)
      const formattedActivities: Activity[] = dbActivities.map(
        (activity: any) => ({
          id: activity.id,
          type: activity.type as "schedule" | "worker" | "payment" | "revenue",
          title: activity.title,
          description: activity.description || "",
          timestamp: activity.timestamp,
          icon: activity.icon || getDefaultIcon(activity.type),
          color: activity.color || getDefaultColor(activity.type),
          relatedId: activity.relatedId || activity.related_id,
          isRead: activity.isRead || false,
          isDeleted: activity.isDeleted || false,
        })
      );

      setRecentActivities(formattedActivities);
    } catch (error) {
      console.error("Failed to load activities from DB:", error);
      // DB 오류 시에만 빈 배열 (더미 데이터 대신)
      setRecentActivities([]);
    }
  };

  // 활동 삭제 함수
  const handleDeleteActivity = async (activityId: string) => {
    try {
      const db = getDatabase();
      await db.markActivityAsDeleted(activityId);

      // UI에서 즉시 제거
      setRecentActivities((prev) =>
        prev.filter((activity) => activity.id !== activityId)
      );
    } catch (error) {
      console.error("Failed to delete activity:", error);
    }
  };

  // 웹용 알림 애니메이션
  const webNotificationAnimation = useState(new Animated.Value(1000))[0];

  // 활동 상세 보기 함수
  const handleViewActivityDetails = async (activity: Activity) => {
    // 최근 활동 모달 닫기
    setShowActivityModal(false);

    if (activity.relatedId) {
      try {
        const db = getDatabase();

        // 활동을 읽음 처리
        await db.markActivityAsRead(activity.id);

        // UI에서 즉시 제거 (읽음 처리된 활동은 더 이상 표시되지 않음)
        setRecentActivities((prev) => prev.filter((a) => a.id !== activity.id));

        // 관련 ID가 있으면 해당 상세 화면으로 이동
        switch (activity.type) {
          case "schedule":
            // 스케줄 존재 여부 확인
            const schedule = await db.getSchedule(activity.relatedId);
            if (schedule) {
              router.push(`/schedule/${activity.relatedId}`);
            } else {
              alert("존재하지 않는 스케줄입니다.");
            }
            break;
          case "worker":
            router.push(`/worker/index`);
            break;
          case "payment":
            // 미지급 급여 알림 - 스케줄 상세로 이동 (근로자 정보 포함)
            const paymentSchedule = await db.getSchedule(activity.relatedId);
            if (paymentSchedule) {
              router.push(`/schedule/${activity.relatedId}`);
            } else {
              alert("존재하지 않는 스케줄입니다.");
            }
            break;
          case "revenue":
            // 미수금 알림 - 거래처 존재 여부 확인
            const client = await db.getClient(activity.relatedId);
            if (client) {
              router.push(`/clients/${activity.relatedId}`);
            } else {
              alert("존재하지 않는 거래처입니다.");
            }
            break;
          default:
        }
      } catch (error) {
        console.error("Error checking related ID:", error);
        alert("데이터를 확인하는 중 오류가 발생했습니다.");
      }
    } else {
      // 관련 ID가 없으면 일반 상세 표시 (모달 등)
      // TODO: 일반 상세 모달 구현
    }
  };

  // 기본 아이콘 가져오기
  const getDefaultIcon = (type: string): string => {
    switch (type) {
      case "schedule":
        return "calendar";
      case "worker":
        return "person-add";
      case "payment":
        return "card";
      case "revenue":
        return "business";
      default:
        return "information-circle";
    }
  };

  // 기본 색상 가져오기
  const getDefaultColor = (type: string): string => {
    switch (type) {
      case "schedule":
        return "#3b82f6";
      case "worker":
        return "#10b981";
      case "payment":
        return "#f59e0b";
      case "revenue":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  // 활동 프레스 핸들러
  const handleActivityPress = (activity: Activity) => {
    handleViewActivityDetails(activity);
  };

  // 상대 시간 포맷
  const formatRelativeTime = (timestamp: string): string => {
    const now = dayjs();
    const time = dayjs(timestamp);
    const diffMinutes = now.diff(time, "minute");

    if (diffMinutes < 1) return "방금 전";
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    const diffHours = now.diff(time, "hour");
    if (diffHours < 24) return `${diffHours}시간 전`;
    const diffDays = now.diff(time, "day");
    if (diffDays < 7) return `${diffDays}일 전`;
    return time.format("YYYY-MM-DD");
  };

  const loadRecentActivities = () => {
    // 더미 데이터 (DB에 활동이 없을 때 사용)
    const activities: Activity[] = [];

    // 스케줄 기반 활동
    schedules.forEach((schedule) => {
      const scheduleTime = dayjs(schedule.startDate);
      const timeAgo = dayjs().diff(scheduleTime, "hour");

      if (timeAgo < 24) {
        // 최근 24시간 내
        activities.push({
          id: `schedule-${schedule.id}`,
          type: "schedule",
          title: `${schedule.title} 일정 추가`,
          description: schedule.location || schedule.description || "",
          timestamp: scheduleTime.format("YYYY-MM-DD HH:mm"),
          icon: "calendar",
          color: "#6366f1", // 인디고 바이올렛
        });
      }
    });

    // 근로자 기반 활동
    const allWorkers = schedules.flatMap(
      (s) => s.workers?.map((w) => w.worker) || []
    );
    allWorkers.forEach((worker, index) => {
      if (index < 2) {
        // 최근 2명의 근로자
        activities.push({
          id: `worker-${worker.id}`,
          type: "worker",
          title: `${worker.name}님 추가`,
          description: `${formatPhoneNumber(
            worker.phone
          )} | ${new Intl.NumberFormat("ko-KR").format(
            worker.hourlyWage
          )}원/시간`,
          timestamp: dayjs()
            .subtract(index + 1, "hour")
            .format("YYYY-MM-DD HH:mm"),
          icon: "person-add",
          color: "#8b5cf6", // 바이올렛
        });
      }
    });

    // 급여 지급 활동
    const paidWorkers = schedules.flatMap(
      (s) => s.workers?.filter((w) => w.paid) || []
    );
    paidWorkers.forEach((workerInfo, index) => {
      if (index < 1) {
        // 최근 1건의 급여 지급
        activities.push({
          id: `payment-${workerInfo.worker.id}`,
          type: "payment",
          title: `${workerInfo.worker.name}님 급여 지급`,
          description: "지급 완료",
          timestamp: dayjs().subtract(2, "hour").format("YYYY-MM-DD HH:mm"),
          icon: "card",
          color: "#f97316", // 오렌지
        });
      }
    });

    // 시간순으로 정렬 (최신순)
    activities.sort((a, b) => dayjs(b.timestamp).diff(dayjs(a.timestamp)));

    setRecentActivities(activities.slice(0, 5)); // 최근 5개만 표시
  };

  // 오늘 일정 가져오기
  // 오늘 근무하는 근로자 목록
  const getTodayWorkers = () => {
    const todayWorkersMap = new Map();

    getTodaySchedules().forEach((schedule) => {
      schedule.workers?.forEach((workerInfo) => {
        const worker = workerInfo.worker;

        // 근무 시간 정보 추출
        const workTimes =
          workerInfo.periods
            ?.map((period) => {
              if (period.startTime && period.endTime) {
                return `${period.startTime} - ${period.endTime}`;
              }
              return null;
            })
            .filter(Boolean) || [];

        if (!todayWorkersMap.has(worker.id)) {
          todayWorkersMap.set(worker.id, {
            ...worker,
            schedules: [schedule.title],
            scheduleIds: [schedule.id],
            workTimes: workTimes.length > 0 ? workTimes : ["시간 미지정"],
          });
        } else {
          const existing = todayWorkersMap.get(worker.id);
          existing.schedules.push(schedule.title);
          existing.scheduleIds.push(schedule.id);
          if (workTimes.length > 0) {
            existing.workTimes.push(...workTimes);
          }
        }
      });
    });

    return Array.from(todayWorkersMap.values());
  };

  const getTodaySchedules = () => {
    return schedules.filter((schedule) => {
      const scheduleStart = dayjs(schedule.startDate);
      const scheduleEnd = dayjs(schedule.endDate);
      const today = dayjs(selectedDate);
      return (
        today.isSameOrAfter(scheduleStart) && today.isSameOrBefore(scheduleEnd)
      );
    });
  };

  // 시간 포맷팅
  const formatTime = (periods: any[]) => {
    if (periods.length === 0) return "시간 미정";

    const times = periods.map((p) => ({
      start: dayjs(p.startTime || p.start).format("HH:mm"),
      end: dayjs(p.endTime || p.end).format("HH:mm"),
    }));

    if (times.length === 1) {
      return `${times[0].start} - ${times[0].end}`;
    } else {
      const start = times[0].start;
      const end = times[times.length - 1].end;
      return `${start} - ${end}`;
    }
  };

  // 활동 시간 포맷팅
  const formatActivityTime = (timestamp: string) => {
    const now = dayjs();
    const activityTime = dayjs(timestamp);
    const diffMinutes = now.diff(activityTime, "minute");
    const diffHours = now.diff(activityTime, "hour");
    const diffDays = now.diff(activityTime, "day");

    if (diffMinutes < 60) {
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else {
      return `${diffDays}일 전`;
    }
  };

  const getMonthlyPayroll = () => {
    const today = dayjs();
    const firstDay = today.startOf("month").format("YYYY-MM-DD");
    const lastDay = today.endOf("month").format("YYYY-MM-DD");

    let total = 0;
    schedules.forEach((schedule) => {
      const scheduleStart = dayjs(schedule.startDate);
      const scheduleEnd = dayjs(schedule.endDate);
      const periodStart = dayjs(firstDay);
      const periodEnd = dayjs(lastDay);

      if (
        scheduleStart.isSameOrBefore(periodEnd) &&
        scheduleEnd.isSameOrAfter(periodStart)
      ) {
        schedule.workers?.forEach((workerInfo) => {
          const hourlyWage = workerInfo.worker.hourlyWage;
          const taxWithheld = (workerInfo as any).taxWithheld ?? false;
          const taxRate = 0.033;

          const totalHours =
            workerInfo.periods?.reduce((sum, period) => {
              const start = dayjs(period.startTime);
              const end = dayjs(period.endTime);
              return sum + end.diff(start, "hour", true);
            }, 0) || 0;

          let grossPay = hourlyWage * totalHours;
          let netPay = grossPay;

          if (taxWithheld) {
            netPay = grossPay * (1 - taxRate);
          }

          total += Math.round(netPay);
        });
      }
    });

    return total;
  };

  const getUnpaidCount = () => {
    const today = dayjs();
    let count = 0;

    schedules.forEach((schedule) => {
      schedule.workers?.forEach((workerInfo) => {
        workerInfo.periods?.forEach((period) => {
          const workEnd = dayjs(period.endTime);
          if (
            workEnd.isBefore(today) &&
            !((workerInfo as any).wagePaid ?? workerInfo.paid)
          ) {
            count++;
          }
        });
      });
    });

    return count;
  };

  // 미수금 계산: 스케줄 종료일로부터 2주 이상 지났는데 거래처에서 돈을 받지 못한 경우
  const getUncollectedAmount = () => {
    const today = dayjs();
    let total = 0;

    schedules.forEach((schedule) => {
      const scheduleEnd = dayjs(schedule.endDate);
      const daysSinceEnd = today.diff(scheduleEnd, "day");

      // 스케줄 종료일로부터 2주(14일) 이상 지난 경우
      if (daysSinceEnd >= 14) {
        // 미수금 상태 확인 (거래처가 돈을 받지 않은 상태)
        const isUncollected = schedule.clientId && !schedule.collected;

        if (isUncollected) {
          // 스케줄의 총 금액 계산
          schedule.workers?.forEach((workerInfo) => {
            const hourlyWage = workerInfo.worker.hourlyWage;
            const taxWithheld = (workerInfo as any).taxWithheld ?? false;
            const taxRate = 0.033;

            const totalHours =
              workerInfo.periods?.reduce((sum, period) => {
                const start = dayjs(period.startTime);
                const end = dayjs(period.endTime);
                return sum + end.diff(start, "hour", true);
              }, 0) || 0;

            let grossPay = hourlyWage * totalHours;
            let netPay = grossPay;

            if (taxWithheld) {
              netPay = grossPay * (1 - taxRate);
            }

            total += Math.round(netPay);
          });
        }
      }
    });

    return total;
  };

  // 메뉴를 카테고리별로 분류
  const menuCategories = [
    {
      title: "주요 기능",
      items: [
        {
          id: "dashboard",
          title: "대시보드",
          description: "전체 현황을 한눈에 확인",
          emoji: "📊",
          color: "#60A5FA",
          route: "/dashboard",
        },
        {
          id: "reports",
          title: "리포트",
          description: "상세한 보고서 확인",
          emoji: "📈",
          color: "#22D3EE",
          route: "/reports",
        },
      ],
    },
    {
      title: "일정 관리",
      items: [
        {
          id: "calendar",
          title: "캘린더",
          description: "캘린더로 일정 확인",
          emoji: "📅",
          color: "#22D3EE",
          route: "/schedule",
        },
        {
          id: "schedule-management",
          title: "일정 목록",
          description: "모든 일정 관리",
          emoji: "📋",
          color: "#60A5FA",
          route: "/schedule/list",
        },
      ],
    },
    {
      title: "인원 관리",
      items: [
        {
          id: "workers",
          title: "근로자",
          description: "근로자 정보 관리",
          emoji: "👥",
          color: "#34D399",
          route: "/worker",
        },
        {
          id: "clients",
          title: "거래처",
          description: "거래처 정보 관리",
          emoji: "🏢",
          color: "#FBBF24",
          route: "/clients",
        },
      ],
    },
    {
      title: "급여/수익",
      items: [
        {
          id: "payments",
          title: "급여",
          description: "급여 계산 및 지급",
          emoji: "💵",
          color: "#F87171",
          route: "/worker/payroll",
        },
        {
          id: "revenue-management",
          title: "수입 관리",
          description: "거래처 수입 관리",
          emoji: "💰",
          color: "#F472B6",
          route: "/clients/revenue-management",
        },
      ],
    },
  ];

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      {/* Apple 스타일 헤더 */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 60,
          paddingBottom: 24,
          backgroundColor: "transparent",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text
              style={{ fontSize: 32, fontWeight: "700", color: colors.text }}
            >
              반반
            </Text>
            <Text
              style={{
                fontSize: 15,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              {currentUser
                ? `${currentUser.nickname || currentUser.name}님`
                : "Half&Half"}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/settings")}
            style={{
              padding: 10,
              borderRadius: 50,
            }}
          >
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 20 }}>
          {/* Apple Compact 스타일 - 주요 기능 */}
          <View style={{ gap: 10, marginBottom: 24 }}>
            {/* 오늘 일정 카드 */}
            <Pressable
              style={{
                backgroundColor: colors.surface,
                padding: 16,
                borderRadius: 14,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 2,
              }}
              onPress={() => setShowTodaySchedule(true)}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    📅 오늘 일정
                  </Text>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "700",
                      color: colors.text,
                    }}
                  >
                    {getTodaySchedules().length}건
                  </Text>
                </View>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: "#e8f0fe",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 28 }}>📅</Text>
                </View>
              </View>
            </Pressable>

            {/* 오늘 근무 근로자 카드 */}
            <Pressable
              style={{
                backgroundColor: colors.surface,
                padding: 16,
                borderRadius: 14,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 2,
              }}
              onPress={() => setShowTodayWorkers(true)}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    👥 오늘 근무 근로자
                  </Text>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "700",
                      color: colors.text,
                    }}
                  >
                    {getTodayWorkers().length}명
                  </Text>
                </View>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: "#fef3e7",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 28 }}>👥</Text>
                </View>
              </View>
            </Pressable>
          </View>

          {/* 추가 기능 */}
          <View style={{ marginTop: 24, gap: 10, marginBottom: 24 }}>
            {/* 급여 + 수급 (2열) */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Pressable
                  style={{
                    backgroundColor: colors.surface,
                    padding: 16,
                    borderRadius: 14,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  onPress={() => {
                    if (!showPayrollAmount) {
                      setShowPayrollAmount(true);
                    } else {
                      // 금액 상태 유지하면서 이동
                      router.push("/worker/payroll");
                    }
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    💰 월 급여
                  </Text>
                  <Text
                    style={{
                      fontSize: showPayrollAmount ? 15 : 22,
                      fontWeight: "700",
                      color: colors.text,
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {showPayrollAmount
                      ? `${new Intl.NumberFormat("ko-KR").format(
                          getMonthlyPayroll()
                        )}원`
                      : "확인"}
                  </Text>
                </Pressable>
              </View>
              <View style={{ flex: 1 }}>
                <Pressable
                  style={{
                    backgroundColor: colors.surface,
                    padding: 16,
                    borderRadius: 14,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                  onPress={() => {
                    if (!showUncollectedAmount) {
                      setShowUncollectedAmount(true);
                    } else {
                      // 금액 상태 유지하면서 이동
                      router.push("/clients/revenue-management");
                    }
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textSecondary,
                      marginBottom: 4,
                    }}
                  >
                    💵 미수금
                  </Text>
                  <Text
                    style={{
                      fontSize: showUncollectedAmount ? 15 : 22,
                      fontWeight: "700",
                      color: colors.text,
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                  >
                    {showUncollectedAmount
                      ? `${new Intl.NumberFormat("ko-KR").format(
                          getUncollectedAmount()
                        )}원`
                      : "확인"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* 카테고리별 메뉴 */}
          {menuCategories.map((category, categoryIndex) => (
            <View key={categoryIndex} style={{ marginBottom: 32 }}>
              {/* 카테고리 제목 */}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.text,
                  marginBottom: 12,
                  paddingHorizontal: 4,
                }}
              >
                {category.title}
              </Text>

              {/* 카테고리별 메뉴 아이템 */}
              <View
                style={[
                  { gap: 10 },
                  isDesktop && {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 12,
                  },
                ]}
              >
                {category.items.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[
                      {
                        backgroundColor: colors.surface,
                        padding: 16,
                        borderRadius: 14,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 4,
                        elevation: 2,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      },
                      isDesktop && {
                        width: "calc(50% - 6px)",
                        minWidth: 280,
                      },
                    ]}
                    onPress={() => handleMenuPress(item.route)}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: colors.border + "40",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: colors.text,
                        }}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={{ fontSize: 13, color: colors.textSecondary }}
                      >
                        {item.description}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Apple Compact 스타일 활동 알림 버튼 */}
      {recentActivities.length > 0 && (
        <Pressable
          style={styles.activityFab}
          onPress={() => {
            if (isWeb) {
              setShowWebNotificationPanel(true);
            } else {
              setShowActivityModal(true);
            }
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 48,
              backgroundColor: "#ffffff",
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Ionicons name="notifications" size={20} color="#86868b" />
          </View>
          {recentActivities.filter((a) => a.type === "payment").length > 0 && (
            <View
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "#ef4444",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 11,
                  fontWeight: "700",
                }}
              >
                {formatActivityCount(
                  recentActivities.filter((a) => a.type === "payment").length
                )}
              </Text>
            </View>
          )}
        </Pressable>
      )}

      {/* 모달들 */}
      <TodayScheduleModal
        visible={showTodaySchedule}
        onClose={() => setShowTodaySchedule(false)}
        schedules={schedules}
        selectedDate={selectedDate}
      />

      {/* 최근 활동 모달 */}
      <Modal
        visible={showActivityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActivityModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowActivityModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              height: "80%",
              padding: 20,
            }}
            onPress={() => {}} // 빈 함수로 터치 이벤트 막기
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
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: colors.text,
                }}
              >
                최근 활동
              </Text>
              <Pressable
                onPress={() => setShowActivityModal(false)}
                style={{
                  width: 32,
                  height: 32,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* 활동 목록 */}
            <ScrollView style={{ flex: 1 }}>
              {recentActivities.length > 0 ? (
                <View style={{ gap: 12 }}>
                  {recentActivities.map((activity) => (
                    <SwipeableActivityItem
                      key={activity.id}
                      activity={activity}
                      onDelete={handleDeleteActivity}
                      onViewDetails={handleViewActivityDetails}
                      colors={colors}
                      formatActivityTime={formatActivityTime}
                    />
                  ))}
                </View>
              ) : (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 40,
                  }}
                >
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                    최근 활동이 없습니다
                  </Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 오늘 근무 근로자 모달 */}
      <Modal
        visible={showTodayWorkers}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTodayWorkers(false)}
      >
        <View style={[{ flex: 1 }, { backgroundColor: colors.background }]}>
          {/* 헤더 */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingTop: Platform.OS === "ios" ? 40 : 20,
              paddingBottom: 20,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              오늘 근무 근로자
            </Text>
            <Pressable
              onPress={() => setShowTodayWorkers(false)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* 근로자 목록 */}
          <ScrollView style={{ flex: 1, padding: 20 }}>
            {getTodayWorkers().length > 0 ? (
              <View style={{ gap: 12 }}>
                {getTodayWorkers().map((worker) => (
                  <Pressable
                    key={worker.id}
                    style={{
                      backgroundColor: colors.card,
                      padding: 16,
                      borderRadius: 14,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 4,
                      elevation: 2,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                    onPress={() => {
                      setShowTodayWorkers(false);
                      setSelectedWorker(worker);
                      setShowWorkerDetail(true);
                    }}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: "#e8f0fe",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 24 }}>👤</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: colors.text,
                          marginBottom: 4,
                        }}
                      >
                        {worker.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: colors.textSecondary,
                          marginBottom: 2,
                        }}
                      >
                        {worker.schedules.join(", ")}
                      </Text>
                      {worker.workTimes && worker.workTimes.length > 0 && (
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.success,
                            fontWeight: "600",
                            marginBottom: 2,
                          }}
                        >
                          ⏰ {worker.workTimes.join(", ")}
                        </Text>
                      )}
                      {worker.phone && (
                        <Text
                          style={{
                            fontSize: 12,
                            color: colors.textSecondary,
                          }}
                        >
                          📱 {formatPhoneNumber(worker.phone)}
                        </Text>
                      )}
                    </View>
                    {/* 전화/문자 버튼 */}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable
                        onPress={() => {
                          if (worker.phone) {
                            Linking.openURL(`tel:${worker.phone}`);
                          }
                        }}
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
                        onPress={() => {
                          if (worker.phone) {
                            Linking.openURL(`sms:${worker.phone}`);
                          }
                        }}
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
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9ca3af"
                    />
                  </Pressable>
                ))}
              </View>
            ) : (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 60,
                }}
              >
                <Ionicons
                  name="people-outline"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.textSecondary,
                    marginTop: 16,
                  }}
                >
                  오늘 근무하는 근로자가 없습니다
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* 근로자 상세 모달 */}
      {selectedWorker && (
        <Modal
          visible={showWorkerDetail}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowWorkerDetail(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: Platform.OS === "web" ? "center" : "flex-end",
              padding: Platform.OS === "web" ? 20 : 0,
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: Platform.OS === "web" ? 12 : 20,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                width: "100%",
                maxWidth: Platform.OS === "web" ? 500 : undefined,
                height: Platform.OS === "web" ? "70%" : "75%",
                padding: 24,
              }}
            >
              {/* 헤더 */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                  paddingBottom: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "700",
                      color: colors.text,
                    }}
                  >
                    {selectedWorker.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                      marginTop: 4,
                    }}
                  >
                    근로자 정보
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    setShowWorkerDetail(false);
                    setSelectedWorker(null);
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>

              {/* 내용 */}
              <ScrollView style={{ flex: 1 }}>
                {/* 연락처 */}
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.text,
                      marginBottom: 12,
                    }}
                  >
                    연락처
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 16, color: colors.text }}>
                      {formatPhoneNumber(selectedWorker.phone)}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable
                        onPress={() => {
                          if (selectedWorker.phone) {
                            Linking.openURL(`tel:${selectedWorker.phone}`);
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
                          if (selectedWorker.phone) {
                            Linking.openURL(`sms:${selectedWorker.phone}`);
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
                </View>

                {/* 시급 */}
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.text,
                      marginBottom: 12,
                    }}
                  >
                    시급
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.card,
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <Text style={{ fontSize: 18, color: colors.text }}>
                      {new Intl.NumberFormat("ko-KR").format(
                        selectedWorker.hourlyWage || 0
                      )}
                      원
                    </Text>
                  </View>
                </View>

                {/* 오늘 참여 일정 */}
                {selectedWorker.schedules &&
                  selectedWorker.schedules.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: colors.text,
                          marginBottom: 12,
                        }}
                      >
                        참여 일정
                      </Text>
                      <View style={{ gap: 8 }}>
                        {selectedWorker.schedules.map(
                          (schedule: string, index: number) => (
                            <View
                              key={index}
                              style={{
                                backgroundColor: colors.primary + "20",
                                borderRadius: 8,
                                padding: 12,
                              }}
                            >
                              <Text
                                style={{ fontSize: 14, color: colors.primary }}
                              >
                                {schedule}
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    </View>
                  )}

                {/* 근무 시간 */}
                {selectedWorker.workTimes &&
                  selectedWorker.workTimes.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: colors.text,
                          marginBottom: 12,
                        }}
                      >
                        근무 시간
                      </Text>
                      <View style={{ gap: 8 }}>
                        {selectedWorker.workTimes.map(
                          (time: string, index: number) => (
                            <View
                              key={index}
                              style={{
                                backgroundColor: colors.success + "20",
                                borderRadius: 8,
                                padding: 12,
                              }}
                            >
                              <Text
                                style={{ fontSize: 14, color: colors.success }}
                              >
                                ⏰ {time}
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    </View>
                  )}
              </ScrollView>

              {/* 하단 버튼 */}
              <Pressable
                onPress={() => {
                  setShowWorkerDetail(false);
                  router.push(`/worker` as any);
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
                  전체 근로자 관리
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      <MonthlyPayrollModal
        visible={showMonthlyPayroll}
        onClose={() => setShowMonthlyPayroll(false)}
        schedules={schedules}
      />

      <StaffWorkStatusModal
        visible={showStaffWorkStatus}
        onClose={() => setShowStaffWorkStatus(false)}
        schedules={schedules}
      />

      <UnpaidScheduleModal
        visible={showUnpaidSchedule}
        onClose={() => setShowUnpaidSchedule(false)}
        schedules={schedules}
      />

      <MultiStepScheduleModal
        visible={showAddScheduleModal}
        onClose={() => setShowAddScheduleModal(false)}
      />

      {/* 웹 전용 알림 패널 */}
      {isWeb && showWebNotificationPanel && (
        <View style={styles.webNotificationOverlayContainer}>
          {/* 배경 오버레이 */}
          <Pressable
            style={styles.webNotificationOverlay}
            onPress={() => setShowWebNotificationPanel(false)}
          />

          {/* 알림 패널 */}
          <View
            style={[
              styles.webNotificationPanel,
              { backgroundColor: colors.surface },
            ]}
          >
            <View
              style={[
                styles.webNotificationHeader,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.webNotificationHeaderTitle,
                  { color: colors.text },
                ]}
              >
                최근 활동
              </Text>
              <Pressable onPress={() => setShowWebNotificationPanel(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.webNotificationContent}>
              {recentActivities.length > 0 ? (
                <View style={{ padding: 12, gap: 8 }}>
                  {recentActivities.map((activity) => (
                    <Pressable
                      key={activity.id}
                      style={styles.webNotificationItem}
                      onPress={() => handleActivityPress(activity)}
                    >
                      <View
                        style={[
                          styles.webNotificationIcon,
                          { backgroundColor: `${activity.color}20` },
                        ]}
                      >
                        <Ionicons
                          name={activity.icon as any}
                          size={24}
                          color={activity.color}
                        />
                      </View>
                      <View style={styles.webNotificationText}>
                        <Text
                          style={[
                            styles.webNotificationItemTitle,
                            { color: colors.text },
                          ]}
                        >
                          {activity.title}
                        </Text>
                        <Text
                          style={[
                            styles.webNotificationDescription,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {activity.description}
                        </Text>
                        <Text
                          style={[
                            styles.webNotificationTime,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {formatRelativeTime(activity.timestamp)}
                        </Text>
                      </View>
                      {!activity.isRead && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: colors.primary,
                          }}
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.webNotificationEmpty}>
                  <Text
                    style={[
                      styles.webNotificationEmptyText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    최근 활동이 없습니다
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7", // Apple Compact soft gray background
  },
  webContainer: {
    maxWidth: 1200,
    marginHorizontal: "auto",
    width: "100%",
    minHeight: "100vh",
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  headerWeb: {
    paddingHorizontal: "clamp(16px, 5vw, 48px)",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContentWeb: {
    maxWidth: 1400,
    marginHorizontal: "auto",
    paddingHorizontal: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  settingsButton: {
    padding: 12,
    borderRadius: 50,
  },
  mainContentWeb: {
    flexDirection: "row",
    gap: 24,
    paddingHorizontal: "clamp(16px, 5vw, 48px)",
  },
  menuContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  menuGridWeb: {
    justifyContent: "flex-start",
    gap: "clamp(12px, 2vw, 24px)",
  },
  menuItem: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    width: "48%",
  },
  menuItemWeb: {
    width: "clamp(140px, 20vw, 200px)",
    marginBottom: "clamp(12px, 2vh, 20px)",
    marginHorizontal: "clamp(4px, 1vw, 8px)",
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 12,
    textAlign: "center",
  },
  menuTitleWeb: {
    fontSize: "clamp(12px, 2vw, 16px)",
    fontWeight: "600",
  },
  menuDescriptionWeb: {
    fontSize: "clamp(10px, 1.5vw, 14px)",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleList: {
    gap: 12,
  },
  scheduleCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    alignItems: "center",
    gap: 12,
  },
  scheduleCardWeb: {
    cursor: "pointer",
  },
  scheduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 14,
  },
  scheduleInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  scheduleInfoText: {
    fontSize: 12,
  },
  todayScheduleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  columnItemWeb: {
    flex: 1,
  },
  twoColumnWeb: {
    flexDirection: "row",
    gap: 24,
  },
  activityFab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  webNotificationOverlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    flexDirection: "row",
  },
  webNotificationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  webNotificationPanel: {
    width: 400,
    height: "100%",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  webNotificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  webNotificationHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  webNotificationContent: {
    flex: 1,
  },
  webNotificationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    marginHorizontal: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  webNotificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  webNotificationText: {
    flex: 1,
  },
  webNotificationItemTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  webNotificationDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  webNotificationTime: {
    fontSize: 12,
    marginTop: 4,
  },
  webNotificationEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  webNotificationEmptyText: {
    fontSize: 14,
  },
});
