// 미니멀 블랙&화이트 테마
export const Theme = {
	colors: {
		// 기본 색상
		primary: "#000000",
		secondary: "#6b7280",
		background: "#ffffff",
		surface: "#f9fafb",
		card: "#ffffff",

		// 텍스트 색상
		text: {
			primary: "#000000",
			secondary: "#6b7280",
			tertiary: "#9ca3af",
			inverse: "#ffffff",
		},

		// 상태 색상 (최신 트렌드 컬러)
		success: "#22c55e", // 에메랄드 그린
		warning: "#f97316", // 오렌지
		error: "#ef4444",   // 레드 (유지)
		info: "#6366f1",    // 인디고 바이올렛

		// 카테고리별 컬러 (최신 트렌드)
		category: {
			education: "#8b5cf6", // 바이올렛
			work: "#06b6d4",      // 시안
			event: "#f59e0b",     // 앰버
			personal: "#ec4899",  // 핑크
			other: "#6b7280",     // 그레이
		},

		// 테두리 및 구분선
		border: {
			light: "#e5e7eb",
			medium: "#d1d5db",
			dark: "#9ca3af",
		},

		// 그림자
		shadow: {
			light: "rgba(0, 0, 0, 0.05)",
			medium: "rgba(0, 0, 0, 0.1)",
			dark: "rgba(0, 0, 0, 0.15)",
		},

		// 오버레이
		overlay: "rgba(0, 0, 0, 0.5)",

		// 그라데이션
		gradient: {
			primary: ["#000000", "#374151"],
			secondary: ["#f9fafb", "#e5e7eb"],
		},
	},

	spacing: {
		xs: 4,
		sm: 8,
		md: 12,
		lg: 16,
		xl: 20,
		xxl: 24,
		xxxl: 32,
	},

	borderRadius: {
		sm: 4,
		md: 8,
		lg: 12,
		xl: 16,
		full: 9999,
	},

	typography: {
		fontFamily: {
			regular: "Inter_400Regular",
			medium: "Inter_500Medium",
			semibold: "Inter_600SemiBold",
			bold: "Inter_700Bold",
		},
		sizes: {
			xs: 12,
			sm: 14,
			md: 16,
			lg: 18,
			xl: 20,
			xxl: 24,
			xxxl: 32,
		},
		weights: {
			normal: "400" as const,
			medium: "500" as const,
			semibold: "600" as const,
			bold: "700" as const,
		},
	},

	shadows: {
		sm: {
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 1 },
			shadowOpacity: 0.05,
			shadowRadius: 2,
			elevation: 1,
		},
		md: {
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.1,
			shadowRadius: 4,
			elevation: 2,
		},
		lg: {
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.15,
			shadowRadius: 8,
			elevation: 4,
		},
	},
};
