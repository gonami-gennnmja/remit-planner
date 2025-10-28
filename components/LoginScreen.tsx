// @ts-nocheck - web-specific properties cause type conflicts with React Native
import { initializeAuthDB, login } from "@/utils/authUtils";
import { signInWithSocial, SocialProvider } from "@/utils/socialAuth";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
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

const { width, height } = Dimensions.get("window");

// 반응형 기준점
const isTablet = width >= 768;
const isDesktop = width >= 1024;
const isSmallScreen = height < 700;

export default function LoginScreen() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useRouter();

  // 반응형 값 계산
  const getResponsiveSize = (
    mobile: number,
    tablet?: number,
    desktop?: number
  ) => {
    if (Platform.OS === "web") {
      return undefined; // 웹은 CSS clamp 사용
    }
    if (isDesktop && desktop) return desktop;
    if (isTablet && tablet) return tablet;
    return mobile;
  };

  // 반응형 스타일
  const responsiveStyles = useMemo(
    () => ({
      headerPaddingTop: getResponsiveSize(isSmallScreen ? 40 : 60, 60, 80),
      headerPaddingBottom: getResponsiveSize(isSmallScreen ? 20 : 40, 40, 60),
      logoSize: getResponsiveSize(isSmallScreen ? 48 : 56, 64, 72),
      logoIconSize: getResponsiveSize(isSmallScreen ? 24 : 28, 32, 36),
      titleSize: getResponsiveSize(isSmallScreen ? 24 : 32, 32, 36),
      subtitleSize: getResponsiveSize(isSmallScreen ? 14 : 15, 15, 16),
      formMarginBottom: getResponsiveSize(isSmallScreen ? 20 : 40, 40, 60),
      containerPadding: getResponsiveSize(isSmallScreen ? 16 : 20, 20, 24),
      socialButtonSize: getResponsiveSize(isSmallScreen ? 48 : 56, 60, 64),
    }),
    [isSmallScreen, isTablet, isDesktop]
  );

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
      <View
        style={[
          styles.header,
          {
            marginTop: responsiveStyles.headerPaddingTop,
            marginBottom: responsiveStyles.headerPaddingBottom,
          },
        ]}
      >
        <View
          style={[
            styles.logoContainer,
            {
              width: responsiveStyles.logoSize,
              height: responsiveStyles.logoSize,
            },
          ]}
        >
          <Image
            source={require("@/assets/images/favicon.png")}
            style={[
              styles.logoImage,
              {
                width: responsiveStyles.logoIconSize,
                height: responsiveStyles.logoIconSize,
              },
            ]}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.title, { fontSize: responsiveStyles.titleSize }]}>
          반반
        </Text>
        <Text
          style={[styles.subtitle, { fontSize: responsiveStyles.subtitleSize }]}
        >
          Half&Half - 일도 반반, 여유도 반반
        </Text>
      </View>

      {/* 로그인 폼 */}
      <View
        style={[
          styles.formContainer,
          {
            marginBottom: responsiveStyles.formMarginBottom,
          },
        ]}
      >
        <View style={styles.inputContainer}>
          <Ionicons
            name="person"
            size={20}
            color="#86868b"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="이메일 또는 아이디"
            placeholderTextColor="#86868b"
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
            color="#86868b"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor="#86868b"
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
              style={[
                styles.socialIconButton,
                styles.kakaoButton,
                {
                  width: responsiveStyles.socialButtonSize,
                  height: responsiveStyles.socialButtonSize,
                },
              ]}
              onPress={() => handleSocialLogin("kakao")}
              disabled={isLoading}
            >
              <Ionicons
                name="chatbubble"
                size={responsiveStyles.socialButtonSize / 2.3}
                color="#1d1d1f"
              />
            </Pressable>

            <Pressable
              style={[
                styles.socialIconButton,
                styles.googleButton,
                {
                  width: responsiveStyles.socialButtonSize,
                  height: responsiveStyles.socialButtonSize,
                },
              ]}
              onPress={() => handleSocialLogin("google")}
              disabled={isLoading}
            >
              <Ionicons
                name="logo-google"
                size={responsiveStyles.socialButtonSize / 2.3}
                color="#1d1d1f"
              />
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
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: responsiveStyles.containerPadding },
            ]}
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
    backgroundColor: "#f5f5f7", // Apple Compact soft gray background
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
    justifyContent: "center",
    // 기본 패딩은 인라인 스타일로 오버라이드됨
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
    // 기본값은 인라인 스타일로 오버라이드됨
    ...(Platform.OS === "web" && {
      // 모바일: 작은 여백, 태블릿: 중간 여백, 데스크톱: 큰 여백
      marginTop: "clamp(20px, 5vh, 80px)",
      marginBottom: "clamp(20px, 4vh, 60px)",
    }),
  },
  logoContainer: {
    borderRadius: 12, // Apple Compact emoji box radius
    backgroundColor: "#ffffff", // Apple Compact surface color
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, // Apple Compact very subtle shadow
    shadowRadius: 4,
    elevation: 2,
    // 기본 크기는 인라인 스타일로 오버라이드됨
    ...(Platform.OS === "web" && {
      // 모바일: 56px, 태블릿: 64px, 데스크톱: 72px
      width: "clamp(56px, 6vw, 72px)",
      height: "clamp(56px, 6vw, 72px)",
    }),
  },
  logoImage: {
    // 기본 크기는 인라인 스타일로 오버라이드됨
    ...(Platform.OS === "web" && {
      // 모바일: 24px, 태블릿: 28px, 데스크톱: 32px
      width: "clamp(24px, 3vw, 32px)",
      height: "clamp(24px, 3vw, 32px)",
    }),
  },
  title: {
    fontWeight: "700", // Bold
    color: "#1d1d1f", // Apple Compact primary text
    marginBottom: 8,
    // 기본 크기는 인라인 스타일로 오버라이드됨
    ...(Platform.OS === "web" && {
      // 모바일: 24px, 태블릿: 28px, 데스크톱: 32px
      fontSize: "clamp(24px, 3vw, 32px)",
    }),
  },
  subtitle: {
    color: "#86868b", // Apple Compact secondary text
    textAlign: "center",
    lineHeight: 22,
    // 기본 크기는 인라인 스타일로 오버라이드됨
    ...(Platform.OS === "web" && {
      // 모바일: 14px, 태블릿: 15px, 데스크톱: 16px
      fontSize: "clamp(14px, 1.8vw, 16px)",
      lineHeight: "clamp(20px, 2.2vw, 22px)",
    }),
  },
  formContainer: {
    gap: 10, // Apple Compact card gap
    // 기본 마진은 인라인 스타일로 오버라이드됨
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
    backgroundColor: "#ffffff", // Apple Compact surface color
    borderRadius: 14, // Apple Compact card border radius
    marginBottom: 10, // Apple Compact card gap
    padding: 16, // Apple Compact card padding
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, // Apple Compact very subtle shadow
    shadowRadius: 4,
    elevation: 2,
    // 웹 반응형 최적화 - 화면 크기별로 다르게
    ...(Platform.OS === "web" && {
      // @ts-ignore - web-specific properties
      cursor: "text",
      userSelect: "none",
      // 모바일: 48px, 태블릿: 56px, 데스크톱: 64px
      minHeight: "clamp(48px, 6vh, 64px)",
    }),
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16, // Apple Compact input text size
    color: "#1d1d1f", // Apple Compact primary text
    // 웹 최적화
    ...(Platform.OS === "web" && {
      outline: "none",
      border: "none",
      backgroundColor: "transparent",
      minHeight: 20,
      fontSize: "clamp(14px, 2vw, 16px)",
    }),
  },
  loginButton: {
    backgroundColor: "#1d1d1f", // Apple Compact primary text color for button
    padding: 16, // Apple Compact button padding
    borderRadius: 14, // Apple Compact card border radius
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, // Apple Compact very subtle shadow
    shadowRadius: 4,
    elevation: 2,
    // 웹 반응형 최적화 - 화면 크기별로 다르게
    ...(Platform.OS === "web" && {
      // 모바일: 44px, 태블릿: 52px, 데스크톱: 60px
      paddingVertical: "clamp(12px, 2vh, 18px)",
      minHeight: "clamp(44px, 6vh, 60px)",
    }),
  },
  loginButtonDisabled: {
    backgroundColor: "#86868b", // Apple Compact secondary text for disabled
  },
  loginButtonText: {
    color: "#ffffff", // White text on dark button
    fontSize: 16, // Apple Compact button text
    fontWeight: "600", // Semibold
    // 웹 반응형 최적화
    ...(Platform.OS === "web" && {
      fontSize: "clamp(14px, 2vw, 16px)",
    }),
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.08)", // Subtle divider line
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#86868b", // Apple Compact secondary text
    fontSize: 14,
  },
  socialContainer: {
    alignItems: "center",
    gap: 16,
  },
  socialLoginTitle: {
    fontSize: 14,
    color: "#86868b", // Apple Compact secondary text
    fontWeight: "500",
    marginBottom: 8,
  },
  socialButtonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  socialIconButton: {
    width: 56, // Apple Compact emoji box size
    height: 56,
    borderRadius: 14, // Apple Compact card border radius
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, // Apple Compact very subtle shadow
    shadowRadius: 4,
    elevation: 2,
    // 웹 반응형 최적화 - 화면 크기별로 다르게
    ...(Platform.OS === "web" && {
      // 모바일: 56px, 태블릿: 60px, 데스크톱: 64px
      width: "clamp(56px, 6vw, 64px)",
      height: "clamp(56px, 6vw, 64px)",
    }),
  },
  kakaoButton: {
    backgroundColor: "#ffffff",
  },
  googleButton: {
    backgroundColor: "#ffffff",
  },
  appleButton: {
    backgroundColor: "#1d1d1f",
  },
  footer: {
    alignItems: "center",
    gap: 16,
    marginBottom: 40,
  },
  footerText: {
    color: "#86868b", // Apple Compact secondary text
    fontSize: 14,
  },
  footerLink: {
    color: "#1d1d1f", // Apple Compact primary text
    fontSize: 14,
    fontWeight: "600", // Semibold
  },
  signupContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
