import { Text } from "@/components/Themed";
import { useI18n } from "@/contexts/LocalizationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useResponsive } from "@/hooks/useResponsive";
import { getCurrentUser, logout, updateUser, User } from "@/utils/authUtils";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";

export default function SettingsScreen() {
  const { screenData, isMobile, isTablet, isDesktop, getResponsiveValue } =
    useResponsive();
  const { themeMode, setThemeMode, colors } = useTheme();
  const { t, setLanguage } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    email: "",
    businessName: "",
    businessNumber: "",
    businessAddress: "",
    businessPhone: "",
    businessEmail: "",
    notifications: true,
    theme: themeMode,
    language: "ko" as "ko" | "en",
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setFormData({
          name: currentUser.name || "",
          nickname: currentUser.nickname || "",
          email: currentUser.email || "",
          businessName: currentUser.businessInfo?.businessName || "",
          businessNumber: currentUser.businessInfo?.businessNumber || "",
          businessAddress: currentUser.businessInfo?.businessAddress || "",
          businessPhone: currentUser.businessInfo?.businessPhone || "",
          businessEmail: currentUser.businessInfo?.businessEmail || "",
          notifications: currentUser.settings?.notifications ?? true,
          theme: currentUser.settings?.theme || "light",
          language: currentUser.settings?.language || "ko",
        });
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const updatedUser: User = {
        ...user,
        name: formData.name,
        nickname: formData.nickname,
        email: formData.email,
        businessInfo: {
          businessName: formData.businessName,
          businessNumber: formData.businessNumber,
          businessAddress: formData.businessAddress,
          businessPhone: formData.businessPhone,
          businessEmail: formData.businessEmail,
        },
        settings: {
          notifications: formData.notifications,
          theme: formData.theme,
          language: formData.language,
        },
      };

      const result = await updateUser(updatedUser);
      if (result.success) {
        setUser(updatedUser);
        setEditing(false);
        Alert.alert("성공", "설정이 저장되었습니다.");
      } else {
        Alert.alert("오류", result.message || "설정 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      Alert.alert("오류", "설정 저장 중 오류가 발생했습니다.");
    }
  };

  const handleLogout = () => {
    Alert.alert("로그아웃", "정말 로그아웃하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/");
        },
      },
    ]);
  };

  const getInputStyle = (editing: boolean) => [
    styles.textInput,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.text,
    },
    !editing && { backgroundColor: colors.border, color: colors.textSecondary },
  ];

  const getLabelStyle = () => [styles.inputLabel, { color: colors.text }];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </Pressable>
          <Text style={styles.headerTitle}>설정</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t("settings")}
        </Text>
        {editing ? (
          <Pressable
            style={[styles.saveButton, { backgroundColor: colors.success }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>저장</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => setEditing(true)}
          >
            <Text style={styles.editButtonText}>편집</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("profile")}
          </Text>
          <View
            style={[
              styles.profileCard,
              { backgroundColor: colors.surface, shadowColor: colors.text },
            ]}
          >
            <View
              style={[styles.profileIcon, { backgroundColor: colors.border }]}
            >
              <Ionicons name="person" size={40} color={colors.primary} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user?.name}
              </Text>
              <Text
                style={[styles.profileEmail, { color: colors.textSecondary }]}
              >
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* 개인 정보 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("personalInfo")}
          </Text>
          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.surface, shadowColor: colors.text },
            ]}
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t("name")} *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                  !editing && {
                    backgroundColor: colors.border,
                    color: colors.textSecondary,
                  },
                ]}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                editable={editing}
                placeholder="이름을 입력하세요"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle()}>{t("nickname")}</Text>
              <TextInput
                style={getInputStyle(editing)}
                value={formData.nickname}
                onChangeText={(text) =>
                  setFormData({ ...formData, nickname: text })
                }
                editable={editing}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle()}>{t("email")}</Text>
              <TextInput
                style={getInputStyle(editing)}
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                editable={editing}
                placeholder="이메일을 입력하세요"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* 사업자 정보 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("businessInfo")}
          </Text>
          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.surface, shadowColor: colors.text },
            ]}
          >
            <View style={styles.inputGroup}>
              <Text style={getLabelStyle()}>{t("businessName")} *</Text>
              <TextInput
                style={getInputStyle(editing)}
                value={formData.businessName}
                onChangeText={(text) =>
                  setFormData({ ...formData, businessName: text })
                }
                editable={editing}
                placeholder="사업자명을 입력하세요"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle()}>{t("businessNumber")}</Text>
              <TextInput
                style={getInputStyle(editing)}
                value={formData.businessNumber}
                onChangeText={(text) =>
                  setFormData({ ...formData, businessNumber: text })
                }
                editable={editing}
                placeholder="123-45-67890"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle()}>{t("businessAddress")}</Text>
              <TextInput
                style={getInputStyle(editing)}
                value={formData.businessAddress}
                onChangeText={(text) =>
                  setFormData({ ...formData, businessAddress: text })
                }
                editable={editing}
                placeholder="사업장 주소를 입력하세요"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle()}>{t("businessPhone")}</Text>
              <TextInput
                style={getInputStyle(editing)}
                value={formData.businessPhone}
                onChangeText={(text) =>
                  setFormData({ ...formData, businessPhone: text })
                }
                editable={editing}
                placeholder="02-1234-5678"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={getLabelStyle()}>{t("businessEmail")}</Text>
              <TextInput
                style={getInputStyle(editing)}
                value={formData.businessEmail}
                onChangeText={(text) =>
                  setFormData({ ...formData, businessEmail: text })
                }
                editable={editing}
                placeholder="business@example.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* 앱 설정 섹션 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("appSettings")}
          </Text>
          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.surface, shadowColor: colors.text },
            ]}
          >
            <View
              style={[styles.settingRow, { borderBottomColor: colors.border }]}
            >
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t("notifications")}
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  푸시 알림을 받습니다
                </Text>
              </View>
              <Switch
                value={formData.notifications}
                onValueChange={(value) =>
                  setFormData({ ...formData, notifications: value })
                }
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.surface}
              />
            </View>

            <View
              style={[styles.settingRow, { borderBottomColor: colors.border }]}
            >
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t("theme")}
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t("selectAppTheme")}
                </Text>
              </View>
              <View style={styles.themeSelector}>
                {(["light", "dark", "auto"] as const).map((theme) => (
                  <Pressable
                    key={theme}
                    style={[
                      styles.themeOption,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                      formData.theme === theme && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, theme });
                      setThemeMode(theme);
                    }}
                  >
                    <Text
                      style={[
                        styles.themeOptionText,
                        { color: colors.text },
                        formData.theme === theme && { color: colors.surface },
                      ]}
                    >
                      {theme === "light"
                        ? "라이트"
                        : theme === "dark"
                        ? "다크"
                        : "자동"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View
              style={[styles.settingRow, { borderBottomColor: colors.border }]}
            >
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  {t("language")}
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t("selectAppLanguage")}
                </Text>
              </View>
              <View style={styles.languageSelector}>
                {(["ko", "en"] as const).map((language) => (
                  <Pressable
                    key={language}
                    style={[
                      styles.languageOption,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                      formData.language === language && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, language })}
                  >
                    <Text
                      style={[
                        styles.languageOptionText,
                        { color: colors.text },
                        formData.language === language && {
                          color: colors.surface,
                        },
                      ]}
                    >
                      {language === "ko" ? "한국어" : "English"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* 로그아웃 버튼 */}
        <View style={styles.section}>
          <Pressable
            style={[
              styles.logoutButton,
              { backgroundColor: colors.surface, shadowColor: colors.text },
            ]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
            <Text style={[styles.logoutButtonText, { color: colors.error }]}>
              {t("logout")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter_600SemiBold",
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#6366f1",
  },
  editButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#10b981",
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
    fontFamily: "Inter_600SemiBold",
  },
  profileCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
    fontFamily: "Inter_600SemiBold",
  },
  profileEmail: {
    fontSize: 14,
    color: "#6b7280",
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
    fontFamily: "Inter_500Medium",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "white",
    fontFamily: "Inter_400Regular",
  },
  disabledInput: {
    backgroundColor: "#f9fafb",
    color: "#6b7280",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 4,
    fontFamily: "Inter_500Medium",
  },
  settingDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
  themeSelector: {
    flexDirection: "row",
    gap: 8,
  },
  themeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "white",
  },
  themeOptionSelected: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  themeOptionText: {
    fontSize: 12,
    color: "#374151",
    fontFamily: "Inter_400Regular",
  },
  themeOptionTextSelected: {
    color: "white",
  },
  languageSelector: {
    flexDirection: "row",
    gap: 8,
  },
  languageOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "white",
  },
  languageOptionSelected: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  languageOptionText: {
    fontSize: 12,
    color: "#374151",
    fontFamily: "Inter_400Regular",
  },
  languageOptionTextSelected: {
    color: "white",
  },
  logoutButton: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ef4444",
    marginLeft: 8,
    fontFamily: "Inter_600SemiBold",
  },
});
