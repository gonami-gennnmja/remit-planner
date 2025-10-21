import MonthlyPayrollModal from "@/components/MonthlyPayrollModal";
import StaffWorkStatusModal from "@/components/StaffWorkStatusModal";
import TodayScheduleModal from "@/components/TodayScheduleModal";
import UnpaidScheduleModal from "@/components/UnpaidScheduleModal";
import { Theme } from "@/constants/Theme";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import { useResponsive } from "@/hooks/useResponsive";
import { Schedule } from "@/models/types";
import { checkAndCreateOverduePaymentActivities } from "@/utils/activityUtils";
import { getCurrentUser, User } from "@/utils/authUtils";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const isWeb = Platform.OS === "web";

interface Activity {
  id: string;
  type: "schedule" | "worker" | "payment";
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

export default function MainScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const { screenData, isMobile, isTablet, isDesktop, getResponsiveValue } =
    useResponsive();
  const { colors } = useTheme();

  // 모달 상태
  const [showTodaySchedule, setShowTodaySchedule] = useState(false);
  const [showMonthlyPayroll, setShowMonthlyPayroll] = useState(false);
  const [showStaffWorkStatus, setShowStaffWorkStatus] = useState(false);
  const [showUnpaidSchedule, setShowUnpaidSchedule] = useState(false);

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

  // 활동 초기화 및 미지급 급여 체크
  const initializeActivities = async () => {
    try {
      // 미지급 급여 체크 및 활동 생성
      await checkAndCreateOverduePaymentActivities();

      // 활동 로드
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
      const allSchedules = await db.getAllSchedules();
      setSchedules(allSchedules);
    } catch (error) {
      console.error("Failed to load schedules:", error);
      setSchedules([]);
    }
  };

  // 실제 DB에서 활동 로드
  const loadRecentActivitiesFromDB = async () => {
    try {
      const db = getDatabase();
      const dbActivities = await db.getRecentActivities(10);

      // DB에 활동이 없으면 빈 배열 표시
      if (dbActivities.length === 0) {
        console.log("No activities found in DB");
        setRecentActivities([]);
        return;
      }

      // DB 활동을 UI에 맞는 형식으로 변환
      const formattedActivities: Activity[] = dbActivities.map((activity) => ({
        id: activity.id,
        type: activity.type as "schedule" | "worker" | "payment",
        title: activity.title,
        description: activity.description || "",
        timestamp: activity.timestamp,
        icon: activity.icon || getDefaultIcon(activity.type),
        color: activity.color || getDefaultColor(activity.type),
      }));

      setRecentActivities(formattedActivities);
      console.log(`Loaded ${formattedActivities.length} activities from DB`);
    } catch (error) {
      console.error("Failed to load activities from DB:", error);
      // DB 오류 시에만 빈 배열 (더미 데이터 대신)
      setRecentActivities([]);
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
    const allWorkers = schedules.flatMap((s) => s.workers.map((w) => w.worker));
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
    const paidWorkers = schedules.flatMap((s) =>
      s.workers.filter((w) => w.paid)
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
        schedule.workers.forEach((workerInfo) => {
          const hourlyWage = workerInfo.worker.hourlyWage;
          const taxWithheld = workerInfo.worker.taxWithheld;
          const taxRate = 0.033;

          const totalHours = workerInfo.periods.reduce((sum, period) => {
            const start = dayjs(period.start);
            const end = dayjs(period.end);
            return sum + end.diff(start, "hour", true);
          }, 0);

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
      schedule.workers.forEach((workerInfo) => {
        workerInfo.periods.forEach((period) => {
          const workEnd = dayjs(period.end);
          if (workEnd.isBefore(today) && !workerInfo.paid) {
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
      id: "schedule-management",
      title: "일정 관리",
      description: "모든 일정을 한눈에 관리하세요",
      icon: "list-outline",
      color: "#60A5FA", // 부드러운 스카이 블루
      route: "/schedule-list",
    },
    {
      id: "calendar",
      title: "스케줄 관리",
      description: "캘린더로 일정을 확인하세요",
      icon: "calendar-outline",
      color: "#22D3EE", // 부드러운 아쿠아
      route: "/schedule",
    },
    {
      id: "workers",
      title: "근로자 관리",
      description: "근로자 정보를 관리하세요",
      icon: "people-outline",
      color: "#34D399", // 부드러운 민트
      route: "/workers",
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
      route: "/payroll",
    },
    {
      id: "uncollected",
      title: "미수급 건수",
      description: "업체에서 받는 수입을 관리하세요",
      icon: "cash-outline",
      color: "#F472B6", // 부드러운 로즈
      route: "/uncollected",
    },
  ];

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
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

          {/* 웹에서는 2열 레이아웃, 앱에서는 1열 */}
          <View style={isWeb ? styles.twoColumnWeb : null}>
            {/* 오늘 일정 */}
            <View
              style={[
                styles.todayScheduleContainer,
                isWeb && styles.columnItemWeb,
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                오늘 일정
              </Text>
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
                            schedule.workers.flatMap((w) => w.periods)
                          )}
                        </Text>
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
          onPress={() => setShowActivityModal(true)}
        >
          <Ionicons name="notifications" size={24} color="white" />
          {recentActivities.filter((a) => a.type === "payment").length > 0 && (
            <View
              style={[styles.activityBadge, { backgroundColor: colors.error }]}
            >
              <Text style={styles.activityBadgeText}>
                {recentActivities.filter((a) => a.type === "payment").length}
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

      {/* 활동 알림 모달 */}
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
              <View
                key={activity.id}
                style={[
                  styles.activityModalItem,
                  { borderBottomColor: colors.border },
                ]}
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
                  <Text
                    style={[styles.activityModalTitle, { color: colors.text }]}
                  >
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
                    style={[
                      styles.activityModalTime,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {formatActivityTime(activity.timestamp)}
                  </Text>
                </View>
              </View>
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
    marginBottom: Theme.spacing.lg,
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
    paddingTop: 80,
    paddingBottom: 50,
  },
  headerContentWeb: {
    maxWidth: 1400,
    width: "100%",
    marginHorizontal: "auto",
    paddingHorizontal: 40,
  },
  headerTitleWeb: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
  },
  mainContentWeb: {
    maxWidth: 1400,
    width: "100%",
    marginHorizontal: "auto",
    paddingHorizontal: 40,
  },
  menuGridWeb: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 24,
    justifyContent: "flex-start",
  },
  menuItemWeb: {
    width: 280,
    padding: 32,
  },
  menuTitleWeb: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  menuDescriptionWeb: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
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
});
