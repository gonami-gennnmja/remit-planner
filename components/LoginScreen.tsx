// @ts-nocheck - web-specific properties cause type conflicts with React Native
import { Theme } from "@/constants/Theme";
import { initializeAuthDB, login } from "@/utils/authUtils";
import { signInWithSocial, SocialProvider } from "@/utils/socialAuth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
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
      const result = await login(userId.trim(), password.trim());

      setIsLoading(false);

      if (result.success && result.user) {
        // 비동기적으로 화면 전환
        setTimeout(() => {
          navigation.push("/main");
        }, 100);
      } else {
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

  const handleSocialLogin = async (provider: SocialProvider) => {
    setIsLoading(true);

    try {
      const result = await signInWithSocial(provider);

      setIsLoading(false);

      if (result.success) {
        // 웹에서는 OAuth 플로우가 redirect로 처리됨
        // OAuth 완료 후 자동으로 세션이 설정되고 메인 화면으로 이동
      } else {
        Alert.alert(
          "소셜 로그인 실패",
          result.message ||
            "로그인에 실패했습니다. Supabase에서 OAuth 프로바이더 설정을 확인해주세요."
        );
      }
    } catch (error) {
      console.error("소셜 로그인 오류:", error);
      setIsLoading(false);
      Alert.alert(
        "오류",
        "소셜 로그인 중 오류가 발생했습니다.\n\nSupabase 대시보드에서 Kakao OAuth 설정을 확인해주세요.\n설정 > Authentication > Providers > Kakao"
      );
    }
  };

  // 키보드 숨기기 함수
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // 안드로이드에서 뒤로가기 버튼으로 키보드 숨기기
  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        // 키보드가 숨겨질 때 추가 처리 (필요시)
      }
    );

    return () => {
      keyboardDidHideListener?.remove();
    };
  }, []);

  const renderContent = () => (
    <>
      {/* 로고 및 타이틀 */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/favicon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>반반</Text>
        <Text style={styles.subtitle}>Half&Half - 일도 반반, 여유도 반반</Text>
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
            placeholder="이메일 또는 아이디"
            placeholderTextColor="#9ca3af"
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => {
              // 다음 필드로 포커스 이동 (비밀번호 필드)
              // React Native에서는 자동으로 다음 TextInput으로 이동
            }}
            // 안드로이드 최적화
            importantForAutofill="yes"
            textContentType="emailAddress"
            // 웹 최적화
            {...(Platform.OS === "web" && {
              autoFocus: false,
              selectTextOnFocus: true,
              editable: true,
            })}
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
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            blurOnSubmit={true}
            // 안드로이드 최적화
            importantForAutofill="yes"
            textContentType="password"
            // 웹 최적화
            {...(Platform.OS === "web" && {
              autoFocus: false,
              selectTextOnFocus: true,
              editable: true,
            })}
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
              onPress={() => handleSocialLogin("kakao")}
              disabled={isLoading}
            >
              <Ionicons name="chatbubble" size={28} color="#000000" />
            </Pressable>

            <Pressable
              style={[styles.socialIconButton, styles.googleButton]}
              onPress={() => handleSocialLogin("google")}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={28} color="#4285F4" />
            </Pressable>

            {/* Apple Login - 추후 구현 ($99/년 필요) */}
            {/* <Pressable
          style={[styles.socialIconButton, styles.appleButton]}
          onPress={() => handleSocialLogin("apple")}
          disabled={isLoading}
        >
          <Ionicons name="logo-apple" size={28} color="white" />
        </Pressable> */}
          </View>
        </View>
      </View>

      {/* 하단 링크 */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => navigation.push("/auth/forgot-password" as any)}
        >
          <Text style={styles.footerLink}>비밀번호를 잊으셨나요?</Text>
        </Pressable>
        <View style={styles.signupContainer}>
          <Text style={styles.footerText}>계정이 없으신가요? </Text>
          <Pressable onPress={() => navigation.push("/auth/signup" as any)}>
            <Text style={styles.footerLink}>회원가입</Text>
          </Pressable>
        </View>
      </View>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {Platform.OS === "web" ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      ) : (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {renderContent()}
          </ScrollView>
        </TouchableWithoutFeedback>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    // 웹 반응형 최적화
    ...(Platform.OS === "web" && {
      minHeight: "100vh",
      width: "100%",
      maxWidth: "none",
      marginHorizontal: 0,
    }),
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing.xxl,
    justifyContent: "center",
    // 웹 반응형 최적화 - 화면 크기별로 다르게
    ...(Platform.OS === "web" && {
      // 모바일: 100% 너비, 태블릿: 80% 너비, 데스크톱: 60% 너비
      width: "clamp(100%, 60vw, 60%)",
      maxWidth: "clamp(400px, 60vw, 800px)",
      marginHorizontal: "auto",
      paddingHorizontal: "clamp(16px, 4vw, 48px)",
    }),
  },
  header: {
    alignItems: "center",
    marginTop: 100,
    marginBottom: 60,
    // 웹 반응형 최적화 - 화면 크기별로 다르게
    ...(Platform.OS === "web" && {
      // 모바일: 작은 여백, 태블릿: 중간 여백, 데스크톱: 큰 여백
      marginTop: "clamp(20px, 5vh, 80px)",
      marginBottom: "clamp(20px, 4vh, 60px)",
    }),
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
    // 웹 반응형 최적화 - 화면 크기별로 다르게
    ...(Platform.OS === "web" && {
      // 모바일: 60px, 태블릿: 80px, 데스크톱: 100px
      width: "clamp(60px, 6vw, 100px)",
      height: "clamp(60px, 6vw, 100px)",
    }),
  },
  logoImage: {
    width: 60,
    height: 60,
    // 웹 반응형 최적화 - 화면 크기별로 다르게
    ...(Platform.OS === "web" && {
      // 모바일: 45px, 태블릿: 60px, 데스크톱: 75px
      width: "clamp(45px, 4.5vw, 75px)",
      height: "clamp(45px, 4.5vw, 75px)",
    }),
  },
  title: {
    fontSize: Theme.typography.sizes.xxxl,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
    // 웹 반응형 최적화 - 화면 크기별로 다르게
    ...(Platform.OS === "web" && {
      // 모바일: 24px, 태블릿: 28px, 데스크톱: 32px
      fontSize: "clamp(24px, 3vw, 32px)",
    }),
  },
  subtitle: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    // 웹 반응형 최적화 - 화면 크기별로 다르게
    ...(Platform.OS === "web" && {
      // 모바일: 14px, 태블릿: 16px, 데스크톱: 18px
      fontSize: "clamp(14px, 2vw, 18px)",
      lineHeight: "clamp(20px, 2.5vw, 24px)",
    }),
  },
  formContainer: {
    marginBottom: 60,
    // 웹 반응형 최적화 - 화면 크기별로 다르게
    ...(Platform.OS === "web" && {
      marginBottom: "clamp(40px, 8vh, 80px)",
      // 모바일: 90% 너비, 태블릿: 70% 너비, 데스크톱: 50% 너비
      width: "clamp(90%, 50vw, 50%)",
      maxWidth: "clamp(400px, 50vw, 500px)",
      marginHorizontal: "auto",
    }),
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
    // 웹 반응형 최적화 - 화면 크기별로 다르게
    ...(Platform.OS === "web" && {
      // @ts-ignore - web-specific properties
      cursor: "text",
      userSelect: "none",
      // 모바일: 48px, 태블릿: 56px, 데스크톱: 64px
      minHeight: "clamp(48px, 6vh, 64px)",
      paddingHorizontal: "clamp(12px, 3vw, 20px)",
    }),
  },
  inputIcon: {
    marginRight: Theme.spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: Theme.spacing.lg,
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.primary,
    // 웹 최적화
    ...(Platform.OS === "web" && {
      outline: "none",
      border: "none",
      backgroundColor: "transparent",
      minHeight: 20,
      fontSize: "clamp(14px, 2vw, 16px)",
      paddingVertical: "clamp(8px, 1.5vh, 12px)",
    }),
  },
  loginButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    alignItems: "center",
    marginBottom: Theme.spacing.xxl,
    ...Theme.shadows.sm,
    // 웹 반응형 최적화 - 화면 크기별로 다르게
    ...(Platform.OS === "web" && {
      // 모바일: 44px, 태블릿: 52px, 데스크톱: 60px
      paddingVertical: "clamp(12px, 2vh, 18px)",
      minHeight: "clamp(44px, 6vh, 60px)",
    }),
  },
  loginButtonDisabled: {
    backgroundColor: Theme.colors.text.tertiary,
  },
  loginButtonText: {
    color: Theme.colors.text.inverse,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
    // 웹 반응형 최적화
    ...(Platform.OS === "web" && {
      fontSize: "clamp(14px, 2vw, 16px)",
    }),
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
    // 웹 반응형 최적화 - 화면 크기별로 다르게
    ...(Platform.OS === "web" && {
      // 모바일: 48px, 태블릿: 56px, 데스크톱: 64px
      width: "clamp(48px, 6vw, 64px)",
      height: "clamp(48px, 6vw, 64px)",
    }),
  },
  kakaoButton: {
    backgroundColor: "#FEE500",
    borderColor: "#FEE500",
  },
  googleButton: {
    backgroundColor: Theme.colors.card,
    borderColor: Theme.colors.border.light,
  },
  appleButton: {
    backgroundColor: "#000000",
    borderColor: "#000000",
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
