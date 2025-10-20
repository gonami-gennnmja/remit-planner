import PlannerCalendar from "@/components/PlannerCalendar";
import ScheduleAddModal from "@/components/ScheduleAddModal";
import { useResponsive } from "@/hooks/useResponsive";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ScheduleScreen() {
  const { screenData, isMobile, isTablet, isDesktop, getResponsiveValue } =
    useResponsive();
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialStartDate, setInitialStartDate] = useState<string>();
  const [initialEndDate, setInitialEndDate] = useState<string>();
  const [initialIsMultiDay, setInitialIsMultiDay] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddSchedule = () => {
    setInitialStartDate(undefined);
    setInitialEndDate(undefined);
    setInitialIsMultiDay(false);
    setShowAddModal(true);
  };

  const handleAddSchedulePress = (startDate?: string, endDate?: string) => {
    if (startDate && endDate && startDate !== endDate) {
      // 범위 선택 모드에서 여러 날 선택된 경우
      setInitialStartDate(startDate);
      setInitialEndDate(endDate);
      setInitialIsMultiDay(true);
    } else if (startDate) {
      // 단일 날짜 선택된 경우
      setInitialStartDate(startDate);
      setInitialEndDate(startDate);
      setInitialIsMultiDay(false);
    }
    setShowAddModal(true);
  };

  const handleSaveSchedule = () => {
    setRefreshKey((prev) => prev + 1);
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
        <PlannerCalendar
          key={refreshKey}
          onAddSchedulePress={handleAddSchedulePress}
        />
      </View>

      {/* 스케줄 추가 모달 */}
      <ScheduleAddModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveSchedule}
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
        initialIsMultiDay={initialIsMultiDay}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#6366f1",
    padding: 20,
    paddingTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
});
