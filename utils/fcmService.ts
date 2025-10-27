import { getDatabase } from '@/database/platformDatabase';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class FCMService {
	// Expo Push Token 가져오기
	static async getToken(): Promise<string | null> {
		try {
			if (!Device.isDevice) {
				return null;
			}

			const projectId = Constants.expoConfig?.extra?.eas?.projectId;
			if (!projectId) {
				return null;
			}

			const token = await Notifications.getExpoPushTokenAsync({
				projectId: projectId,
			});
			return token.data;
		} catch (error) {
			console.error('Expo Push Token Error:', error);
			return null;
		}
	}

	// 알림 권한 요청
	static async requestPermission(): Promise<boolean> {
		try {
			const { status: existingStatus } = await Notifications.getPermissionsAsync();
			let finalStatus = existingStatus;

			if (existingStatus !== 'granted') {
				const { status } = await Notifications.requestPermissionsAsync();
				finalStatus = status;
			}

			if (finalStatus !== 'granted') {
				return false;
			}

			return true;
		} catch (error) {
			console.error('알림 권한 요청 오류:', error);
			return false;
		}
	}

	// FCM 토큰을 서버에 저장 (로컬 알림에서는 불필요)
	static async saveTokenToServer(): Promise<void> {
		// 로컬 알림에서는 토큰 저장이 불필요합니다.
	}

	// 백그라운드 메시지 핸들러 설정
	static setupBackgroundMessageHandler(): void {
		Notifications.setNotificationHandler({
			handleNotification: async () => ({
				shouldShowAlert: true,
				shouldPlaySound: true,
				shouldSetBadge: true,
			}),
		});
	}

	// 포그라운드 메시지 핸들러 설정
	static setupForegroundMessageHandler(): void {
		// 알림 수신 리스너
		Notifications.addNotificationReceivedListener(notification => {
			console.log('알림 수신:', notification);

			// 알림 데이터를 데이터베이스에 저장
			if (notification.request.content.data) {
				this.saveNotificationToDB(notification.request.content.data);
			}
		});

		// 알림 클릭 리스너
		Notifications.addNotificationResponseReceivedListener(response => {
			console.log('알림 클릭:', response);

			// 알림 클릭 시 해당 화면으로 이동
			if (response.notification.request.content.data) {
				this.handleNotificationPress(response.notification.request.content.data);
			}
		});
	}

	// 알림 클릭 핸들러
	static async handleNotificationPress(data: any): Promise<void> {
		if (!data) return;

		const { type, relatedId, activityId } = data;

		// 활동이 있으면 읽음 처리
		if (activityId) {
			try {
				const db = getDatabase();
				await db.markActivityAsRead(activityId);
				console.log('Activity marked as read:', activityId);
			} catch (error) {
				console.error('Failed to mark activity as read:', error);
			}
		}

		// 알림 타입에 따라 다른 화면으로 이동
		try {
			const db = getDatabase();

			switch (type) {
				case 'payment':
					// 미지급 급여 알림 - 스케줄 상세로 이동 (근로자 정보 포함)
					if (relatedId) {
						const schedule = await db.getSchedule(relatedId);
						if (schedule) {
							console.log('스케줄 상세 화면으로 이동 (미지급 급여):', relatedId);
							// TODO: router.push(`/schedule/${relatedId}`);
						} else {
							alert("존재하지 않는 스케줄입니다.");
						}
					}
					break;
				case 'revenue':
					// 미수금 알림 - 거래처 존재 여부 확인 후 상세로 이동
					if (relatedId) {
						const client = await db.getClient(relatedId);
						if (client) {
							console.log('거래처 상세 화면으로 이동:', relatedId);
							// TODO: router.push(`/client/${relatedId}`);
						} else {
							alert("존재하지 않는 거래처입니다.");
						}
					}
					break;
				case 'schedule':
					// 스케줄 관련 - 스케줄 존재 여부 확인 후 상세로 이동
					if (relatedId) {
						const schedule = await db.getSchedule(relatedId);
						if (schedule) {
							console.log('스케줄 상세 화면으로 이동:', relatedId);
							// TODO: router.push(`/schedule/${relatedId}`);
						} else {
							alert("존재하지 않는 스케줄입니다.");
						}
					}
					break;
				case 'worker':
					// 근로자 관련 - 근로자 관리로 이동
					console.log('근로자 관리 화면으로 이동');
					// TODO: router.push('/workers');
					break;
				default:
					console.log('알 수 없는 알림 타입:', type);
			}
		} catch (error) {
			console.error('Error handling notification press:', error);
			alert("데이터를 확인하는 중 오류가 발생했습니다.");
		}
	}

	// 알림 데이터를 데이터베이스에 저장
	static async saveNotificationToDB(data: any): Promise<void> {
		try {
			const { type, title, message, relatedId, priority, activityId } = data;

			// 활동이 있으면 활동을 읽음 처리
			if (activityId) {
				const db = getDatabase();
				await db.markActivityAsRead(activityId);
			}

			// 기존 알림 시스템은 유지 (필요한 경우)
			// await database.createNotification({
			// 	userId: '', // 현재 사용자 ID로 설정
			// 	type: type as 'wage_overdue' | 'revenue_overdue' | 'schedule_reminder',
			// 	title: title || '알림',
			// 	message: message || '',
			// 	isRead: false,
			// 	priority: priority ? parseInt(priority) : 2,
			// 	relatedId: relatedId || undefined,
			// });
		} catch (error) {
			console.error('알림 데이터베이스 저장 오류:', error);
		}
	}

	// 알림 채널 생성 (Android)
	static async createNotificationChannel(): Promise<void> {
		if (Platform.OS === 'android') {
			await Notifications.setNotificationChannelAsync('remit-planner-notifications', {
				name: 'Remit Planner 알림',
				description: '급여 및 수급 관련 알림',
				importance: Notifications.AndroidImportance.HIGH,
				sound: 'default',
				vibrationPattern: [0, 250, 250, 250],
				lightColor: '#FF6B6B',
			});
			console.log('알림 채널 생성 완료');
		}
	}

	// FCM 초기화
	static async initialize(): Promise<void> {
		try {
			// 알림 권한 요청
			const hasPermission = await this.requestPermission();
			if (!hasPermission) {
				console.log('알림 권한이 필요합니다.');
				return;
			}

			// 알림 채널 생성 (Android)
			await this.createNotificationChannel();

			// 메시지 핸들러 설정
			this.setupBackgroundMessageHandler();
			this.setupForegroundMessageHandler();

		} catch (error) {
			console.error('알림 초기화 오류:', error);
		}
	}

	// 토큰 갱신 리스너 (Expo에서는 자동으로 처리됨)
	static setupTokenRefreshListener(): void {
		// Expo Notifications에서는 토큰 갱신이 자동으로 처리됩니다.
	}
}
