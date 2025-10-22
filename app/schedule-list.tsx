import CommonHeader from "@/components/CommonHeader";
import ScheduleAddModal from "@/components/ScheduleAddModal";
import { Theme } from "@/constants/Theme";
import { getDatabase } from "@/database/platformDatabase";
import { Schedule } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// 웹 환경에서 window 객체 타입 선언
declare const window: any;

export default function ScheduleListScreen() {
  const params = useLocalSearchParams();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "ongoing" | "upcoming" | "past"
  >("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    loadSchedules();
    loadCategories();
  }, []);

  // URL 파라미터에서 검색어가 있으면 설정
  useEffect(() => {
    if (params.search && typeof params.search === "string") {
      setSearchQuery(params.search);
    }
  }, [params.search]);

  useEffect(() => {
    filterSchedules();
  }, [schedules, searchQuery, filterType]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      await db.init();

      const allSchedules = await db.getAllSchedules();
      setSchedules(allSchedules);
    } catch (error) {
      console.error("Failed to load schedules:", error);
      Alert.alert("오류", "일정을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filterSchedules = () => {
    let filtered = schedules;

    // 검색어 필터링
    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 날짜 필터링
    const today = dayjs();
    if (filterType === "ongoing") {
      filtered = filtered.filter(
        (s) =>
          dayjs(s.startDate).isSameOrBefore(today, "day") &&
          dayjs(s.endDate).isSameOrAfter(today, "day")
      );
    } else if (filterType === "upcoming") {
      filtered = filtered.filter((s) =>
        dayjs(s.startDate).isAfter(today, "day")
      );
    } else if (filterType === "past") {
      filtered = filtered.filter((s) =>
        dayjs(s.endDate).isBefore(today, "day")
      );
    }

    // 날짜순 정렬 (최신순)
    filtered.sort((a, b) => dayjs(b.startDate).diff(dayjs(a.startDate)));

    setFilteredSchedules(filtered);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    console.log("Delete button clicked for schedule:", scheduleId);

    // 웹에서는 confirm 사용
    if (Platform.OS === "web") {
      const confirmed = window.confirm("이 일정을 삭제하시겠습니까?");
      if (confirmed) {
        try {
          console.log("Deleting schedule:", scheduleId);
          const db = getDatabase();
          await db.deleteSchedule(scheduleId);
          await loadSchedules();
          alert("일정이 삭제되었습니다.");
        } catch (error) {
          console.error("Failed to delete schedule:", error);
          alert("일정 삭제에 실패했습니다.");
        }
      }
    } else {
      // 모바일에서는 Alert 사용
      Alert.alert("일정 삭제", "이 일정을 삭제하시겠습니까?", [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Deleting schedule:", scheduleId);
              const db = getDatabase();
              await db.deleteSchedule(scheduleId);
              await loadSchedules();
              Alert.alert("성공", "일정이 삭제되었습니다.");
            } catch (error) {
              console.error("Failed to delete schedule:", error);
              Alert.alert("오류", "일정 삭제에 실패했습니다.");
            }
          },
        },
      ]);
    }
  };

  const handleAddSchedule = () => {
    setShowAddModal(true);
  };

  const handleSaveSchedule = () => {
    loadSchedules(); // 일정 목록 새로고침
  };

  const loadCategories = async () => {
    try {
      const db = getDatabase();
      const cats = await db.getAllCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const getCategoryText = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "기타";
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.color : "#6b7280";
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (start.isSame(end, "day")) {
      return start.format("YYYY년 M월 D일");
    } else if (start.isSame(end, "month")) {
      return `${start.format("YYYY년 M월 D일")} ~ ${end.format("D일")}`;
    } else if (start.isSame(end, "year")) {
      return `${start.format("YYYY년 M월 D일")} ~ ${end.format("M월 D일")}`;
    } else {
      return `${start.format("YYYY년 M월 D일")} ~ ${end.format(
        "YYYY년 M월 D일"
      )}`;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>일정을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <CommonHeader
        title="일정 관리"
        rightButton={{
          icon: "add",
          onPress: handleAddSchedule,
        }}
      />

      {/* 검색 및 필터 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={Theme.colors.text.tertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="일정명, 장소, 설명으로 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Theme.colors.text.tertiary}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={Theme.colors.text.tertiary}
              />
            </Pressable>
          )}
        </View>

        {/* 필터 버튼과 추가 버튼 */}
        <View style={styles.filterAndAddContainer}>
          {/* 필터 버튼 그룹 */}
          <View style={styles.filterContainer}>
            <Pressable
              style={[
                styles.filterButton,
                filterType === "all" && styles.filterButtonActive,
              ]}
              onPress={() => setFilterType("all")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterType === "all" && styles.filterButtonTextActive,
                ]}
              >
                전체
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.filterButton,
                filterType === "ongoing" && styles.filterButtonActive,
              ]}
              onPress={() => setFilterType("ongoing")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterType === "ongoing" && styles.filterButtonTextActive,
                ]}
              >
                진행 중
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.filterButton,
                filterType === "upcoming" && styles.filterButtonActive,
              ]}
              onPress={() => setFilterType("upcoming")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterType === "upcoming" && styles.filterButtonTextActive,
                ]}
              >
                예정
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.filterButton,
                filterType === "past" && styles.filterButtonActive,
              ]}
              onPress={() => setFilterType("past")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filterType === "past" && styles.filterButtonTextActive,
                ]}
              >
                지난 일정
              </Text>
            </Pressable>
          </View>

          {/* 추가 버튼 */}
          <Pressable style={styles.addButton} onPress={handleAddSchedule}>
            <Ionicons name="add" size={24} color="white" />
          </Pressable>
        </View>
      </View>

      {/* 일정 리스트 */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS === "web" && styles.contentContainerWeb,
        ]}
      >
        {filteredSchedules.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color={Theme.colors.text.tertiary}
            />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "검색 결과가 없습니다"
                : filterType === "upcoming"
                ? "예정된 일정이 없습니다"
                : filterType === "past"
                ? "지난 일정이 없습니다"
                : "등록된 일정이 없습니다"}
            </Text>
          </View>
        ) : (
          <View
            style={Platform.OS === "web" ? styles.schedulesGrid : undefined}
          >
            {filteredSchedules.map((schedule) => (
              <Pressable
                key={schedule.id}
                style={styles.scheduleCard}
                onPress={() => router.push(`/schedule/${schedule.id}`)}
              >
                {/* 카드 헤더 */}
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                    <View
                      style={[
                        styles.categoryBadge,
                        {
                          backgroundColor: getCategoryColor(schedule.category),
                        },
                      ]}
                    >
                      <Text style={styles.categoryText}>
                        {getCategoryText(schedule.category)}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteSchedule(schedule.id);
                    }}
                    onPressIn={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onPressOut={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                {/* 날짜 */}
                <View style={styles.dateRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={Theme.colors.text.secondary}
                  />
                  <Text style={styles.dateText}>
                    {formatDateRange(schedule.startDate, schedule.endDate)}
                  </Text>
                  {dayjs(schedule.endDate).isBefore(dayjs(), "day") && (
                    <View style={styles.pastBadge}>
                      <Text style={styles.pastBadgeText}>종료</Text>
                    </View>
                  )}
                </View>

                {/* 설명 */}
                {schedule.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {schedule.description}
                  </Text>
                )}

                {/* 장소 */}
                {schedule.location && (
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={Theme.colors.text.secondary}
                    />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {schedule.location}
                    </Text>
                  </View>
                )}

                {/* 첨부파일 여부 */}
                {schedule.hasAttachments && (
                  <View style={styles.attachmentRow}>
                    <Ionicons
                      name="attach-outline"
                      size={16}
                      color={Theme.colors.primary}
                    />
                    <Text style={styles.attachmentText}>첨부파일 있음</Text>
                  </View>
                )}

                {/* 일별 시간 설정 여부 */}
                {!schedule.uniformTime && (
                  <View style={styles.timeSettingsRow}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={Theme.colors.text.secondary}
                    />
                    <Text style={styles.timeSettingsText}>일별 시간 설정</Text>
                  </View>
                )}

                {/* 근로자 정보 */}
                <View style={styles.workerInfo}>
                  <View style={styles.workerCountRow}>
                    <Ionicons
                      name="people-outline"
                      size={16}
                      color={Theme.colors.text.secondary}
                    />
                    <Text style={styles.workerCountText}>
                      {schedule.workers?.length || 0}명
                    </Text>
                  </View>
                  <View style={styles.paidStatus}>
                    {schedule.workers?.some((w) => w.paid) && (
                      <View style={styles.paidIndicator}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={Theme.colors.success}
                        />
                        <Text style={styles.paidText}>일부 지급</Text>
                      </View>
                    )}
                    {schedule.workers?.every((w) => w.paid) && (
                      <View style={styles.paidIndicator}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={Theme.colors.success}
                        />
                        <Text style={styles.paidText}>전체 지급</Text>
                      </View>
                    )}
                    {schedule.workers?.every((w) => !w.paid) && (
                      <View style={styles.unpaidIndicator}>
                        <Ionicons
                          name="alert-circle-outline"
                          size={16}
                          color={Theme.colors.warning}
                        />
                        <Text style={styles.unpaidText}>미지급</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 스케줄 추가 모달 */}
      <ScheduleAddModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveSchedule}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
  },
  searchContainer: {
    backgroundColor: Theme.colors.card,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    paddingHorizontal: Theme.spacing.md,
    height: 44,
    marginBottom: Theme.spacing.md,
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
    padding: 0,
  },
  filterContainer: {
    flexDirection: "row",
    gap: Theme.spacing.xs,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
  },
  filterButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  filterButtonActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  filterButtonText: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.secondary,
  },
  filterButtonTextActive: {
    color: Theme.colors.text.inverse,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Theme.spacing.lg,
  },
  contentContainerWeb: {
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
  },
  schedulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: Theme.spacing.lg,
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.tertiary,
  },
  scheduleCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
    marginBottom: Theme.spacing.md,
    ...(Platform.OS === "web"
      ? {
          flex: 1,
          minWidth: "calc(50% - 8px)",
          maxWidth: "calc(50% - 8px)",
        }
      : {}),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Theme.spacing.md,
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    marginRight: Theme.spacing.md,
  },
  scheduleTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
  },
  categoryText: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.medium,
    color: "#ffffff",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 5,
    cursor: "pointer",
    position: "relative",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  dateText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
    flex: 1,
  },
  pastBadge: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  pastBadgeText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.tertiary,
  },
  description: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: Theme.spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  locationText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    flex: 1,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  attachmentText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  timeSettingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  timeSettingsText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    fontStyle: "italic",
  },
  workerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
  },
  workerCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.xs,
  },
  workerCountText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  paidStatus: {
    flexDirection: "row",
    gap: Theme.spacing.sm,
  },
  paidIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.xs,
  },
  paidText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.success,
    fontWeight: Theme.typography.weights.medium,
  },
  unpaidIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.xs,
  },
  unpaidText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.warning,
    fontWeight: Theme.typography.weights.medium,
  },
  // 필터와 추가 버튼 컨테이너
  filterAndAddContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Theme.spacing.lg,
  },
  addButton: {
    backgroundColor: "#6366f1",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
