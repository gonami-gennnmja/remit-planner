import CommonHeader from "@/components/CommonHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getDatabase } from "@/database/platformDatabase";
import { Client } from "@/models/types";
import { formatPhoneNumber } from "@/utils/bankUtils";
import { getCurrentSupabaseUser } from "@/utils/supabaseAuth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addData, setAddData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    businessNumber: "",
    memo: "",
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const db = getDatabase();
      await db.init();

      const allClients = await db.getAllClients();

      // 기본값 설정
      const clientsWithDefaults = allClients.map((client) => ({
        ...client,
        name: client.name || "이름 없음",
        phone: client.phone || "",
        email: client.email || "",
        address: client.address || "",
        businessNumber: client.businessNumber || "",
        memo: client.memo || "",
        contacts: client.contacts || [],
      }));

      setClients(clientsWithDefaults);
    } catch (error) {
      console.error("❌ Failed to load clients:", error);
      Alert.alert("오류", "거래처를 불러오는데 실패했습니다.");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = (clients || []).filter(
    (client) =>
      (client?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client?.phone || "").includes(searchQuery)
  );

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSMS = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const handleAddClient = async () => {
    if (!addData.name.trim() || !addData.phone.trim()) {
      Alert.alert("오류", "거래처명과 연락처는 필수입니다.");
      return;
    }

    try {
      const user = await getCurrentSupabaseUser();
      if (!user) {
        Alert.alert("오류", "로그인이 필요합니다.");
        return;
      }

      const db = getDatabase();
      await db.init();
      const newClient: Client = {
        id: Date.now().toString(),
        userId: user.id,
        name: addData.name.trim(),
        contactPerson: addData.contactPerson.trim() || undefined,
        phone: addData.phone.trim(),
        email: addData.email.trim() || undefined,
        address: addData.address.trim() || undefined,
        businessNumber: addData.businessNumber.trim() || undefined,
        memo: addData.memo.trim() || undefined,
        totalRevenue: 0,
        unpaidAmount: 0,
      };

      await db.createClient(newClient);
      await loadClients();

      setShowAddModal(false);
      setAddData({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        businessNumber: "",
        memo: "",
      });

      Alert.alert("성공", "거래처가 추가되었습니다.");
    } catch (error) {
      console.error("Failed to add client:", error);
      Alert.alert("오류", "거래처 추가에 실패했습니다.");
    }
  };

  if (loading) {
    return <LoadingSpinner message="거래처를 불러오는 중..." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f7" }}>
      {/* 헤더 */}
      <CommonHeader
        title="거래처 관리"
        rightButton={{
          icon: "add",
          onPress: () => setShowAddModal(true),
        }}
      />

      {/* 검색 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 20,
          backgroundColor: "transparent",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
            backgroundColor: "#ffffff",
            borderRadius: 14,
            paddingHorizontal: 16,
            height: 44,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Ionicons name="search" size={20} color="#86868b" />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 16,
              color: "#1d1d1f",
            }}
            placeholder="거래처명 또는 연락처로 검색"
            placeholderTextColor="#86868b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#86868b" />
            </Pressable>
          )}
        </View>
      </View>

      {/* 거래처 리스트 */}
      <ScrollView style={{ flex: 1 }}>
        {filteredClients.length === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 32,
            }}
          >
            <Ionicons name="business-outline" size={64} color="#86868b" />
            <Text style={{ marginTop: 16, fontSize: 16, color: "#86868b" }}>
              {searchQuery
                ? "검색 결과가 없습니다"
                : "등록된 거래처가 없습니다"}
            </Text>
          </View>
        ) : (
          <View style={{ padding: 20, gap: 10 }}>
            {filteredClients.map((client) => (
              <Pressable
                key={client.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 14,
                  padding: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                onPress={() => router.push(`/clients/${client.id}` as any)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
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
                      <Ionicons name="business" size={20} color="#86868b" />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          marginLeft: 8,
                          color: "#1d1d1f",
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
                          <Ionicons name="person" size={16} color="#86868b" />
                          <Text
                            style={{
                              fontSize: 14,
                              color: "#86868b",
                              marginLeft: 6,
                            }}
                          >
                            담당자: {client.contactPerson}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* 첨부파일 여부 */}
                    {client.documentsFolderPath && (
                      <View style={{ marginBottom: 8 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <Ionicons name="attach" size={16} color="#1d1d1f" />
                          <Text
                            style={{
                              fontSize: 14,
                              color: "#1d1d1f",
                              marginLeft: 6,
                            }}
                          >
                            첨부파일 있음
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* 담당자 목록 */}
                    {client.contacts && client.contacts.length > 0 && (
                      <View style={{ marginBottom: 12 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#666",
                            marginBottom: 4,
                          }}
                        >
                          담당자 ({client.contacts.length}명)
                        </Text>
                        {client.contacts.slice(0, 2).map((contact) => (
                          <View key={contact.id} style={{ marginBottom: 4 }}>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              {contact.isPrimary && (
                                <Ionicons
                                  name="star"
                                  size={14}
                                  color="#f59e0b"
                                />
                              )}
                              <Text style={{ fontSize: 14, marginLeft: 4 }}>
                                {contact.name || "이름 없음"}
                              </Text>
                              {contact.position && (
                                <Text
                                  style={{
                                    fontSize: 12,
                                    color: "#666",
                                    marginLeft: 4,
                                  }}
                                >
                                  ({contact.position})
                                </Text>
                              )}
                            </View>
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#666",
                                marginLeft: 18,
                              }}
                            >
                              {formatPhoneNumber(contact.phone || "")}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Ionicons name="call-outline" size={16} color="#86868b" />
                      <Text
                        style={{
                          fontSize: 14,
                          marginLeft: 8,
                          color: "#86868b",
                        }}
                      >
                        {formatPhoneNumber(client.phone || "")}
                      </Text>
                    </View>

                    {client.email && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Ionicons
                          name="mail-outline"
                          size={16}
                          color="#86868b"
                        />
                        <Text
                          style={{
                            fontSize: 14,
                            marginLeft: 8,
                            color: "#86868b",
                          }}
                        >
                          {client.email}
                        </Text>
                      </View>
                    )}

                    <View
                      style={{ flexDirection: "row", gap: 8, marginTop: 8 }}
                    >
                      <Pressable
                        onPress={() => handleCall(client.phone || "")}
                        style={({ pressed }) => [
                          {
                            opacity: pressed ? 0.6 : 1,
                          },
                        ]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={{ fontSize: 16 }}>📞</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleSMS(client.phone || "")}
                        style={({ pressed }) => [
                          {
                            opacity: pressed ? 0.6 : 1,
                          },
                        ]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={{ fontSize: 16 }}>💬</Text>
                      </Pressable>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 거래처 추가 모달 */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <CommonHeader
            title="거래처 추가"
            showBackButton={false}
            rightButton={{
              icon: "checkmark",
              onPress: handleAddClient,
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
            onPress={() => setShowAddModal(false)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>거래처명 *</Text>
              <TextInput
                style={styles.formInput}
                value={addData.name}
                onChangeText={(text) => setAddData({ ...addData, name: text })}
                placeholder="거래처명을 입력하세요"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>담당자</Text>
              <TextInput
                style={styles.formInput}
                value={addData.contactPerson}
                onChangeText={(text) =>
                  setAddData({ ...addData, contactPerson: text })
                }
                placeholder="담당자명을 입력하세요"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>대표 연락처 *</Text>
              <TextInput
                style={styles.formInput}
                value={addData.phone}
                onChangeText={(text) => setAddData({ ...addData, phone: text })}
                placeholder="연락처를 입력하세요"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>이메일</Text>
              <TextInput
                style={styles.formInput}
                value={addData.email}
                onChangeText={(text) => setAddData({ ...addData, email: text })}
                placeholder="이메일을 입력하세요"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>주소</Text>
              <TextInput
                style={styles.formInput}
                value={addData.address}
                onChangeText={(text) =>
                  setAddData({ ...addData, address: text })
                }
                placeholder="주소를 입력하세요"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>사업자등록번호</Text>
              <TextInput
                style={styles.formInput}
                value={addData.businessNumber}
                onChangeText={(text) =>
                  setAddData({ ...addData, businessNumber: text })
                }
                placeholder="사업자등록번호를 입력하세요"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>메모</Text>
              <TextInput
                style={[styles.formInput, styles.memoInput]}
                value={addData.memo}
                onChangeText={(text) => setAddData({ ...addData, memo: text })}
                placeholder="메모를 입력하세요"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  memoInput: {
    height: 80,
    textAlignVertical: "top",
  },
});
