import CommonHeader from "@/components/CommonHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import MultiStepScheduleModal from "@/components/MultiStepScheduleModal";
import { Theme } from "@/constants/Theme";
import { useTheme } from "@/contexts/ThemeContext";
import { getDatabase } from "@/database/platformDatabase";
import { Client, ClientContact, Schedule } from "@/models/types";
import { formatPhoneNumber } from "@/utils/bankUtils";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const STEPS = {
  BASIC_INFO: 1,
  DATE_TIME: 2,
  LOCATION: 3,
  CONTRACT: 4,
  WORKERS: 5,
  DOCUMENTS: 6,
  REVIEW: 7,
} as const;

export default function ClientDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const [client, setClient] = useState<Client | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    businessNumber: "",
    memo: "",
  });
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(
    null
  );
  const [contactData, setContactData] = useState({
    name: "",
    position: "",
    phone: "",
    memo: "",
    isPrimary: false,
  });
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    const loadClientData = async () => {
      try {
        const db = getDatabase();
        await db.init();

        // 거래처 정보 로드
        const clientData = await db.getClient(id as string);
        setClient(clientData);

        // 해당 거래처의 스케줄들 로드
        const allSchedules = await db.getAllSchedules();
        const clientSchedules = allSchedules.filter(
          (schedule) => schedule.clientId === id
        );
        setSchedules(clientSchedules);

        // 수정 데이터 초기화
        if (clientData) {
          setEditData({
            name: clientData.name || "",
            contactPerson: clientData.contactPerson || "",
            phone: clientData.phone || "",
            email: clientData.email || "",
            address: clientData.address || "",
            businessNumber: clientData.businessNumber || "",
            memo: clientData.memo || "",
          });
          setContacts(clientData.contacts || []);
        }
      } catch (error) {
        console.error("Failed to load client data:", error);
        Alert.alert("오류", "거래처 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadClientData();
    }
  }, [id]);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleSchedulePress = (scheduleId: string) => {
    router.push(`/schedule/${scheduleId}` as any);
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      // 변경사항이 있는지 확인
      const hasBasicInfoChanged =
        editData.name !== (client?.name || "") ||
        editData.contactPerson !== (client?.contactPerson || "") ||
        editData.phone !== (client?.phone || "") ||
        editData.email !== (client?.email || "") ||
        editData.address !== (client?.address || "") ||
        editData.businessNumber !== (client?.businessNumber || "") ||
        editData.memo !== (client?.memo || "");

      const hasContactsChanged =
        JSON.stringify(contacts) !== JSON.stringify(client?.contacts || []);

      if (!hasBasicInfoChanged && !hasContactsChanged) {
        Alert.alert("알림", "변경된 내용이 없습니다.");
        return;
      }

      const db = getDatabase();

      // 거래처 기본 정보와 담당자 정보를 함께 업데이트
      await db.updateClient(id as string, {
        ...editData,
        contacts: contacts,
      });

      // 클라이언트 정보 새로고침
      const updatedClient = await db.getClient(id as string);
      setClient(updatedClient);

      setShowEditModal(false);
      Alert.alert("성공", "거래처 정보가 수정되었습니다.");
    } catch (error) {
      console.error("Failed to update client:", error);
      Alert.alert("오류", "거래처 정보 수정에 실패했습니다.");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "거래처 삭제",
      "정말로 이 거래처를 삭제하시겠습니까?\n삭제된 거래처는 복구할 수 없습니다.",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              const db = getDatabase();
              await db.deleteClient(id as string);
              Alert.alert("성공", "거래처가 삭제되었습니다.", [
                {
                  text: "확인",
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              console.error("Failed to delete client:", error);
              Alert.alert("오류", "거래처 삭제에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setContactData({
      name: "",
      position: "",
      phone: "",
      memo: "",
      isPrimary: false,
    });
    setShowContactModal(true);
  };

  const handleEditContact = (contact: ClientContact) => {
    setEditingContact(contact);
    setContactData({
      name: contact.name,
      position: contact.position || "",
      phone: contact.phone,
      memo: contact.memo || "",
      isPrimary: contact.isPrimary || false,
    });
    setShowContactModal(true);
  };

  const handleSaveContact = async () => {
    if (!contactData.name.trim() || !contactData.phone.trim()) {
      Alert.alert("오류", "담당자명과 연락처는 필수입니다.");
      return;
    }

    const newContact: ClientContact = {
      id: editingContact?.id || Date.now().toString(),
      name: contactData.name.trim(),
      position: contactData.position.trim() || undefined,
      phone: contactData.phone.trim(),
      memo: contactData.memo.trim() || undefined,
      isPrimary: contactData.isPrimary,
    };

    let updatedContacts: ClientContact[];
    if (editingContact) {
      // 수정 - 변경사항이 있는지 확인
      const existingContact = contacts.find((c) => c.id === editingContact.id);
      if (
        existingContact &&
        existingContact.name === newContact.name &&
        existingContact.position === newContact.position &&
        existingContact.phone === newContact.phone &&
        existingContact.memo === newContact.memo &&
        existingContact.isPrimary === newContact.isPrimary
      ) {
        Alert.alert("알림", "변경된 내용이 없습니다.");
        return;
      }
      updatedContacts = contacts.map((c) =>
        c.id === editingContact.id ? newContact : c
      );
    } else {
      // 추가
      updatedContacts = [...contacts, newContact];
    }

    setContacts(updatedContacts);
    setShowContactModal(false);

    // TODO: 담당자 정보를 별도 테이블에 저장하는 기능 구현 필요
    // 현재는 로컬 상태로만 관리
  };

  const handleDeleteContact = (contactId: string) => {
    Alert.alert("담당자 삭제", "정말로 이 담당자를 삭제하시겠습니까?", [
      {
        text: "취소",
        style: "cancel",
      },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          const updatedContacts = contacts.filter((c) => c.id !== contactId);
          setContacts(updatedContacts);

          // TODO: 담당자 정보를 별도 테이블에서 삭제하는 기능 구현 필요
          // 현재는 로컬 상태로만 관리
        },
      },
    ]);
  };

  const getScheduleStatusColor = (schedule: Schedule) => {
    const today = dayjs();
    const startDate = dayjs(schedule.startDate);
    const endDate = dayjs(schedule.endDate);

    if (endDate.isBefore(today, "day")) {
      return "#10b981"; // 완료 - 초록색
    } else if (
      startDate.isSameOrBefore(today, "day") &&
      endDate.isSameOrAfter(today, "day")
    ) {
      return "#f59e0b"; // 진행중 - 주황색
    } else {
      return colors.primary; // 예정 - 파란색
    }
  };

  const getScheduleStatusText = (schedule: Schedule) => {
    const today = dayjs();
    const startDate = dayjs(schedule.startDate);
    const endDate = dayjs(schedule.endDate);

    if (endDate.isBefore(today, "day")) {
      return "완료";
    } else if (
      startDate.isSameOrBefore(today, "day") &&
      endDate.isSameOrAfter(today, "day")
    ) {
      return "진행중";
    } else {
      return "예정";
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="거래처 상세" />
        <LoadingSpinner message="거래처 정보를 불러오는 중..." />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.container}>
        <CommonHeader title="거래처 상세" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>거래처 정보를 찾을 수 없습니다.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <CommonHeader
        title="거래처 상세"
        rightButton={{
          icon: "create-outline",
          onPress: handleEdit,
        }}
      />

      <ScrollView style={styles.content}>
        {/* 거래처 기본 정보 */}
        <View style={styles.clientCard}>
          <View style={styles.clientHeader}>
            <Text style={styles.clientName}>{client.name}</Text>
            <View style={styles.clientBadge}>
              <Text style={styles.clientBadgeText}>거래처</Text>
            </View>
          </View>

          {/* 기본 정보 */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>기본 정보</Text>

            {/* 대표 연락처 */}
            <View style={styles.infoRow}>
              <Ionicons
                name="call-outline"
                size={20}
                color={Theme.colors.primary}
              />
              <Text style={styles.infoLabel}>대표 연락처</Text>
              <Pressable onPress={() => handleCall(client.phone)}>
                <Text style={styles.infoValue}>
                  {formatPhoneNumber(client.phone)}
                </Text>
              </Pressable>
            </View>

            {/* 이메일 */}
            {client.email && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={Theme.colors.primary}
                />
                <Text style={styles.infoLabel}>이메일</Text>
                <Pressable onPress={() => handleEmail(client.email!)}>
                  <Text style={styles.infoValue}>{client.email}</Text>
                </Pressable>
              </View>
            )}

            {/* 담당자 */}
            {client.contactPerson && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={Theme.colors.primary}
                />
                <Text style={styles.infoLabel}>담당자</Text>
                <Text style={styles.infoValue}>{client.contactPerson}</Text>
              </View>
            )}

            {/* 주소 */}
            {client.address && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={Theme.colors.primary}
                />
                <Text style={styles.infoLabel}>주소</Text>
                <Text style={styles.infoValue}>{client.address}</Text>
              </View>
            )}

            {/* 사업자등록번호 */}
            {client.businessNumber && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={Theme.colors.primary}
                />
                <Text style={styles.infoLabel}>사업자등록번호</Text>
                <Text style={styles.infoValue}>{client.businessNumber}</Text>
              </View>
            )}

            {/* 메모 */}
            {client.memo && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color={Theme.colors.primary}
                />
                <Text style={styles.infoLabel}>메모</Text>
                <Text style={styles.infoValue}>{client.memo}</Text>
              </View>
            )}
          </View>

          {/* 담당자 목록 */}
          <View style={styles.contactSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>담당자 목록</Text>
              <Pressable style={styles.addButton} onPress={handleAddContact}>
                <Ionicons name="add" size={20} color={Theme.colors.primary} />
                <Text style={styles.addButtonText}>담당자 추가</Text>
              </Pressable>
            </View>
            {contacts.length > 0 ? (
              contacts.map((contact, index) => (
                <View key={contact.id || index} style={styles.contactItem}>
                  <View style={styles.contactHeader}>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      {contact.isPrimary && (
                        <View style={styles.primaryBadge}>
                          <Text style={styles.primaryBadgeText}>대표</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.contactActions}>
                      <Pressable
                        style={styles.editButton}
                        onPress={() => handleEditContact(contact)}
                      >
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color={Theme.colors.primary}
                        />
                      </Pressable>
                      <Pressable
                        style={styles.contactDeleteButton}
                        onPress={() => handleDeleteContact(contact.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={Theme.colors.error}
                        />
                      </Pressable>
                    </View>
                  </View>
                  {contact.position && (
                    <Text style={styles.contactPosition}>
                      {contact.position}
                    </Text>
                  )}
                  <Pressable
                    style={styles.contactPhone}
                    onPress={() => handleCall(contact.phone)}
                  >
                    <Ionicons
                      name="call-outline"
                      size={16}
                      color={Theme.colors.primary}
                    />
                    <Text style={styles.contactPhoneText}>
                      {formatPhoneNumber(contact.phone)}
                    </Text>
                  </Pressable>
                  {contact.memo && (
                    <Text style={styles.contactMemo}>{contact.memo}</Text>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  등록된 담당자가 없습니다.
                </Text>
              </View>
            )}
          </View>

          {/* 수익 정보 */}
          <View style={styles.revenueSection}>
            <Text style={styles.sectionTitle}>수익 정보</Text>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>총 매출</Text>
              <Text style={styles.revenueValue}>
                {client.totalRevenue
                  ? `${client.totalRevenue.toLocaleString()}원`
                  : "0원"}
              </Text>
            </View>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>미수금</Text>
              <Text
                style={[
                  styles.revenueValue,
                  client.unpaidAmount && client.unpaidAmount > 0
                    ? { color: Theme.colors.error }
                    : {},
                ]}
              >
                {client.unpaidAmount
                  ? `${client.unpaidAmount.toLocaleString()}원`
                  : "0원"}
              </Text>
            </View>
          </View>
        </View>

        {/* 관련 스케줄 (행사) */}
        <View style={styles.schedulesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              관련 행사 ({schedules.length}개)
            </Text>
            <Pressable
              style={styles.addButton}
              onPress={() => {
                setShowScheduleModal(true);
              }}
            >
              <Ionicons name="add" size={20} color={Theme.colors.primary} />
              <Text style={styles.addButtonText}>행사 추가</Text>
            </Pressable>
          </View>
          {schedules.length > 0 ? (
            schedules.map((schedule) => (
              <Pressable
                key={schedule.id}
                style={styles.scheduleItem}
                onPress={() => handleSchedulePress(schedule.id)}
              >
                <View style={styles.scheduleHeader}>
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleTitle}>{schedule.title}</Text>
                    <View style={styles.scheduleStatus}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getScheduleStatusColor(schedule) },
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {getScheduleStatusText(schedule)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={Theme.colors.text.secondary}
                  />
                </View>
                <Text style={styles.scheduleDate}>
                  {dayjs(schedule.startDate).format("YYYY-MM-DD")} ~{" "}
                  {dayjs(schedule.endDate).format("YYYY-MM-DD")}
                </Text>
                {schedule.description && (
                  <Text style={styles.scheduleDescription}>
                    {schedule.description}
                  </Text>
                )}
                <View style={styles.scheduleFooter}>
                  <Text style={styles.scheduleCategory}>
                    {schedule.category}
                  </Text>
                  {schedule.location && (
                    <Text style={styles.scheduleLocation}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color={Theme.colors.text.secondary}
                      />
                      {schedule.location}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>등록된 행사가 없습니다.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 수정 모달 */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <CommonHeader
            title="거래처 수정"
            showBackButton={false}
            rightButton={{
              icon: "checkmark",
              onPress: handleSave,
            }}
          />
          <Pressable
            style={{
              position: "absolute",
              left: 16,
              top: 16,
              zIndex: 1,
              padding: 8,
            }}
            onPress={() => setShowEditModal(false)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>거래처명 *</Text>
              <TextInput
                style={styles.formInput}
                value={editData.name}
                onChangeText={(text) =>
                  setEditData({ ...editData, name: text })
                }
                placeholder="거래처명을 입력하세요"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>담당자</Text>
              <TextInput
                style={styles.formInput}
                value={editData.contactPerson}
                onChangeText={(text) =>
                  setEditData({ ...editData, contactPerson: text })
                }
                placeholder="담당자명을 입력하세요"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>대표 연락처 *</Text>
              <TextInput
                style={styles.formInput}
                value={editData.phone}
                onChangeText={(text) =>
                  setEditData({ ...editData, phone: text })
                }
                placeholder="연락처를 입력하세요"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>이메일</Text>
              <TextInput
                style={styles.formInput}
                value={editData.email}
                onChangeText={(text) =>
                  setEditData({ ...editData, email: text })
                }
                placeholder="이메일을 입력하세요"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>주소</Text>
              <TextInput
                style={styles.formInput}
                value={editData.address}
                onChangeText={(text) =>
                  setEditData({ ...editData, address: text })
                }
                placeholder="주소를 입력하세요"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>사업자등록번호</Text>
              <TextInput
                style={styles.formInput}
                value={editData.businessNumber}
                onChangeText={(text) =>
                  setEditData({ ...editData, businessNumber: text })
                }
                placeholder="사업자등록번호를 입력하세요"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>메모</Text>
              <TextInput
                style={[styles.formInput, styles.memoInput]}
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

          {/* 삭제 버튼 */}
          <View style={styles.deleteButtonContainer}>
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>거래처 삭제</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 담당자 수정 모달 */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={styles.modalContainer}>
          <CommonHeader
            title={editingContact ? "담당자 수정" : "담당자 추가"}
            showBackButton={false}
            compact={true}
            leftButton={{
              icon: "close",
              onPress: () => setShowContactModal(false),
            }}
            rightButton={{
              icon: "checkmark",
              onPress: handleSaveContact,
            }}
          />

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>담당자명 *</Text>
              <TextInput
                style={styles.formInput}
                value={contactData.name}
                onChangeText={(text) =>
                  setContactData({ ...contactData, name: text })
                }
                placeholder="담당자명을 입력하세요"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>직급/직책</Text>
              <TextInput
                style={styles.formInput}
                value={contactData.position}
                onChangeText={(text) =>
                  setContactData({ ...contactData, position: text })
                }
                placeholder="직급 또는 직책을 입력하세요"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>연락처 *</Text>
              <TextInput
                style={styles.formInput}
                value={contactData.phone}
                onChangeText={(text) =>
                  setContactData({ ...contactData, phone: text })
                }
                placeholder="연락처를 입력하세요"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>메모</Text>
              <TextInput
                style={[styles.formInput, styles.memoInput]}
                value={contactData.memo}
                onChangeText={(text) =>
                  setContactData({ ...contactData, memo: text })
                }
                placeholder="메모를 입력하세요"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formSection}>
              <Pressable
                style={[
                  styles.checkboxContainer,
                  contactData.isPrimary && styles.checkboxChecked,
                ]}
                onPress={() =>
                  setContactData({
                    ...contactData,
                    isPrimary: !contactData.isPrimary,
                  })
                }
              >
                <Ionicons
                  name={contactData.isPrimary ? "checkbox" : "square-outline"}
                  size={20}
                  color={
                    contactData.isPrimary
                      ? Theme.colors.primary
                      : Theme.colors.text.secondary
                  }
                />
                <Text style={styles.checkboxLabel}>대표 담당자로 설정</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* 행사 추가 모달 */}
      <MultiStepScheduleModal
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={async () => {
          setShowScheduleModal(false);
          // 스케줄 목록 새로고침
          const db = getDatabase();
          await db.init();
          const allSchedules = await db.getAllSchedules();
          const clientSchedules = allSchedules.filter(
            (schedule) => schedule.clientId === id
          );
          setSchedules(clientSchedules);
        }}
        initialStep={STEPS.CONTRACT}
        initialClientId={id as string}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: Theme.colors.text.secondary,
  },
  content: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  clientCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: 12,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    shadowColor: Theme.colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, // Apple Compact very subtle shadow
    shadowRadius: 4,
    elevation: 3,
  },
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.lg,
  },
  clientName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Theme.colors.text.primary,
    flex: 1,
  },
  clientBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clientBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  infoSection: {
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
    marginLeft: 8,
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: Theme.colors.text.primary,
    flex: 1,
  },
  contactSection: {
    marginBottom: Theme.spacing.lg,
  },
  contactItem: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 8,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.text.primary,
    flex: 1,
  },
  primaryBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  primaryBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  contactPosition: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
    marginBottom: 4,
  },
  contactPhone: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  contactPhoneText: {
    fontSize: 14,
    color: Theme.colors.primary,
    marginLeft: 4,
  },
  contactMemo: {
    fontSize: 12,
    color: Theme.colors.text.tertiary,
  },
  revenueSection: {
    marginBottom: Theme.spacing.lg,
  },
  revenueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  revenueLabel: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.text.primary,
  },
  schedulesSection: {
    marginBottom: Theme.spacing.lg,
  },
  scheduleItem: {
    backgroundColor: Theme.colors.card,
    borderRadius: 8,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    shadowColor: Theme.colors.text.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, // Apple Compact very subtle shadow
    shadowRadius: 2,
    elevation: 1,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.text.primary,
    flex: 1,
  },
  scheduleDate: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
    marginBottom: 4,
  },
  scheduleDescription: {
    fontSize: 12,
    color: Theme.colors.text.tertiary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  modalContent: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  formSection: {
    marginBottom: Theme.spacing.lg,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  formInput: {
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    borderRadius: 8,
    padding: Theme.spacing.md,
    fontSize: 16,
    color: Theme.colors.text.primary,
    backgroundColor: Theme.colors.surface,
  },
  memoInput: {
    height: 80,
    textAlignVertical: "top",
  },
  deleteButtonContainer: {
    padding: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
  },
  deleteButton: {
    backgroundColor: Theme.colors.error,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.md,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  addButtonText: {
    color: Theme.colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  contactInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  contactActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  contactDeleteButton: {
    padding: 8,
  },
  emptyState: {
    padding: Theme.spacing.lg,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: Theme.colors.text.secondary,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleStatus: {
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  scheduleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  scheduleCategory: {
    fontSize: 12,
    color: Theme.colors.text.secondary,
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  scheduleLocation: {
    fontSize: 12,
    color: Theme.colors.text.secondary,
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  checkboxChecked: {
    backgroundColor: Theme.colors.surface,
  },
  checkboxLabel: {
    fontSize: 16,
    color: Theme.colors.text.primary,
    marginLeft: 8,
  },
});
