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

export default function MainScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );

  // 모달 상태
  const [showTodaySchedule, setShowTodaySchedule] = useState(false);
  const [showMonthlyPayroll, setShowMonthlyPayroll] = useState(false);
  const [showStaffWorkStatus, setShowStaffWorkStatus] = useState(false);
  const [showUnpaidSchedule, setShowUnpaidSchedule] = useState(false);

  useEffect(() => {
    loadUser();
    loadSchedules();
  }, []);

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
    ];

    setSchedules(tempSchedules);
  };

  // 통계 계산
  const getTodayScheduleCount = () => {
    return schedules.filter((schedule) => {
      const scheduleStart = dayjs(schedule.startDate);
      const scheduleEnd = dayjs(schedule.endDate);
      const today = dayjs(selectedDate);
      return (
        today.isSameOrAfter(scheduleStart) && today.isSameOrBefore(scheduleEnd)
      );
    }).length;
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

  const quickStats = [
    {
      label: "오늘 일정",
      value: `${getTodayScheduleCount()}건`,
      color: "#3b82f6",
      onPress: () => setShowTodaySchedule(true),
    },
    {
      label: "이번 달 급여",
      value: `₩${new Intl.NumberFormat("ko-KR").format(getMonthlyPayroll())}`,
      color: "#f59e0b",
      onPress: () => setShowMonthlyPayroll(true),
    },
    {
      label: "스태프 근무 현황",
      value: "상세보기",
      color: "#10b981",
      onPress: () => setShowStaffWorkStatus(true),
    },
    {
      label: "미지급 건수",
      value: `${getUnpaidCount()}건`,
      color: "#ef4444",
      onPress: () => setShowUnpaidSchedule(true),
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

      {/* 빠른 통계 */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>오늘의 현황</Text>
        <View style={styles.statsGrid}>
          {quickStats.map((stat, index) => (
            <Pressable
              key={index}
              style={styles.statCard}
              onPress={stat.onPress}
            >
              <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Pressable>
          ))}
        </View>
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

      {/* 최근 활동 */}
      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>최근 활동</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="person-add" size={20} color="#10b981" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>새 근로자 추가</Text>
              <Text style={styles.activityTime}>2시간 전</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="calendar" size={20} color="#3b82f6" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>수학 과외 일정 추가</Text>
              <Text style={styles.activityTime}>4시간 전</Text>
            </View>
          </View>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons name="card" size={20} color="#f59e0b" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>급여 지급 완료</Text>
              <Text style={styles.activityTime}>1일 전</Text>
            </View>
          </View>
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
  statsContainer: {
    padding: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.md,
  },
  statCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: "center",
    width: (width - 52) / 2,
    ...Theme.shadows.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: Theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Theme.spacing.sm,
  },
  statValue: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.inverse,
  },
  statLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    textAlign: "center",
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
    backgroundColor: Theme.colors.surface,
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
  activityTime: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
});
