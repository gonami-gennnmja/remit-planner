import { Theme } from "@/constants/Theme";
import { getDatabase } from "@/database/platformDatabase";
import { Schedule } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    category: "",
    address: "",
    memo: "",
  });
  const [isMultiDay, setIsMultiDay] = useState(false);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const db = getDatabase();
        await db.init();

        const scheduleData = await db.getSchedule(id as string);
        setSchedule(scheduleData);

        if (scheduleData) {
          setEditData({
            title: scheduleData.title,
            description: scheduleData.description || "",
            startDate: scheduleData.startDate,
            endDate: scheduleData.endDate,
            category: scheduleData.category || "",
            address: scheduleData.address || "",
            memo: scheduleData.memo || "",
          });
          setIsMultiDay(scheduleData.startDate !== scheduleData.endDate);
        }
      } catch (error) {
        console.error("Failed to load schedule:", error);
      }
    };

    if (id) {
      loadSchedule();
    }
  }, [id]);

  const handleEditSchedule = async () => {
    try {
      const db = getDatabase();
      await db.init();

      const updatedSchedule: Schedule = {
        ...schedule!,
        title: editData.title,
        description: editData.description,
        startDate: editData.startDate,
        endDate: isMultiDay ? editData.endDate : editData.startDate,
        category: editData.category,
        address: editData.address,
        memo: editData.memo,
        updatedAt: new Date().toISOString(),
      };

      await db.updateSchedule(id as string, updatedSchedule);
      setSchedule(updatedSchedule);
      setShowEditModal(false);

      Alert.alert("성공", "일정이 수정되었습니다.");
    } catch (error) {
      console.error("Failed to update schedule:", error);
      Alert.alert("오류", "일정 수정에 실패했습니다.");
    }
  };

  if (!schedule) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>
          로딩 중...
        </Text>
      </View>
    );
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case "education":
        return "교육";
      case "event":
        return "이벤트";
      case "meeting":
        return "회의";
      default:
        return "기타";
    }
  };

  const getWorkPeriods = (schedule: Schedule) => {
    const allPeriods = schedule.workers.flatMap((w) => w.periods);
    if (allPeriods.length === 0)
      return { start: "시간 미정", end: "시간 미정" };

    const startTimes = allPeriods
      .map((p) => dayjs(p.start))
      .sort((a, b) => a.diff(b));
    const endTimes = allPeriods
      .map((p) => dayjs(p.end))
      .sort((a, b) => b.diff(a));

    return {
      start: startTimes[0].format("HH:mm"),
      end: endTimes[0].format("HH:mm"),
    };
  };

  const periods = getWorkPeriods(schedule);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text style={styles.headerTitle}>스케줄 상세</Text>
        <Pressable
          style={styles.editButton}
          onPress={() => setShowEditModal(true)}
        >
          <Ionicons name="create-outline" size={24} color="white" />
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        {/* 스케줄 정보 */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleTitle}>{schedule.title}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {getCategoryText(schedule.category)}
              </Text>
            </View>
          </View>

          <Text style={styles.scheduleDate}>
            {dayjs(schedule.startDate).format("YYYY년 M월 D일")}
            {schedule.startDate !== schedule.endDate &&
              ` ~ ${dayjs(schedule.endDate).format("M월 D일")}`}
          </Text>

          {schedule.description && (
            <Text style={styles.description}>{schedule.description}</Text>
          )}

          {schedule.location && (
            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={Theme.colors.text.secondary}
              />
              <Text style={styles.infoText}>{schedule.location}</Text>
            </View>
          )}

          <View style={styles.timeRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color={Theme.colors.text.secondary}
            />
            <Text style={styles.timeText}>
              {periods.start} - {periods.end}
            </Text>
          </View>

          {schedule.memo && (
            <View style={styles.memoRow}>
              <Ionicons
                name="document-text-outline"
                size={16}
                color={Theme.colors.text.secondary}
              />
              <Text style={styles.memoText}>{schedule.memo}</Text>
            </View>
          )}
        </View>

        {/* 근로자 목록 */}
        <View style={styles.workersSection}>
          <Text style={styles.sectionTitle}>참여 근로자</Text>
          {schedule.workers.map((workerInfo, index) => (
            <View key={index} style={styles.workerCard}>
              <View style={styles.workerHeader}>
                <Text style={styles.workerName}>{workerInfo.worker.name}</Text>
                <View
                  style={[
                    styles.paidBadge,
                    {
                      backgroundColor: workerInfo.paid
                        ? Theme.colors.success
                        : Theme.colors.warning,
                    },
                  ]}
                >
                  <Text style={styles.paidText}>
                    {workerInfo.paid ? "지급완료" : "미지급"}
                  </Text>
                </View>
              </View>

              <View style={styles.workerDetails}>
                <Text style={styles.workerPhone}>
                  {workerInfo.worker.phone}
                </Text>
                <Text style={styles.workerWage}>
                  {new Intl.NumberFormat("ko-KR").format(
                    workerInfo.worker.hourlyWage
                  )}
                  원/시간
                </Text>
              </View>

              <View style={styles.periodsList}>
                {workerInfo.periods.map((period, periodIndex) => (
                  <View key={periodIndex} style={styles.periodItem}>
                    <Text style={styles.periodText}>
                      {dayjs(period.start).format("M월 D일 HH:mm")} -{" "}
                      {dayjs(period.end).format("HH:mm")}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 수정 모달 */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: Platform.OS === "web" ? "center" : "flex-end",
            alignItems: "center",
            padding: Platform.OS === "web" ? 20 : 0,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: Platform.OS === "web" ? 12 : 0,
              borderTopLeftRadius: Platform.OS === "web" ? 12 : 20,
              borderTopRightRadius: Platform.OS === "web" ? 12 : 20,
              width: "100%",
              maxWidth: Platform.OS === "web" ? 500 : "100%",
              maxHeight: Platform.OS === "web" ? "90%" : "85%",
              minHeight: Platform.OS === "web" ? "auto" : "60%",
              overflow: "hidden",
            }}
          >
            {/* 헤더 */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#e5e7eb",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}
              >
                일정 수정
              </Text>
              <Pressable
                onPress={() => setShowEditModal(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: "#f3f4f6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={20} color="#6b7280" />
              </Pressable>
            </View>

            {/* 스크롤 가능한 콘텐츠 */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
              showsVerticalScrollIndicator={true}
            >
              {/* 제목 */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                >
                  제목 *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 16,
                  }}
                  value={editData.title}
                  onChangeText={(text) =>
                    setEditData({ ...editData, title: text })
                  }
                  placeholder="일정 제목을 입력하세요"
                />
              </View>

              {/* 설명 */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                >
                  설명
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 16,
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                  value={editData.description}
                  onChangeText={(text) =>
                    setEditData({ ...editData, description: text })
                  }
                  placeholder="일정 설명을 입력하세요"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* 날짜 및 시간 */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, marginBottom: 8, color: "#374151" }}
                >
                  날짜 및 시간
                </Text>

                {/* 여러 날에 걸친 일정 체크박스 */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <Pressable
                    onPress={() => setIsMultiDay(!isMultiDay)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginRight: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: isMultiDay ? "#2563eb" : "#d1d5db",
                        backgroundColor: isMultiDay ? "#2563eb" : "white",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 8,
                      }}
                    >
                      {isMultiDay && (
                        <Ionicons name="checkmark" size={12} color="white" />
                      )}
                    </View>
                    <Text style={{ fontSize: 14, color: "#374151" }}>
                      여러 날에 걸친 일정
                    </Text>
                  </Pressable>
                </View>

                {/* 시작일 */}
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{ fontSize: 12, marginBottom: 4, color: "#6b7280" }}
                  >
                    시작일 *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#d1d5db",
                      borderRadius: 6,
                      padding: 12,
                      fontSize: 14,
                    }}
                    value={editData.startDate}
                    onChangeText={(text) =>
                      setEditData({ ...editData, startDate: text })
                    }
                    placeholder="YYYY-MM-DD"
                  />
                </View>

                {/* 종료일 (여러 날에 걸친 일정일 때만) */}
                {isMultiDay && (
                  <View style={{ marginBottom: 12 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        marginBottom: 4,
                        color: "#6b7280",
                      }}
                    >
                      종료일 *
                    </Text>
                    <TextInput
                      style={{
                        borderWidth: 1,
                        borderColor: "#d1d5db",
                        borderRadius: 6,
                        padding: 12,
                        fontSize: 14,
                      }}
                      value={editData.endDate}
                      onChangeText={(text) =>
                        setEditData({ ...editData, endDate: text })
                      }
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                )}
              </View>

              {/* 카테고리 */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                >
                  카테고리
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 16,
                  }}
                  value={editData.category}
                  onChangeText={(text) =>
                    setEditData({ ...editData, category: text })
                  }
                  placeholder="카테고리를 입력하세요"
                />
              </View>

              {/* 주소 */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                >
                  주소
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 16,
                  }}
                  value={editData.address}
                  onChangeText={(text) =>
                    setEditData({ ...editData, address: text })
                  }
                  placeholder="주소를 입력하세요"
                />
              </View>

              {/* 메모 */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                >
                  메모
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 16,
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                  value={editData.memo}
                  onChangeText={(text) =>
                    setEditData({ ...editData, memo: text })
                  }
                  placeholder="메모를 입력하세요"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* 하단 버튼들 */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderTopWidth: 1,
                borderTopColor: "#e5e7eb",
                flexDirection: "row",
                gap: 12,
                backgroundColor: "white",
              }}
            >
              <Pressable
                onPress={() => setShowEditModal(false)}
                style={{
                  backgroundColor: "#6b7280",
                  paddingVertical: 12,
                  borderRadius: 6,
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  취소
                </Text>
              </Pressable>
              <Pressable
                onPress={handleEditSchedule}
                style={{
                  backgroundColor: "#10b981",
                  paddingVertical: 12,
                  borderRadius: 6,
                  flex: 1,
                }}
              >
                <Text
                  style={{
                    color: "white",
                    textAlign: "center",
                    fontWeight: "600",
                  }}
                >
                  수정
                </Text>
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
  header: {
    backgroundColor: "#1e40af",
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
  placeholder: {
    width: 40,
  },
  editButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: Theme.spacing.xl,
  },
  scheduleCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  scheduleTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  categoryText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    fontWeight: Theme.typography.weights.medium,
  },
  scheduleDate: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  description: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.md,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  infoText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  timeText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    marginLeft: Theme.spacing.sm,
    fontWeight: Theme.typography.weights.medium,
  },
  memoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  memoText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginLeft: Theme.spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  workersSection: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  workerCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  workerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  workerName: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
  },
  paidBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  paidText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.inverse,
    fontWeight: Theme.typography.weights.medium,
  },
  workerDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  workerPhone: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  workerWage: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  periodsList: {
    gap: Theme.spacing.xs,
  },
  periodItem: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
  },
  periodText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
});
