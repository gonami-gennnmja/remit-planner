// 다음 우편번호 서비스 연동 유틸리티
// https://postcode.map.daum.net/guide 참고

export interface AddressResult {
	address: string;
	roadAddress: string;
	jibunAddress: string;
	buildingName: string;
	zoneCode: string;
	sido: string;
	sigungu: string;
	bname: string;
	buildingCode: string;
	apartment: string;
	jibunAddressEnglish: string;
	roadAddressEnglish: string;
	autoJibunAddress: string;
	autoRoadAddress: string;
	autoJibunAddressEnglish: string;
	autoRoadAddressEnglish: string;
	userSelectedType: string;
	noSelected: string;
	userLanguageType: string;
}

// 다음 우편번호 서비스 스크립트 로드 (웹에서만)
const loadDaumPostcodeScript = (): Promise<void> => {
	return new Promise((resolve, reject) => {
		// 웹 환경이 아니면 바로 실패
		if (typeof window === 'undefined' || typeof document === 'undefined') {
			reject(new Error('웹 환경이 아닙니다.'));
			return;
		}

		// 이미 로드되어 있는지 확인
		if ((window as any).daum && (window as any).daum.Postcode) {
			resolve();
			return;
		}

		const script = document.createElement('script');
		script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('다음 우편번호 서비스 로드 실패'));
		document.head.appendChild(script);
	});
};

// 다음 우편번호 서비스 초기화 (웹에서만)
export const initializeDaumPostcode = async (): Promise<boolean> => {
	try {
		// 웹 환경이 아니면 false 반환
		if (typeof window === 'undefined' || typeof document === 'undefined') {
			return false;
		}

		await loadDaumPostcodeScript();
		return true;
	} catch (error) {
		console.error('다음 우편번호 서비스 초기화 실패:', error);
		return false;
	}
};

// 주소 검색 팝업 열기 (웹에서만)
export const openAddressSearch = (callback: (result: AddressResult) => void) => {
	// 웹 환경이 아니면 앱용 대체 기능 사용
	if (typeof window === 'undefined' || typeof document === 'undefined') {
		// 앱에서는 간단한 알림만 표시
		const { Alert, Platform } = require('react-native');

		if (Platform.OS !== 'web') {
			Alert.alert(
				'주소 검색',
				'앱에서는 직접 주소를 입력해주세요. 웹에서 사용하시면 주소 검색 기능을 이용할 수 있습니다.',
				[
					{
						text: '확인',
						style: 'default'
					}
				]
			);
		}
		return;
	}

	initializeDaumPostcode().then((success) => {
		if (!success) {
			alert('주소 검색 서비스를 불러올 수 없습니다.');
			return;
		}

		const daum = (window as any).daum;
		if (!daum || !daum.Postcode) {
			alert('주소 검색 서비스를 사용할 수 없습니다.');
			return;
		}

		new daum.Postcode({
			oncomplete: function (data: any) {
				const result: AddressResult = {
					address: data.address,
					roadAddress: data.roadAddress,
					jibunAddress: data.jibunAddress,
					buildingName: data.buildingName,
					zoneCode: data.zonecode,
					sido: data.sido,
					sigungu: data.sigungu,
					bname: data.bname,
					buildingCode: data.buildingCode,
					apartment: data.apartment,
					jibunAddressEnglish: data.jibunAddressEnglish,
					roadAddressEnglish: data.roadAddressEnglish,
					autoJibunAddress: data.autoJibunAddress,
					autoRoadAddress: data.autoRoadAddress,
					autoJibunAddressEnglish: data.autoJibunAddressEnglish,
					autoRoadAddressEnglish: data.autoRoadAddressEnglish,
					userSelectedType: data.userSelectedType,
					noSelected: data.noSelected,
					userLanguageType: data.userLanguageType,
				};
				callback(result);
			},
			theme: {
				searchBgColor: "#2563eb",
				queryTextColor: "#FFFFFF",
				bgColor: "#FFFFFF",
				contentBgColor: "#FFFFFF",
				pageBgColor: "#F8F9FA",
				textColor: "#1F2937",
				queryTextColor: "#FFFFFF",
				postcodeTextColor: "#6B7280",
				emphTextColor: "#2563eb",
				outlineColor: "#E5E7EB"
			}
		}).open();
	});
};

// 카카오맵에서 위치 검색
export const openKakaoMap = (address: string) => {
	if (!address) {
		alert('주소가 없습니다.');
		return;
	}

	const encodedAddress = encodeURIComponent(address);
	const kakaoMapUrl = `https://map.kakao.com/link/search/${encodedAddress}`;

	if (typeof window !== 'undefined') {
		window.open(kakaoMapUrl, '_blank');
	}
};

// 네이버지도에서 위치 검색
export const openNaverMap = (address: string) => {
	if (!address) {
		alert('주소가 없습니다.');
		return;
	}

	const encodedAddress = encodeURIComponent(address);
	const naverMapUrl = `https://map.naver.com/v5/search/${encodedAddress}`;

	if (typeof window !== 'undefined') {
		window.open(naverMapUrl, '_blank');
	}
};

// 모바일 앱에서 지도 앱 열기
export const openMapApp = (address: string, mapType: 'kakao' | 'naver' | 'google') => {
	if (!address) {
		alert('주소가 없습니다.');
		return;
	}

	const encodedAddress = encodeURIComponent(address);
	let mapUrl = '';

	switch (mapType) {
		case 'kakao':
			mapUrl = `kakaomap://search?q=${encodedAddress}`;
			break;
		case 'naver':
			mapUrl = `nmap://search?query=${encodedAddress}`;
			break;
		case 'google':
			mapUrl = `comgooglemaps://?q=${encodedAddress}`;
			break;
	}

	// React Native 앱에서는 Linking API 사용
	if (typeof window !== 'undefined') {
		const { Linking } = require('react-native');
		Linking.openURL(mapUrl).catch((err: any) => {
			console.error('지도 앱을 열 수 없습니다:', err);
			// 앱이 설치되지 않은 경우 웹으로 대체
			const webUrl = mapType === 'kakao'
				? `https://map.kakao.com/link/search/${encodedAddress}`
				: mapType === 'naver'
					? `https://map.naver.com/v5/search/${encodedAddress}`
					: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
			Linking.openURL(webUrl);
		});
	}
};
