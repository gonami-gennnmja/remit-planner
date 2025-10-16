import { Theme } from "@/constants/Theme";
import { initializeAuthDB, login } from "@/utils/authUtils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useRouter();

  useEffect(() => {
    // Auth DB 초기화
    initializeAuthDB();
  }, []);

  const handleLogin = async () => {
    // 입력값 검증
    if (!userId.trim() || !password.trim()) {
      Alert.alert("오류", "아이디와 비밀번호를 입력해주세요.");
      return;
    }

    // 로딩 상태 설정
    setIsLoading(true);

    try {
      console.log("로그인 시도:", { userId, password: "***" });

      const result = await login(userId.trim(), password.trim());
      console.log("로그인 결과:", result);

      setIsLoading(false);

      if (result.success && result.user) {
        console.log("로그인 성공:", result.user.name);
        // 비동기적으로 화면 전환
        setTimeout(() => {
          console.log("메인 화면으로 이동 시도");
          navigation.push("/main");
        }, 100);
      } else {
        console.log("로그인 실패:", result.message);
        Alert.alert(
          "로그인 실패",
          result.message || "아이디 또는 비밀번호가 올바르지 않습니다."
        );
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      setIsLoading(false);
      Alert.alert("오류", "로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert("소셜 로그인", `${provider} 로그인은 추후 구현 예정입니다.`, [
      { text: "확인" },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 로고 및 타이틀 */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="calendar" size={48} color={Theme.colors.primary} />
        </View>
        <Text style={styles.title}>리밋 플래너</Text>
        <Text style={styles.subtitle}>
          스케줄과 근로자를 효율적으로 관리하세요
        </Text>
      </View>

      {/* 로그인 폼 */}
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Ionicons
            name="person"
            size={20}
            color="#6b7280"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="아이디"
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            returnKeyType="next"
            blurOnSubmit={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed"
            size={20}
            color="#6b7280"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
        </View>

        <Pressable
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          android_ripple={{ color: "rgba(255, 255, 255, 0.2)" }}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? "로그인 중..." : "로그인"}
          </Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* 소셜 로그인 버튼들 */}
        <View style={styles.socialContainer}>
          <Text style={styles.socialLoginTitle}>소셜 로그인</Text>
          <View style={styles.socialButtonRow}>
            <Pressable
              style={[styles.socialIconButton, styles.kakaoButton]}
              onPress={() => handleSocialLogin("카카오톡")}
            >
              <Ionicons name="chatbubble" size={28} color="#000000" />
            </Pressable>

            <Pressable
              style={[styles.socialIconButton, styles.naverButton]}
              onPress={() => handleSocialLogin("네이버")}
            >
              <Text style={styles.naverIcon}>N</Text>
            </Pressable>

            <Pressable
              style={[styles.socialIconButton, styles.googleButton]}
              onPress={() => handleSocialLogin("구글")}
            >
              <Ionicons name="logo-google" size={28} color="#4285F4" />
            </Pressable>

            <Pressable
              style={[styles.socialIconButton, styles.appleButton]}
              onPress={() => handleSocialLogin("애플")}
            >
              <Ionicons name="logo-apple" size={28} color="white" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* 하단 링크 */}
      <View style={styles.footer}>
        <Pressable>
          <Text style={styles.footerLink}>비밀번호를 잊으셨나요?</Text>
        </Pressable>
        <View style={styles.signupContainer}>
          <Text style={styles.footerText}>계정이 없으신가요? </Text>
          <Pressable>
            <Text style={styles.footerLink}>회원가입</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: Theme.spacing.xxl,
  },
  header: {
    alignItems: "center",
    marginTop: 100,
    marginBottom: 60,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Theme.spacing.xl,
    ...Theme.shadows.sm,
  },
  title: {
    fontSize: Theme.typography.sizes.xxxl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  subtitle: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
  },
  formContainer: {
    marginBottom: 60,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border.light,
    ...Theme.shadows.sm,
  },
  inputIcon: {
    marginRight: Theme.spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: Theme.spacing.lg,
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
  },
  loginButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    alignItems: "center",
    marginBottom: Theme.spacing.xxl,
    ...Theme.shadows.sm,
  },
  loginButtonDisabled: {
    backgroundColor: Theme.colors.text.tertiary,
  },
  loginButtonText: {
    color: Theme.colors.text.inverse,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Theme.spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.border.light,
  },
  dividerText: {
    marginHorizontal: Theme.spacing.lg,
    color: Theme.colors.text.secondary,
    fontSize: Theme.typography.sizes.sm,
  },
  socialContainer: {
    alignItems: "center",
    gap: Theme.spacing.lg,
  },
  socialLoginTitle: {
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    fontWeight: Theme.typography.weights.medium,
    marginBottom: Theme.spacing.xs,
  },
  socialButtonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Theme.spacing.lg,
  },
  socialIconButton: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    ...Theme.shadows.sm,
  },
  kakaoButton: {
    backgroundColor: "#FEE500",
    borderColor: "#FEE500",
  },
  naverButton: {
    backgroundColor: "#03C75A",
    borderColor: "#03C75A",
  },
  naverIcon: {
    fontSize: 24,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.inverse,
  },
  googleButton: {
    backgroundColor: Theme.colors.card,
    borderColor: Theme.colors.border.light,
  },
  appleButton: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  footer: {
    alignItems: "center",
    gap: Theme.spacing.lg,
  },
  footerText: {
    color: Theme.colors.text.secondary,
    fontSize: Theme.typography.sizes.sm,
  },
  footerLink: {
    color: Theme.colors.primary,
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
  },
  signupContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
