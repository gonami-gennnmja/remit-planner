import { getDatabase } from "@/database/platformDatabase";

// 활동 타입 정의
export type ActivityType = "schedule" | "worker" | "payment";

export interface ActivityConfig {
	type: ActivityType;
	title: string;
	description?: string;
	relatedId?: string;
	icon?: string;
	color?: string;
}

// 활동 기록 함수
export async function logActivity(config: ActivityConfig): Promise<void> {
	try {
		const db = getDatabase();
		const id = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		await db.createActivity({
			id,
			...config,
		});

		console.log(`Activity logged: ${config.type} - ${config.title}`);
	} catch (error) {
		console.error("Failed to log activity:", error);
	}
}

// 스케줄 생성 활동 기록
export async function logScheduleCreated(title: string, description?: string): Promise<void> {
	await logActivity({
		type: "schedule",
		title: `${title} 일정 추가`,
		description: description || "새 일정이 생성되었습니다",
		icon: "calendar",
		color: "#3b82f6",
	});
}

// 스케줄 업데이트 활동 기록
export async function logScheduleUpdated(title: string): Promise<void> {
	await logActivity({
		type: "schedule",
		title: `${title} 일정 수정`,
		description: "일정이 업데이트되었습니다",
		icon: "create",
		color: "#3b82f6",
	});
}

// 스케줄 삭제 활동 기록
export async function logScheduleDeleted(title: string): Promise<void> {
	await logActivity({
		type: "schedule",
		title: `${title} 일정 삭제`,
		description: "일정이 삭제되었습니다",
		icon: "trash",
		color: "#ef4444",
	});
}

// 근로자 추가 활동 기록
export async function logWorkerAdded(name: string, phone: string, hourlyWage: number): Promise<void> {
	await logActivity({
		type: "worker",
		title: `${name}님 추가`,
		description: `${phone} | ${new Intl.NumberFormat("ko-KR").format(hourlyWage)}원/시간`,
		icon: "person-add",
		color: "#10b981",
	});
}

// 근로자 업데이트 활동 기록
export async function logWorkerUpdated(name: string): Promise<void> {
	await logActivity({
		type: "worker",
		title: `${name}님 정보 수정`,
		description: "근로자 정보가 업데이트되었습니다",
		icon: "create",
		color: "#10b981",
	});
}

// 근로자 삭제 활동 기록
export async function logWorkerDeleted(name: string): Promise<void> {
	await logActivity({
		type: "worker",
		title: `${name}님 삭제`,
		description: "근로자가 삭제되었습니다",
		icon: "person-remove",
		color: "#ef4444",
	});
}

// 급여 지급 활동 기록
export async function logPaymentMade(
	workerName: string,
	amount: number,
	scheduleTitle?: string
): Promise<void> {
	await logActivity({
		type: "payment",
		title: `${workerName}님 급여 지급`,
		description: scheduleTitle
			? `${scheduleTitle} - ${new Intl.NumberFormat("ko-KR").format(amount)}원`
			: `${new Intl.NumberFormat("ko-KR").format(amount)}원 지급 완료`,
		icon: "card",
		color: "#f59e0b",
	});
}

// 급여 지급 취소 활동 기록
export async function logPaymentCancelled(workerName: string): Promise<void> {
	await logActivity({
		type: "payment",
		title: `${workerName}님 급여 지급 취소`,
		description: "지급이 취소되었습니다",
		icon: "close-circle",
		color: "#ef4444",
	});
}

// 오래된 활동 정리 (30일 이상)
export async function cleanupOldActivities(daysToKeep: number = 30): Promise<void> {
	try {
		const db = getDatabase();
		await db.clearOldActivities(daysToKeep);
		console.log(`Old activities cleared (kept last ${daysToKeep} days)`);
	} catch (error) {
		console.error("Failed to cleanup old activities:", error);
	}
}

