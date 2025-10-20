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
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    loadSchedules();
    setShowAddModal(false);
    setShowCategoryModal(false);
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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("오류", "카테고리명을 입력해주세요.");
      return;
    }

    try {
      const db = getDatabase();
      const categoryId = `category_${Date.now()}`;

      await db.createCategory({
        id: categoryId,
        name: newCategoryName.trim(),
        color: newCategoryColor,
      });

      // 카테고리 목록 새로고침
      const updatedCategories = await db.getAllCategories();
      setCategories(updatedCategories);

      // 새로 추가된 카테고리 선택
      setFormData({ ...formData, category: categoryId as ScheduleCategory });

      // 모달 닫기 및 폼 초기화
      setShowCategoryModal(false);
      setNewCategoryName("");
      setNewCategoryColor("#6366f1");

      Alert.alert("성공", "카테고리가 추가되었습니다.");
    } catch (error) {
      console.error("Failed to add category:", error);
      Alert.alert("오류", "카테고리 추가에 실패했습니다.");
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        startDate: dayjs(selectedDate).format("YYYY-MM-DD"),
      });
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        endDate: dayjs(selectedDate).format("YYYY-MM-DD"),
      });
    }
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

      // 모달 닫기
      setShowAddModal(false);

      // 폼 초기화
      setFormData({
        title: "",
        description: "",
        startDate: dayjs().format("YYYY-MM-DD"),
        startTime: "09:00",
        endDate: dayjs().format("YYYY-MM-DD"),
        endTime: "18:00",
        category: "",
        address: "",
        memo: "",
      });
      setIsMultiDay(false);

      Alert.alert("성공", "일정이 추가되었습니다.");
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
                      onPress={() => setShowCategoryModal(true)}
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
                              formData.category === category.id
                                ? category.color
                                : "#f5f5f5",
                          },
                        ]}
                        onPress={() =>
                          setFormData({
                            ...formData,
                            category: category.id as ScheduleCategory,
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

                <View style={styles.dateTimeRow}>
                  <View style={styles.dateTimeGroup}>
                    <Text style={styles.inputLabel}>시작일 *</Text>
                    {Platform.OS === "web" ? (
                      <Pressable
                        style={styles.webDateInput}
                        onPress={() => {
                          const input = document.createElement("input");
                          input.type = "date";
                          input.value = formData.startDate;
                          input.style.position = "absolute";
                          input.style.left = "-9999px";
                          document.body.appendChild(input);
                          input.click();
                          input.onchange = (e: any) => {
                            setFormData({
                              ...formData,
                              startDate: e.target.value,
                            });
                            document.body.removeChild(input);
                          };
                        }}
                      >
                        <Text
                          style={[
                            styles.webDateInputText,
                            !formData.startDate && styles.placeholderText,
                          ]}
                        >
                          {formData.startDate || "날짜 선택"}
                        </Text>
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#666"
                        />
                      </Pressable>
                    ) : (
                      <Pressable
                        style={styles.dateInput}
                        onPress={() => setShowStartDatePicker(true)}
                      >
                        <Text style={styles.dateInputText}>
                          {formData.startDate || "날짜 선택"}
                        </Text>
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#666"
                        />
                      </Pressable>
                    )}
                  </View>

                  <View style={styles.dateTimeGroup}>
                    <Text style={styles.inputLabel}>시작시간 *</Text>
                    {Platform.OS === "web" ? (
                      <Pressable
                        style={styles.webTimeInput}
                        onPress={() => {
                          const input = document.createElement("input");
                          input.type = "time";
                          input.value = formData.startTime;
                          input.style.position = "absolute";
                          input.style.left = "-9999px";
                          document.body.appendChild(input);
                          input.click();
                          input.onchange = (e: any) => {
                            setFormData({
                              ...formData,
                              startTime: e.target.value,
                            });
                            document.body.removeChild(input);
                          };
                        }}
                      >
                        <Text
                          style={[
                            styles.webTimeInputText,
                            !formData.startTime && styles.placeholderText,
                          ]}
                        >
                          {formData.startTime || "시간 선택"}
                        </Text>
                        <Ionicons name="time-outline" size={20} color="#666" />
                      </Pressable>
                    ) : (
                      <TextInput
                        style={styles.textInput}
                        placeholder="HH:MM"
                        value={formData.startTime}
                        onChangeText={(text) =>
                          setFormData({ ...formData, startTime: text })
                        }
                      />
                    )}
                  </View>
                </View>

                {isMultiDay && (
                  <View style={styles.dateTimeRow}>
                    <View style={styles.dateTimeGroup}>
                      <Text style={styles.inputLabel}>종료일 *</Text>
                      {Platform.OS === "web" ? (
                        <Pressable
                          style={styles.webDateInput}
                          onPress={() => {
                            const input = document.createElement("input");
                            input.type = "date";
                            input.value = formData.endDate;
                            input.style.position = "absolute";
                            input.style.left = "-9999px";
                            document.body.appendChild(input);
                            input.click();
                            input.onchange = (e: any) => {
                              setFormData({
                                ...formData,
                                endDate: e.target.value,
                              });
                              document.body.removeChild(input);
                            };
                          }}
                        >
                          <Text
                            style={[
                              styles.webDateInputText,
                              !formData.endDate && styles.placeholderText,
                            ]}
                          >
                            {formData.endDate || "날짜 선택"}
                          </Text>
                          <Ionicons
                            name="calendar-outline"
                            size={20}
                            color="#666"
                          />
                        </Pressable>
                      ) : (
                        <Pressable
                          style={styles.dateInput}
                          onPress={() => setShowEndDatePicker(true)}
                        >
                          <Text style={styles.dateInputText}>
                            {formData.endDate || "날짜 선택"}
                          </Text>
                          <Ionicons
                            name="calendar-outline"
                            size={20}
                            color="#666"
                          />
                        </Pressable>
                      )}
                    </View>

                    <View style={styles.dateTimeGroup}>
                      <Text style={styles.inputLabel}>종료시간 *</Text>
                      {Platform.OS === "web" ? (
                        <Pressable
                          style={styles.webTimeInput}
                          onPress={() => {
                            const input = document.createElement("input");
                            input.type = "time";
                            input.value = formData.endTime;
                            input.style.position = "absolute";
                            input.style.left = "-9999px";
                            document.body.appendChild(input);
                            input.click();
                            input.onchange = (e: any) => {
                              setFormData({
                                ...formData,
                                endTime: e.target.value,
                              });
                              document.body.removeChild(input);
                            };
                          }}
                        >
                          <Text
                            style={[
                              styles.webTimeInputText,
                              !formData.endTime && styles.placeholderText,
                            ]}
                          >
                            {formData.endTime || "시간 선택"}
                          </Text>
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color="#666"
                          />
                        </Pressable>
                      ) : (
                        <TextInput
                          style={styles.textInput}
                          placeholder="HH:MM"
                          value={formData.endTime}
                          onChangeText={(text) =>
                            setFormData({ ...formData, endTime: text })
                          }
                        />
                      )}
                    </View>
                  </View>
                )}
              </View>

              {/* 장소 정보 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>장소</Text>

                <View style={styles.inputGroup}>
                  <View style={styles.addressRow}>
                    <TextInput
                      style={[styles.textInput, styles.addressInput]}
                      placeholder="주소 검색 버튼을 눌러주세요"
                      value={formData.address}
                      editable={false}
                    />
                    <Pressable
                      style={styles.addressSearchButton}
                      onPress={() => setShowAddressModal(true)}
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

      {/* 카테고리 추가 모달 */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.categoryModal}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>새 카테고리 추가</Text>
              <Pressable onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <View style={styles.categoryModalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>카테고리명 *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="카테고리명을 입력하세요"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>색상</Text>
                <View style={styles.colorPicker}>
                  {[
                    "#6366f1",
                    "#ef4444",
                    "#10b981",
                    "#f59e0b",
                    "#8b5cf6",
                    "#06b6d4",
                    "#84cc16",
                    "#f97316",
                  ].map((color) => (
                    <Pressable
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newCategoryColor === color &&
                          styles.colorOptionSelected,
                      ]}
                      onPress={() => setNewCategoryColor(color)}
                    />
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.categoryModalButtons}>
              <Pressable
                style={styles.addCancelButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.addCancelButtonText}>취소</Text>
              </Pressable>
              <Pressable
                style={styles.addSaveButton}
                onPress={handleAddCategory}
              >
                <Text style={styles.addSaveButtonText}>추가</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 날짜 피커 */}
      {Platform.OS !== "web" && showStartDatePicker && (
        <DateTimePicker
          value={new Date(formData.startDate || new Date())}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleStartDateChange}
        />
      )}

      {Platform.OS !== "web" && showEndDatePicker && (
        <DateTimePicker
          value={new Date(formData.endDate || new Date())}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleEndDateChange}
        />
      )}

      {/* 주소 검색 모달 */}
      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addressModal}>
            <View style={styles.addressModalHeader}>
              <Text style={styles.addressModalTitle}>주소 검색</Text>
              <Pressable onPress={() => setShowAddressModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </Pressable>
            </View>

            <View style={styles.addressModalContent}>
              <TextInput
                style={styles.addressSearchInput}
                placeholder="주소를 입력하세요"
                value={formData.address}
                onChangeText={(text) =>
                  setFormData({ ...formData, address: text })
                }
              />
              <Pressable
                style={styles.addressConfirmButton}
                onPress={() => setShowAddressModal(false)}
              >
                <Text style={styles.addressConfirmButtonText}>확인</Text>
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
    maxWidth: 600,
    maxHeight: "90%",
  },
  addModalWeb: {
    width: "90%",
    maxWidth: 520,
    maxHeight: "90%",
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
  // 카테고리 추가 모달 스타일
  categoryModal: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  categoryModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  categoryModalContent: {
    padding: 20,
  },
  categoryModalButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#333",
    borderWidth: 3,
  },
  // 날짜 입력 스타일
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "white",
  },
  dateInputText: {
    fontSize: 16,
    color: "#333",
  },
  // 주소 검색 모달 스타일
  addressModal: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
  },
  addressModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  addressModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  addressModalContent: {
    padding: 20,
  },
  addressSearchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  addressConfirmButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  addressConfirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // 웹용 날짜 피커 모달 스타일
  datePickerModal: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  datePickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  datePickerModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  datePickerModalContent: {
    padding: 20,
    alignItems: "center",
  },
  datePickerModalButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  webDateInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    height: 40,
  },
  webTimeInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    height: 40,
  },
  webDateInputText: {
    fontSize: 16,
    color: "#333",
  },
  webTimeInputText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#9ca3af",
  },
  // 날짜/시간 행 스타일
  dateTimeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dateTimeGroup: {
    flex: 1,
  },
});
