import { getDatabase } from "@/database/platformDatabase";
import dayjs from "dayjs";
import * as Notifications from "expo-notifications";

// 활동 생성 후 푸시알림 전송
async function sendActivityNotification(activityId: string, title: string, description: string, type: string, relatedId?: string): Promise<void> {
	try {
		await Notifications.scheduleNotificationAsync({
			content: {
				title: title,
				body: description,
				data: {
					type: type,
					relatedId: relatedId,
					activityId: activityId,
				},
			},
			trigger: null, // 즉시 전송
		});
	} catch (error) {
		console.error('❌ Failed to send push notification:', error);
	}
}

export interface OverduePayment {
	scheduleId: string;
	scheduleTitle: string;
	endDate: string;
	overdueDays: number;
	unpaidWorkers: Array<{
		workerId: string;
		workerName: string;
		amount: number;
		workHours: number;
	}>;
}

/**
 * 일정 종료일로부터 2주가 지난 미지급 근로자들을 찾아서 활동 생성
 */
export async function checkAndCreateOverduePaymentActivities(): Promise<void> {
	try {
		const db = getDatabase();
		const allSchedules = await db.getAllSchedules();

		// 2주 전 날짜 계산 (스케줄 종료 후 2주)
		const twoWeeksAgo = dayjs().subtract(14, "days").format("YYYY-MM-DD");

		for (const schedule of allSchedules) {
			const scheduleEndDate = schedule.endDate || schedule.startDate;

			// 일정 종료일이 2주 전보다 이전인 경우 (스케줄 종료 후 2주 경과)
			if (dayjs(scheduleEndDate).isBefore(twoWeeksAgo)) {
				// 해당 스케줄의 근로자 정보 가져오기
				const scheduleWorkers = await db.getScheduleWorkers(schedule.id);

				// 미지급 근로자들 필터링
				const unpaidWorkers = scheduleWorkers.filter((sw: any) => !sw.paid);

				if (unpaidWorkers.length > 0) {
					// 근로자 정보 가져오기
					const workerDetails = await Promise.all(
						unpaidWorkers.map(async (sw: any) => {
							// 근무 시간 계산
							const totalHours = sw.periods?.reduce((sum: number, period: any) => {
								const start = dayjs(period.start);
								const end = dayjs(period.end);
								return sum + end.diff(start, "hour", true);
							}, 0) || 0;

							const worker = sw.worker;
							const hourlyWage = worker?.hourlyWage || 0;
							const taxWithheld = worker?.taxWithheld || false;
							const taxRate = 0.033;

							let amount = hourlyWage * totalHours;
							if (taxWithheld) {
								amount = amount * (1 - taxRate);
							}

							return {
								workerId: worker?.id || "",
								workerName: worker?.name || "알 수 없음",
								amount: Math.round(amount),
								workHours: totalHours,
							};
						})
					);

					const totalAmount = workerDetails.reduce((sum, worker) => sum + worker.amount, 0);
					const overdueDays = dayjs().diff(dayjs(scheduleEndDate), "days");

					// 이미 해당 스케줄에 대한 미지급 급여 활동이 있는지 확인
					const existingActivities = await db.getRecentActivities(100);
					const existingOverdueActivity = existingActivities.find(
						(activity: any) =>
							activity.type === "payment" &&
							activity.relatedId === schedule.id &&
							activity.title === "미지급 급여 알림" &&
							!activity.isDeleted
					);

					// 기존 활동이 없을 때만 새로 생성
					if (!existingOverdueActivity) {
						const activityId = `overdue_${schedule.id}_${Date.now()}`;
						const title = `미지급 급여 알림`;
						const description = `${schedule.title} - ${unpaidWorkers.length}명, 총 ${totalAmount.toLocaleString()}원 (${overdueDays}일 지연)`;

						await db.createActivity({
							id: activityId,
							type: "payment",
							title: title,
							description: description,
							relatedId: schedule.id,
							icon: "warning",
							color: "#ef4444", // 빨간색으로 긴급도 표시
							isRead: false,
							isDeleted: false,
						});

						// 푸시알림 전송
						await sendActivityNotification(activityId, title, description, "payment", schedule.id);
					}

					// 거래처가 있는 경우 수급 지연 알림도 생성
					if (schedule.clientId) {
						// 거래처 정보 가져오기
						const client = await db.getClient(schedule.clientId);
						const clientName = client?.name || "거래처";

						// 기존 거래처 수급 지연 활동이 있는지 확인
						const existingRevenueOverdueActivity = existingActivities.find(
							(activity: any) =>
								activity.type === "revenue" &&
								activity.relatedId === schedule.id &&
								activity.title === "거래처 수급 지연 알림" &&
								!activity.isDeleted
						);

						// 기존 활동이 없을 때만 새로 생성
						if (!existingRevenueOverdueActivity) {
							await db.createActivity({
								id: `revenue_overdue_${schedule.id}_${Date.now()}`,
								type: "revenue",
								title: `거래처 수급 지연 알림`,
								description: `${clientName} - ${schedule.title} 수급 지연 (${overdueDays}일 지연)`,
								relatedId: schedule.id,
								icon: "warning",
								color: "#ef4444", // 빨간색으로 긴급도 표시
								isRead: false,
								isDeleted: false,
							});
						}
					}
				}
			}
		}
	} catch (error) {
		console.error("Failed to check overdue payments:", error);
	}
}

/**
 * 스케줄 완료 시점에 알림 생성
 */
export async function createScheduleCompletionActivities(schedule: any): Promise<void> {
	try {
		const db = getDatabase();
		const scheduleEndDate = schedule.endDate || schedule.startDate;
		const today = dayjs();
		const endDate = dayjs(scheduleEndDate);

		// 스케줄이 오늘 완료된 경우
		if (endDate.isSame(today, 'day')) {
			// 1주 후 급여 지급 알림 생성
			const paymentDueDate = endDate.add(7, 'days');
			await db.createActivity({
				id: `payment_due_${schedule.id}_${Date.now()}`,
				type: "payment",
				title: "급여 지급 예정",
				description: `${schedule.title} - ${paymentDueDate.format('MM월 DD일')}까지 급여 지급 예정`,
				relatedId: schedule.id,
				icon: "card",
				color: "#3b82f6", // 파란색
				isRead: false,
				isDeleted: false,
			});

			// 2주 후 미지급 급여 알림 생성 (스케줄된 알림)
			const overdueDate = endDate.add(14, 'days');
			await db.createActivity({
				id: `overdue_scheduled_${schedule.id}_${Date.now()}`,
				type: "payment",
				title: "미지급 급여 알림 (예정)",
				description: `${schedule.title} - ${overdueDate.format('MM월 DD일')}부터 미지급 급여 알림 시작`,
				relatedId: schedule.id,
				icon: "warning",
				color: "#f59e0b", // 주황색
				isRead: false,
				isDeleted: false,
			});

			// 거래처가 있는 경우 수급 관련 알림 생성
			if (schedule.clientId) {
				// 거래처 정보 가져오기
				const client = await db.getClient(schedule.clientId);
				const clientName = client?.name || "거래처";

				// 1주 후 거래처 수급 요청 알림
				const revenueDueDate = endDate.add(7, 'days');
				await db.createActivity({
					id: `revenue_due_${schedule.id}_${Date.now()}`,
					type: "revenue",
					title: "거래처 수급 요청",
					description: `${clientName} - ${schedule.title} 수급 요청 (${revenueDueDate.format('MM월 DD일')}까지)`,
					relatedId: schedule.id,
					icon: "business",
					color: "#10b981", // 초록색
					isRead: false,
					isDeleted: false,
				});

				// 2주 후 거래처 수급 지연 알림 (스케줄된 알림)
				const revenueOverdueDate = endDate.add(14, 'days');
				await db.createActivity({
					id: `revenue_overdue_scheduled_${schedule.id}_${Date.now()}`,
					type: "revenue",
					title: "거래처 수급 지연 알림 (예정)",
					description: `${clientName} - ${schedule.title} 수급 지연 알림 (${revenueOverdueDate.format('MM월 DD일')}부터)`,
					relatedId: schedule.id,
					icon: "warning",
					color: "#f59e0b", // 주황색
					isRead: false,
					isDeleted: false,
				});
			}
		}
	} catch (error) {
		console.error("Failed to create schedule completion activities:", error);
	}
}

/**
 * 급여 지급 시 활동 생성
 */
export async function createPaymentActivity(
	scheduleId: string,
	workerId: string,
	amount: number
): Promise<void> {
	try {
		const db = getDatabase();
		const schedule = await db.getSchedule(scheduleId);
		const worker = await db.getWorker(workerId);

		if (schedule && worker) {
			await db.createActivity({
				id: `payment_${scheduleId}_${workerId}_${Date.now()}`,
				type: "payment",
				title: `급여 지급 완료`,
				description: `${worker.name}님 - ${schedule.title} (${amount.toLocaleString()}원)`,
				relatedId: scheduleId,
				icon: "checkmark-circle",
				color: "#10b981", // 초록색으로 완료 표시
				isRead: false,
				isDeleted: false,
			});
		}
	} catch (error) {
		console.error("Failed to create payment activity:", error);
	}
}

/**
 * 일정 추가 시 활동 생성
 */
export async function createScheduleActivity(
	scheduleId: string,
	title: string,
	description?: string
): Promise<void> {
	try {
		const db = getDatabase();

		await db.createActivity({
			id: `schedule_${scheduleId}_${Date.now()}`,
			type: "schedule",
			title: `새 일정 추가`,
			description: `${title}${description ? ` - ${description}` : ""}`,
			relatedId: scheduleId,
			icon: "calendar",
			color: "#6366f1", // 파란색
			isRead: false,
			isDeleted: false,
		});
	} catch (error) {
		console.error("Failed to create schedule activity:", error);
	}
}

/**
 * 근로자 추가 시 활동 생성
 */
export async function createWorkerActivity(
	workerId: string,
	workerName: string,
	hourlyWage: number
): Promise<void> {
	try {
		const db = getDatabase();

		await db.createActivity({
			id: `worker_${workerId}_${Date.now()}`,
			type: "worker",
			title: `새 근로자 추가`,
			description: `${workerName}님 (${hourlyWage.toLocaleString()}원/시간)`,
			relatedId: workerId,
			icon: "person-add",
			color: "#8b5cf6", // 보라색
			isRead: false,
			isDeleted: false,
		});
	} catch (error) {
		console.error("Failed to create worker activity:", error);
	}
}
