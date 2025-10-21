import { supabase } from "@/lib/supabase";
import { Platform } from "react-native";

// 소셜 로그인 에러 메시지 번역
function translateSocialAuthError(errorMessage: string): string {
	const errorTranslations: { [key: string]: string } = {
		"User cancelled": "로그인이 취소되었습니다.",
		"Popup closed": "로그인 창이 닫혔습니다.",
		"Network error": "네트워크 연결을 확인해주세요.",
		"OAuth error": "소셜 로그인 중 오류가 발생했습니다.",
		"Invalid credentials": "인증 정보가 올바르지 않습니다.",
	};

	for (const [key, value] of Object.entries(errorTranslations)) {
		if (errorMessage.includes(key)) {
			return value;
		}
	}

	return "소셜 로그인 중 오류가 발생했습니다.";
}

// Redirect URL 생성
function getRedirectUrl(): string {
	if (Platform.OS === "web") {
		// 웹에서는 현재 origin 사용
		if (typeof window !== "undefined") {
			return `${window.location.origin}/main`;
		}
		return "http://localhost:8081/main";
	}
	// 앱에서는 Deep Link 사용
	return "remitplanner://main";
}

/**
 * Google 소셜 로그인
 */
export async function signInWithGoogle(): Promise<{
	success: boolean;
	message?: string;
}> {
	try {
		console.log("🔐 Google 로그인 시도");

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: getRedirectUrl(),
				queryParams: {
					access_type: "offline",
					prompt: "consent",
				},
			},
		});

		if (error) {
			console.error("❌ Google 로그인 실패:", error.message);
			const translatedMessage = translateSocialAuthError(error.message);
			return { success: false, message: translatedMessage };
		}

		console.log("✅ Google 로그인 성공");
		return { success: true };
	} catch (error) {
		console.error("❌ Google 로그인 오류:", error);
		return {
			success: false,
			message: "Google 로그인 중 오류가 발생했습니다.",
		};
	}
}

/**
 * Kakao 소셜 로그인
 */
export async function signInWithKakao(): Promise<{
	success: boolean;
	message?: string;
}> {
	try {
		console.log("🔐 Kakao 로그인 시도");

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: "kakao",
			options: {
				redirectTo: getRedirectUrl(),
			},
		});

		if (error) {
			console.error("❌ Kakao 로그인 실패:", error.message);
			const translatedMessage = translateSocialAuthError(error.message);
			return { success: false, message: translatedMessage };
		}

		console.log("✅ Kakao 로그인 성공");
		return { success: true };
	} catch (error) {
		console.error("❌ Kakao 로그인 오류:", error);
		return {
			success: false,
			message: "Kakao 로그인 중 오류가 발생했습니다.",
		};
	}
}

/**
 * Apple 소셜 로그인
 */
export async function signInWithApple(): Promise<{
	success: boolean;
	message?: string;
}> {
	try {
		console.log("🔐 Apple 로그인 시도");

		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: "apple",
			options: {
				redirectTo: getRedirectUrl(),
			},
		});

		if (error) {
			console.error("❌ Apple 로그인 실패:", error.message);
			const translatedMessage = translateSocialAuthError(error.message);
			return { success: false, message: translatedMessage };
		}

		console.log("✅ Apple 로그인 성공");
		return { success: true };
	} catch (error) {
		console.error("❌ Apple 로그인 오류:", error);
		return {
			success: false,
			message: "Apple 로그인 중 오류가 발생했습니다.",
		};
	}
}

/**
 * 소셜 로그인 Provider 타입
 */
export type SocialProvider = "google" | "kakao" | "apple";

/**
 * 통합 소셜 로그인 함수
 */
export async function signInWithSocial(
	provider: SocialProvider
): Promise<{ success: boolean; message?: string }> {
	switch (provider) {
		case "google":
			return signInWithGoogle();
		case "kakao":
			return signInWithKakao();
		case "apple":
			return signInWithApple();
		default:
			return {
				success: false,
				message: "지원하지 않는 소셜 로그인입니다.",
			};
	}
}

