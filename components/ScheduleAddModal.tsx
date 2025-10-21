import AddressSearchModal from "@/components/AddressSearchModal";
import { Text } from "@/components/Themed";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import { useResponsive } from "@/hooks/useResponsive";
import { ScheduleCategory } from "@/models/types";
import { createScheduleActivity } from "@/utils/activityUtils";
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
// @ts-ignore
import RNDatePicker from "react-native-datepicker";

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
  const { screenData, isMobile, isTablet, isDesktop, getResponsiveValue } =
    useResponsive();
  const { colors } = useTheme();
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

      // 활동 생성
      await createScheduleActivity(
        newSchedule.id,
        newSchedule.title,
        newSchedule.description
      );

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

  const handleDirectAddressSearch = () => {
    if (Platform.OS === "web") {
      // 웹에서 직접 다음 우편번호 서비스 열기
      const script = document.createElement("script");
      script.src =
        "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.onload = () => {
        // 팝업 창으로 열기
        const popup = window.open(
          "",
          "postcodePopup",
          "width=500,height=600,scrollbars=yes,resizable=yes"
        );

        if (popup) {
          // 팝업 창에 HTML 작성
          popup.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>주소 검색</title>
              <style>
                body { margin: 0; padding: 0; }
                #postcode { width: 100%; height: 100vh; }
              </style>
            </head>
            <body>
              <div id="postcode"></div>
            </body>
            </html>
          `);
          popup.document.close();

          // 팝업이 완전히 로드된 후 다음 우편번호 서비스 초기화
          popup.onload = () => {
            // @ts-ignore
            new window.daum.Postcode({
              oncomplete: function (data: any) {
                console.log("팝업에서 선택된 주소:", data);

                let selectedAddress = "";
                if (data.roadAddress) {
                  selectedAddress = data.roadAddress;
                } else if (data.jibunAddress) {
                  selectedAddress = data.jibunAddress;
                } else if (data.address) {
                  selectedAddress = data.address;
                }

                if (data.buildingName) {
                  selectedAddress += ` (${data.buildingName})`;
                }

                // 선택된 주소를 폼 데이터에 설정
                setFormData({ ...formData, address: selectedAddress });
                popup.close();
              },
              onclose: function (state: string) {
                console.log("팝업 닫힘:", state);
                if (state === "FORCE_CLOSE") {
                  popup.close();
                }
              },
            }).embed(popup.document.getElementById("postcode"));
          };
        }
      };

      script.onerror = () => {
        Alert.alert("오류", "주소 검색 서비스를 불러올 수 없습니다.");
      };

      document.head.appendChild(script);
    } else {
      // 모바일에서는 기존 방식 사용
      setIsAddressSearchVisible(true);
    }
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
                      <Ionicons name="add" size={16} color={colors.primary} />
                      <Text
                        style={[
                          styles.addCategoryButtonText,
                          { color: colors.primary },
                        ]}
                      >
                        추가
                      </Text>
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
                        color={isMultiDay ? colors.primary : "#666"}
                      />
                      <Text style={styles.checkboxText}>
                        여러 날에 걸친 일정
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.dateTimeRow}>
                  <View
                    style={[
                      styles.dateTimeGroup,
                      Platform.OS === "web" && styles.webDateGroup,
                    ]}
                  >
                    <Text style={styles.inputLabel}>시작일 *</Text>
                    {Platform.OS === "web" ? (
                      <Pressable
                        style={styles.webDateInput}
                        onPress={() => {
                          const input = document.createElement("input");
                          input.type = "date";
                          input.value = formData.startDate || "";
                          input.style.position = "absolute";
                          input.style.left = "-9999px";
                          input.style.opacity = "0";
                          input.style.pointerEvents = "none";
                          document.body.appendChild(input);

                          const handleChange = (e: any) => {
                            setFormData({
                              ...formData,
                              startDate: e.target.value,
                            });
                            document.body.removeChild(input);
                          };

                          input.addEventListener("change", handleChange);
                          input.addEventListener("blur", () => {
                            document.body.removeChild(input);
                          });

                          input.focus();
                          input.click();
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
                      <RNDatePicker
                        style={styles.datePickerStyle}
                        date={formData.startDate}
                        mode="date"
                        placeholder="날짜 선택"
                        format="YYYY-MM-DD"
                        confirmBtnText="확인"
                        cancelBtnText="취소"
                        customStyles={{
                          dateInput: styles.datePickerInput,
                          dateText: styles.datePickerText,
                          placeholderText: styles.datePickerPlaceholder,
                        }}
                        onDateChange={(date: string) =>
                          setFormData({ ...formData, startDate: date })
                        }
                      />
                    )}
                  </View>

                  <View
                    style={[
                      styles.dateTimeGroup,
                      Platform.OS === "web" && styles.webTimeGroup,
                    ]}
                  >
                    <Text style={styles.inputLabel}>시작시간 *</Text>
                    {Platform.OS === "web" ? (
                      <Pressable
                        style={styles.webTimeInput}
                        onPress={() => {
                          const input = document.createElement("input");
                          input.type = "time";
                          input.value = formData.startTime || "";
                          input.style.position = "absolute";
                          input.style.left = "-9999px";
                          input.style.opacity = "0";
                          input.style.pointerEvents = "none";
                          document.body.appendChild(input);

                          const handleChange = (e: any) => {
                            setFormData({
                              ...formData,
                              startTime: e.target.value,
                            });
                            document.body.removeChild(input);
                          };

                          input.addEventListener("change", handleChange);
                          input.addEventListener("blur", () => {
                            document.body.removeChild(input);
                          });

                          input.focus();
                          input.click();
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
                      <RNDatePicker
                        style={styles.datePickerStyle}
                        date={formData.startTime}
                        mode="time"
                        placeholder="시간 선택"
                        format="HH:mm"
                        confirmBtnText="확인"
                        cancelBtnText="취소"
                        customStyles={{
                          dateInput: styles.datePickerInput,
                          dateText: styles.datePickerText,
                          placeholderText: styles.datePickerPlaceholder,
                        }}
                        onDateChange={(time: string) =>
                          setFormData({ ...formData, startTime: time })
                        }
                      />
                    )}
                  </View>
                </View>

                {isMultiDay && (
                  <View style={styles.dateTimeRow}>
                    <View
                      style={[
                        styles.dateTimeGroup,
                        Platform.OS === "web" && styles.webDateGroup,
                      ]}
                    >
                      <Text style={styles.inputLabel}>종료일 *</Text>
                      {Platform.OS === "web" ? (
                        <Pressable
                          style={styles.webDateInput}
                          onPress={() => {
                            const input = document.createElement("input");
                            input.type = "date";
                            input.value = formData.endDate || "";
                            if (formData.startDate) {
                              input.min = formData.startDate;
                            }
                            input.style.position = "absolute";
                            input.style.left = "-9999px";
                            input.style.opacity = "0";
                            input.style.pointerEvents = "none";
                            document.body.appendChild(input);

                            const handleChange = (e: any) => {
                              setFormData({
                                ...formData,
                                endDate: e.target.value,
                              });
                              document.body.removeChild(input);
                            };

                            input.addEventListener("change", handleChange);
                            input.addEventListener("blur", () => {
                              document.body.removeChild(input);
                            });

                            input.focus();
                            input.click();
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
                        <RNDatePicker
                          style={styles.datePickerStyle}
                          date={formData.endDate}
                          mode="date"
                          placeholder="날짜 선택"
                          format="YYYY-MM-DD"
                          minDate={formData.startDate}
                          confirmBtnText="확인"
                          cancelBtnText="취소"
                          customStyles={{
                            dateInput: styles.datePickerInput,
                            dateText: styles.datePickerText,
                            placeholderText: styles.datePickerPlaceholder,
                          }}
                          onDateChange={(date: string) =>
                            setFormData({ ...formData, endDate: date })
                          }
                        />
                      )}
                    </View>

                    <View
                      style={[
                        styles.dateTimeGroup,
                        Platform.OS === "web" && styles.webTimeGroup,
                      ]}
                    >
                      <Text style={styles.inputLabel}>종료시간 *</Text>
                      {Platform.OS === "web" ? (
                        <Pressable
                          style={styles.webTimeInput}
                          onPress={() => {
                            const input = document.createElement("input");
                            input.type = "time";
                            input.value = formData.endTime || "";
                            input.style.position = "absolute";
                            input.style.left = "-9999px";
                            input.style.opacity = "0";
                            input.style.pointerEvents = "none";
                            document.body.appendChild(input);

                            const handleChange = (e: any) => {
                              setFormData({
                                ...formData,
                                endTime: e.target.value,
                              });
                              document.body.removeChild(input);
                            };

                            input.addEventListener("change", handleChange);
                            input.addEventListener("blur", () => {
                              document.body.removeChild(input);
                            });

                            input.focus();
                            input.click();
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
                        <RNDatePicker
                          style={styles.datePickerStyle}
                          date={formData.endTime}
                          mode="time"
                          placeholder="시간 선택"
                          format="HH:mm"
                          confirmBtnText="확인"
                          cancelBtnText="취소"
                          customStyles={{
                            dateInput: styles.datePickerInput,
                            dateText: styles.datePickerText,
                            placeholderText: styles.datePickerPlaceholder,
                          }}
                          onDateChange={(time: string) =>
                            setFormData({ ...formData, endTime: time })
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
                      style={[
                        styles.addressSearchButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={handleDirectAddressSearch}
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
              <Pressable
                style={[
                  styles.addSaveButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleSave}
              >
                <Text style={styles.addSaveButtonText}>저장</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {Platform.OS !== "web" && (
        <AddressSearchModal
          visible={isAddressSearchVisible}
          onClose={() => setIsAddressSearchVisible(false)}
          onSelectAddress={handleAddressSelect}
        />
      )}
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
    alignItems: "flex-start",
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
    alignItems: "center",
  },
  addSaveButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
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
  datePickerStyle: {
    width: "100%",
  },
  datePickerInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
    alignItems: "flex-start",
  },
  datePickerText: {
    fontSize: 16,
    color: "#333",
  },
  datePickerPlaceholder: {
    fontSize: 16,
    color: "#9ca3af",
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateInputText: {
    fontSize: 16,
    color: "#333",
  },
  // 웹용 날짜/시간 그룹 스타일
  webDateGroup: {
    flex: 1,
    minWidth: 150,
    maxWidth: 200,
    marginRight: 8,
  },
  webTimeGroup: {
    flex: 1,
    minWidth: 100,
    maxWidth: 150,
    marginLeft: 8,
  },
});
