import { Text } from "@/components/Themed";
import { Theme } from "@/constants/Theme";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

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
    if (mode === "time") {
      return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("ko-KR");
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      let formattedDate = "";
      if (mode === "time") {
        const hours = selectedDate.getHours().toString().padStart(2, "0");
        const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
        formattedDate = `${hours}:${minutes}`;
      } else {
        const year = selectedDate.getFullYear();
        const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
        const day = selectedDate.getDate().toString().padStart(2, "0");
        formattedDate = `${year}-${month}-${day}`;
      }
      onDateChange(formattedDate);
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
            onPress={() => setShowPicker(true)}
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
            <DateTimePicker
              value={value ? new Date(value) : new Date()}
              mode={mode}
              display="default"
              onChange={handleDateChange}
              minimumDate={minDate ? new Date(minDate) : undefined}
              maximumDate={maxDate ? new Date(maxDate) : undefined}
            />
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
  placeholderText: {
    color: "#9ca3af",
  },
  datePickerStyle: {
    width: "100%",
  },
});
