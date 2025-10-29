import CommonHeader from "@/components/CommonHeader";
import MultiStepScheduleModal from "@/components/MultiStepScheduleModal";
import PlannerCalendar from "@/components/PlannerCalendar";
import { useResponsive } from "@/hooks/useResponsive";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

export default function ScheduleScreen() {
  const { screenData, isMobile, isTablet, isDesktop, getResponsiveValue } =
    useResponsive();
  const { filter } = useLocalSearchParams<{ filter?: string }>();
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
      <CommonHeader
        title={filter === "upcoming" ? "예정 일정" : "스케줄 관리"}
        rightButton={{
          icon: "add",
          onPress: handleAddSchedule,
        }}
      />

      {/* 캘린더 컴포넌트 */}
      <View style={styles.content}>
        <PlannerCalendar
          key={refreshKey}
          onAddSchedulePress={handleAddSchedulePress}
          filter={filter}
        />
      </View>

      {/* 스케줄 추가 모달 (멀티 스텝) */}
      <MultiStepScheduleModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveSchedule}
        initialStartDate={initialStartDate}
        initialEndDate={initialEndDate}
        initialIsMultiDay={initialIsMultiDay}
        modalType={"bottomSheet"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7", // Apple Compact soft gray background
  },
  content: {
    flex: 1,
  },
});
