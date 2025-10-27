import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function AppleCompactMock() {
  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f7" }}>
      {/* 헤더 - Apple 스타일 */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 60,
          paddingBottom: 24,
          backgroundColor: "transparent",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <Text style={{ fontSize: 32, fontWeight: "700", color: "#1d1d1f" }}>
              반반
            </Text>
            <Text style={{ fontSize: 15, color: "#86868b", marginTop: 2 }}>
              김철수님
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={{
              padding: 10,
              borderRadius: 50,
            }}
          >
            <Ionicons name="close" size={22} color="#1d1d1f" />
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20 }}>
          {/* 주요 기능 - 컴팩트 + 이모지 */}
          <View style={{ gap: 10, marginBottom: 24 }}>
            {/* 일정 관리 */}
            <Pressable
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 14,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 12, color: "#86868b", marginBottom: 4 }}
                  >
                    📅 오늘 일정
                  </Text>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "700",
                      color: "#1d1d1f",
                    }}
                  >
                    3건
                  </Text>
                </View>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: "#e8f0fe",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 28 }}>📅</Text>
                </View>
              </View>
            </Pressable>

            {/* 근로자 관리 */}
            <Pressable
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 14,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 12, color: "#86868b", marginBottom: 4 }}
                  >
                    👥 등록 근로자
                  </Text>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "700",
                      color: "#1d1d1f",
                    }}
                  >
                    12명
                  </Text>
                </View>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: "#fef3e7",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 28 }}>👥</Text>
                </View>
              </View>
            </Pressable>

            {/* 거래처 + 급여 (2열) */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Pressable
                  style={{
                    backgroundColor: "#fff",
                    padding: 16,
                    borderRadius: 14,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text
                    style={{ fontSize: 12, color: "#86868b", marginBottom: 4 }}
                  >
                    🏢 거래처
                  </Text>
                  <Text
                    style={{
                      fontSize: 32,
                      fontWeight: "700",
                      color: "#1d1d1f",
                    }}
                  >
                    8
                  </Text>
                </Pressable>
              </View>
              <View style={{ flex: 1 }}>
                <Pressable
                  style={{
                    backgroundColor: "#fff",
                    padding: 16,
                    borderRadius: 14,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text
                    style={{ fontSize: 12, color: "#86868b", marginBottom: 4 }}
                  >
                    💰 이번 달 급여
                  </Text>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "700",
                      color: "#1d1d1f",
                    }}
                  >
                    ₩2.4M
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* 오늘 일정 */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#1d1d1f",
              marginBottom: 14,
            }}
          >
            오늘 일정
          </Text>

          <View style={{ gap: 10 }}>
            {/* 일정 카드 */}
            <View
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 14,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#1d1d1f",
                  marginBottom: 6,
                }}
              >
                🔧 제품 A 설비 점검
              </Text>
              <Text style={{ fontSize: 14, color: "#86868b", marginBottom: 4 }}>
                09:00 - 12:00
              </Text>
              <Text style={{ fontSize: 14, color: "#86868b" }}>
                📍 서울시 강남구 테헤란로
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 14,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#1d1d1f",
                  marginBottom: 6,
                }}
              >
                ❄️ B 건물 냉난방 점검
              </Text>
              <Text style={{ fontSize: 14, color: "#86868b", marginBottom: 4 }}>
                14:00 - 16:00
              </Text>
              <Text style={{ fontSize: 14, color: "#86868b" }}>
                📍 서울시 서초구 서초대로
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
