import { getDatabase } from "@/database/platformDatabase";
import dayjs from "dayjs";

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

		// 2주 전 날짜 계산
		const twoWeeksAgo = dayjs().subtract(14, "days").format("YYYY-MM-DD");

		for (const schedule of allSchedules) {
			const scheduleEndDate = schedule.endDate || schedule.startDate;

			// 일정 종료일이 2주 전보다 이전인 경우
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

					// 활동 생성
					await db.createActivity({
						id: `overdue_${schedule.id}_${Date.now()}`,
						type: "payment",
						title: `미지급 급여 알림`,
						description: `${schedule.title} - ${unpaidWorkers.length}명, 총 ${totalAmount.toLocaleString()}원 (${overdueDays}일 지연)`,
						relatedId: schedule.id,
						icon: "warning",
						color: "#ef4444", // 빨간색으로 긴급도 표시
					});
				}
			}
		}
	} catch (error) {
		console.error("Failed to check overdue payments:", error);
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
		});
	} catch (error) {
		console.error("Failed to create worker activity:", error);
	}
}
