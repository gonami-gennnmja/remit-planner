import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function AppleMock() {
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
            <Text style={{ fontSize: 19, color: "#86868b", marginTop: 2 }}>
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
        {/* Apple 스타일 - 큰 타이포그래피, 얇은 그림자 */}
        <View style={{ padding: 20 }}>
          {/* 주요 기능 - 카드 스타일 */}
          <View style={{ gap: 12, marginBottom: 32 }}>
            {/* 일정 관리 */}
            <Pressable
              style={{
                backgroundColor: "#fff",
                padding: 24,
                borderRadius: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 13, color: "#86868b", marginBottom: 4 }}
                >
                  오늘 일정
                </Text>
                <Text
                  style={{ fontSize: 48, fontWeight: "700", color: "#1d1d1f" }}
                >
                  3
                </Text>
              </View>
              <Text
                style={{ fontSize: 17, fontWeight: "600", color: "#1d1d1f" }}
              >
                오늘 3개의 일정이 있습니다
              </Text>
            </Pressable>

            {/* 근로자 관리 */}
            <Pressable
              style={{
                backgroundColor: "#fff",
                padding: 24,
                borderRadius: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 13, color: "#86868b", marginBottom: 4 }}
                >
                  등록 근로자
                </Text>
                <Text
                  style={{ fontSize: 48, fontWeight: "700", color: "#1d1d1f" }}
                >
                  12
                </Text>
              </View>
              <Text
                style={{ fontSize: 17, fontWeight: "600", color: "#1d1d1f" }}
              >
                12명의 근로자가 활동 중입니다
              </Text>
            </Pressable>

            {/* 거래처 + 급여 (2열) */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Pressable
                  style={{
                    backgroundColor: "#fff",
                    padding: 24,
                    borderRadius: 20,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <Text
                    style={{ fontSize: 13, color: "#86868b", marginBottom: 4 }}
                  >
                    거래처
                  </Text>
                  <Text
                    style={{
                      fontSize: 42,
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
                    padding: 24,
                    borderRadius: 20,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <Text
                    style={{ fontSize: 13, color: "#86868b", marginBottom: 4 }}
                  >
                    이번 달 급여
                  </Text>
                  <Text
                    style={{
                      fontSize: 38,
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
              fontSize: 22,
              fontWeight: "700",
              color: "#1d1d1f",
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
                padding: 24,
                borderRadius: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: "#1d1d1f",
                  marginBottom: 8,
                }}
              >
                제품 A 설비 점검
              </Text>
              <Text style={{ fontSize: 15, color: "#86868b", marginBottom: 4 }}>
                오전 9:00 - 12:00
              </Text>
              <Text style={{ fontSize: 15, color: "#86868b" }}>
                서울시 강남구 테헤란로
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#fff",
                padding: 24,
                borderRadius: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  color: "#1d1d1f",
                  marginBottom: 8,
                }}
              >
                B 건물 냉난방 점검
              </Text>
              <Text style={{ fontSize: 15, color: "#86868b", marginBottom: 4 }}>
                오후 2:00 - 4:00
              </Text>
              <Text style={{ fontSize: 15, color: "#86868b" }}>
                서울시 서초구 서초대로
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
