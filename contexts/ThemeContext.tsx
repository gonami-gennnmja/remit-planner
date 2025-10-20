import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";

export type ThemeMode = "light" | "dark" | "auto";

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("light");
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
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ["light", "dark", "auto"].includes(savedTheme)) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error("Failed to load theme:", error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  // 실제 다크 모드 여부 계산
  const isDark =
    themeMode === "dark" ||
    (themeMode === "auto" && systemColorScheme === "dark");
  const colors = isDark ? darkColors : lightColors;

  const value: ThemeContextType = {
    themeMode,
    isDark,
    setThemeMode,
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
