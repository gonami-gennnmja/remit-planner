import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function LinearMock() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
      {/* 헤더 - Linear 스타일 (다크 모드) */}
      <View
        style={{
          padding: 24,
          backgroundColor: "#0d0d0d",
          borderBottomWidth: 1,
          borderBottomColor: "#222",
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
            <Text style={{ fontSize: 24, fontWeight: "600", color: "#fff" }}>
              반반
            </Text>
            <Text style={{ fontSize: 13, color: "#787878", marginTop: 4 }}>
              김철수님
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={{
              padding: 8,
              borderRadius: 6,
              backgroundColor: "#1a1a1a",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14 }}>←</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* 주요 기능 - Linear 스타일 */}
        <View style={{ padding: 20 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: "#787878",
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            주요 기능
          </Text>

          {/* 미니멀 리스트 */}
          <View style={{ gap: 8 }}>
            {/* 일정 관리 */}
            <Pressable
              style={{
                backgroundColor: "#1a1a1a",
                padding: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#222",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "500", color: "#fff" }}
                  >
                    오늘 일정
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: "#787878", marginTop: 4 }}
                  >
                    3개의 일정이 있습니다
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 20, fontWeight: "700", color: "#5e6ad2" }}
                >
                  3
                </Text>
              </View>
            </Pressable>

            {/* 근로자 관리 */}
            <Pressable
              style={{
                backgroundColor: "#1a1a1a",
                padding: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#222",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "500", color: "#fff" }}
                  >
                    근로자 관리
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: "#787878", marginTop: 4 }}
                  >
                    12명 등록
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 20, fontWeight: "700", color: "#5e6ad2" }}
                >
                  12
                </Text>
              </View>
            </Pressable>

            {/* 거래처 관리 */}
            <Pressable
              style={{
                backgroundColor: "#1a1a1a",
                padding: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#222",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "500", color: "#fff" }}
                  >
                    거래처 관리
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: "#787878", marginTop: 4 }}
                  >
                    8개 거래처
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 20, fontWeight: "700", color: "#5e6ad2" }}
                >
                  8
                </Text>
              </View>
            </Pressable>

            {/* 급여 관리 */}
            <Pressable
              style={{
                backgroundColor: "#1a1a1a",
                padding: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#222",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "500", color: "#fff" }}
                  >
                    이번 달 급여
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: "#787878", marginTop: 4 }}
                  >
                    2024년 1월
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 20, fontWeight: "700", color: "#5e6ad2" }}
                >
                  ₩2.4M
                </Text>
              </View>
            </Pressable>
          </View>

          {/* 오늘 일정 */}
          <View style={{ marginTop: 40 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "#787878",
                marginBottom: 16,
                textTransform: "uppercase",
              }}
            >
              오늘 일정
            </Text>

            <View style={{ gap: 8 }}>
              {/* 일정 카드 */}
              <View
                style={{
                  backgroundColor: "#1a1a1a",
                  padding: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#222",
                }}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: "#fff" }}
                >
                  제품 A 설비 점검
                </Text>
                <Text style={{ fontSize: 12, color: "#787878", marginTop: 6 }}>
                  09:00 - 12:00
                </Text>
                <View
                  style={{
                    height: 1,
                    backgroundColor: "#222",
                    marginVertical: 8,
                  }}
                />
                <Text style={{ fontSize: 12, color: "#787878" }}>
                  서울시 강남구 테헤란로
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "#1a1a1a",
                  padding: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#222",
                }}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: "#fff" }}
                >
                  B 건물 냉난방 점검
                </Text>
                <Text style={{ fontSize: 12, color: "#787878", marginTop: 6 }}>
                  14:00 - 16:00
                </Text>
                <View
                  style={{
                    height: 1,
                    backgroundColor: "#222",
                    marginVertical: 8,
                  }}
                />
                <Text style={{ fontSize: 12, color: "#787878" }}>
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
