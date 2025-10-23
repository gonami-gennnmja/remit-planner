import CommonHeader from "@/components/CommonHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getDatabase } from "@/database/platformDatabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

interface ClientContact {
  id: string;
  name: string;
  position?: string;
  phone: string;
  memo?: string;
  isPrimary: boolean;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  businessNumber?: string;
  memo?: string;
  totalRevenue?: number;
  unpaidAmount?: number;
  contacts?: ClientContact[];
}

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      console.log("🔄 Loading clients...");
      setLoading(true);
      const db = getDatabase();
      await db.init();

      const allClients = await db.getAllClients();
      console.log("📊 Raw clients data:", allClients);

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

      console.log("✅ Processed clients:", clientsWithDefaults);
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

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  };

  if (loading) {
    return <LoadingSpinner message="거래처를 불러오는 중..." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* 헤더 */}
      <CommonHeader
        title="거래처 관리"
        leftButton={{
          icon: "arrow-back",
          onPress: () => router.back(),
        }}
        rightButton={{
          icon: "add",
          onPress: () => {
            Alert.alert("알림", "거래처 추가 기능은 준비 중입니다.");
          },
        }}
      />

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
          placeholder="거래처명 또는 연락처로 검색"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </Pressable>
        )}
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
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>
              {searchQuery
                ? "검색 결과가 없습니다"
                : "등록된 거래처가 없습니다"}
            </Text>
          </View>
        ) : (
          <View style={{ padding: 16 }}>
            {filteredClients.map((client) => (
              <Pressable
                key={client.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
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
                      <Ionicons name="call-outline" size={16} color="#666" />
                      <Text style={{ fontSize: 14, marginLeft: 8 }}>
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
                        <Ionicons name="mail-outline" size={16} color="#666" />
                        <Text style={{ fontSize: 14, marginLeft: 8 }}>
                          {client.email}
                        </Text>
                      </View>
                    )}

                    <View style={{ flexDirection: "row", marginTop: 8 }}>
                      <Pressable
                        style={{
                          backgroundColor: "#007AFF",
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                          marginRight: 8,
                        }}
                        onPress={() => handleCall(client.phone || "")}
                      >
                        <Text style={{ color: "#fff", fontSize: 12 }}>
                          전화
                        </Text>
                      </Pressable>
                      <Pressable
                        style={{
                          backgroundColor: "#34C759",
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                        }}
                        onPress={() => handleSMS(client.phone || "")}
                      >
                        <Text style={{ color: "#fff", fontSize: 12 }}>
                          문자
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
