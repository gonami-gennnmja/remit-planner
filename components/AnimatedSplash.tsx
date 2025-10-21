import { useI18n } from "@/contexts/LocalizationContext";
import { useTheme } from "@/contexts/ThemeContext";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";

const { width, height } = Dimensions.get("window");

export default function AnimatedSplash() {
  const { colors } = useTheme();
  const { t } = useI18n();

  // 애니메이션 값들
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // 아이템별 애니메이션 값들
  const calendarAnim = useRef(new Animated.Value(0)).current;
  const coinAnim = useRef(new Animated.Value(0)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;

  // 텍스트 애니메이션
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 메인 캐릭터 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // 아이템들 순차 등장 (캐릭터 애니메이션 후)
    setTimeout(() => {
      Animated.timing(calendarAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 800);

    setTimeout(() => {
      Animated.timing(coinAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 1200);

    setTimeout(() => {
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 1600);

    // 텍스트 애니메이션 (마지막에)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2000);
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 메인 캐릭터 영역 */}
      <View style={styles.characterContainer}>
        <Animated.View
          style={[
            styles.character,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { rotate: rotateInterpolate }],
            },
          ]}
        >
          {/* 반반 캐릭터 (민트 그린 + 복숭아색) */}
          <View style={styles.characterBody}>
            <View style={[styles.half, { backgroundColor: "#A8E6CF" }]} />
            <View style={[styles.half, { backgroundColor: "#FFD3A5" }]} />
          </View>

          {/* 캐릭터 얼굴 */}
          <View style={styles.face}>
            <View style={styles.eye} />
            <View style={styles.eye} />
            <View style={styles.mouth} />
          </View>
        </Animated.View>

        {/* 달력 아이템 */}
        <Animated.View
          style={[
            styles.item,
            styles.calendar,
            {
              opacity: calendarAnim,
              transform: [
                {
                  translateY: calendarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.itemText}>📅</Text>
        </Animated.View>

        {/* 동전 아이템 */}
        <Animated.View
          style={[
            styles.item,
            styles.coin,
            {
              opacity: coinAnim,
              transform: [
                {
                  translateY: coinAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.itemText}>💰</Text>
        </Animated.View>

        {/* 차트 아이템 */}
        <Animated.View
          style={[
            styles.item,
            styles.chart,
            {
              opacity: chartAnim,
              transform: [
                {
                  translateY: chartAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.itemText}>📊</Text>
        </Animated.View>
      </View>

      {/* 텍스트 영역 */}
      <View style={styles.textContainer}>
        <Animated.Text
          style={[
            styles.title,
            {
              color: colors.primary,
              opacity: titleAnim,
              transform: [
                {
                  translateY: titleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          반반
        </Animated.Text>

        <Animated.Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
              opacity: subtitleAnim,
              transform: [
                {
                  translateY: subtitleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          Half&Half - 일도 반반, 여유도 반반
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  characterContainer: {
    position: "relative",
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  character: {
    width: 120,
    height: 120,
    borderRadius: 60,
    position: "relative",
  },
  characterBody: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    flexDirection: "row",
    overflow: "hidden",
  },
  half: {
    flex: 1,
    height: "100%",
  },
  face: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -15 }, { translateY: -15 }],
    width: 30,
    height: 30,
    justifyContent: "space-between",
    alignItems: "center",
  },
  eye: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#333",
    marginBottom: 6,
  },
  mouth: {
    width: 12,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#333",
  },
  item: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calendar: {
    top: 20,
    right: 20,
  },
  coin: {
    bottom: 20,
    left: 20,
  },
  chart: {
    top: 20,
    left: 20,
  },
  itemText: {
    fontSize: 20,
  },
  textContainer: {
    marginTop: 60,
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
});
