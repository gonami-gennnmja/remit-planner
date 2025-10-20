import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export interface ScreenData {
	width: number;
	height: number;
	scale: number;
	fontScale: number;
}

export const useResponsive = () => {
	const [screenData, setScreenData] = useState<ScreenData>(Dimensions.get('window'));

	useEffect(() => {
		const subscription = Dimensions.addEventListener('change', ({ window }) => {
			setScreenData(window);
		});

		return () => subscription?.remove();
	}, []);

	// 반응형 브레이크포인트
	const isMobile = screenData.width < 768;
	const isTablet = screenData.width >= 768 && screenData.width < 1024;
	const isDesktop = screenData.width >= 1024;
	const isLargeDesktop = screenData.width >= 1440;

	// 반응형 스타일 헬퍼
	const getResponsiveStyle = (mobile: any, tablet?: any, desktop?: any) => {
		if (isMobile) return mobile;
		if (isTablet && tablet) return tablet;
		if (isDesktop && desktop) return desktop;
		return mobile;
	};

	// 반응형 값 헬퍼
	const getResponsiveValue = (mobile: number, tablet?: number, desktop?: number) => {
		if (isMobile) return mobile;
		if (isTablet && tablet !== undefined) return tablet;
		if (isDesktop && desktop !== undefined) return desktop;
		return mobile;
	};

	return {
		screenData,
		isMobile,
		isTablet,
		isDesktop,
		isLargeDesktop,
		getResponsiveStyle,
		getResponsiveValue,
	};
};
