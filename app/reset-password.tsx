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
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 에러 상태
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  // 비밀번호 검증
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

  // 비밀번호 확인 검증
  const validateConfirmPassword = (confirmPassword: string) => {
    if (confirmPassword !== password) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "비밀번호가 일치하지 않습니다.",
      }));
      return false;
    }
    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    return true;
  };

  const handleResetPassword = async () => {
    // 검증
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      // Supabase Auth 비밀번호 업데이트
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      setIsLoading(false);

      if (error) {
        console.error("비밀번호 재설정 오류:", error);

        let errorMessage = "비밀번호 재설정에 실패했습니다.";
        if (error.message.includes("same")) {
          errorMessage = "새 비밀번호는 기존 비밀번호와 달라야 합니다.";
        } else if (error.message.includes("weak")) {
          errorMessage = "비밀번호가 너무 약합니다.";
        }

        Alert.alert("오류", errorMessage);
      } else {
        Alert.alert(
          "비밀번호 재설정 완료",
          "비밀번호가 성공적으로 변경되었습니다.\n새 비밀번호로 로그인해주세요.",
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="lock-closed"
                size={48}
                color={Theme.colors.primary}
              />
            </View>

            <Text style={styles.title}>새 비밀번호 설정</Text>
            <Text style={styles.subtitle}>새로운 비밀번호를 입력해주세요.</Text>
          </View>

          {/* 폼 */}
          <View style={styles.formContainer}>
            {/* 새 비밀번호 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>새 비밀번호 *</Text>
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
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => validatePassword(password)}
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
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onBlur={() => validateConfirmPassword(confirmPassword)}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="password-new"
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={20}
                    color="#6b7280"
                  />
                </Pressable>
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            {/* 재설정 버튼 */}
            <Pressable
              style={[
                styles.resetButton,
                isLoading && styles.resetButtonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={styles.resetButtonText}>
                {isLoading ? "처리 중..." : "비밀번호 변경"}
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
                비밀번호 변경 후에는 모든 기기에서 자동으로 로그아웃됩니다.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    marginTop: 40,
    marginBottom: 40,
    alignItems: "center",
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
});
