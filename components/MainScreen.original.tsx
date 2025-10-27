// @ts-nocheck
import MonthlyPayrollModal from "@/components/MonthlyPayrollModal";
import ScheduleAddModal from "@/components/ScheduleAddModal";
import StaffWorkStatusModal from "@/components/StaffWorkStatusModal";
import TodayScheduleModal from "@/components/TodayScheduleModal";
import UnpaidScheduleModal from "@/components/UnpaidScheduleModal";
import { Theme } from "@/constants/Theme";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import { useResponsive } from "@/hooks/useResponsive";
import { Schedule } from "@/models/types";
import { getCurrentUser, User } from "@/utils/authUtils";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // 웹에서는 PanGestureHandler 사용, 네이티브에서는 PanResponder 사용
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false, // 터치 이벤트 우선
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10; // 드래그 감도 증가
    },
    onPanResponderGrant: () => {},
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx < 0) {
        // 드래그 거리를 제한하여 부드럽게
        const maxDrag = -screenWidth * 0.6;
        const dragValue = Math.max(gestureState.dx, maxDrag);
        translateX.setValue(dragValue);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      const deleteThreshold = -screenWidth * 0.4; // 화면 너비의 40%로 설정
      const actionThreshold = -screenWidth * 0.15; // 화면 너비의 15%로 설정

      if (gestureState.dx < deleteThreshold) {
        // 화면 너비의 40% 이상 드래그 - 바로 삭제
        Animated.timing(translateX, {
          toValue: -screenWidth,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsDeleting(true);
          onDelete(activity.id);
        });
      } else if (gestureState.dx < actionThreshold) {
        // 화면 너비의 15%~40% 드래그 - 액션 버튼 표시
        setShowActions(true);
        Animated.spring(translateX, {
          toValue: -120, // 액션 버튼 공간만큼 이동
          useNativeDriver: true,
        }).start();
      } else {
        // 화면 너비의 15% 미만 드래그 - 원래 위치로 복귀
        setShowActions(false);
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  // 웹용 PanGestureHandler 핸들러
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      const deleteThreshold = -screenWidth * 0.4; // 화면 너비의 40%로 설정
      const actionThreshold = -screenWidth * 0.15; // 화면 너비의 15%로 설정

      if (translationX < deleteThreshold) {
        // 화면 너비의 40% 이상 드래그 - 바로 삭제
        Animated.timing(translateX, {
          toValue: -screenWidth,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setIsDeleting(true);
          onDelete(activity.id);
        });
      } else if (translationX < actionThreshold) {
        // 화면 너비의 15%~40% 드래그 - 액션 버튼 표시
        setShowActions(true);
        Animated.spring(translateX, {
          toValue: -120, // 액션 버튼 공간만큼 이동
          useNativeDriver: true,
        }).start();
      } else {
        // 화면 너비의 15% 미만 드래그 - 원래 위치로 복귀
        setShowActions(false);
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  if (isDeleting) {
    return null;
  }

  const content = (
    <Pressable
      style={[
        styles.activityModalItem,
        {
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
      onPress={() => onViewDetails(activity)}
    >
      <View
        style={[
          styles.activityModalIcon,
          { backgroundColor: `${activity.color}20` },
        ]}
      >
        <Ionicons
          name={activity.icon as any}
          size={20}
          color={activity.color}
        />
      </View>
      <View style={styles.activityModalContent}>
        <Text style={[styles.activityModalTitle, { color: colors.text }]}>
          {activity.title}
        </Text>
        <Text
          style={[
            styles.activityModalDescription,
            { color: colors.textSecondary },
          ]}
        >
          {activity.description}
        </Text>
        <Text
          style={[styles.activityModalTime, { color: colors.textSecondary }]}
        >
          {formatActivityTime(activity.timestamp)}
        </Text>
      </View>
      {!activity.isRead && (
        <View
          style={[styles.unreadIndicator, { backgroundColor: colors.primary }]}
        />
      )}

      {/* 액션 버튼들 */}
      {showActions ? (
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setShowActions(false);
              onViewDetails(activity);
            }}
          >
            <Ionicons name="eye" size={16} color="white" />
            <Text style={styles.actionButtonText}>더보기</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={() => {
              setShowActions(false);
              onDelete(activity.id);
            }}
          >
            <Ionicons name="trash" size={16} color="white" />
            <Text style={styles.actionButtonText}>삭제</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.dragHint, { backgroundColor: colors.error }]}>
          <Ionicons name="trash" size={16} color="white" />
          <Text style={styles.dragHintText}>삭제</Text>
        </View>
      )}
    </Pressable>
  );

  // 웹에서는 PanGestureHandler 사용, 네이티브에서는 PanResponder 사용
  if (isWeb) {
    return (
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View style={{ transform: [{ translateX }] }}>
          {content}
        </Animated.View>
      </PanGestureHandler>
    );
  }

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateX }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      {content}
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
  const [showMonthlyPayroll, setShowMonthlyPayroll] = useState(false);
  const [showStaffWorkStatus, setShowStaffWorkStatus] = useState(false);
  const [showUnpaidSchedule, setShowUnpaidSchedule] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 데이터베이스 초기화
        const db = getDatabase();
        await db.init();

        loadCurrentUser();
        loadSchedules();
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
          description: `${worker.phone} | ${new Intl.NumberFormat(
            "ko-KR"
          ).format(worker.hourlyWage)}원/시간`,
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

  const menuItems = [
    {
      id: "dashboard",
      title: "대시보드",
      description: "한눈에 보는 업무 현황",
      icon: "analytics-outline",
      color: "#A78BFA", // 부드러운 라벤더
      route: "/dashboard",
    },
    {
      id: "reports",
      title: "리포트",
      description: "상세한 통계 및 분석",
      icon: "bar-chart-outline",
      color: "#F59E0B", // 부드러운 앰버
      route: "/reports",
    },
    {
      id: "schedule-management",
      title: "일정 관리",
      description: "모든 일정을 한눈에 관리하세요",
      icon: "list-outline",
      color: "#60A5FA", // 부드러운 스카이 블루
      route: "/schedule/list",
    },
    {
      id: "calendar",
      title: "스케줄 관리",
      description: "캘린더로 일정을 확인하세요",
      icon: "calendar-outline",
      color: "#22D3EE", // 부드러운 아쿠아
      route: "/schedule/list",
    },
    {
      id: "workers",
      title: "근로자 관리",
      description: "근로자 정보를 관리하세요",
      icon: "people-outline",
      color: "#34D399", // 부드러운 민트
      route: "/worker",
    },
    {
      id: "clients",
      title: "거래처 관리",
      description: "거래처 정보를 관리하세요",
      icon: "business-outline",
      color: "#FBBF24", // 부드러운 골드
      route: "/clients",
    },
    {
      id: "payments",
      title: "급여 관리",
      description: "급여 계산 및 지급을 관리하세요",
      icon: "card-outline",
      color: "#F87171", // 부드러운 코랄
      route: "/worker/payroll",
    },
    {
      id: "uncollected",
      title: "수급 관리",
      description: "업체에서 받는 수입을 관리하세요",
      icon: "cash-outline",
      color: "#F472B6", // 부드러운 로즈
      route: "/clients/uncollected",
    },
    {
      id: "files",
      title: "파일 관리",
      description: "거래처 및 스케줄 문서를 관리하세요",
      icon: "folder-outline",
      color: "#8B5CF6", // 부드러운 바이올렛
      route: "/files",
    },
  ];

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={[styles.container, isWeb && styles.webContainer]}>
      <ScrollView style={styles.scrollContainer}>
        {/* 헤더 */}
        <View
          style={[
            styles.header,
            isWeb && styles.headerWeb,
            { backgroundColor: colors.primary },
          ]}
        >
          <View
            style={[styles.headerContent, isWeb && styles.headerContentWeb]}
          >
            {/* 왼쪽: 제목과 부제목 */}
            <View style={styles.headerLeft}>
              <Text
                style={[
                  styles.headerTitle,
                  isWeb && styles.headerTitleWeb,
                  { color: colors.surface },
                ]}
              >
                반반
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.surface }]}>
                {currentUser
                  ? `${currentUser.nickname || currentUser.name}님 환영합니다`
                  : "Half&Half - 일도 반반, 여유도 반반"}
              </Text>
            </View>

            {/* 오른쪽: 설정 버튼 */}
            <Pressable
              style={[
                styles.settingsButton,
                { backgroundColor: colors.surface },
              ]}
              onPress={() => router.push("/settings")}
            >
              <Ionicons
                name="settings-outline"
                size={24}
                color={colors.primary}
              />
            </Pressable>
          </View>
        </View>

        {/* 메인 컨텐츠 컨테이너 (웹 전용) */}
        <View style={isWeb && styles.mainContentWeb}>
          {/* 메인 메뉴 */}
          <View style={styles.menuContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              주요 기능
            </Text>
            <View style={[styles.menuGrid, isWeb && styles.menuGridWeb]}>
              {menuItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.menuItem,
                    isWeb && styles.menuItemWeb,
                    { backgroundColor: colors.surface },
                    {
                      width: getResponsiveValue(
                        (screenData.width - 56) / 2,
                        (screenData.width - 80) / 3,
                        (screenData.width - 120) / 4
                      ),
                    },
                  ]}
                  onPress={() => handleMenuPress(item.route)}
                >
                  <View
                    style={[styles.menuIcon, { backgroundColor: item.color }]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={isWeb ? 40 : 32}
                      color="white"
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuTitle,
                      isWeb && styles.menuTitleWeb,
                      { color: colors.text },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.menuDescription,
                      isWeb && styles.menuDescriptionWeb,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 스타일 선택 버튼 (개발용) */}
          <View
            style={{
              padding: 12,
              marginVertical: 20,
            }}
          >
            {/* 첫 번째 줄 */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              <Pressable
                onPress={() => router.push("/mock/google")}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#e8eaed",
                }}
              >
                <Text
                  style={{ color: "#1a73e8", fontWeight: "600", fontSize: 13 }}
                >
                  Google
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/mock/linear")}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#e8eaed",
                }}
              >
                <Text
                  style={{ color: "#1a73e8", fontWeight: "600", fontSize: 13 }}
                >
                  Linear
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/mock/stripe")}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#e8eaed",
                }}
              >
                <Text
                  style={{ color: "#1a73e8", fontWeight: "600", fontSize: 13 }}
                >
                  Stripe
                </Text>
              </Pressable>
            </View>
            {/* 두 번째 줄 */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => router.push("/mock/business-friendly")}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#e8eaed",
                }}
              >
                <Text
                  style={{ color: "#f59e0b", fontWeight: "600", fontSize: 13 }}
                >
                  친근한
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/mock/apple")}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#e8eaed",
                }}
              >
                <Text
                  style={{ color: "#1d1d1f", fontWeight: "600", fontSize: 13 }}
                >
                  Apple
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/mock/notion")}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#e8eaed",
                }}
              >
                <Text
                  style={{ color: "#37352f", fontWeight: "600", fontSize: 13 }}
                >
                  Notion
                </Text>
              </Pressable>
            </View>
            {/* 세 번째 줄 */}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <Pressable
                onPress={() => router.push("/mock/apple-compact")}
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: "#1d1d1f",
                }}
              >
                <Text
                  style={{ color: "#1d1d1f", fontWeight: "700", fontSize: 13 }}
                >
                  🍎 Apple 컴팩트
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 웹에서는 2열 레이아웃, 앱에서는 1열 */}
          <View style={isWeb ? styles.twoColumnWeb : null}>
            {/* 오늘 일정 */}
            <View
              style={[
                styles.todayScheduleContainer,
                isWeb && styles.columnItemWeb,
              ]}
            >
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  오늘 일정
                </Text>
                <Pressable
                  style={[
                    styles.addButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setShowAddScheduleModal(true)}
                >
                  <Ionicons name="add" size={20} color="white" />
                </Pressable>
              </View>
              <View style={styles.scheduleList}>
                {getTodaySchedules().length > 0 ? (
                  getTodaySchedules().map((schedule) => (
                    <Pressable
                      key={schedule.id}
                      style={[
                        styles.scheduleCard,
                        isWeb && styles.scheduleCardWeb,
                        { backgroundColor: colors.surface },
                      ]}
                      onPress={() => setShowTodaySchedule(true)}
                    >
                      <View style={styles.scheduleIcon}>
                        <Ionicons
                          name="calendar"
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.scheduleContent}>
                        <Text
                          style={[styles.scheduleTitle, { color: colors.text }]}
                        >
                          {schedule.title}
                        </Text>
                        <Text
                          style={[
                            styles.scheduleTime,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {formatTime(
                            schedule.workers?.flatMap((w) => w.periods || []) ||
                              []
                          )}
                        </Text>

                        {/* 위치 정보 */}
                        {schedule.location && (
                          <View style={styles.scheduleInfoRow}>
                            <Ionicons
                              name="location-outline"
                              size={12}
                              color={colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.scheduleInfoText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {schedule.location}
                            </Text>
                          </View>
                        )}

                        {/* 첨부파일 여부 */}
                        {schedule.hasAttachments && (
                          <View style={styles.scheduleInfoRow}>
                            <Ionicons
                              name="attach-outline"
                              size={12}
                              color={colors.primary}
                            />
                            <Text
                              style={[
                                styles.scheduleInfoText,
                                { color: colors.primary },
                              ]}
                            >
                              첨부파일
                            </Text>
                          </View>
                        )}

                        {/* 일별 시간 설정 여부 */}
                        {!schedule.uniformTime && (
                          <View style={styles.scheduleInfoRow}>
                            <Ionicons
                              name="time-outline"
                              size={12}
                              color={colors.textSecondary}
                            />
                            <Text
                              style={[
                                styles.scheduleInfoText,
                                { color: colors.textSecondary },
                              ]}
                            >
                              일별 시간 설정
                            </Text>
                          </View>
                        )}
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  ))
                ) : (
                  <View
                    style={[
                      styles.emptyScheduleContainer,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={48}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.emptyScheduleText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      오늘 일정이 없습니다
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* FAB 스타일 활동 알림 버튼 - 스크롤과 무관하게 고정 */}
      {recentActivities.length > 0 && (
        <Pressable
          style={[
            styles.activityFab,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
          onPress={() => {
            if (isWeb) {
              setShowWebNotificationPanel(true);
            } else {
              setShowActivityModal(true);
            }
          }}
        >
          <Ionicons name="notifications" size={24} color="white" />
          {recentActivities.filter((a) => a.type === "payment").length > 0 && (
            <View
              style={[styles.activityBadge, { backgroundColor: colors.error }]}
            >
              <Text style={styles.activityBadgeText}>
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

      <ScheduleAddModal
        visible={showAddScheduleModal}
        onClose={() => setShowAddScheduleModal(false)}
        onSave={() => {
          loadSchedules();
          setShowAddScheduleModal(false);
        }}
        modalType="bottomSheet"
      />

      {/* 활동 알림 모달 */}
      {/* 웹용 알림 패널 */}
      {isWeb && showWebNotificationPanel && (
        <WebNotificationPanel
          activities={recentActivities}
          onDelete={handleDeleteActivity}
          onClose={() => setShowWebNotificationPanel(false)}
          onViewDetails={handleViewActivityDetails}
          colors={colors}
          formatActivityTime={formatActivityTime}
        />
      )}

      <Modal
        visible={showActivityModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowActivityModal(false)}
      >
        <View
          style={[styles.activityModal, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.activityModalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <Text style={[styles.activityModalTitle, { color: colors.text }]}>
              최근 활동
            </Text>
            <Pressable
              style={[
                styles.activityModalClose,
                { backgroundColor: colors.surface },
              ]}
              onPress={() => setShowActivityModal(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.activityModalContent}>
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
          </ScrollView>
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
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: Theme.colors.primary,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: Theme.spacing.xl,
    borderBottomLeftRadius: Theme.borderRadius.xl,
    borderBottomRightRadius: Theme.borderRadius.xl,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: Theme.typography.sizes.xxl,
    fontWeight: Theme.typography.weights.bold,
    fontFamily: "Inter_700Bold",
    color: Theme.colors.text.inverse,
    marginBottom: Theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: Theme.typography.sizes.md,
    fontFamily: "Inter_400Regular",
    color: "rgba(255, 255, 255, 0.8)",
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.semibold,
    fontFamily: "Inter_600SemiBold",
    color: Theme.colors.text.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Theme.shadows.sm,
  },
  todayScheduleContainer: {
    padding: Theme.spacing.xl,
    paddingTop: 0,
  },
  scheduleList: {
    gap: Theme.spacing.sm,
  },
  scheduleCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  scheduleIcon: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: "#6366f120", // 인디고 바이올렛 20% 투명도
    alignItems: "center",
    justifyContent: "center",
    marginRight: Theme.spacing.md,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    fontFamily: "Inter_600SemiBold",
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  scheduleTime: {
    fontSize: Theme.typography.sizes.sm,
    fontFamily: "Inter_400Regular",
    color: Theme.colors.text.secondary,
  },
  scheduleInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  scheduleInfoText: {
    fontSize: Theme.typography.sizes.xs,
    fontFamily: "Inter_400Regular",
  },
  menuContainer: {
    padding: Theme.spacing.xl,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.lg,
  },
  menuItem: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: "center",
    ...Theme.shadows.sm,
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: Theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.spacing.md,
    // 웹 반응형 최적화
    ...(Platform.OS === "web" && {
      width: "clamp(40px, 6vw, 56px)",
      height: "clamp(40px, 6vw, 56px)",
      marginBottom: "clamp(8px, 1.5vh, 12px)",
    }),
  },
  menuTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    fontFamily: "Inter_600SemiBold",
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
    textAlign: "center",
  },
  menuDescription: {
    fontSize: Theme.typography.sizes.xs,
    fontFamily: "Inter_400Regular",
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 16,
  },
  activityContainer: {
    padding: Theme.spacing.xl,
    paddingBottom: 40,
  },
  activityList: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadows.sm,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: Theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Theme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    fontFamily: "Inter_500Medium",
    color: Theme.colors.text.primary,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: Theme.typography.sizes.xs,
    fontFamily: "Inter_400Regular",
    color: Theme.colors.text.tertiary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: Theme.typography.sizes.xs,
    fontFamily: "Inter_400Regular",
    color: Theme.colors.text.secondary,
  },
  noActivityContainer: {
    alignItems: "center",
    paddingVertical: Theme.spacing.xxl,
  },
  noActivityText: {
    fontSize: Theme.typography.sizes.sm,
    fontFamily: "Inter_400Regular",
    color: Theme.colors.text.tertiary,
    marginTop: Theme.spacing.md,
  },
  // 웹 전용 스타일
  headerWeb: {
    paddingHorizontal: 0,
    // 화면 크기별로 다르게
    paddingTop: "clamp(40px, 8vh, 80px)",
    paddingBottom: "clamp(30px, 6vh, 50px)",
  },
  headerContentWeb: {
    // 화면 크기별로 다르게
    maxWidth: "clamp(800px, 90vw, 1400px)",
    width: "100%",
    marginHorizontal: "auto",
    paddingHorizontal: "clamp(20px, 4vw, 60px)",
  },
  headerTitleWeb: {
    // 화면 크기별로 다르게
    fontSize: "clamp(28px, 4vw, 42px)",
    fontFamily: "Inter_700Bold",
  },
  mainContentWeb: {
    // 화면 크기별로 다르게
    maxWidth: "clamp(800px, 90vw, 1400px)",
    width: "100%",
    marginHorizontal: "auto",
    paddingHorizontal: "clamp(20px, 4vw, 60px)",
  },
  menuGridWeb: {
    // 한 줄에 6개씩 두 줄로 정확히 배치
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: "20px",
    paddingHorizontal: "20px",
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  menuItemWeb: {
    // 한 줄에 6개씩 두 줄로 정확히 배치
    width: "15%", // 6개 배치를 위해 15%씩
    height: "120px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    ...Theme.shadows.sm,
    transition: "all 0.2s ease",
    cursor: "pointer",
    // 호버 효과
    ...(Platform.OS === "web" && {
      "&:hover": {
        transform: "translateY(-2px)",
        ...Theme.shadows.md,
      },
    }),
  },
  menuTitleWeb: {
    fontSize: "clamp(14px, 2.5vw, 20px)",
    fontFamily: "Inter_600SemiBold",
  },
  menuDescriptionWeb: {
    fontSize: "clamp(12px, 1.8vw, 14px)",
    fontFamily: "Inter_400Regular",
    lineHeight: "clamp(16px, 2.5vw, 20px)",
  },
  twoColumnWeb: {
    flexDirection: "row" as const,
    gap: 32,
    flexWrap: "wrap" as const,
  },
  columnItemWeb: {
    flex: 1,
    minWidth: 400,
  },
  scheduleCardWeb: {
    // 웹 전용 스타일
  },
  emptyScheduleContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Theme.spacing.xxl,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.lg,
    minHeight: 150,
  },
  emptyScheduleText: {
    fontSize: Theme.typography.sizes.md,
    fontFamily: "Inter_400Regular",
    marginTop: Theme.spacing.md,
    textAlign: "center",
  },
  // FAB 스타일
  activityFab: {
    position: "absolute",
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  activityBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  activityBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  // 모달 스타일
  activityModal: {
    flex: 1,
    paddingTop: 50,
  },
  activityModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  activityModalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  activityModalContent: {
    flex: 1,
  },
  activityModalItem: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    alignItems: "flex-start",
    minHeight: 80, // 최소 높이 확보
  },
  activityModalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityModalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  activityModalDescription: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  activityModalTime: {
    fontSize: 12,
  },
  unreadIndicator: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dragHint: {
    position: "absolute",
    right: -100,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  dragHintText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtons: {
    position: "absolute",
    right: -120,
    top: 0,
    bottom: 0,
    width: 120,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: 4,
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  // 웹용 알림 패널 스타일
  webNotificationPanel: {
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
  webNotificationContent: {
    width: 400,
    height: "100%",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  webNotificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  webNotificationTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  webNotificationClose: {
    padding: 4,
  },
  webNotificationList: {
    flex: 1,
  },
  webNotificationEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  webNotificationEmptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  // 웹용 반응형 스타일
  webContainer: {
    width: "100%",
    maxWidth: "none",
    marginHorizontal: 0,
    minHeight: "100vh",
    paddingHorizontal: "clamp(16px, 5vw, 48px)",
  },
  headerWeb: {
    borderRadius: 0,
    marginHorizontal: 0,
    paddingHorizontal: "clamp(16px, 5vw, 48px)",
  },
  headerContentWeb: {
    maxWidth: 1400,
    marginHorizontal: "auto",
    paddingHorizontal: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitleWeb: {
    fontSize: "clamp(20px, 4vw, 32px)",
  },
  menuItemWeb: {
    width: "clamp(140px, 20vw, 200px)",
    marginBottom: "clamp(12px, 2vh, 20px)",
    marginHorizontal: "clamp(4px, 1vw, 8px)",
  },
  menuTitleWeb: {
    fontSize: "clamp(12px, 2vw, 16px)",
    fontWeight: "600",
  },
});
