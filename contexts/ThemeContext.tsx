import { getDatabase } from "@/database/platformDatabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";

export type ThemeMode = "light" | "dark" | "auto";
export type AccentColor =
  | "blue"
  | "purple"
  | "green"
  | "orange"
  | "pink"
  | "red"
  | "teal"
  | "indigo"
  | "black";

export const accentColorPresets: Record<
  AccentColor,
  { name: string; light: string; dark: string; rgb: string }
> = {
  blue: {
    name: "스카이",
    light: "#7DD3FC",
    dark: "#0EA5E9",
    rgb: "125, 211, 252",
  },
  purple: {
    name: "라벤더",
    light: "#C084FC",
    dark: "#A855F7",
    rgb: "192, 132, 252",
  },
  green: {
    name: "민트",
    light: "#6EE7B7",
    dark: "#10B981",
    rgb: "110, 231, 183",
  },
  orange: {
    name: "피치",
    light: "#FDBA74",
    dark: "#F97316",
    rgb: "253, 186, 116",
  },
  pink: {
    name: "로즈",
    light: "#F9A8D4",
    dark: "#EC4899",
    rgb: "249, 168, 212",
  },
  red: {
    name: "코랄",
    light: "#FCA5A5",
    dark: "#EF4444",
    rgb: "252, 165, 165",
  },
  teal: {
    name: "터콰이즈",
    light: "#5EEAD4",
    dark: "#14B8A6",
    rgb: "94, 234, 212",
  },
  indigo: {
    name: "바이올렛",
    light: "#A78BFA",
    dark: "#8B5CF6",
    rgb: "167, 139, 250",
  },
  black: {
    name: "블랙",
    light: "#374151",
    dark: "#111827",
    rgb: "55, 65, 81",
  },
};

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  accentColor: AccentColor;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  colors: {
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    accent: string;
  };
}

const lightColors = {
  background: "#f8fafc",
  surface: "#ffffff",
  card: "#ffffff",
  text: "#111827",
  textSecondary: "#6b7280",
  border: "#e5e7eb",
  primary: "#6366f1",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  accent: "#00adf5",
};

const darkColors = {
  background: "#0f172a",
  surface: "#1e293b",
  card: "#334155",
  text: "#f8fafc",
  textSecondary: "#cbd5e1",
  border: "#475569",
  primary: "#818cf8",
  secondary: "#a78bfa",
  success: "#34d399",
  warning: "#fbbf24",
  error: "#f87171",
  accent: "#38bdf8",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@remit-planner:theme";
const ACCENT_COLOR_STORAGE_KEY = "@remit-planner:accentColor";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
  const [accentColor, setAccentColorState] = useState<AccentColor>("indigo");
  const [systemColorScheme, setSystemColorScheme] =
    useState<ColorSchemeName>("light");

  // 시스템 테마 변경 감지
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    // 초기 시스템 테마 설정
    setSystemColorScheme(Appearance.getColorScheme());

    return () => subscription?.remove();
  }, []);

  // 저장된 테마 설정 로드
  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const db = getDatabase();
      const settings = await db.getUserSettings();

      if (settings) {
        setThemeModeState(settings.themeMode);
        setAccentColorState(settings.accentColor);
      } else {
        // Fallback to AsyncStorage for backward compatibility
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        const savedColor = await AsyncStorage.getItem(ACCENT_COLOR_STORAGE_KEY);

        if (savedTheme && ["light", "dark", "auto"].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
        if (
          savedColor &&
          Object.keys(accentColorPresets).includes(savedColor)
        ) {
          setAccentColorState(savedColor as AccentColor);
        }
      }
    } catch (error) {
      console.error("Failed to load user settings:", error);
      // Fallback to AsyncStorage
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        const savedColor = await AsyncStorage.getItem(ACCENT_COLOR_STORAGE_KEY);

        if (savedTheme && ["light", "dark", "auto"].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
        if (
          savedColor &&
          Object.keys(accentColorPresets).includes(savedColor)
        ) {
          setAccentColorState(savedColor as AccentColor);
        }
      } catch (fallbackError) {
        console.error("Failed to load from AsyncStorage:", fallbackError);
      }
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      const db = getDatabase();
      await db.updateUserSettings({ themeMode: mode });
      // Also save to AsyncStorage for backward compatibility
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  const setAccentColor = async (color: AccentColor) => {
    try {
      setAccentColorState(color);
      const db = getDatabase();
      await db.updateUserSettings({ accentColor: color });
      // Also save to AsyncStorage for backward compatibility
      await AsyncStorage.setItem(ACCENT_COLOR_STORAGE_KEY, color);
    } catch (error) {
      console.error("Failed to save accent color:", error);
    }
  };

  // 실제 다크 모드 여부 계산
  const isDark =
    themeMode === "dark" ||
    (themeMode === "auto" && systemColorScheme === "dark");

  // 선택된 accent color 적용
  const selectedAccent = accentColorPresets[accentColor];
  const accentColorValue = isDark ? selectedAccent.dark : selectedAccent.light;

  const colors = {
    ...(isDark ? darkColors : lightColors),
    primary: accentColorValue,
    accent: accentColorValue,
  };

  const value: ThemeContextType = {
    themeMode,
    isDark,
    accentColor,
    setThemeMode,
    setAccentColor,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
