import { Text } from "@/components/Themed";
import { Theme } from "@/constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Calendar } from "react-native-calendars";

interface DatePickerProps {
  label: string;
  value: string;
  onDateChange: (date: string) => void;
  placeholder?: string;
}

export default function DatePicker({
  label,
  value,
  onDateChange,
  placeholder = "날짜를 선택하세요",
}: DatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return placeholder;
    return dayjs(dateString).format("YYYY년 M월 D일");
  };

  const handleDateSelect = (day: any) => {
    onDateChange(day.dateString);
    setShowCalendar(false);
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <Pressable
          style={styles.dateButton}
          onPress={() => setShowCalendar(!showCalendar)}
        >
          <Text style={[styles.dateText, !value && styles.placeholderText]}>
            {formatDate(value)}
          </Text>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={Theme.colors.text.secondary}
          />
        </Pressable>
      </View>

      {showCalendar && (
        <Modal
          visible={showCalendar}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCalendar(false)}
        >
          <Pressable
            style={styles.overlay}
            onPress={() => setShowCalendar(false)}
          >
            <View style={styles.calendarModal}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                <Calendar
                  onDayPress={handleDateSelect}
                  markedDates={{
                    [value]: {
                      selected: true,
                      selectedColor: Theme.colors.primary,
                    },
                  }}
                  theme={{
                    selectedDayBackgroundColor: Theme.colors.primary,
                    todayTextColor: Theme.colors.primary,
                    arrowColor: Theme.colors.primary,
                    calendarBackground: Theme.colors.background,
                    textSectionTitleColor: Theme.colors.text.primary,
                    dayTextColor: Theme.colors.text.primary,
                    monthTextColor: Theme.colors.text.primary,
                    textDisabledColor: Theme.colors.text.tertiary,
                    textDayFontSize: 14,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 12,
                    agendaDayTextColor: Theme.colors.text.primary,
                    agendaDayNumColor: Theme.colors.text.primary,
                    agendaTodayColor: Theme.colors.primary,
                  }}
                  style={styles.calendar}
                  hideExtraDays={true}
                  firstDay={1}
                  showWeekNumbers={false}
                  disableMonthChange={false}
                  enableSwipeMonths={true}
                />
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
    </>
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
  },
  dateText: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
  },
  placeholderText: {
    color: Theme.colors.text.tertiary,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarModal: {
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginHorizontal: Theme.spacing.xl,
    ...Theme.shadows.lg,
    maxWidth: 400,
    width: "90%",
  },
  calendar: {
    borderRadius: Theme.borderRadius.md,
  },
});
