import MonthlyPayrollModal from "@/components/MonthlyPayrollModal";
import StaffWorkStatusModal from "@/components/StaffWorkStatusModal";
import TodayScheduleModal from "@/components/TodayScheduleModal";
import UnpaidScheduleModal from "@/components/UnpaidScheduleModal";
import { Theme } from "@/constants/Theme";
import { Schedule } from "@/models/types";
import { getCurrentUser, logout, User } from "@/utils/authUtils";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

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

  // 모달 상태
  const [showTodaySchedule, setShowTodaySchedule] = useState(false);
  const [showMonthlyPayroll, setShowMonthlyPayroll] = useState(false);
  const [showStaffWorkStatus, setShowStaffWorkStatus] = useState(false);
  const [showUnpaidSchedule, setShowUnpaidSchedule] = useState(false);

  useEffect(() => {
    loadUser();
    loadSchedules();
  }, []);

  useEffect(() => {
    if (schedules.length > 0) {
      loadRecentActivities();
    }
  }, [schedules]);

  const loadUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  };

  const loadSchedules = () => {
    // 임시 데이터 - 실제로는 데이터베이스에서 가져와야 함
    const today = dayjs().format("YYYY-MM-DD");
    const tomorrow = dayjs().add(1, "day").format("YYYY-MM-DD");

    const tempSchedules: Schedule[] = [
      {
        id: "1",
        title: "수학 과외",
        startDate: today,
        endDate: today,
        description: "고등학교 2학년 수학 과외",
        location: "강남구 학원",
        memo: "교재 준비 필요",
        category: "education",
        workers: [
          {
            worker: {
              id: "w1",
              name: "김선생",
              phone: "010-1234-5678",
              bankAccount: "110-1234-5678",
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
        startDate: today,
        endDate: today,
        description: "성인 영어 회화 수업",
        location: "서초구 문화센터",
        memo: "원어민 강사",
        category: "education",
        workers: [
          {
            worker: {
              id: "w2",
              name: "Sarah Johnson",
              phone: "010-9876-5432",
              bankAccount: "3333-12-3456789",
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
            paid: true,
          },
        ],
      },
      {
        id: "3",
        title: "프로그래밍 수업",
        startDate: tomorrow,
        endDate: tomorrow,
        description: "웹 개발 기초 수업",
        location: "온라인",
        memo: "Zoom 링크 공유",
        category: "education",
        workers: [
          {
            worker: {
              id: "w3",
              name: "이개발",
              phone: "010-5555-1234",
              bankAccount: "1002-123-456789",
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

    setSchedules(tempSchedules);
  };

  const loadRecentActivities = () => {
    // 실제 활동 데이터 생성 (스케줄과 근로자 데이터 기반)
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
          description: schedule.location || schedule.description,
          timestamp: scheduleTime.format("YYYY-MM-DD HH:mm"),
          icon: "calendar",
          color: "#3b82f6",
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
          color: "#10b981",
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
          color: "#f59e0b",
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

  const handleLogout = () => {
    Alert.alert("로그아웃", "로그아웃 하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: "calendar",
      title: "스케줄 관리",
      description: "일정을 확인하고 관리하세요",
      icon: "calendar-outline",
      color: "#3b82f6",
      route: "/schedule",
    },
    {
      id: "workers",
      title: "근로자 관리",
      description: "근로자 정보를 관리하세요",
      icon: "people-outline",
      color: "#10b981",
      route: "/workers",
    },
    {
      id: "payments",
      title: "급여 관리",
      description: "급여 계산 및 지급을 관리하세요",
      icon: "card-outline",
      color: "#f59e0b",
      route: "/payroll",
    },
    {
      id: "uncollected",
      title: "미수급 건수",
      description: "업체에서 받는 수입을 관리하세요",
      icon: "cash-outline",
      color: "#8b5cf6",
      route: "/uncollected",
    },
  ];

  const handleMenuPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <ScrollView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>리밋 플래너</Text>
          <Text style={styles.headerSubtitle}>
            {currentUser
              ? `${currentUser.name}님 환영합니다`
              : "효율적인 스케줄 & 급여 관리"}
          </Text>
        </View>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="white" />
        </Pressable>
      </View>

      {/* 메인 메뉴 */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>주요 기능</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <Pressable
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.route)}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon as any} size={32} color="white" />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 오늘 일정 */}
      {getTodaySchedules().length > 0 && (
        <View style={styles.todayScheduleContainer}>
          <Text style={styles.sectionTitle}>오늘 일정</Text>
          <View style={styles.scheduleList}>
            {getTodaySchedules().map((schedule) => (
              <Pressable
                key={schedule.id}
                style={styles.scheduleCard}
                onPress={() => setShowTodaySchedule(true)}
              >
                <View style={styles.scheduleIcon}>
                  <Ionicons name="calendar" size={20} color="#3b82f6" />
                </View>
                <View style={styles.scheduleContent}>
                  <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                  <Text style={styles.scheduleTime}>
                    {formatTime(schedule.workers.flatMap((w) => w.periods))}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Theme.colors.text.tertiary}
                />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* 최근 활동 */}
      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>최근 활동</Text>
        <View style={styles.activityList}>
          {recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View
                  style={[
                    styles.activityIcon,
                    { backgroundColor: `${activity.color}20` },
                  ]}
                >
                  <Ionicons
                    name={activity.icon as any}
                    size={20}
                    color={activity.color}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDescription}>
                    {activity.description}
                  </Text>
                  <Text style={styles.activityTime}>
                    {formatActivityTime(activity.timestamp)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noActivityContainer}>
              <Ionicons
                name="time-outline"
                size={40}
                color={Theme.colors.text.tertiary}
              />
              <Text style={styles.noActivityText}>최근 활동이 없습니다</Text>
            </View>
          )}
        </View>
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    backgroundColor: Theme.colors.primary,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: Theme.spacing.xl,
    borderBottomLeftRadius: Theme.borderRadius.xl,
    borderBottomRightRadius: Theme.borderRadius.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoutButton: {
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
    color: Theme.colors.text.inverse,
    marginBottom: Theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: Theme.typography.sizes.md,
    color: "rgba(255, 255, 255, 0.8)",
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.semibold,
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
    backgroundColor: "#3b82f620",
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
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  scheduleTime: {
    fontSize: Theme.typography.sizes.sm,
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
    width: (width - 56) / 2,
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
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
    textAlign: "center",
  },
  menuDescription: {
    fontSize: Theme.typography.sizes.xs,
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
    color: Theme.colors.text.primary,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.tertiary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
  noActivityContainer: {
    alignItems: "center",
    paddingVertical: Theme.spacing.xxl,
  },
  noActivityText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.tertiary,
    marginTop: Theme.spacing.md,
  },
});
