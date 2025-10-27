import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function NotionMock() {
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {/* 헤더 - Notion 스타일 */}
      <View
        style={{
          padding: 20,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#e9e9e9",
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
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#37352f" }}>
              반반
            </Text>
            <Text style={{ fontSize: 14, color: "#787774", marginTop: 4 }}>
              김철수님
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={{
              padding: 6,
              borderRadius: 3,
            }}
          >
            <Text style={{ color: "#37352f", fontSize: 16 }}>←</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 20, maxWidth: 768 }}>
          {/* 주요 기능 - Notion 블록 스타일 */}
          <View style={{ gap: 1, backgroundColor: "#e9e9e9", borderRadius: 3 }}>
            {/* 일정 관리 */}
            <Pressable
              style={{
                backgroundColor: "#ffffff",
                padding: 16,
                borderLeftWidth: 3,
                borderLeftColor: "#2383e2",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#37352f",
                  marginBottom: 4,
                }}
              >
                오늘 일정
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}
              >
                <Text
                  style={{ fontSize: 32, fontWeight: "700", color: "#37352f" }}
                >
                  3
                </Text>
                <Text style={{ fontSize: 14, color: "#787774" }}>
                  건의 일정이 있습니다
                </Text>
              </View>
            </Pressable>

            {/* 근로자 관리 */}
            <View style={{ height: 1, backgroundColor: "#e9e9e9" }} />
            <Pressable
              style={{
                backgroundColor: "#ffffff",
                padding: 16,
                borderLeftWidth: 3,
                borderLeftColor: "#e67e00",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#37352f",
                  marginBottom: 4,
                }}
              >
                등록 근로자
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}
              >
                <Text
                  style={{ fontSize: 32, fontWeight: "700", color: "#37352f" }}
                >
                  12
                </Text>
                <Text style={{ fontSize: 14, color: "#787774" }}>
                  명이 활동 중입니다
                </Text>
              </View>
            </Pressable>

            {/* 거래처 관리 */}
            <View style={{ height: 1, backgroundColor: "#e9e9e9" }} />
            <Pressable
              style={{
                backgroundColor: "#ffffff",
                padding: 16,
                borderLeftWidth: 3,
                borderLeftColor: "#0f7b0c",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#37352f",
                  marginBottom: 4,
                }}
              >
                거래처
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}
              >
                <Text
                  style={{ fontSize: 32, fontWeight: "700", color: "#37352f" }}
                >
                  8
                </Text>
                <Text style={{ fontSize: 14, color: "#787774" }}>
                  곳의 거래처가 있습니다
                </Text>
              </View>
            </Pressable>

            {/* 급여 관리 */}
            <View style={{ height: 1, backgroundColor: "#e9e9e9" }} />
            <Pressable
              style={{
                backgroundColor: "#ffffff",
                padding: 16,
                borderLeftWidth: 3,
                borderLeftColor: "#cf3e36",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#37352f",
                  marginBottom: 4,
                }}
              >
                이번 달 급여
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}
              >
                <Text
                  style={{ fontSize: 28, fontWeight: "700", color: "#37352f" }}
                >
                  ₩2.4M
                </Text>
                <Text style={{ fontSize: 14, color: "#787774" }}>
                  전월 대비 15% 증가
                </Text>
              </View>
            </Pressable>
          </View>

          {/* 오늘 일정 */}
          <View style={{ marginTop: 32 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#37352f",
                marginBottom: 12,
              }}
            >
              오늘 일정
            </Text>

            <View
              style={{ gap: 1, backgroundColor: "#e9e9e9", borderRadius: 3 }}
            >
              {/* 일정 카드 */}
              <View
                style={{
                  backgroundColor: "#ffffff",
                  padding: 16,
                  borderLeftWidth: 3,
                  borderLeftColor: "#2383e2",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#37352f",
                    marginBottom: 6,
                  }}
                >
                  제품 A 설비 점검
                </Text>
                <Text
                  style={{ fontSize: 14, color: "#787774", marginBottom: 4 }}
                >
                  09:00 - 12:00
                </Text>
                <Text style={{ fontSize: 14, color: "#787774" }}>
                  서울시 강남구 테헤란로
                </Text>
              </View>

              <View style={{ height: 1, backgroundColor: "#e9e9e9" }} />

              <View
                style={{
                  backgroundColor: "#ffffff",
                  padding: 16,
                  borderLeftWidth: 3,
                  borderLeftColor: "#2383e2",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#37352f",
                    marginBottom: 6,
                  }}
                >
                  B 건물 냉난방 점검
                </Text>
                <Text
                  style={{ fontSize: 14, color: "#787774", marginBottom: 4 }}
                >
                  14:00 - 16:00
                </Text>
                <Text style={{ fontSize: 14, color: "#787774" }}>
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
