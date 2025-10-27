import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function GoogleMock() {
  return (
    <View style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      {/* 헤더 - Google 스타일 */}
      <View
        style={{
          padding: 24,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#e8eaed",
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
            <Text style={{ fontSize: 28, fontWeight: "600", color: "#202124" }}>
              반반
            </Text>
            <Text style={{ fontSize: 14, color: "#5f6368", marginTop: 4 }}>
              김철수님
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: "#f1f3f4",
            }}
          >
            <Ionicons name="close" size={24} color="#5f6368" />
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* 주요 기능 - Google Workspace 스타일 */}
        <View style={{ padding: 20 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#202124",
              marginBottom: 16,
            }}
          >
            주요 기능
          </Text>

          {/* 2열 그리드 */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {/* 일정 관리 */}
            <Pressable
              style={{
                flex: 1,
                minWidth: "48%",
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#e8eaed",
              }}
            >
              <Text
                style={{ fontSize: 32, fontWeight: "600", color: "#202124" }}
              >
                3
              </Text>
              <Text style={{ fontSize: 14, color: "#5f6368", marginTop: 4 }}>
                오늘 일정
              </Text>
            </Pressable>

            {/* 근로자 관리 */}
            <Pressable
              style={{
                flex: 1,
                minWidth: "48%",
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#e8eaed",
              }}
            >
              <Text
                style={{ fontSize: 32, fontWeight: "600", color: "#202124" }}
              >
                12
              </Text>
              <Text style={{ fontSize: 14, color: "#5f6368", marginTop: 4 }}>
                등록 근로자
              </Text>
            </Pressable>

            {/* 거래처 관리 */}
            <Pressable
              style={{
                flex: 1,
                minWidth: "48%",
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#e8eaed",
              }}
            >
              <Text
                style={{ fontSize: 32, fontWeight: "600", color: "#202124" }}
              >
                8
              </Text>
              <Text style={{ fontSize: 14, color: "#5f6368", marginTop: 4 }}>
                거래처 수
              </Text>
            </Pressable>

            {/* 급여 관리 */}
            <Pressable
              style={{
                flex: 1,
                minWidth: "48%",
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#e8eaed",
              }}
            >
              <Text
                style={{ fontSize: 32, fontWeight: "600", color: "#202124" }}
              >
                ₩
              </Text>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "600",
                  color: "#34a853",
                  marginTop: -8,
                }}
              >
                2.4M
              </Text>
              <Text style={{ fontSize: 14, color: "#5f6368", marginTop: 4 }}>
                이번 달 급여
              </Text>
            </Pressable>
          </View>

          {/* 오늘 일정 */}
          <View style={{ marginTop: 32 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#202124",
                marginBottom: 16,
              }}
            >
              오늘 일정
            </Text>

            <View style={{ gap: 8 }}>
              {/* 일정 카드 */}
              <View
                style={{
                  backgroundColor: "#fff",
                  padding: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#e8eaed",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "500", color: "#202124" }}
                >
                  제품 A 설비 점검
                </Text>
                <Text style={{ fontSize: 14, color: "#5f6368", marginTop: 4 }}>
                  오전 9:00 - 12:00
                </Text>
                <Text style={{ fontSize: 13, color: "#80868b", marginTop: 8 }}>
                  서울시 강남구 테헤란로
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "#fff",
                  padding: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#e8eaed",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "500", color: "#202124" }}
                >
                  B 건물 냉난방 점검
                </Text>
                <Text style={{ fontSize: 14, color: "#5f6368", marginTop: 4 }}>
                  오후 2:00 - 4:00
                </Text>
                <Text style={{ fontSize: 13, color: "#80868b", marginTop: 8 }}>
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
