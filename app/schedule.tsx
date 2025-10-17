import PlannerCalendar from "@/components/PlannerCalendar";
import { getDatabase } from "@/database/platformDatabase";
import { Schedule, ScheduleCategory } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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

export default function ScheduleScreen() {
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

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>스케줄 관리</Text>
        <Pressable style={styles.headerButton} onPress={handleAddSchedule}>
          <Ionicons name="add" size={24} color="white" />
        </Pressable>
      </View>

      {/* 캘린더 컴포넌트 */}
      <View style={styles.content}>
        <PlannerCalendar />
      </View>

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
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#6366f1", // 인디고 바이올렛
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
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
