import { getDatabase } from "@/database/platformDatabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "ko" | "en";

type Dictionary = Record<string, string>;

const ko: Dictionary = {
  appName: "리밋 플래너",
  welcome: "효율적인 스케줄 & 급여 관리",
  settings: "설정",
  profile: "프로필",
  personalInfo: "개인 정보",
  businessInfo: "사업자 정보",
  appSettings: "앱 설정",
  name: "이름",
  nickname: "닉네임",
  email: "이메일",
  businessName: "사업자명",
  businessNumber: "사업자등록번호",
  businessAddress: "사업장 주소",
  businessPhone: "사업장 전화번호",
  businessEmail: "사업장 이메일",
  notifications: "알림",
  theme: "테마",
  themeColor: "테마 컬러",
  language: "언어",
  logout: "로그아웃",
  save: "저장",
  edit: "편집",
  selectAppTheme: "앱의 테마를 선택하세요",
  selectAppColor: "앱의 강조 색상을 선택하세요",
  selectAppLanguage: "앱의 언어를 선택하세요",
  mainFeatures: "주요 기능",
};

const en: Dictionary = {
  appName: "Remit Planner",
  welcome: "Efficient schedule & payroll management",
  settings: "Settings",
  profile: "Profile",
  personalInfo: "Personal Info",
  businessInfo: "Business Info",
  appSettings: "App Settings",
  name: "Name",
  nickname: "Nickname",
  email: "Email",
  businessName: "Business Name",
  businessNumber: "Business Number",
  businessAddress: "Business Address",
  businessPhone: "Business Phone",
  businessEmail: "Business Email",
  notifications: "Notifications",
  theme: "Theme",
  themeColor: "Theme Color",
  language: "Language",
  logout: "Logout",
  save: "Save",
  edit: "Edit",
  selectAppTheme: "Choose the app theme",
  selectAppColor: "Choose the app accent color",
  selectAppLanguage: "Choose the app language",
  mainFeatures: "Main Features",
};

const LANG_KEY = "@remit-planner:language";

interface LocalizationContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(
  undefined
);

export function LocalizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>("ko");

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const db = getDatabase();
      const settings = await db.getUserSettings();

      if (settings) {
        setLanguageState(settings.language);
      } else {
        // Fallback to AsyncStorage for backward compatibility
        const saved = await AsyncStorage.getItem(LANG_KEY);
        if (saved === "ko" || saved === "en") setLanguageState(saved);
      }
    } catch (error) {
      console.error("Failed to load user settings:", error);
      // Fallback to AsyncStorage
      try {
        const saved = await AsyncStorage.getItem(LANG_KEY);
        if (saved === "ko" || saved === "en") setLanguageState(saved);
      } catch (fallbackError) {
        console.error("Failed to load from AsyncStorage:", fallbackError);
      }
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      const db = getDatabase();
      await db.updateUserSettings({ language: lang });
      // Also save to AsyncStorage for backward compatibility
      await AsyncStorage.setItem(LANG_KEY, lang);
    } catch (error) {
      console.error("Failed to save language:", error);
    }
  };

  const dict = language === "ko" ? ko : en;

  const t = useMemo(() => (key: string) => dict[key] ?? key, [dict]);

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(LocalizationContext);
  if (!ctx) throw new Error("useI18n must be used within LocalizationProvider");
  return ctx;
}
