import { Theme } from "@/constants/Theme";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResetPassword = async () => {
    // 이메일 검증
    if (!email.trim()) {
      Alert.alert("오류", "이메일을 입력해주세요.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("오류", "올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo:
            Platform.OS === "web"
              ? `${window.location.origin}/reset-password`
              : "banbanhalf://reset-password",
        }
      );

      setIsLoading(false);

      if (error) {
        console.error("비밀번호 재설정 오류:", error);

        // 에러 메시지 번역
        let errorMessage = "비밀번호 재설정 링크 전송에 실패했습니다.";
        if (error.message.includes("rate limit")) {
          errorMessage =
            "이메일 전송 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.";
        } else if (error.message.includes("not found")) {
          errorMessage = "등록되지 않은 이메일입니다.";
        }

        Alert.alert("오류", errorMessage);
      } else {
        setIsSent(true);
        Alert.alert(
          "이메일 전송 완료",
          "비밀번호 재설정 링크가 이메일로 전송되었습니다.\n이메일을 확인해주세요.",
          [
            {
              text: "확인",
              onPress: () => router.replace("/"),
            },
          ]
        );
      }
    } catch (error) {
      console.error("비밀번호 재설정 오류:", error);
      setIsLoading(false);
      Alert.alert(
        "오류",
        "비밀번호 재설정 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={Theme.colors.text.primary}
            />
          </Pressable>

          <View style={styles.iconContainer}>
            <Ionicons
              name="key-outline"
              size={48}
              color={Theme.colors.primary}
            />
          </View>

          <Text style={styles.title}>비밀번호 찾기</Text>
          <Text style={styles.subtitle}>
            가입하신 이메일 주소를 입력하시면{"\n"}
            비밀번호 재설정 링크를 보내드립니다.
          </Text>
        </View>

        {/* 폼 */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일 주소</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#6b7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
                editable={!isSent}
              />
            </View>
          </View>

          <Pressable
            style={[
              styles.resetButton,
              (isLoading || isSent) && styles.resetButtonDisabled,
            ]}
            onPress={handleResetPassword}
            disabled={isLoading || isSent}
          >
            <Text style={styles.resetButtonText}>
              {isLoading
                ? "전송 중..."
                : isSent
                ? "전송 완료"
                : "재설정 링크 보내기"}
            </Text>
          </Pressable>
        </View>

        {/* 안내 메시지 */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={Theme.colors.primary}
            />
            <Text style={styles.infoText}>
              이메일이 도착하지 않았나요?{"\n"}
              스팸 메일함을 확인해주세요.
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="time-outline"
              size={20}
              color={Theme.colors.primary}
            />
            <Text style={styles.infoText}>링크는 1시간 동안 유효합니다.</Text>
          </View>
        </View>

        {/* 로그인 링크 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>비밀번호가 기억나셨나요? </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.footerLink}>로그인</Text>
          </Pressable>
        </View>

        {/* 고객센터 링크 */}
        <View style={styles.supportContainer}>
          <Text style={styles.supportText}>
            문제가 계속되나요?{" "}
            <Pressable>
              <Text style={styles.supportLink}>고객센터 문의</Text>
            </Pressable>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.xxl,
    paddingBottom: Theme.spacing.xxl,
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignSelf: "flex-start",
    marginBottom: Theme.spacing.xl,
  },
  iconContainer: {
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
    marginBottom: Theme.spacing.md,
  },
  subtitle: {
    fontSize: Theme.typography.sizes.md,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
  },
  formContainer: {
    marginBottom: Theme.spacing.xxl,
  },
  inputGroup: {
    marginBottom: Theme.spacing.xl,
  },
  label: {
    fontSize: Theme.typography.sizes.sm,
    fontWeight: Theme.typography.weights.medium,
    color: Theme.colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
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
  resetButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    alignItems: "center",
    ...Theme.shadows.sm,
  },
  resetButtonDisabled: {
    backgroundColor: Theme.colors.text.tertiary,
  },
  resetButtonText: {
    color: Theme.colors.text.inverse,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
  },
  infoContainer: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xxl,
    gap: Theme.spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Theme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: Theme.typography.sizes.sm,
    color: Theme.colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Theme.spacing.lg,
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
  supportContainer: {
    alignItems: "center",
  },
  supportText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.tertiary,
  },
  supportLink: {
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
    textDecorationLine: "underline",
  },
});
