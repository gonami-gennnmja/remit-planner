import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function HybridMock() {
  return (
    <View style={{ flex: 1, backgroundColor: "#f5f5f7" }}>
      {/* 헤더 - 하이브리드 스타일 */}
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
          {/* 주요 기능 - 컴팩트 + 큰 숫자 */}
          <View style={{ gap: 10, marginBottom: 32 }}>
            {/* 일정 관리 - 액센트 컬러 강조 */}
            <Pressable
              style={{
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
                borderLeftWidth: 4,
                borderLeftColor: "#5e6ad2",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 13, color: "#86868b", marginBottom: 6 }}
                  >
                    오늘 일정
                  </Text>
                  <Text
                    style={{
                      fontSize: 40,
                      fontWeight: "700",
                      color: "#5e6ad2",
                    }}
                  >
                    3
                  </Text>
                  <Text
                    style={{ fontSize: 14, color: "#86868b", marginTop: 4 }}
                  >
                    3건의 일정이 있습니다
                  </Text>
                </View>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: "#f0f1fe",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="calendar" size={32} color="#5e6ad2" />
                </View>
              </View>
            </Pressable>

            {/* 근로자 관리 */}
            <Pressable
              style={{
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
                borderLeftWidth: 4,
                borderLeftColor: "#f59e0b",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 13, color: "#86868b", marginBottom: 6 }}
                  >
                    등록 근로자
                  </Text>
                  <Text
                    style={{
                      fontSize: 40,
                      fontWeight: "700",
                      color: "#f59e0b",
                    }}
                  >
                    12
                  </Text>
                  <Text
                    style={{ fontSize: 14, color: "#86868b", marginTop: 4 }}
                  >
                    12명이 활발하게 일하고 있어요
                  </Text>
                </View>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: "#fef3e7",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="people" size={32} color="#f59e0b" />
                </View>
              </View>
            </Pressable>

            {/* 거래처 + 급여 (2열) */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Pressable
                  style={{
                    backgroundColor: "#fff",
                    padding: 20,
                    borderRadius: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                    borderLeftWidth: 4,
                    borderLeftColor: "#10b981",
                  }}
                >
                  <Text
                    style={{ fontSize: 12, color: "#86868b", marginBottom: 4 }}
                  >
                    거래처
                  </Text>
                  <Text
                    style={{
                      fontSize: 36,
                      fontWeight: "700",
                      color: "#10b981",
                    }}
                  >
                    8
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: "#86868b", marginTop: 4 }}
                  >
                    8곳의 거래처
                  </Text>
                </Pressable>
              </View>
              <View style={{ flex: 1 }}>
                <Pressable
                  style={{
                    backgroundColor: "#fff",
                    padding: 20,
                    borderRadius: 16,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                    borderLeftWidth: 4,
                    borderLeftColor: "#dc2626",
                  }}
                >
                  <Text
                    style={{ fontSize: 12, color: "#86868b", marginBottom: 4 }}
                  >
                    이번 달 급여
                  </Text>
                  <Text
                    style={{
                      fontSize: 30,
                      fontWeight: "700",
                      color: "#dc2626",
                    }}
                  >
                    ₩2.4M
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: "#86868b", marginTop: 4 }}
                  >
                    +15%
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
              marginBottom: 16,
            }}
          >
            오늘 일정
          </Text>

          <View style={{ gap: 10 }}>
            {/* 일정 카드 */}
            <View
              style={{
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
                borderLeftWidth: 4,
                borderLeftColor: "#5e6ad2",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#1d1d1f",
                  marginBottom: 8,
                }}
              >
                제품 A 설비 점검
              </Text>
              <Text style={{ fontSize: 14, color: "#86868b", marginBottom: 4 }}>
                09:00 - 12:00
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <Ionicons name="location-outline" size={14} color="#86868b" />
                <Text style={{ fontSize: 13, color: "#86868b", marginLeft: 4 }}>
                  서울시 강남구 테헤란로
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
                borderLeftWidth: 4,
                borderLeftColor: "#f59e0b",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#1d1d1f",
                  marginBottom: 8,
                }}
              >
                B 건물 냉난방 점검
              </Text>
              <Text style={{ fontSize: 14, color: "#86868b", marginBottom: 4 }}>
                14:00 - 16:00
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <Ionicons name="location-outline" size={14} color="#86868b" />
                <Text style={{ fontSize: 13, color: "#86868b", marginLeft: 4 }}>
                  서울시 서초구 서초대로
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
