import { Theme } from "@/constants/Theme";
import { getDatabase } from "@/database/platformDatabase";
import { Client, ClientContact } from "@/models/types";
import { formatPhoneNumber } from "@/utils/bankUtils";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientForm, setClientForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    businessNumber: "",
    memo: "",
  });

  // 담당자 관리
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [currentContact, setCurrentContact] = useState({
    name: "",
    position: "",
    phone: "",
    memo: "",
    isPrimary: false,
  });

  // 수정 모드
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      await db.init();

      const allClients = await db.getAllClients();
      setClients(allClients);
    } catch (error) {
      console.error("Failed to load clients:", error);
      Alert.alert("오류", "거래처를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contacts?.some(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone.includes(searchQuery)
      ) ||
      client.phone.includes(searchQuery)
  );

  const handleAddContact = () => {
    if (!currentContact.name || !currentContact.phone) {
      Alert.alert("오류", "담당자명과 연락처는 필수입니다.");
      return;
    }

    let updatedContacts = [...contacts];

    // 대표 담당자로 지정하면 기존 대표를 해제
    if (currentContact.isPrimary) {
      updatedContacts = updatedContacts.map((c) => ({
        ...c,
        isPrimary: false,
      }));
    }

    const newContact: ClientContact = {
      id: `contact-${Date.now()}`,
      name: currentContact.name,
      position: currentContact.position,
      phone: currentContact.phone,
      memo: currentContact.memo,
      isPrimary: currentContact.isPrimary,
    };

    setContacts([...updatedContacts, newContact]);
    setCurrentContact({
      name: "",
      position: "",
      phone: "",
      memo: "",
      isPrimary: false,
    });
  };

  const handleTogglePrimaryContact = (contactId: string) => {
    setContacts(
      contacts.map((c) => ({
        ...c,
        isPrimary: c.id === contactId,
      }))
    );
  };

  const handleRemoveContact = (contactId: string) => {
    setContacts(contacts.filter((c) => c.id !== contactId));
  };

  const handleAddClient = async () => {
    if (!clientForm.name || !clientForm.phone) {
      Alert.alert("오류", "거래처명과 대표 연락처는 필수입니다.");
      return;
    }

    try {
      const db = getDatabase();

      if (isEditMode && editingClientId) {
        // 수정 모드
        await db.updateClient(editingClientId, {
          name: clientForm.name,
          contacts: contacts,
          phone: clientForm.phone,
          email: clientForm.email,
          address: clientForm.address,
          businessNumber: clientForm.businessNumber,
          memo: clientForm.memo,
        });

        await loadClients();
        Alert.alert("성공", "거래처가 수정되었습니다.");
      } else {
        // 추가 모드
        const newClient = {
          id: `client-${Date.now()}`,
          name: clientForm.name,
          contacts: contacts,
          phone: clientForm.phone,
          email: clientForm.email,
          address: clientForm.address,
          businessNumber: clientForm.businessNumber,
          memo: clientForm.memo,
          totalRevenue: 0,
          unpaidAmount: 0,
        };

        await db.createClient(newClient);
        await loadClients();
        Alert.alert("성공", "거래처가 추가되었습니다.");
      }

      setShowAddModal(false);
      setIsEditMode(false);
      setEditingClientId(null);
      setClientForm({
        name: "",
        phone: "",
        email: "",
        address: "",
        businessNumber: "",
        memo: "",
      });
      setContacts([]);
    } catch (error) {
      console.error("Failed to save client:", error);
      Alert.alert("오류", "거래처 저장에 실패했습니다.");
    }
  };

  const handleEditClient = (client: Client) => {
    setIsEditMode(true);
    setEditingClientId(client.id);
    setClientForm({
      name: client.name,
      phone: client.phone,
      email: client.email || "",
      address: client.address || "",
      businessNumber: client.businessNumber || "",
      memo: client.memo || "",
    });
    setContacts(client.contacts);
    setSelectedClient(null);
    setShowAddModal(true);
  };

  const handleDeleteClient = (clientId: string) => {
    Alert.alert("거래처 삭제", "이 거래처를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("Deleting client:", clientId);
            const db = getDatabase();
            await db.deleteClient(clientId);
            await loadClients();
            setSelectedClient(null);
            Alert.alert("성공", "거래처가 삭제되었습니다.");
          } catch (error) {
            console.error("Failed to delete client:", error);
            Alert.alert("오류", "거래처 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSMS = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>
          거래처를 불러오는 중...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#000" />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>거래처 관리</Text>
          <Text style={styles.headerSubtitle}>총 {clients.length}개</Text>
        </View>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            setIsEditMode(false);
            setEditingClientId(null);
            setContacts([]);
            setShowAddModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#000" />
        </Pressable>
      </View>

      {/* 검색 */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={Theme.colors.text.tertiary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="거래처명, 담당자, 연락처로 검색..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Theme.colors.text.tertiary}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={20}
              color={Theme.colors.text.tertiary}
            />
          </Pressable>
        )}
      </View>

      {/* 거래처 리스트 */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={
          Platform.OS === "web" ? styles.contentContainerWeb : undefined
        }
      >
        {filteredClients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="business-outline"
              size={64}
              color={Theme.colors.text.tertiary}
            />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "검색 결과가 없습니다"
                : "등록된 거래처가 없습니다"}
            </Text>
            <Pressable
              style={styles.emptyAddButton}
              onPress={() => {
                setIsEditMode(false);
                setEditingClientId(null);
                setContacts([]);
                setShowAddModal(true);
              }}
            >
              <Text style={styles.emptyAddButtonText}>거래처 추가하기</Text>
            </Pressable>
          </View>
        ) : (
          <View style={Platform.OS === "web" ? styles.clientsGrid : undefined}>
            {filteredClients.map((client) => (
              <Pressable
                key={client.id}
                style={styles.clientCard}
                onPress={() => setSelectedClient(client)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.clientNameRow}>
                    <Ionicons
                      name="business"
                      size={20}
                      color={Theme.colors.primary}
                    />
                    <Text style={styles.clientName}>{client.name}</Text>
                  </View>
                  <Pressable
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteClient(client.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </Pressable>
                </View>

                {/* 담당자 목록 */}
                {client.contacts.length > 0 && (
                  <View style={styles.contactsSection}>
                    <Text style={styles.contactsLabel}>
                      담당자 ({client.contacts.length}명)
                    </Text>
                    {client.contacts
                      .sort(
                        (a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
                      )
                      .slice(0, 2)
                      .map((contact) => (
                        <View key={contact.id} style={styles.contactItem}>
                          <View style={styles.contactItemHeader}>
                            {contact.isPrimary && (
                              <Ionicons name="star" size={14} color="#f59e0b" />
                            )}
                            <Text style={styles.contactName}>
                              {contact.name}
                            </Text>
                            {contact.position && (
                              <Text style={styles.contactPosition}>
                                {contact.position}
                              </Text>
                            )}
                          </View>
                          <Text style={styles.contactPhone}>
                            {formatPhoneNumber(contact.phone)}
                          </Text>
                        </View>
                      ))}
                    {client.contacts.length > 2 && (
                      <Text style={styles.moreContacts}>
                        +{client.contacts.length - 2}명 더보기
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.contactRow}>
                  <View style={styles.phoneRow}>
                    <Ionicons
                      name="call-outline"
                      size={16}
                      color={Theme.colors.text.secondary}
                    />
                    <Text style={styles.phoneText}>
                      {formatPhoneNumber(client.phone)}
                    </Text>
                  </View>
                  <View style={styles.actionButtons}>
                    <Pressable
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCall(client.phone);
                      }}
                    >
                      <Ionicons name="call" size={16} color="#3b82f6" />
                    </Pressable>
                    <Pressable
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleSMS(client.phone);
                      }}
                    >
                      <Ionicons name="chatbubble" size={16} color="#10b981" />
                    </Pressable>
                  </View>
                </View>

                {client.email && (
                  <View style={styles.emailRow}>
                    <Ionicons
                      name="mail-outline"
                      size={16}
                      color={Theme.colors.text.secondary}
                    />
                    <Text style={styles.emailText}>{client.email}</Text>
                  </View>
                )}

                {(client.totalRevenue || client.unpaidAmount) && (
                  <View style={styles.financialInfo}>
                    {client.totalRevenue && (
                      <View style={styles.financialItem}>
                        <Text style={styles.financialLabel}>총 매출</Text>
                        <Text style={styles.financialValue}>
                          {new Intl.NumberFormat("ko-KR").format(
                            client.totalRevenue
                          )}
                          원
                        </Text>
                      </View>
                    )}
                    {client.unpaidAmount && (
                      <View style={styles.financialItem}>
                        <Text style={styles.financialLabel}>미수금</Text>
                        <Text
                          style={[styles.financialValue, styles.unpaidValue]}
                        >
                          {new Intl.NumberFormat("ko-KR").format(
                            client.unpaidAmount
                          )}
                          원
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 거래처 추가 모달 */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditMode ? "거래처 수정" : "새 거래처 추가"}
              </Text>
              <Pressable
                onPress={() => {
                  setShowAddModal(false);
                  setIsEditMode(false);
                  setEditingClientId(null);
                }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={Theme.colors.text.primary}
                />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>거래처명 *</Text>
                <TextInput
                  style={styles.input}
                  value={clientForm.name}
                  onChangeText={(text) =>
                    setClientForm({ ...clientForm, name: text })
                  }
                  placeholder="회사명 또는 거래처명"
                />
              </View>

              {/* 담당자 관리 섹션 */}
              <View style={styles.contactsInputSection}>
                <Text style={styles.sectionTitle}>담당자 정보</Text>

                {/* 등록된 담당자 목록 */}
                {contacts.length > 0 && (
                  <View style={styles.contactsList}>
                    {contacts.map((contact) => (
                      <View key={contact.id} style={styles.addedContactCard}>
                        <Pressable
                          style={styles.primaryContactToggle}
                          onPress={() => handleTogglePrimaryContact(contact.id)}
                        >
                          <Ionicons
                            name={contact.isPrimary ? "star" : "star-outline"}
                            size={20}
                            color={contact.isPrimary ? "#f59e0b" : "#d1d5db"}
                          />
                        </Pressable>
                        <View style={styles.addedContactInfo}>
                          <View style={styles.addedContactHeader}>
                            <Text style={styles.addedContactName}>
                              {contact.name}
                            </Text>
                            {contact.isPrimary && (
                              <View style={styles.primaryBadge}>
                                <Text style={styles.primaryBadgeText}>
                                  대표
                                </Text>
                              </View>
                            )}
                            {contact.position && (
                              <Text style={styles.addedContactPosition}>
                                {contact.position}
                              </Text>
                            )}
                          </View>
                          <Text style={styles.addedContactPhone}>
                            {formatPhoneNumber(contact.phone)}
                          </Text>
                          {contact.memo && (
                            <Text
                              style={styles.addedContactMemo}
                              numberOfLines={1}
                            >
                              {contact.memo}
                            </Text>
                          )}
                        </View>
                        <Pressable
                          style={styles.removeContactButton}
                          onPress={() => handleRemoveContact(contact.id)}
                        >
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color="#ef4444"
                          />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}

                {/* 새 담당자 추가 폼 */}
                <View style={styles.newContactForm}>
                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                      <Text style={styles.inputLabel}>담당자명</Text>
                      <TextInput
                        style={styles.input}
                        value={currentContact.name}
                        onChangeText={(text) =>
                          setCurrentContact({ ...currentContact, name: text })
                        }
                        placeholder="이름"
                      />
                    </View>
                    <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                      <Text style={styles.inputLabel}>직급/직책</Text>
                      <TextInput
                        style={styles.input}
                        value={currentContact.position}
                        onChangeText={(text) =>
                          setCurrentContact({
                            ...currentContact,
                            position: text,
                          })
                        }
                        placeholder="예) 팀장, 과장"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>연락처</Text>
                    <TextInput
                      style={styles.input}
                      value={currentContact.phone}
                      onChangeText={(text) =>
                        setCurrentContact({ ...currentContact, phone: text })
                      }
                      placeholder="010-0000-0000"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>메모</Text>
                    <TextInput
                      style={styles.input}
                      value={currentContact.memo}
                      onChangeText={(text) =>
                        setCurrentContact({ ...currentContact, memo: text })
                      }
                      placeholder="간단한 메모"
                    />
                  </View>

                  {/* 대표 담당자 체크박스 */}
                  <Pressable
                    style={styles.primaryCheckbox}
                    onPress={() =>
                      setCurrentContact({
                        ...currentContact,
                        isPrimary: !currentContact.isPrimary,
                      })
                    }
                  >
                    <Ionicons
                      name={
                        currentContact.isPrimary ? "checkbox" : "square-outline"
                      }
                      size={20}
                      color={
                        currentContact.isPrimary
                          ? "#f59e0b"
                          : Theme.colors.text.tertiary
                      }
                    />
                    <Text style={styles.primaryCheckboxText}>
                      대표 담당자로 지정
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.addContactButton}
                    onPress={handleAddContact}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color="#3b82f6"
                    />
                    <Text style={styles.addContactButtonText}>담당자 추가</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>대표 연락처 *</Text>
                <TextInput
                  style={styles.input}
                  value={clientForm.phone}
                  onChangeText={(text) =>
                    setClientForm({ ...clientForm, phone: text })
                  }
                  placeholder="010-0000-0000"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이메일</Text>
                <TextInput
                  style={styles.input}
                  value={clientForm.email}
                  onChangeText={(text) =>
                    setClientForm({ ...clientForm, email: text })
                  }
                  placeholder="example@company.com"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>사업자등록번호</Text>
                <TextInput
                  style={styles.input}
                  value={clientForm.businessNumber}
                  onChangeText={(text) =>
                    setClientForm({ ...clientForm, businessNumber: text })
                  }
                  placeholder="000-00-00000"
                  keyboardType="number-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>주소</Text>
                <TextInput
                  style={styles.input}
                  value={clientForm.address}
                  onChangeText={(text) =>
                    setClientForm({ ...clientForm, address: text })
                  }
                  placeholder="주소를 입력하세요"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>메모</Text>
                <TextInput
                  style={[styles.input, styles.memoInput]}
                  value={clientForm.memo}
                  onChangeText={(text) =>
                    setClientForm({ ...clientForm, memo: text })
                  }
                  placeholder="메모를 입력하세요"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setIsEditMode(false);
                  setEditingClientId(null);
                }}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={handleAddClient}>
                <Text style={styles.saveButtonText}>
                  {isEditMode ? "수정" : "추가"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 거래처 상세 모달 */}
      <Modal
        visible={selectedClient !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedClient(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>거래처 상세</Text>
              <Pressable onPress={() => setSelectedClient(null)}>
                <Ionicons
                  name="close"
                  size={24}
                  color={Theme.colors.text.primary}
                />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedClient && (
                <>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>거래처명</Text>
                    <Text style={styles.detailValue}>
                      {selectedClient.name}
                    </Text>
                  </View>

                  {/* 담당자 목록 */}
                  {selectedClient.contacts.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>
                        담당자 ({selectedClient.contacts.length}명)
                      </Text>
                      {selectedClient.contacts
                        .sort(
                          (a, b) =>
                            (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
                        )
                        .map((contact) => (
                          <View
                            key={contact.id}
                            style={styles.contactDetailCard}
                          >
                            <View style={styles.contactDetailHeader}>
                              {contact.isPrimary && (
                                <Ionicons
                                  name="star"
                                  size={16}
                                  color="#f59e0b"
                                />
                              )}
                              <Text style={styles.contactDetailName}>
                                {contact.name}
                              </Text>
                              {contact.isPrimary && (
                                <View style={styles.primaryBadge}>
                                  <Text style={styles.primaryBadgeText}>
                                    대표
                                  </Text>
                                </View>
                              )}
                              {contact.position && (
                                <Text style={styles.contactDetailPosition}>
                                  {contact.position}
                                </Text>
                              )}
                            </View>
                            <View style={styles.contactDetailRow}>
                              <View style={styles.contactDetailPhone}>
                                <Ionicons
                                  name="call-outline"
                                  size={14}
                                  color={Theme.colors.text.secondary}
                                />
                                <Text style={styles.contactDetailPhoneText}>
                                  {formatPhoneNumber(contact.phone)}
                                </Text>
                              </View>
                              <View style={styles.actionButtons}>
                                <Pressable
                                  style={styles.actionButtonSmall}
                                  onPress={() => handleCall(contact.phone)}
                                >
                                  <Ionicons
                                    name="call"
                                    size={14}
                                    color="#3b82f6"
                                  />
                                </Pressable>
                                <Pressable
                                  style={styles.actionButtonSmall}
                                  onPress={() => handleSMS(contact.phone)}
                                >
                                  <Ionicons
                                    name="chatbubble"
                                    size={14}
                                    color="#10b981"
                                  />
                                </Pressable>
                              </View>
                            </View>
                            {contact.memo && (
                              <Text style={styles.contactDetailMemo}>
                                {contact.memo}
                              </Text>
                            )}
                          </View>
                        ))}
                    </View>
                  )}

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>대표 연락처</Text>
                    <View style={styles.phoneDetailRow}>
                      <Text style={styles.detailValue}>
                        {formatPhoneNumber(selectedClient.phone)}
                      </Text>
                      <View style={styles.actionButtons}>
                        <Pressable
                          style={styles.actionButton}
                          onPress={() => handleCall(selectedClient.phone)}
                        >
                          <Ionicons name="call" size={16} color="#3b82f6" />
                        </Pressable>
                        <Pressable
                          style={styles.actionButton}
                          onPress={() => handleSMS(selectedClient.phone)}
                        >
                          <Ionicons
                            name="chatbubble"
                            size={16}
                            color="#10b981"
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>

                  {selectedClient.email && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>이메일</Text>
                      <Text style={styles.detailValue}>
                        {selectedClient.email}
                      </Text>
                    </View>
                  )}

                  {selectedClient.businessNumber && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>사업자등록번호</Text>
                      <Text style={styles.detailValue}>
                        {selectedClient.businessNumber}
                      </Text>
                    </View>
                  )}

                  {selectedClient.address && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>주소</Text>
                      <Text style={styles.detailValue}>
                        {selectedClient.address}
                      </Text>
                    </View>
                  )}

                  {selectedClient.memo && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>메모</Text>
                      <Text style={styles.detailValue}>
                        {selectedClient.memo}
                      </Text>
                    </View>
                  )}

                  {/* 거래 내역 요약 */}
                  <View style={styles.financialSummary}>
                    <Text style={styles.financialSummaryTitle}>거래 내역</Text>
                    <View style={styles.financialRow}>
                      <Text style={styles.financialRowLabel}>총 매출</Text>
                      <Text style={styles.financialRowValue}>
                        {new Intl.NumberFormat("ko-KR").format(
                          selectedClient.totalRevenue || 0
                        )}
                        원
                      </Text>
                    </View>
                    <View style={styles.financialRow}>
                      <Text style={styles.financialRowLabel}>미수금</Text>
                      <Text
                        style={[
                          styles.financialRowValue,
                          selectedClient.unpaidAmount
                            ? styles.unpaidValue
                            : undefined,
                        ]}
                      >
                        {new Intl.NumberFormat("ko-KR").format(
                          selectedClient.unpaidAmount || 0
                        )}
                        원
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.editButton}
                onPress={() => {
                  if (selectedClient) {
                    handleEditClient(selectedClient);
                  }
                }}
              >
                <Ionicons name="create-outline" size={20} color="#3b82f6" />
                <Text style={styles.editButtonText}>수정</Text>
              </Pressable>
              <Pressable
                style={styles.deleteButtonFull}
                onPress={() => {
                  if (selectedClient) {
                    handleDeleteClient(selectedClient.id);
                  }
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#ffffff" />
                <Text style={styles.deleteButtonText}>삭제</Text>
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
    backgroundColor: Theme.colors.card,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: Theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  headerTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.card,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
    padding: 0,
  },
  content: {
    flex: 1,
  },
  contentContainerWeb: {
    padding: Theme.spacing.lg,
  },
  clientsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  emptyContainer: {
    padding: Theme.spacing.lg,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.tertiary,
  },
  emptyAddButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.xl,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.lg,
  },
  emptyAddButtonText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.inverse,
  },
  clientCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
    ...(Platform.OS === "web"
      ? {
          flex: 1,
          minWidth: "calc(50% - 8px)",
          maxWidth: "calc(50% - 8px)",
        }
      : {}),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Theme.spacing.sm,
  },
  clientNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    flex: 1,
  },
  clientName: {
    fontSize: Theme.typography.sizes.lg,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  contactPerson: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.sm,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.xs,
  },
  phoneText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Theme.spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.md,
  },
  emailText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  financialInfo: {
    flexDirection: "row",
    gap: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
  },
  financialItem: {
    flex: 1,
  },
  financialLabel: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.tertiary,
    marginBottom: 4,
  },
  financialValue: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
  },
  unpaidValue: {
    color: Theme.colors.warning,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Theme.colors.card,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border.light,
  },
  modalTitle: {
    fontSize: Theme.typography.sizes.xl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
  },
  modalBody: {
    padding: Theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: Theme.spacing.lg,
  },
  inputLabel: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border.medium,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
    backgroundColor: Theme.colors.background,
  },
  memoInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    padding: Theme.spacing.lg,
    gap: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
  },
  cancelButton: {
    flex: 1,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.inverse,
  },
  detailSection: {
    marginBottom: Theme.spacing.lg,
  },
  detailLabel: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.xs,
  },
  detailValue: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
  },
  phoneDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  financialSummary: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.lg,
    marginTop: Theme.spacing.lg,
  },
  financialSummaryTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.sm,
  },
  financialRowLabel: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
  },
  financialRowValue: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
  },
  deleteButtonFull: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Theme.spacing.sm,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: "#ef4444",
  },
  deleteButtonText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
    color: "#ffffff",
  },
  // 담당자 관련 스타일
  contactsSection: {
    marginBottom: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
  },
  contactsLabel: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.secondary,
    marginBottom: Theme.spacing.sm,
  },
  contactItem: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
  },
  contactItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  contactName: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.primary,
  },
  contactPosition: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    backgroundColor: Theme.colors.card,
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  contactPhone: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
  moreContacts: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.primary,
    textAlign: "center",
    marginTop: Theme.spacing.xs,
  },
  // 담당자 추가 폼 스타일
  contactsInputSection: {
    marginBottom: Theme.spacing.lg,
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  contactsList: {
    marginBottom: Theme.spacing.md,
  },
  addedContactCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
  },
  addedContactInfo: {
    flex: 1,
  },
  addedContactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    marginBottom: 2,
  },
  addedContactName: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
  },
  addedContactPosition: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  addedContactPhone: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
  },
  addedContactMemo: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.tertiary,
    marginTop: 2,
  },
  removeContactButton: {
    padding: Theme.spacing.xs,
  },
  newContactForm: {
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border.light,
  },
  inputRow: {
    flexDirection: "row",
    gap: Theme.spacing.md,
  },
  inputGroupHalf: {
    flex: 1,
  },
  addContactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Theme.spacing.xs,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: "#3b82f6",
    marginTop: Theme.spacing.sm,
  },
  addContactButtonText: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: "#3b82f6",
  },
  // 담당자 상세 스타일
  contactDetailCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  contactDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
  },
  contactDetailName: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.text.primary,
  },
  contactDetailPosition: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    backgroundColor: Theme.colors.card,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  contactDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.xs,
  },
  contactDetailPhone: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.xs,
  },
  contactDetailPhoneText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
  },
  actionButtonSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  contactDetailMemo: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    fontStyle: "italic",
  },
  // 대표 담당자 관련 스타일
  primaryContactToggle: {
    padding: Theme.spacing.xs,
    marginRight: Theme.spacing.sm,
  },
  primaryBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: Theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.sm,
  },
  primaryBadgeText: {
    fontSize: Theme.typography.sizes.xs,
    fontWeight: Theme.typography.weights.semibold,
    color: "#f59e0b",
  },
  primaryCheckbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Theme.spacing.sm,
    padding: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  primaryCheckboxText: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.primary,
  },
  // 수정 버튼 스타일
  editButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Theme.spacing.sm,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  editButtonText: {
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.medium,
    color: "#3b82f6",
  },
});
