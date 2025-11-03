import { Text } from "@/components/Themed";
import { Theme } from "@/constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";

interface DatePickerProps {
  label: string;
  value: string;
  onDateChange: (date: string) => void;
  placeholder?: string;
  mode?: "date" | "datetime" | "time";
  format?: string;
  minDate?: string;
  maxDate?: string;
}

export default function DatePicker({
  label,
  value,
  onDateChange,
  placeholder = "날짜를 선택하세요",
  mode = "date",
  format = "YYYY-MM-DD",
  minDate,
  maxDate,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // Invalid Date 체크
    if (isNaN(date.getTime())) return "";

    if (mode === "time") {
      const h = date.getHours().toString().padStart(2, "0");
      const m = date.getMinutes().toString().padStart(2, "0");
      return `${h}:${m}`;
    }
    return date.toLocaleDateString("ko-KR");
  };

  const [tempDate, setTempDate] = useState<Date>(() => {
    if (value) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    return new Date();
  });

  // value prop이 변경되면 tempDate도 업데이트
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setTempDate(date);
      }
    }
  }, [value]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (!selectedDate) return;
    setTempDate(selectedDate);

    // 즉시 상위 상태 반영 (iOS/Android 공통)
    if (mode === "time") {
      const hours = selectedDate.getHours().toString().padStart(2, "0");
      const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
      onDateChange(`${hours}:${minutes}`);
    } else {
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const day = selectedDate.getDate().toString().padStart(2, "0");
      onDateChange(`${year}-${month}-${day}`);
    }
  };

  const handleConfirm = () => {
    setShowPicker(false);
    let formattedDate = "";
    if (mode === "time") {
      const hours = tempDate.getHours().toString().padStart(2, "0");
      const minutes = tempDate.getMinutes().toString().padStart(2, "0");
      formattedDate = `${hours}:${minutes}`;
    } else {
      const year = tempDate.getFullYear();
      const month = (tempDate.getMonth() + 1).toString().padStart(2, "0");
      const day = tempDate.getDate().toString().padStart(2, "0");
      formattedDate = `${year}-${month}-${day}`;
    }
    onDateChange(formattedDate);
  };

  const handleCancel = () => {
    setShowPicker(false);
    if (value) {
      const date = new Date(value);
      setTempDate(isNaN(date.getTime()) ? new Date() : date);
    } else {
      setTempDate(new Date());
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === "web" ? (
        <Pressable
          style={styles.webInput}
          onPress={() => {
            const input = document.createElement("input");
            input.type = mode === "time" ? "time" : "date";
            input.value = value;
            if (minDate && mode !== "time") input.min = minDate;
            if (maxDate && mode !== "time") input.max = maxDate;
            input.style.position = "absolute";
            input.style.left = "-9999px";
            document.body.appendChild(input);
            input.click();
            input.onchange = (e: any) => {
              onDateChange(e.target.value);
              document.body.removeChild(input);
            };
          }}
        >
          <Text style={[styles.webInputText, !value && styles.placeholderText]}>
            {value ? formatDate(value) : placeholder}
          </Text>
          <Ionicons
            name={mode === "time" ? "time-outline" : "calendar-outline"}
            size={20}
            color="#666"
          />
        </Pressable>
      ) : (
        <>
          <Pressable
            style={styles.dateButton}
            onPress={() => {
              if (value) {
                const date = new Date(value);
                setTempDate(isNaN(date.getTime()) ? new Date() : date);
              } else {
                setTempDate(new Date());
              }
              setShowPicker(true);
            }}
          >
            <Text style={[styles.dateText, !value && styles.placeholderText]}>
              {value ? formatDate(value) : placeholder}
            </Text>
            <Ionicons
              name={mode === "time" ? "time-outline" : "calendar-outline"}
              size={20}
              color="#666"
            />
          </Pressable>
          {showPicker && (
            <Modal
              visible={showPicker}
              transparent={true}
              animationType="slide"
              onRequestClose={handleCancel}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Pressable onPress={handleCancel}>
                      <Text style={styles.modalButton}>취소</Text>
                    </Pressable>
                    <Text style={styles.modalTitle}>
                      {mode === "time" ? "시간 선택" : "날짜 선택"}
                    </Text>
                    <Pressable onPress={handleConfirm}>
                      <Text style={[styles.modalButton, styles.modalConfirm]}>
                        완료
                      </Text>
                    </Pressable>
                  </View>
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={tempDate || new Date()}
                      mode={mode}
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={handleDateChange}
                      minimumDate={minDate ? new Date(minDate) : undefined}
                      maximumDate={maxDate ? new Date(maxDate) : undefined}
                      textColor="#000000"
                      style={styles.picker}
                      themeVariant="light"
                    />
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.background,
    width: "100%",
  },
  dateText: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
  },
  placeholderText: {
    color: Theme.colors.text.tertiary,
  },
  webInput: {
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
  webInputText: {
    fontSize: 16,
    color: "#333",
  },
  datePickerStyle: {
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  modalButton: {
    fontSize: 16,
    color: "#666",
  },
  modalConfirm: {
    color: Theme.colors.primary || "#3b82f6",
    fontWeight: "600",
  },
  pickerContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 20,
    minHeight: 216,
  },
  picker: {
    width: "100%",
    height: Platform.OS === "ios" ? 216 : 200,
    backgroundColor: "#fff",
  },
});
