import { Schedule } from '@/models/types';
import dayjs from 'dayjs';
import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';

/**
 * 네이티브 달력 연동 유틸리티
 * iOS의 Apple Calendar와 Android의 Google Calendar와 연동
 */

export interface CalendarSyncOptions {
	/**
	 * 사용할 캘린더 ID (지정하지 않으면 기본 캘린더 사용)
	 */
	calendarId?: string;
}

/**
 * 달력 접근 권한 요청
 */
export async function requestCalendarPermissions(): Promise<boolean> {
	try {
		const { status } = await Calendar.requestCalendarPermissionsAsync();
		return status === 'granted';
	} catch (error) {
		console.error('Failed to request calendar permissions:', error);
		return false;
	}
}

/**
 * 현재 권한 상태 확인
 */
export async function checkCalendarPermissions(): Promise<boolean> {
	try {
		const { status } = await Calendar.getCalendarPermissionsAsync();
		return status === 'granted';
	} catch (error) {
		console.error('Failed to check calendar permissions:', error);
		return false;
	}
}

/**
 * 사용 가능한 캘린더 목록 가져오기
 */
export async function getAvailableCalendars() {
	try {
		const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
		return calendars;
	} catch (error) {
		console.error('Failed to get calendars:', error);
		return [];
	}
}

/**
 * 기본 캘린더 가져오기
 */
export async function getDefaultCalendar(): Promise<Calendar.Calendar | null> {
	try {
		const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

		// iOS: isPrimary인 캘린더 찾기
		// Android: 기본 캘린더 찾기
		const defaultCalendar = calendars.find(cal =>
			Platform.OS === 'ios' ? cal.isPrimary : cal.allowsModifications
		) || calendars[0];

		return defaultCalendar || null;
	} catch (error) {
		console.error('Failed to get default calendar:', error);
		return null;
	}
}

/**
 * 스케줄을 네이티브 달력에 추가
 */
export async function addScheduleToCalendar(
	schedule: Schedule,
	options: CalendarSyncOptions = {}
): Promise<{ success: boolean; eventIds?: string[]; error?: string }> {
	try {
		// 권한 확인
		const hasPermission = await checkCalendarPermissions();
		if (!hasPermission) {
			const granted = await requestCalendarPermissions();
			if (!granted) {
				return {
					success: false,
					error: '달력 접근 권한이 필요합니다.',
				};
			}
		}

		// 캘린더 가져오기
		let calendar: Calendar.Calendar | null = null;
		if (options.calendarId) {
			const calendars = await getAvailableCalendars();
			calendar = calendars.find(cal => cal.id === options.calendarId) || null;
		} else {
			calendar = await getDefaultCalendar();
		}

		if (!calendar) {
			return {
				success: false,
				error: '사용 가능한 캘린더를 찾을 수 없습니다.',
			};
		}

		const eventIds: string[] = [];

		// 전체 스케줄을 하나의 이벤트로 생성
		// 시작일시와 종료일시 계산
		let startDateTime: Date;
		let endDateTime: Date;

		// 근무 시간이 있는 경우 첫 번째 근로자의 첫 번째 근무일 시간 사용
		if (
			schedule.workers &&
			schedule.workers.length > 0 &&
			schedule.workers[0].periods &&
			schedule.workers[0].periods.length > 0
		) {
			const firstPeriod = schedule.workers[0].periods[0];
			startDateTime = dayjs(`${schedule.startDate} ${firstPeriod.startTime}`).toDate();
			// 종료일시는 마지막 근무일의 종료 시간 사용
			const lastWorker = schedule.workers[schedule.workers.length - 1];
			const lastPeriod =
				lastWorker.periods && lastWorker.periods.length > 0
					? lastWorker.periods[lastWorker.periods.length - 1]
					: firstPeriod;
			const lastWorkDate = lastPeriod.workDate || schedule.endDate;
			endDateTime = dayjs(`${lastWorkDate} ${lastPeriod.endTime}`).toDate();
		} else {
			// 근무 시간 정보가 없으면 기본값 사용
			startDateTime = dayjs(`${schedule.startDate} 09:00`).toDate();
			endDateTime = dayjs(`${schedule.endDate} 18:00`).toDate();
		}

		const eventDescription = buildEventDescription(schedule);

		// 반복 규칙 생성 (반복 스케줄인 경우)
		const recurrenceRule = buildRecurrenceRule(schedule);

		const eventData: any = {
			title: schedule.title,
			startDate: startDateTime,
			endDate: endDateTime,
			notes: eventDescription,
			location: schedule.address || schedule.location,
			timeZone: 'Asia/Seoul',
			alarms: [
				{
					relativeOffset: -30, // 30분 전 알림
					method: Calendar.AlarmMethod.ALERT,
				},
			],
		};

		// 반복 규칙이 있으면 추가
		if (recurrenceRule) {
			eventData.recurrenceRule = recurrenceRule;
		}

		const eventId = await Calendar.createEventAsync(calendar.id, eventData);

		eventIds.push(eventId);

		return {
			success: true,
			eventIds,
		};
	} catch (error) {
		console.error('Failed to add schedule to calendar:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
		};
	}
}

/**
 * 반복 규칙 생성
 * expo-calendar의 RecurrenceRule 형식으로 변환
 */
function buildRecurrenceRule(schedule: Schedule): Calendar.RecurrenceRule | null {
	if (!schedule.isRecurring || !schedule.recurrenceType) {
		return null;
	}

	const rule: Calendar.RecurrenceRule = {
		frequency: mapRecurrenceFrequency(schedule.recurrenceType),
		interval: schedule.recurrenceInterval || 1,
	};

	// 종료 조건 설정
	if (schedule.recurrenceEndType === 'date' && schedule.recurrenceEndDate) {
		rule.endDate = dayjs(schedule.recurrenceEndDate).toDate();
	} else if (schedule.recurrenceEndType === 'count' && schedule.recurrenceCount) {
		rule.occurrence = schedule.recurrenceCount;
	}
	// 'never'인 경우 endDate나 occurrence를 설정하지 않음

	// 주간 반복인 경우 요일 설정
	if (schedule.recurrenceType === 'weekly' && schedule.recurrenceDaysOfWeek) {
		rule.daysOfTheWeek = schedule.recurrenceDaysOfWeek.map(day => ({
			dayOfTheWeek: mapDayOfWeek(day),
		}));
	}

	// 월간 반복인 경우 날짜 설정
	if (schedule.recurrenceType === 'monthly' && schedule.recurrenceDayOfMonth) {
		rule.daysOfTheMonth = [schedule.recurrenceDayOfMonth];
	}

	// 연간 반복인 경우 월 설정
	if (schedule.recurrenceType === 'yearly' && schedule.recurrenceMonthOfYear) {
		rule.monthsOfTheYear = [schedule.recurrenceMonthOfYear];
	}

	return rule;
}

/**
 * 반복 타입을 expo-calendar의 Frequency로 매핑
 */
function mapRecurrenceFrequency(
	type: 'daily' | 'weekly' | 'monthly' | 'yearly'
): Calendar.Frequency {
	switch (type) {
		case 'daily':
			return Calendar.Frequency.DAILY;
		case 'weekly':
			return Calendar.Frequency.WEEKLY;
		case 'monthly':
			return Calendar.Frequency.MONTHLY;
		case 'yearly':
			return Calendar.Frequency.YEARLY;
		default:
			return Calendar.Frequency.DAILY;
	}
}

/**
 * 요일 숫자를 expo-calendar의 DayOfTheWeek로 매핑
 * 0=일요일, 1=월요일, ..., 6=토요일
 */
function mapDayOfWeek(day: number): Calendar.DayOfTheWeek {
	// expo-calendar는 1=일요일, 2=월요일, ..., 7=토요일 사용
	// 우리는 0=일요일, 1=월요일, ..., 6=토요일 사용
	const expoDay = day === 0 ? 1 : day + 1;
	return expoDay as Calendar.DayOfTheWeek;
}

/**
 * 이벤트 설명 텍스트 생성
 * iOS와 Android 모두 notes 필드에 저장됨
 */
function buildEventDescription(schedule: Schedule): string {
	const parts: string[] = [];

	// 스케줄 설명
	if (schedule.description) {
		parts.push(schedule.description);
	}

	// 근로자 목록 (이름만)
	if (schedule.workers && schedule.workers.length > 0) {
		const workerNames = schedule.workers.map(w => w.worker.name).join(', ');
		parts.push(`\n근로자: ${workerNames}`);
	}

	// 근무 기간 정보
	if (schedule.startDate && schedule.endDate) {
		const startDate = dayjs(schedule.startDate).format('YYYY년 MM월 DD일');
		const endDate = dayjs(schedule.endDate).format('YYYY년 MM월 DD일');
		if (schedule.startDate === schedule.endDate) {
			parts.push(`\n일정: ${startDate}`);
		} else {
			parts.push(`\n일정: ${startDate} ~ ${endDate}`);
		}
	}

	// 근무 시간 정보 (첫 번째 근로자의 첫 근무일 기준)
	if (
		schedule.workers &&
		schedule.workers.length > 0 &&
		schedule.workers[0].periods &&
		schedule.workers[0].periods.length > 0
	) {
		const firstPeriod = schedule.workers[0].periods[0];
		parts.push(`\n근무시간: ${firstPeriod.startTime} ~ ${firstPeriod.endTime}`);
	}

	// 메모
	if (schedule.memo) {
		parts.push(`\n메모: ${schedule.memo}`);
	}

	return parts.join('\n');
}

/**
 * 캘린더에서 이벤트 삭제
 */
export async function removeEventsFromCalendar(eventIds: string[]): Promise<boolean> {
	try {
		for (const eventId of eventIds) {
			await Calendar.deleteEventAsync(eventId);
		}
		return true;
	} catch (error) {
		console.error('Failed to remove events from calendar:', error);
		return false;
	}
}

/**
 * 권한 확인 및 안내 메시지 표시
 */
export async function requestCalendarPermissionWithAlert(): Promise<boolean> {
	const hasPermission = await checkCalendarPermissions();

	if (hasPermission) {
		return true;
	}

	return new Promise((resolve) => {
		Alert.alert(
			'달력 접근 권한 필요',
			'일정을 기기의 캘린더 앱에 추가하기 위해 접근 권한이 필요합니다.',
			[
				{
					text: '취소',
					style: 'cancel',
					onPress: () => resolve(false),
				},
				{
					text: '허용',
					onPress: async () => {
						const granted = await requestCalendarPermissions();
						resolve(granted);
					},
				},
			]
		);
	});
}

/**
 * 스케줄을 캘린더에 추가하는 헬퍼 함수 (권한 확인 포함)
 */
export async function syncScheduleToCalendar(
	schedule: Schedule,
	options: CalendarSyncOptions = {}
): Promise<{ success: boolean; message: string; eventIds?: string[] }> {
	const hasPermission = await requestCalendarPermissionWithAlert();

	if (!hasPermission) {
		return {
			success: false,
			message: '달력 접근 권한이 거부되었습니다.',
		};
	}

	const result = await addScheduleToCalendar(schedule, options);

	if (result.success) {
		const eventCount = result.eventIds?.length || 0;
		return {
			success: true,
			message: `캘린더에 ${eventCount}개의 이벤트가 추가되었습니다.`,
			eventIds: result.eventIds,
		};
	} else {
		return {
			success: false,
			message: result.error || '캘린더에 이벤트를 추가하는데 실패했습니다.',
		};
	}
}

