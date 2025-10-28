import { Text } from "@/components/Themed";
import { Theme } from "@/constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import React, { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";

export type PeriodType = "week" | "month" | "year" | "custom";

interface PeriodSelectorProps {
  selectedPeriod: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  showCustomRange?: boolean;
}

export default function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  showCustomRange = true,
}: PeriodSelectorProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [dateError, setDateError] = useState<string>("");

  // 날짜 유효성 검사
  const validateDates = (start: string, end: string): string => {
    if (!start || !end) return "";

    const startDate = dayjs(start);
    const endDate = dayjs(end);
    const today = dayjs();

    // 시작일이 종료일보다 과거인지 확인
    if (startDate.isAfter(endDate)) {
      return "시작일은 종료일보다 과거여야 합니다.";
    }

    // 5년 이상 차이나는지 확인
    if (endDate.diff(startDate, "year") >= 5) {
      return "기간은 5년을 초과할 수 없습니다.";
    }

    // 미래 날짜인지 확인
    if (startDate.isAfter(today) || endDate.isAfter(today)) {
      return "미래 날짜는 선택할 수 없습니다.";
    }

    return "";
  };

  // 검색 실행
  const handleSearch = () => {
    if (!startDate || !endDate) {
      setDateError("시작일과 종료일을 모두 선택해주세요.");
      return;
    }

    const error = validateDates(startDate, endDate);
    if (error) {
      setDateError(error);
      return;
    }

    setDateError("");
    // 검색 실행 (부모 컴포넌트에서 처리)
    onPeriodChange("custom");
  };

  const getPeriodStats = () => {
    const today = dayjs();
    switch (selectedPeriod) {
      case "week":
        return {
          start: today.startOf("week").format("YYYY-MM-DD"),
          end: today.endOf("week").format("YYYY-MM-DD"),
          label: "이번 주",
        };
      case "month":
        return {
          start: today.startOf("month").format("YYYY-MM-DD"),
          end: today.endOf("month").format("YYYY-MM-DD"),
          label: "이번 달",
        };
      case "year":
        return {
          start: today.startOf("year").format("YYYY-MM-DD"),
          end: today.endOf("year").format("YYYY-MM-DD"),
          label: "올해",
        };
      case "custom":
        return {
          start: startDate || today.format("YYYY-MM-DD"),
          end: endDate || today.format("YYYY-MM-DD"),
          label: "사용자 지정",
        };
      default:
        return {
          start: today.format("YYYY-MM-DD"),
          end: today.format("YYYY-MM-DD"),
          label: "오늘",
        };
    }
  };

  const periodStats = getPeriodStats();

  return (
    <View style={styles.container}>
      {/* 기간 선택 버튼들 */}
      <View style={styles.periodSelector}>
        <Pressable
          style={[
            styles.periodButton,
            selectedPeriod === "week" && styles.periodButtonActive,
          ]}
          onPress={() => onPeriodChange("week")}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === "week" && styles.periodButtonTextActive,
            ]}
          >
            주간
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.periodButton,
            selectedPeriod === "month" && styles.periodButtonActive,
          ]}
          onPress={() => onPeriodChange("month")}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === "month" && styles.periodButtonTextActive,
            ]}
          >
            월간
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.periodButton,
            selectedPeriod === "year" && styles.periodButtonActive,
          ]}
          onPress={() => onPeriodChange("year")}
        >
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === "year" && styles.periodButtonTextActive,
            ]}
          >
            연간
          </Text>
        </Pressable>
        {showCustomRange && (
          <Pressable
            style={[
              styles.periodButton,
              selectedPeriod === "custom" && styles.periodButtonActive,
            ]}
            onPress={() => onPeriodChange("custom")}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === "custom" && styles.periodButtonTextActive,
              ]}
            >
              기간
            </Text>
          </Pressable>
        )}
      </View>

      {/* 선택된 기간 정보 */}
      <View style={styles.periodInfo}>
        <View style={styles.periodInfoRow}>
          <Ionicons name="calendar-outline" size={16} color="#86868b" />
          <Text style={styles.periodInfoText}>
            {periodStats.label}: {dayjs(periodStats.start).format("YYYY.MM.DD")}{" "}
            - {dayjs(periodStats.end).format("YYYY.MM.DD")}
          </Text>
        </View>
      </View>

      {/* 사용자 지정 기간 선택 */}
      {selectedPeriod === "custom" && (
        <View style={styles.customDateContainer}>
          <Text style={styles.customDateTitle}>기간 선택</Text>
          <View style={styles.dateRangeContainer}>
            <Pressable
              style={styles.dateRangeInput}
              onPress={() => {
                if (Platform.OS === "web") {
                  const input = document.createElement("input");
                  input.type = "date";
                  input.value = startDate || "";
                  if (endDate) input.max = endDate;
                  input.style.position = "absolute";
                  input.style.left = "-9999px";
                  document.body.appendChild(input);
                  input.click();
                  input.onchange = (e: any) => {
                    onStartDateChange?.(e.target.value);
                    document.body.removeChild(input);
                  };
                } else {
                  setTempStartDate(
                    startDate ? new Date(startDate) : new Date()
                  );
                  setShowStartPicker(true);
                }
              }}
            >
              <Text
                style={[
                  styles.dateRangeText,
                  !startDate && styles.placeholderText,
                ]}
              >
                {startDate
                  ? dayjs(startDate).format("YYYY.MM.DD")
                  : "시작일 선택"}
              </Text>
              <Ionicons name="calendar-outline" size={16} color="#666" />
            </Pressable>

            <Text style={styles.dateRangeSeparator}>~</Text>

            <Pressable
              style={styles.dateRangeInput}
              onPress={() => {
                if (Platform.OS === "web") {
                  const input = document.createElement("input");
                  input.type = "date";
                  input.value = endDate || "";
                  if (startDate) input.min = startDate;
                  input.style.position = "absolute";
                  input.style.left = "-9999px";
                  document.body.appendChild(input);
                  input.click();
                  input.onchange = (e: any) => {
                    onEndDateChange?.(e.target.value);
                    document.body.removeChild(input);
                  };
                } else {
                  setTempEndDate(endDate ? new Date(endDate) : new Date());
                  setShowEndPicker(true);
                }
              }}
            >
              <Text
                style={[
                  styles.dateRangeText,
                  !endDate && styles.placeholderText,
                ]}
              >
                {endDate ? dayjs(endDate).format("YYYY.MM.DD") : "종료일 선택"}
              </Text>
              <Ionicons name="calendar-outline" size={16} color="#666" />
            </Pressable>
          </View>

          {/* 에러 메시지 */}
          {dateError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={16} color={Theme.colors.error} />
              <Text style={styles.errorText}>{dateError}</Text>
            </View>
          ) : null}

          {/* 검색 버튼 */}
          <Pressable
            style={[
              styles.searchButton,
              (!startDate || !endDate || dateError) &&
                styles.searchButtonDisabled,
            ]}
            onPress={handleSearch}
            disabled={!startDate || !endDate || !!dateError}
          >
            <Ionicons
              name="search"
              size={20}
              color={
                !startDate || !endDate || dateError
                  ? Theme.colors.text.tertiary
                  : "white"
              }
            />
            <Text
              style={[
                styles.searchButtonText,
                (!startDate || !endDate || dateError) &&
                  styles.searchButtonTextDisabled,
              ]}
            >
              검색
            </Text>
          </Pressable>
        </View>
      )}

      {/* 시작일 선택 모달 */}
      <Modal
        visible={showStartPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStartPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>시작일 선택</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowStartPicker(false)}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={Theme.colors.text.primary}
                />
              </Pressable>
            </View>
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={tempStartDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setTempStartDate(selectedDate);
                  }
                }}
                style={styles.datePicker}
              />
            </View>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowStartPicker(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  if (tempStartDate) {
                    const formattedDate =
                      dayjs(tempStartDate).format("YYYY-MM-DD");
                    onStartDateChange?.(formattedDate);

                    // 종료일이 있으면 유효성 검사
                    if (endDate) {
                      const error = validateDates(formattedDate, endDate);
                      setDateError(error);
                    }
                  }
                  setShowStartPicker(false);
                }}
              >
                <Text style={styles.confirmButtonText}>확인</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 종료일 선택 모달 */}
      <Modal
        visible={showEndPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEndPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>종료일 선택</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowEndPicker(false)}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={Theme.colors.text.primary}
                />
              </Pressable>
            </View>
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={tempEndDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setTempEndDate(selectedDate);
                  }
                }}
                style={styles.datePicker}
              />
            </View>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEndPicker(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  if (tempEndDate) {
                    const formattedDate =
                      dayjs(tempEndDate).format("YYYY-MM-DD");
                    onEndDateChange?.(formattedDate);

                    // 시작일이 있으면 유효성 검사
                    if (startDate) {
                      const error = validateDates(startDate, formattedDate);
                      setDateError(error);
                    }
                  }
                  setShowEndPicker(false);
                }}
              >
                <Text style={styles.confirmButtonText}>확인</Text>
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  periodButtonActive: {
    backgroundColor: "#1d1d1f",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#86868b",
  },
  periodButtonTextActive: {
    color: "white",
  },
  periodInfo: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  periodInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  periodInfoText: {
    fontSize: 14,
    color: "#1d1d1f",
    fontWeight: "500",
  },
  customDateContainer: {
    marginTop: Theme.spacing.md,
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
  customDateTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  dateRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
  },
  dateRangeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.background,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateRangeText: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
    flex: 1,
  },
  dateRangeSeparator: {
    fontSize: Theme.typography.sizes.lg,
    color: Theme.colors.text.secondary,
    fontWeight: Theme.typography.weights.bold,
    marginHorizontal: Theme.spacing.xs,
  },
  placeholderText: {
    color: Theme.colors.text.tertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : Theme.spacing.lg, // iPhone 홈 인디케이터 공간
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  modalTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
  },
  modalCloseButton: {
    padding: Theme.spacing.sm,
  },
  pickerContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
  },
  datePicker: {
    height: Platform.OS === "ios" ? 200 : 150,
  },
  modalButtons: {
    flexDirection: "row",
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
  },
  confirmButton: {
    backgroundColor: Theme.colors.primary,
  },
  cancelButtonText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.primary,
  },
  confirmButtonText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
    color: "white",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    gap: Theme.spacing.xs,
  },
  errorText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.error,
    flex: 1,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    marginTop: Theme.spacing.md,
    gap: Theme.spacing.sm,
  },
  searchButtonDisabled: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
  },
  searchButtonText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: "white",
  },
  searchButtonTextDisabled: {
    color: Theme.colors.text.tertiary,
  },
});
