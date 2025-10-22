import { database } from '@/database';
import { Notification, NotificationSettings } from '@/models/types';
import dayjs from 'dayjs';
import * as Notifications from 'expo-notifications';

export class NotificationService {
	// 알림 생성
	static async createNotification(
		type: 'wage_overdue' | 'revenue_overdue' | 'schedule_reminder',
		title: string,
		message: string,
		relatedId?: string,
		priority: 1 | 2 | 3 = 2,
		scheduledAt?: string
	): Promise<string> {
		const user = await database.getCurrentUser();

		const notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'> = {
			userId: user.id,
			type,
			title,
			message,
			isRead: false,
			priority,
			relatedId,
			scheduledAt,
		};

		const notificationId = await database.createNotification(notification);

		// FCM 푸시 알림 전송
		await this.sendPushNotification(notification);

		return notificationId;
	}

	// Expo Push 알림 전송
	private static async sendPushNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
		try {
			// 로컬 알림으로 전송 (개발용)
			await this.sendLocalNotification(notification);

			// TODO: 서버에서 Expo Push 알림 전송
		} catch (error) {
			console.error('푸시 알림 전송 오류:', error);
		}
	}

	// 로컬 알림 전송 (개발/테스트용)
	private static async sendLocalNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
		await Notifications.scheduleNotificationAsync({
			content: {
				title: notification.title,
				body: notification.message,
				data: {
					type: notification.type,
					relatedId: notification.relatedId,
					priority: notification.priority,
				},
			},
			trigger: null, // 즉시 전송
		});
	}

	// 급여 연체 알림 생성
	static async createWageOverdueNotification(
		workerName: string,
		scheduleTitle: string,
		overdueDays: number
	): Promise<string> {
		return this.createNotification(
			'wage_overdue',
			'급여 연체 알림',
			`${workerName}님의 ${scheduleTitle} 급여가 ${overdueDays}일 연체되었습니다.`,
			undefined,
			1 // 높은 우선순위
		);
	}

	// 수급 연체 알림 생성
	static async createRevenueOverdueNotification(
		clientName: string,
		scheduleTitle: string,
		overdueDays: number
	): Promise<string> {
		return this.createNotification(
			'revenue_overdue',
			'수급 연체 알림',
			`${clientName}의 ${scheduleTitle} 수급이 ${overdueDays}일 연체되었습니다.`,
			undefined,
			1 // 높은 우선순위
		);
	}

	// 스케줄 리마인더 알림 생성
	static async createScheduleReminderNotification(
		scheduleTitle: string,
		startDate: string,
		reminderTime: string
	): Promise<string> {
		return this.createNotification(
			'schedule_reminder',
			'스케줄 리마인더',
			`${scheduleTitle}이 ${reminderTime}에 시작됩니다.`,
			undefined,
			2, // 보통 우선순위
			startDate
		);
	}

	// 알림 읽음 처리
	static async markAsRead(notificationId: string): Promise<void> {
		await database.updateNotification(notificationId, { isRead: true });
	}

	// 모든 알림 읽음 처리
	static async markAllAsRead(): Promise<void> {
		await database.markAllNotificationsAsRead();
	}

	// 사용자 알림 설정 가져오기
	static async getNotificationSettings(): Promise<NotificationSettings | null> {
		return await database.getNotificationSettings();
	}

	// 사용자 알림 설정 업데이트
	static async updateNotificationSettings(
		settings: Partial<NotificationSettings>
	): Promise<void> {
		await database.updateNotificationSettings(settings);
	}

	// 미읽음 알림 개수 가져오기
	static async getUnreadCount(): Promise<number> {
		return await database.getUnreadNotificationCount();
	}

	// 최근 알림 가져오기 (위젯용)
	static async getRecentNotifications(limit: number = 5): Promise<Notification[]> {
		return await database.getRecentNotifications(limit);
	}

	// 자동 알림 생성 (백그라운드에서 실행)
	static async checkAndCreateAutomaticNotifications(): Promise<void> {
		const settings = await this.getNotificationSettings();
		if (!settings) return;

		// 급여 연체 체크
		if (settings.wageOverdueEnabled) {
			await this.checkWageOverdue();
		}

		// 수급 연체 체크
		if (settings.revenueOverdueEnabled) {
			await this.checkRevenueOverdue();
		}

		// 스케줄 리마인더 체크
		if (settings.scheduleReminderEnabled) {
			await this.checkScheduleReminders(settings);
		}
	}

	// 급여 연체 체크
	private static async checkWageOverdue(): Promise<void> {
		const schedules = await database.getAllSchedules();
		const today = dayjs();

		for (const schedule of schedules) {
			if (!schedule.allWagesPaid) {
				const endDate = dayjs(schedule.endDate);
				const overdueDays = today.diff(endDate, 'day');

				if (overdueDays > 0) {
					// 이미 해당 스케줄에 대한 연체 알림이 있는지 확인
					const existingNotification = await database.getNotificationByRelatedId(schedule.id, 'wage_overdue');

					if (!existingNotification) {
						await this.createWageOverdueNotification(
							'근로자들', // 실제로는 근로자 이름들을 가져와야 함
							schedule.title,
							overdueDays
						);
					}
				}
			}
		}
	}

	// 수급 연체 체크
	private static async checkRevenueOverdue(): Promise<void> {
		const schedules = await database.getAllSchedules();

		for (const schedule of schedules) {
			if (schedule.revenueStatus === 'overdue') {
				// 이미 해당 스케줄에 대한 연체 알림이 있는지 확인
				const existingNotification = await database.getNotificationByRelatedId(schedule.id, 'revenue_overdue');

				if (!existingNotification) {
					const dueDate = dayjs(schedule.revenueDueDate);
					const today = dayjs();
					const overdueDays = today.diff(dueDate, 'day');

					await this.createRevenueOverdueNotification(
						schedule.category, // 클라이언트명
						schedule.title,
						overdueDays
					);
				}
			}
		}
	}

	// 스케줄 리마인더 체크
	private static async checkScheduleReminders(settings: NotificationSettings): Promise<void> {
		const schedules = await database.getAllSchedules();
		const today = dayjs();

		for (const schedule of schedules) {
			const startDate = dayjs(schedule.startDate);
			const reminderTime = startDate.subtract(settings.scheduleReminderValue, settings.scheduleReminderUnit);

			// 리마인더 시간이 오늘과 같거나 지났고, 아직 시작하지 않은 스케줄
			if (today.isSameOrAfter(reminderTime) && today.isBefore(startDate)) {
				// 이미 해당 스케줄에 대한 리마인더 알림이 있는지 확인
				const existingNotification = await database.getNotificationByRelatedId(schedule.id, 'schedule_reminder');

				if (!existingNotification) {
					await this.createScheduleReminderNotification(
						schedule.title,
						schedule.startDate,
						startDate.format('YYYY-MM-DD HH:mm')
					);
				}
			}
		}
	}

}
