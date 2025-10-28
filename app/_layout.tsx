import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import AnimatedSplash from "@/components/AnimatedSplash";
import { LocalizationProvider } from "@/contexts/LocalizationContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { FCMService } from "@/utils/fcmService";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...FontAwesome.font,
  });

  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();

      // FCM 초기화
      FCMService.initialize();
      FCMService.setupTokenRefreshListener();

      // 애니메이션 스플래시를 3초간 보여준 후 메인 앱으로 전환
      setTimeout(() => {
        setShowAnimatedSplash(false);
      }, 3000);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // 애니메이션 스플래시 표시
  if (showAnimatedSplash) {
    return (
      <LocalizationProvider>
        <ThemeProvider>
          <AnimatedSplash />
        </ThemeProvider>
      </LocalizationProvider>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LocalizationProvider>
        <ThemeProvider>
          <NavigationWrapper />
        </ThemeProvider>
      </LocalizationProvider>
    </GestureHandlerRootView>
  );
}

function NavigationWrapper() {
  const { isDark } = useTheme();

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* 인증 관련 */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth/forgot-password"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="auth/reset-password"
          options={{ headerShown: false }}
        />

        {/* 약관 및 정책 */}
        <Stack.Screen
          name="terms-of-service"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />

        {/* 메인 화면 */}
        <Stack.Screen name="main" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />

        {/* 스케줄 관리 */}
        <Stack.Screen name="schedule/index" options={{ headerShown: false }} />
        <Stack.Screen name="schedule/list" options={{ headerShown: false }} />
        <Stack.Screen name="schedule/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="schedule/reports"
          options={{ headerShown: false }}
        />

        {/* 거래처 관리 */}
        <Stack.Screen name="clients/index" options={{ headerShown: false }} />
        <Stack.Screen name="clients/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="clients/revenue-management"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="clients/unpaid-details"
          options={{ headerShown: false }}
        />

        {/* 근로자 관리 */}
        <Stack.Screen name="worker/index" options={{ headerShown: false }} />
        <Stack.Screen name="worker/reports" options={{ headerShown: false }} />
        <Stack.Screen name="worker/payroll" options={{ headerShown: false }} />

        {/* 리포트 */}
        <Stack.Screen name="reports/index" options={{ headerShown: false }} />
        <Stack.Screen name="reports/revenue" options={{ headerShown: false }} />
        <Stack.Screen
          name="reports/performance"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="reports/cashflow"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="reports/worker-efficiency"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="reports/clients" options={{ headerShown: false }} />

        {/* 기타 */}
        <Stack.Screen name="files" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </NavigationThemeProvider>
  );
}
