import CommonHeader from "@/components/CommonHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Theme } from "@/constants/Theme";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import { Client, Schedule } from "@/models/types";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
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

export default function ScheduleDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    category: "",
    location: "",
    address: "",
    uniformTime: true,
    scheduleTimes: [] as Array<{
      workDate: string;
      startTime: string;
      endTime: string;
      breakDuration: number;
    }>,
    documentsFolderPath: "",
    hasAttachments: false,
    clientId: "",
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
            location: scheduleData.location || "",
            address: scheduleData.address || "",
            uniformTime: scheduleData.uniformTime ?? true,
            scheduleTimes: scheduleData.scheduleTimes || [],
            documentsFolderPath: scheduleData.documentsFolderPath || "",
            hasAttachments: scheduleData.hasAttachments || false,
            clientId: scheduleData.clientId || "",
            memo: scheduleData.memo || "",
          });
          setIsMultiDay(scheduleData.startDate !== scheduleData.endDate);
        }
      } catch (error) {
        console.error("Failed to load schedule:", error);
      }
    };

    const loadClients = async () => {
      try {
        const db = getDatabase();
        const clientsData = await db.getAllClients();
        setClients(clientsData);
      } catch (error) {
        console.error("Failed to load clients:", error);
      }
    };

    if (id) {
      loadSchedule();
      loadClients();
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
        clientId: editData.clientId || undefined,
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
        <LoadingSpinner message="일정 정보를 불러오는 중..." />
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
    const allPeriods = schedule.workers?.flatMap((w) => w.periods || []) || [];
    if (allPeriods.length === 0)
      return { start: "시간 미정", end: "시간 미정" };

    const startTimes = allPeriods
      .filter((p) => p && p.start) // null/undefined 체크
      .map((p) => dayjs(p.start))
      .sort((a, b) => a.diff(b));
    const endTimes = allPeriods
      .filter((p) => p && p.end) // null/undefined 체크
      .map((p) => dayjs(p.end))
      .sort((a, b) => b.diff(a));

    return {
      start: startTimes[0]?.format("HH:mm") || "시간 미정",
      end: endTimes[0]?.format("HH:mm") || "시간 미정",
    };
  };

  const periods = getWorkPeriods(schedule);

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <CommonHeader
        title="스케줄 상세"
        leftButton={{
          icon: "arrow-back",
          onPress: () => router.back(),
        }}
        rightButton={{
          icon: "create-outline",
          onPress: () => setShowEditModal(true),
        }}
      />

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

          {schedule.clientId && (
            <View style={styles.infoRow}>
              <Ionicons
                name="business-outline"
                size={16}
                color={Theme.colors.text.secondary}
              />
              <Text style={styles.infoText}>
                거래처:{" "}
                {clients.find((c) => c.id === schedule.clientId)?.name ||
                  "알 수 없음"}
              </Text>
            </View>
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

          {schedule.address && (
            <View style={styles.infoRow}>
              <Ionicons
                name="map-outline"
                size={16}
                color={Theme.colors.text.secondary}
              />
              <Text style={styles.infoText}>{schedule.address}</Text>
            </View>
          )}

          {/* 첨부파일 여부 */}
          {schedule.hasAttachments && (
            <View style={styles.infoRow}>
              <Ionicons
                name="attach-outline"
                size={16}
                color={Theme.colors.primary}
              />
              <Text style={[styles.infoText, { color: Theme.colors.primary }]}>
                첨부파일 있음
              </Text>
            </View>
          )}

          {/* 일별 시간 설정 여부 */}
          {!schedule.uniformTime && (
            <View style={styles.infoRow}>
              <Ionicons
                name="time-outline"
                size={16}
                color={Theme.colors.text.secondary}
              />
              <Text style={styles.infoText}>일별 시간 설정됨</Text>
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
          {schedule.workers?.map((workerInfo, index) => (
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
                {(workerInfo.periods || []).map((period, periodIndex) => (
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

              {/* 거래처 선택 */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, marginBottom: 4, color: "#374151" }}
                >
                  거래처
                </Text>
                <Pressable
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 6,
                    padding: 12,
                    backgroundColor: "#f9fafb",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onPress={() => setShowClientModal(true)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <Ionicons
                      name="business-outline"
                      size={20}
                      color="#6b7280"
                    />
                    <Text
                      style={{
                        marginLeft: 8,
                        fontSize: 16,
                        color: editData.clientId ? "#374151" : "#9ca3af",
                        flex: 1,
                      }}
                    >
                      {editData.clientId
                        ? clients.find((c) => c.id === editData.clientId)
                            ?.name || "알 수 없음"
                        : "거래처를 선택하세요"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                </Pressable>
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

      {/* 거래처 선택 모달 */}
      <Modal
        visible={showClientModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClientModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          {/* 헤더 */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
            }}
          >
            <Pressable
              style={{ padding: 8 }}
              onPress={() => setShowClientModal(false)}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}>
              거래처 선택
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* 검색 */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: "#f5f5f5",
            }}
          >
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 16,
                paddingVertical: 8,
              }}
              placeholder="거래처명으로 검색"
              value={clientSearchQuery}
              onChangeText={setClientSearchQuery}
            />
            {clientSearchQuery.length > 0 && (
              <Pressable onPress={() => setClientSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </Pressable>
            )}
          </View>

          {/* 거래처 목록 */}
          <ScrollView style={{ flex: 1 }}>
            {/* 거래처 없음 옵션 */}
            <Pressable
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 16,
                margin: 16,
                marginBottom: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                borderWidth: editData.clientId === "" ? 2 : 0,
                borderColor:
                  editData.clientId === "" ? colors.primary : "transparent",
              }}
              onPress={() => {
                setEditData({ ...editData, clientId: "" });
                setShowClientModal(false);
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={20}
                    color="#6b7280"
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      marginLeft: 8,
                      color: "#374151",
                    }}
                  >
                    거래처 없음
                  </Text>
                </View>
                {editData.clientId === "" && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </View>
            </Pressable>

            {/* 거래처 목록 */}
            {clients
              .filter(
                (client) =>
                  client.name
                    .toLowerCase()
                    .includes(clientSearchQuery.toLowerCase()) ||
                  (client.contactPerson &&
                    client.contactPerson
                      .toLowerCase()
                      .includes(clientSearchQuery.toLowerCase()))
              )
              .map((client) => (
                <Pressable
                  key={client.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    padding: 16,
                    marginHorizontal: 16,
                    marginBottom: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    borderWidth: editData.clientId === client.id ? 2 : 0,
                    borderColor:
                      editData.clientId === client.id
                        ? colors.primary
                        : "transparent",
                  }}
                  onPress={() => {
                    setEditData({ ...editData, clientId: client.id });
                    setShowClientModal(false);
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Ionicons name="business" size={20} color="#007AFF" />
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            marginLeft: 8,
                          }}
                        >
                          {client.name || "이름 없음"}
                        </Text>
                      </View>

                      {/* 담당자 정보 */}
                      {client.contactPerson && (
                        <View style={{ marginBottom: 8 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 4,
                            }}
                          >
                            <Ionicons name="person" size={16} color="#666" />
                            <Text
                              style={{
                                fontSize: 14,
                                color: "#666",
                                marginLeft: 6,
                              }}
                            >
                              담당자: {client.contactPerson}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* 연락처 */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Ionicons name="call" size={16} color="#666" />
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#666",
                            marginLeft: 6,
                          }}
                        >
                          {client.phone}
                        </Text>
                      </View>
                    </View>
                    {editData.clientId === client.id && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </View>
                </Pressable>
              ))}

            {clients.filter(
              (client) =>
                client.name
                  .toLowerCase()
                  .includes(clientSearchQuery.toLowerCase()) ||
                (client.contactPerson &&
                  client.contactPerson
                    .toLowerCase()
                    .includes(clientSearchQuery.toLowerCase()))
            ).length === 0 && (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  padding: 32,
                }}
              >
                <Ionicons name="business-outline" size={64} color="#ccc" />
                <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>
                  {clientSearchQuery
                    ? "검색 결과가 없습니다"
                    : "등록된 거래처가 없습니다"}
                </Text>
              </View>
            )}
          </ScrollView>
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
