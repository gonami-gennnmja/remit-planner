import { Theme } from "@/constants/Theme";
import { getDatabase } from "@/database/platformDatabase";
import { Schedule, ScheduleCategory } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ScheduleListScreen() {
  const params = useLocalSearchParams();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "upcoming" | "past">(
    "all"
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: dayjs().format("YYYY-MM-DD"),
    endDate: dayjs().format("YYYY-MM-DD"),
    category: "" as ScheduleCategory,
    address: "",
    memo: "",
  });
  const [isMultiDay, setIsMultiDay] = useState(false);

  useEffect(() => {
    loadSchedules();

    // URL 파라미터에서 검색어가 있으면 설정
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
    if (filterType === "upcoming") {
      filtered = filtered.filter((s) =>
        dayjs(s.endDate).isSameOrAfter(today, "day")
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
    Alert.alert("일정 삭제", "이 일정을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
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
  };

  const handleAddSchedule = () => {
    setShowAddModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!formData.title.trim()) {
      Alert.alert("오류", "일정명을 입력해주세요.");
      return;
    }

    if (!formData.startDate) {
      Alert.alert("오류", "시작일을 선택해주세요.");
      return;
    }

    if (!isMultiDay && !formData.endDate) {
      Alert.alert("오류", "종료일을 선택해주세요.");
      return;
    }

    try {
      const db = getDatabase();

      const newSchedule: Schedule = {
        id: `schedule-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: isMultiDay ? formData.endDate : formData.startDate,
        category: formData.category,
        location: formData.address, // 주소를 location으로 저장
        address: formData.address,
        memo: formData.memo,
        workers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.createSchedule(newSchedule);
      await loadSchedules(); // 일정 목록 새로고침
      Alert.alert("성공", "일정이 추가되었습니다.", [
        { text: "확인", onPress: () => setShowAddModal(false) },
      ]);

      // 폼 초기화
      setFormData({
        title: "",
        description: "",
        startDate: dayjs().format("YYYY-MM-DD"),
        endDate: dayjs().format("YYYY-MM-DD"),
        category: "",
        address: "",
        memo: "",
      });
      setIsMultiDay(false);
    } catch (error) {
      console.error("Failed to create schedule:", error);
      Alert.alert("오류", "일정 추가에 실패했습니다.");
    }
  };

  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const db = getDatabase();
      const cats = await db.getAllCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case "education":
        return "교육";
      case "event":
        return "이벤트";
      case "meeting":
        return "회의";
      default:
        return "기타";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "education":
        return "#3b82f6";
      case "event":
        return "#f59e0b";
      case "meeting":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
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
                  <Pressable
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteSchedule(schedule.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </Pressable>
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

                {/* 근로자 정보 */}
                <View style={styles.workerInfo}>
                  <View style={styles.workerCountRow}>
                    <Ionicons
                      name="people-outline"
                      size={16}
                      color={Theme.colors.text.secondary}
                    />
                    <Text style={styles.workerCountText}>
                      {schedule.workers.length}명
                    </Text>
                  </View>
                  <View style={styles.paidStatus}>
                    {schedule.workers.some((w) => w.paid) && (
                      <View style={styles.paidIndicator}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={Theme.colors.success}
                        />
                        <Text style={styles.paidText}>일부 지급</Text>
                      </View>
                    )}
                    {schedule.workers.every((w) => w.paid) && (
                      <View style={styles.paidIndicator}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={Theme.colors.success}
                        />
                        <Text style={styles.paidText}>전체 지급</Text>
                      </View>
                    )}
                    {schedule.workers.every((w) => !w.paid) && (
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
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.addModal,
              Platform.OS === "web" && styles.addModalWeb,
            ]}
          >
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>새 일정 추가</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.addModalContent}
              contentContainerStyle={styles.addModalContentContainer}
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

                <View style={styles.inputGroup}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.inputLabel}>카테고리</Text>
                    <Pressable
                      style={styles.addCategoryButton}
                      onPress={() =>
                        Alert.alert(
                          "알림",
                          "카테고리 추가 기능은 곧 추가됩니다."
                        )
                      }
                    >
                      <Ionicons name="add" size={16} color="#6366f1" />
                      <Text style={styles.addCategoryButtonText}>추가</Text>
                    </Pressable>
                  </View>
                  <View style={styles.categoryContainer}>
                    {categories.map((category) => (
                      <Pressable
                        key={category.id}
                        style={[
                          styles.categoryButton,
                          {
                            backgroundColor:
                              formData.category === category.name
                                ? category.color
                                : "#f5f5f5",
                          },
                        ]}
                        onPress={() =>
                          setFormData({
                            ...formData,
                            category: category.name,
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.categoryButtonText,
                            {
                              color:
                                formData.category === category.name
                                  ? "white"
                                  : "#333",
                            },
                          ]}
                        >
                          {category.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>

              {/* 날짜 및 시간 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>날짜 및 시간</Text>

                <View style={styles.inputGroup}>
                  <View style={styles.checkboxContainer}>
                    <Pressable
                      style={styles.checkbox}
                      onPress={() => setIsMultiDay(!isMultiDay)}
                    >
                      <Ionicons
                        name={isMultiDay ? "checkbox" : "square-outline"}
                        size={20}
                        color={isMultiDay ? "#6366f1" : "#666"}
                      />
                      <Text style={styles.checkboxText}>
                        여러 날에 걸친 일정
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <View style={styles.dateInputGroup}>
                    <Text style={styles.inputLabel}>시작일 *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="YYYY-MM-DD"
                      value={formData.startDate}
                      onChangeText={(text) =>
                        setFormData({ ...formData, startDate: text })
                      }
                    />
                  </View>

                  {isMultiDay && (
                    <View style={styles.dateInputGroup}>
                      <Text style={styles.inputLabel}>종료일 *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="YYYY-MM-DD"
                        value={formData.endDate}
                        onChangeText={(text) =>
                          setFormData({ ...formData, endDate: text })
                        }
                      />
                    </View>
                  )}
                </View>
              </View>

              {/* 장소 정보 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>장소</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>주소</Text>
                  <View style={styles.addressRow}>
                    <TextInput
                      style={[styles.textInput, styles.addressInput]}
                      placeholder="주소 검색 버튼을 눌러주세요"
                      value={formData.address}
                      editable={false}
                    />
                    <Pressable
                      style={styles.addressSearchButton}
                      onPress={() => {
                        // TODO: 주소 검색 모달 열기
                        Alert.alert("알림", "주소 검색 기능은 곧 추가됩니다.");
                      }}
                    >
                      <Ionicons name="search" size={20} color="white" />
                      <Text style={styles.addressSearchButtonText}>
                        주소 검색
                      </Text>
                    </Pressable>
                  </View>
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
            </ScrollView>

            <View style={styles.addModalButtons}>
              <Pressable
                style={styles.addCancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.addCancelButtonText}>취소</Text>
              </Pressable>
              <Pressable
                style={styles.addSaveButton}
                onPress={handleSaveSchedule}
              >
                <Text style={styles.addSaveButtonText}>저장</Text>
              </Pressable>
            </View>
          </View>
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
    gap: Theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
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
    gap: Theme.spacing.sm,
  },
  addButton: {
    backgroundColor: "#6366f1",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  // 스케줄 추가 모달 스타일
  addModal: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "95%",
    maxWidth: 500,
    maxHeight: "90%",
  },
  addModalWeb: {
    width: "70%",
    maxWidth: 700,
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
    color: "#6366f1",
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
  checkboxContainer: {
    marginBottom: 12,
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
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateInputGroup: {
    flex: 1,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#6366f1",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addressSearchButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
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
    backgroundColor: "#6366f1",
    alignItems: "center",
  },
  addSaveButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
});
