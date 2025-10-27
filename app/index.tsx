import LoginScreen from "@/components/LoginScreen";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Platform } from "react-native";

export default function Home() {
  const router = useRouter();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // 웹 환경에서 URL의 해시 처리
      if (Platform.OS === "web" && typeof window !== "undefined") {
        const url = window.location.href;
        if (url.includes("#access_token") || url.includes("?access_token")) {
          await handleDeepLink(url);
          // URL을 정리
          window.history.replaceState({}, "", "/");
        }
      }

      // 세션 확인
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (session && !error) {
        router.push("/main");
        return;
      }
    };

    handleOAuthCallback();

    // 모바일 Deep Link 처리
    const setupMobileDeepLink = async () => {
      if (Platform.OS === "web") return;

      try {
        const url = await Linking.getInitialURL();
        if (url) {
          await handleDeepLink(url);
        }

        // Deep Link 리스너
        const subscription = Linking.addEventListener("url", async (event) => {
          await handleDeepLink(event.url);
        });

        return () => {
          subscription.remove();
        };
      } catch (error) {
        console.error("Deep Link 설정 오류:", error);
      }
    };

    setupMobileDeepLink();
  }, []);

  const handleDeepLink = async (url: string) => {
    if (!url) return;

    try {
      let access_token: string | null = null;
      let refresh_token: string | null = null;

      // 해시에서 토큰 추출 (#access_token=xxx)
      if (url.includes("#")) {
        const hash = url.split("#")[1];
        const params = new URLSearchParams(hash);
        access_token = params.get("access_token");
        refresh_token = params.get("refresh_token");
      }
      // 쿼리 파라미터에서 토큰 추출 (?access_token=xxx)
      else if (url.includes("?")) {
        const query = url.split("?")[1];
        const params = new URLSearchParams(query);
        access_token = params.get("access_token");
        refresh_token = params.get("refresh_token");
      }

      if (access_token && refresh_token) {
        // 세션 설정
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (!error) {
          router.push("/main");
        }
      }
    } catch (error) {
      console.error("Deep Link 처리 오류:", error);
    }
  };

  return <LoginScreen />;
}
