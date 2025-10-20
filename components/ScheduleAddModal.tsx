import AddressSearchModal from "@/components/AddressSearchModal";
import { Text } from "@/components/Themed";
import { getDatabase } from "@/database/platformDatabase";
import { ScheduleCategory } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

interface ScheduleAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  initialStartDate?: string;
  initialEndDate?: string;
  initialIsMultiDay?: boolean;
}

export default function ScheduleAddModal({
  visible,
  onClose,
  onSave,
  initialStartDate,
  initialEndDate,
  initialIsMultiDay = false,
}: ScheduleAddModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: initialStartDate || dayjs().format("YYYY-MM-DD"),
    startTime: "09:00",
    endDate: initialEndDate || dayjs().format("YYYY-MM-DD"),
    endTime: "18:00",
    category: "" as ScheduleCategory,
    address: "",
    memo: "",
  });
  const [isMultiDay, setIsMultiDay] = useState(initialIsMultiDay);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [isAddressSearchVisible, setIsAddressSearchVisible] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (visible) {
      // 모달이 열릴 때 초기값 설정
      setFormData({
        title: "",
        description: "",
        startDate: initialStartDate || dayjs().format("YYYY-MM-DD"),
        startTime: "09:00",
        endDate: initialEndDate || dayjs().format("YYYY-MM-DD"),
        endTime: "18:00",
        category: "" as ScheduleCategory,
        address: "",
        memo: "",
      });
      setIsMultiDay(initialIsMultiDay);
    }
  }, [visible, initialStartDate, initialEndDate, initialIsMultiDay]);

  const loadCategories = async () => {
    try {
      const db = getDatabase();
      const cats = await db.getAllCategories();
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert("오류", "일정명을 입력해주세요.");
      return;
    }

    if (!formData.startDate) {
      Alert.alert("오류", "시작일을 선택해주세요.");
      return;
    }

    if (isMultiDay && !formData.endDate) {
      Alert.alert("오류", "종료일을 선택해주세요.");
      return;
    }

    try {
      const db = getDatabase();

      const newSchedule = {
        id: `schedule-${Date.now()}`,
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: isMultiDay ? formData.endDate : formData.startDate,
        category: formData.category,
        location: formData.address,
        address: formData.address,
        memo: formData.memo,
        workers: [],
      };

      await db.createSchedule(newSchedule);
      Alert.alert("성공", "일정이 추가되었습니다.", [
        {
          text: "확인",
          onPress: () => {
            onSave();
            onClose();
          },
        },
      ]);

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
    } catch (error) {
      console.error("Failed to create schedule:", error);
      Alert.alert("오류", "일정 추가에 실패했습니다.");
    }
  };

  const handleAddressSelect = (address: string) => {
    setFormData({ ...formData, address });
    setIsAddressSearchVisible(false);
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
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
              <Pressable onPress={onClose}>
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
                            category: category.name as ScheduleCategory,
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
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
                        }
                        style={styles.webDateInput}
                      />
                    ) : (
                      <TextInput
                        style={styles.textInput}
                        value={formData.startDate}
                        onChangeText={(text) =>
                          setFormData({ ...formData, startDate: text })
                        }
                      />
                    )}
                  </View>

                  <View style={styles.dateTimeGroup}>
                    <Text style={styles.inputLabel}>시작시간 *</Text>
                    {Platform.OS === "web" ? (
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startTime: e.target.value,
                          })
                        }
                        style={styles.webTimeInput}
                      />
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
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endDate: e.target.value,
                            })
                          }
                          style={styles.webDateInput}
                        />
                      ) : (
                        <TextInput
                          style={styles.textInput}
                          value={formData.endDate}
                          onChangeText={(text) =>
                            setFormData({ ...formData, endDate: text })
                          }
                        />
                      )}
                    </View>

                    <View style={styles.dateTimeGroup}>
                      <Text style={styles.inputLabel}>종료시간 *</Text>
                      {Platform.OS === "web" ? (
                        <input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endTime: e.target.value,
                            })
                          }
                          style={styles.webTimeInput}
                        />
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
                      onPress={() => setIsAddressSearchVisible(true)}
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
              <Pressable style={styles.addCancelButton} onPress={onClose}>
                <Text style={styles.addCancelButtonText}>취소</Text>
              </Pressable>
              <Pressable style={styles.addSaveButton} onPress={handleSave}>
                <Text style={styles.addSaveButtonText}>저장</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <AddressSearchModal
        visible={isAddressSearchVisible}
        onClose={() => setIsAddressSearchVisible(false)}
        onSelectAddress={handleAddressSelect}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
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
  dateTimeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  dateTimeGroup: {
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
  webDateInput: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "white",
  },
  webTimeInput: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: "white",
  },
});
