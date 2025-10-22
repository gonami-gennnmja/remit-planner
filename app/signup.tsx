import { Theme } from "@/constants/Theme";
import { registerUser } from "@/utils/authUtils";
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

export default function SignupScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 에러 상태
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // 실시간 검증 함수들
  const validateName = (name: string) => {
    if (!name.trim()) {
      setErrors((prev) => ({ ...prev, name: "이름을 입력해주세요." }));
      return false;
    }
    setErrors((prev) => ({ ...prev, name: "" }));
    return true;
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: "이메일을 입력해주세요." }));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({
        ...prev,
        email: "올바른 이메일 형식을 입력해주세요.",
      }));
      return false;
    }

    // 중복 확인은 회원가입 시도 시 Supabase에서 자동으로 확인됨
    setErrors((prev) => ({ ...prev, email: "" }));
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setErrors((prev) => ({ ...prev, password: "비밀번호를 입력해주세요." }));
      return false;
    }
    if (password.length < 6) {
      setErrors((prev) => ({
        ...prev,
        password: "비밀번호는 최소 6자 이상이어야 합니다.",
      }));
      return false;
    }
    // 영문, 숫자, 특수문자 포함 검증
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
    if (!passwordRegex.test(password)) {
      setErrors((prev) => ({
        ...prev,
        password: "영문, 숫자, 특수문자를 포함하여 6자 이상 입력해주세요.",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, password: "" }));
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (confirmPassword !== formData.password) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "비밀번호가 일치하지 않습니다.",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    return true;
  };

  const handleSignup = async () => {
    // 모든 필드 검증
    const isNameValid = validateName(formData.name);
    const isEmailValid = validateEmail(formData.email);
    const isPasswordValid = validatePassword(formData.password);
    const isConfirmPasswordValid = validateConfirmPassword(
      formData.confirmPassword
    );

    // 하나라도 유효하지 않으면 중단
    if (
      !isNameValid ||
      !isEmailValid ||
      !isPasswordValid ||
      !isConfirmPasswordValid
    ) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser(
        formData.email.trim(),
        formData.password,
        formData.name.trim(),
        formData.email.trim()
      );

      setIsLoading(false);

      if (result.success) {
        Alert.alert(
          "회원가입 완료",
          "회원가입이 완료되었습니다. 로그인해주세요.",
          [
            {
              text: "확인",
              onPress: () => router.replace("/"),
            },
          ]
        );
      } else {
        // 중복 이메일 에러인 경우 이메일 필드에 표시
        const errorMessage = result.message || "회원가입에 실패했습니다.";
        if (errorMessage.includes("이미 등록된")) {
          setErrors((prev) => ({ ...prev, email: errorMessage }));
        } else {
          // 다른 에러는 Alert로 표시
          Alert.alert("회원가입 실패", errorMessage);
        }
      }
    } catch (error) {
      console.error("회원가입 오류:", error);
      setIsLoading(false);
      Alert.alert(
        "오류",
        "회원가입 중 오류가 발생했습니다. 다시 시도해주세요."
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
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>리밋 플래너 계정을 만들어보세요</Text>
        </View>

        {/* 폼 */}
        <View style={styles.formContainer}>
          {/* 이름 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이름 *</Text>
            <View
              style={[
                styles.inputContainer,
                errors.name && styles.inputContainerError,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color="#6b7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="홍길동"
                placeholderTextColor="#9ca3af"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                onBlur={() => validateName(formData.name)}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
            {errors.name ? (
              <Text style={styles.errorText}>{errors.name}</Text>
            ) : null}
          </View>

          {/* 이메일 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>이메일 *</Text>
            <View
              style={[
                styles.inputContainer,
                errors.email && styles.inputContainerError,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color="#6b7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor="#9ca3af"
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                onBlur={() => validateEmail(formData.email)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}
          </View>

          {/* 비밀번호 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호 *</Text>
            <View
              style={[
                styles.inputContainer,
                errors.password && styles.inputContainerError,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#6b7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="최소 6자 이상"
                placeholderTextColor="#9ca3af"
                value={formData.password}
                onChangeText={(text) =>
                  setFormData({ ...formData, password: text })
                }
                onBlur={() => validatePassword(formData.password)}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
                returnKeyType="next"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#6b7280"
                />
              </Pressable>
            </View>
            {errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : (
              <Text style={styles.hint}>
                영문, 숫자, 특수문자를 포함하여 6자 이상 입력해주세요
              </Text>
            )}
          </View>

          {/* 비밀번호 확인 */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>비밀번호 확인 *</Text>
            <View
              style={[
                styles.inputContainer,
                errors.confirmPassword && styles.inputContainerError,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#6b7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="비밀번호를 다시 입력하세요"
                placeholderTextColor="#9ca3af"
                value={formData.confirmPassword}
                onChangeText={(text) =>
                  setFormData({ ...formData, confirmPassword: text })
                }
                onBlur={() => validateConfirmPassword(formData.confirmPassword)}
                secureTextEntry={!showConfirmPassword}
                autoComplete="password-new"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#6b7280"
                />
              </Pressable>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}
          </View>

          {/* 회원가입 버튼 */}
          <Pressable
            style={[
              styles.signupButton,
              isLoading && styles.signupButtonDisabled,
            ]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.signupButtonText}>
              {isLoading ? "처리 중..." : "회원가입"}
            </Text>
          </Pressable>
        </View>

        {/* 약관 */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            회원가입 시{" "}
            <Text
              style={styles.termsLink}
              onPress={() => router.push("/terms-of-service")}
            >
              이용약관
            </Text>{" "}
            및{" "}
            <Text
              style={styles.termsLink}
              onPress={() => router.push("/privacy-policy")}
            >
              개인정보처리방침
            </Text>
            에 동의하게 됩니다.
          </Text>
        </View>

        {/* 로그인 링크 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.footerLink}>로그인</Text>
          </Pressable>
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
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginBottom: Theme.spacing.lg,
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
    lineHeight: 24,
  },
  formContainer: {
    marginBottom: Theme.spacing.xl,
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
  inputContainerError: {
    borderColor: "#ef4444",
    borderWidth: 2,
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
  eyeButton: {
    padding: Theme.spacing.sm,
  },
  errorText: {
    fontSize: Theme.typography.sizes.xs,
    color: "#ef4444",
    marginTop: Theme.spacing.xs,
    marginLeft: Theme.spacing.sm,
  },
  hint: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.tertiary,
    marginTop: Theme.spacing.xs,
    marginLeft: Theme.spacing.sm,
  },
  signupButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    alignItems: "center",
    marginTop: Theme.spacing.lg,
    ...Theme.shadows.sm,
  },
  signupButtonDisabled: {
    backgroundColor: Theme.colors.text.tertiary,
  },
  signupButtonText: {
    color: Theme.colors.text.inverse,
    fontSize: Theme.typography.sizes.md,
    fontWeight: Theme.typography.weights.semibold,
  },
  termsContainer: {
    marginBottom: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.sm,
  },
  termsText: {
    fontSize: Theme.typography.sizes.xs,
    color: Theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  termsLink: {
    color: Theme.colors.primary,
    fontWeight: Theme.typography.weights.medium,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
});
