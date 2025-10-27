import { router } from "expo-router";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function StripeMock() {
  return (
    <View style={{ flex: 1, backgroundColor: "#f6f9fc" }}>
      {/* 헤더 - Stripe 스타일 */}
      <View
        style={{
          padding: 24,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#e6ebf1",
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
            <Text style={{ fontSize: 26, fontWeight: "600", color: "#0a2540" }}>
              반반
            </Text>
            <Text style={{ fontSize: 14, color: "#68768a", marginTop: 4 }}>
              김철수님
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={{
              padding: 10,
              borderRadius: 6,
              backgroundColor: "#f6f9fc",
            }}
          >
            <Text style={{ color: "#68768a", fontSize: 16 }}>←</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* 대시보드 통계 - Stripe 스타일 */}
        <View style={{ padding: 24 }}>
          {/* 상단 통계 카드 */}
          <View style={{ flexDirection: "row", gap: 16, marginBottom: 24 }}>
            {/* 일정 */}
            <View
              style={{
                flex: 1,
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#e6ebf1",
              }}
            >
              <Text style={{ fontSize: 12, color: "#68768a", marginBottom: 8 }}>
                오늘 일정
              </Text>
              <Text
                style={{ fontSize: 32, fontWeight: "700", color: "#0a2540" }}
              >
                3
              </Text>
            </View>

            {/* 근로자 */}
            <View
              style={{
                flex: 1,
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#e6ebf1",
              }}
            >
              <Text style={{ fontSize: 12, color: "#68768a", marginBottom: 8 }}>
                등록 근로자
              </Text>
              <Text
                style={{ fontSize: 32, fontWeight: "700", color: "#0a2540" }}
              >
                12
              </Text>
            </View>

            {/* 거래처 */}
            <View
              style={{
                flex: 1,
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#e6ebf1",
              }}
            >
              <Text style={{ fontSize: 12, color: "#68768a", marginBottom: 8 }}>
                거래처
              </Text>
              <Text
                style={{ fontSize: 32, fontWeight: "700", color: "#0a2540" }}
              >
                8
              </Text>
            </View>
          </View>

          {/* 급여 카드 - 강조 */}
          <View
            style={{
              backgroundColor: "#0a2540",
              padding: 24,
              borderRadius: 12,
              marginBottom: 32,
            }}
          >
            <Text style={{ fontSize: 14, color: "#68768a", marginBottom: 12 }}>
              이번 달 급여
            </Text>
            <Text
              style={{
                fontSize: 48,
                fontWeight: "700",
                color: "#fff",
                marginBottom: 8,
              }}
            >
              ₩2.4M
            </Text>
            <Text style={{ fontSize: 14, color: "#68768a" }}>
              +15% 전월 대비
            </Text>
          </View>

          {/* 주요 기능 */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#0a2540",
              marginBottom: 16,
            }}
          >
            빠른 접근
          </Text>

          <View style={{ gap: 10 }}>
            <Pressable
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#e6ebf1",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "500",
                  color: "#0a2540",
                  marginBottom: 4,
                }}
              >
                일정 관리
              </Text>
              <Text style={{ fontSize: 13, color: "#68768a" }}>
                오늘의 일정을 확인하고 관리합니다
              </Text>
            </Pressable>

            <Pressable
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#e6ebf1",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "500",
                  color: "#0a2540",
                  marginBottom: 4,
                }}
              >
                근로자 관리
              </Text>
              <Text style={{ fontSize: 13, color: "#68768a" }}>
                근로자 정보와 근태를 관리합니다
              </Text>
            </Pressable>

            <Pressable
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#e6ebf1",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "500",
                  color: "#0a2540",
                  marginBottom: 4,
                }}
              >
                거래처 관리
              </Text>
              <Text style={{ fontSize: 13, color: "#68768a" }}>
                거래처 정보를 관리합니다
              </Text>
            </Pressable>

            <Pressable
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#e6ebf1",
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "500",
                  color: "#0a2540",
                  marginBottom: 4,
                }}
              >
                급여 관리
              </Text>
              <Text style={{ fontSize: 13, color: "#68768a" }}>
                월별 급여를 관리합니다
              </Text>
            </Pressable>
          </View>

          {/* 오늘 일정 */}
          <View style={{ marginTop: 32 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#0a2540",
                marginBottom: 16,
              }}
            >
              오늘 일정
            </Text>

            <View style={{ gap: 10 }}>
              <View
                style={{
                  backgroundColor: "#fff",
                  padding: 16,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#e6ebf1",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: "#0a2540",
                    marginBottom: 8,
                  }}
                >
                  제품 A 설비 점검
                </Text>
                <View
                  style={{
                    height: 1,
                    backgroundColor: "#e6ebf1",
                    marginVertical: 8,
                  }}
                />
                <Text
                  style={{ fontSize: 13, color: "#68768a", marginBottom: 4 }}
                >
                  09:00 - 12:00
                </Text>
                <Text style={{ fontSize: 13, color: "#68768a" }}>
                  서울시 강남구 테헤란로
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "#fff",
                  padding: 16,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#e6ebf1",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: "#0a2540",
                    marginBottom: 8,
                  }}
                >
                  B 건물 냉난방 점검
                </Text>
                <View
                  style={{
                    height: 1,
                    backgroundColor: "#e6ebf1",
                    marginVertical: 8,
                  }}
                />
                <Text
                  style={{ fontSize: 13, color: "#68768a", marginBottom: 4 }}
                >
                  14:00 - 16:00
                </Text>
                <Text style={{ fontSize: 13, color: "#68768a" }}>
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
