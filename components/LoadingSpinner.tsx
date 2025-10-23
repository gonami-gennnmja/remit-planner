import { Theme } from "@/constants/Theme";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "large";
}

export default function LoadingSpinner({
  message = "데이터를 불러오는 중...",
  size = "large",
}: LoadingSpinnerProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [ecgPath, setEcgPath] = useState("M 0 20");
  const [currentX, setCurrentX] = useState(0);

  useEffect(() => {
    // 심전도 그래프 그리기 애니메이션
    const drawingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ])
    );

    drawingAnimation.start();

    // 진행률에 따라 ECG 패스 업데이트
    const updateECG = () => {
      const value = progress._value;
      const width = 180;
      const height = 40;
      const centerY = height / 2;

      let path = `M 0 ${centerY}`;
      const steps = Math.floor(value * 60); // 60개 포인트
      setCurrentX(value * width);

      for (let i = 0; i <= steps; i++) {
        const x = (i / 60) * width;
        let y = centerY;

        // 심전도 패턴 생성 (4번의 심장박동)
        const cycle = (i / 60) * 4;
        const cyclePos = cycle % 1;

        // 불규칙성을 위한 노이즈 추가
        const noise = Math.sin(i * 0.3) * 0.5 + Math.sin(i * 0.7) * 0.3;
        const randomVariation = (Math.random() - 0.5) * 2;

        if (cyclePos < 0.08) {
          // P파 (작은 상승) - 불규칙한 높이
          const pHeight = 4 + Math.sin(i * 0.5) * 2;
          y = centerY - (cyclePos / 0.08) * pHeight;
        } else if (cyclePos < 0.15) {
          // QRS 복합체 (큰 상승) - 불규칙한 피크
          const qrsHeight = 8 + Math.sin(i * 0.8) * 4;
          y = centerY - 4 - ((cyclePos - 0.08) / 0.07) * qrsHeight;
        } else if (cyclePos < 0.25) {
          // S파 (하강) - 불규칙한 골짜기
          const sDepth = 6 + Math.sin(i * 0.6) * 3;
          y = centerY - 12 + ((cyclePos - 0.15) / 0.1) * sDepth;
        } else if (cyclePos < 0.45) {
          // T파 (중간 상승) - 불규칙한 T파
          const tHeight = 5 + Math.sin(i * 0.4) * 3;
          y = centerY - 6 + ((cyclePos - 0.25) / 0.2) * tHeight;
        } else {
          // 휴식 (기준선) - 미세한 노이즈
          y = centerY + noise * 0.5;
        }

        // 전체적인 불규칙성 추가
        y += noise + randomVariation * 0.3;

        path += ` L ${x} ${y}`;
      }

      setEcgPath(path);
    };

    // 애니메이션 업데이트
    const interval = setInterval(updateECG, 50); // 50ms마다 업데이트

    return () => {
      drawingAnimation.stop();
      clearInterval(interval);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.screenFrame}>
        <Svg width={180} height={40} style={styles.ecgSvg}>
          <Path
            d={ecgPath}
            stroke={Theme.colors.primary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 그리기 커서 */}
          <Circle
            cx={currentX}
            cy={20}
            r="3"
            fill={Theme.colors.primary}
            opacity={0.8}
          />
        </Svg>
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.xl,
  },
  screenFrame: {
    width: 200,
    height: 60,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    borderRadius: 12,
    backgroundColor: Theme.colors.surface,
    overflow: "hidden",
    position: "relative",
    shadowColor: Theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  ecgSvg: {
    position: "absolute",
  },
  message: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    fontWeight: Theme.typography.weights.medium,
    marginTop: Theme.spacing.lg,
  },
});
