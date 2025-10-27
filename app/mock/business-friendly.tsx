import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function BusinessFriendlyMock() {
  return (
    <View style={{ flex: 1, backgroundColor: "#fafbfc" }}>
      {/* 헤더 - 친근한 비즈니스 스타일 */}
      <View
        style={{
          padding: 24,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#e3e8ef",
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
            <Text style={{ fontSize: 28, fontWeight: "700", color: "#1a1f36" }}>
              반반
            </Text>
            <Text style={{ fontSize: 14, color: "#67728c", marginTop: 4 }}>
              김철수님
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={{
              padding: 10,
              borderRadius: 12,
              backgroundColor: "#f6f8fa",
            }}
          >
            <Ionicons name="close" size={20} color="#67728c" />
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* 주요 기능 - 친근한 비즈니스 스타일 */}
        <View style={{ padding: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#1a1f36",
              marginBottom: 16,
            }}
          >
            주요 기능
          </Text>

          {/* 부드러운 그리드 */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {/* 일정 관리 - 부드러운 색상 */}
            <Pressable
              style={{
                flex: 1,
                minWidth: "48%",
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#e3e8ef",
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "#e8f0fe",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ fontSize: 24, fontWeight: "700", color: "#4285f4" }}
                >
                  3
                </Text>
              </View>
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: "#1a1f36" }}
              >
                오늘 일정
              </Text>
              <Text style={{ fontSize: 13, color: "#67728c", marginTop: 2 }}>
                3건의 일정이 있어요
              </Text>
            </Pressable>

            {/* 근로자 관리 */}
            <Pressable
              style={{
                flex: 1,
                minWidth: "48%",
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#e3e8ef",
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "#fef3e7",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ fontSize: 24, fontWeight: "700", color: "#f59e0b" }}
                >
                  12
                </Text>
              </View>
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: "#1a1f36" }}
              >
                등록 근로자
              </Text>
              <Text style={{ fontSize: 13, color: "#67728c", marginTop: 2 }}>
                12명이 활발하게 일하고 있어요
              </Text>
            </Pressable>

            {/* 거래처 관리 */}
            <Pressable
              style={{
                flex: 1,
                minWidth: "48%",
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#e3e8ef",
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "#f0fdf4",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ fontSize: 24, fontWeight: "700", color: "#10b981" }}
                >
                  8
                </Text>
              </View>
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: "#1a1f36" }}
              >
                거래처 수
              </Text>
              <Text style={{ fontSize: 13, color: "#67728c", marginTop: 2 }}>
                8곳과 함께 일하고 있어요
              </Text>
            </Pressable>

            {/* 급여 관리 */}
            <Pressable
              style={{
                flex: 1,
                minWidth: "48%",
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#e3e8ef",
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "#fef3e7",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{ fontSize: 18, fontWeight: "700", color: "#f59e0b" }}
                >
                  ₩2.4M
                </Text>
              </View>
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: "#1a1f36" }}
              >
                이번 달 급여
              </Text>
              <Text style={{ fontSize: 13, color: "#67728c", marginTop: 2 }}>
                전월 대비 15% 증가
              </Text>
            </Pressable>
          </View>

          {/* 오늘 일정 - 부드러운 카드 */}
          <View style={{ marginTop: 32 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#1a1f36",
                marginBottom: 16,
              }}
            >
              오늘 일정
            </Text>

            <View style={{ gap: 12 }}>
              {/* 일정 카드 */}
              <View
                style={{
                  backgroundColor: "#fff",
                  padding: 18,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#e3e8ef",
                  borderLeftWidth: 4,
                  borderLeftColor: "#4285f4",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#1a1f36" }}
                >
                  제품 A 설비 점검
                </Text>
                <Text style={{ fontSize: 14, color: "#67728c", marginTop: 6 }}>
                  오전 9:00 - 12:00
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <Ionicons name="location-outline" size={14} color="#67728c" />
                  <Text
                    style={{ fontSize: 13, color: "#67728c", marginLeft: 4 }}
                  >
                    서울시 강남구 테헤란로
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: "#fff",
                  padding: 18,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#e3e8ef",
                  borderLeftWidth: 4,
                  borderLeftColor: "#f59e0b",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#1a1f36" }}
                >
                  B 건물 냉난방 점검
                </Text>
                <Text style={{ fontSize: 14, color: "#67728c", marginTop: 6 }}>
                  오후 2:00 - 4:00
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <Ionicons name="location-outline" size={14} color="#67728c" />
                  <Text
                    style={{ fontSize: 13, color: "#67728c", marginLeft: 4 }}
                  >
                    서울시 서초구 서초대로
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
