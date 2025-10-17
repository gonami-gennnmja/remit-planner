// Platform-specific database factory
import { IDatabase } from './interface';
import { SupabaseRepository } from './supabaseRepository';

// Web fallback database
class WebDatabase implements IDatabase {
	private workers: Map<string, any> = new Map();
	private schedules: Map<string, any> = new Map();
	private scheduleWorkers: Map<string, any> = new Map();
	private workPeriods: Map<string, any> = new Map();

	async init(): Promise<void> {
		console.log('🌐 Using web database (in-memory + localStorage)');
		this.loadFromLocalStorage();
	}

	private loadFromLocalStorage(): void {
		try {
			const workersData = localStorage.getItem('remit_planner_workers');
			if (workersData) {
				const workers = JSON.parse(workersData);
				workers.forEach((worker: any) => this.workers.set(worker.id, worker));
			}

			const schedulesData = localStorage.getItem('remit_planner_schedules');
			if (schedulesData) {
				const schedules = JSON.parse(schedulesData);
				schedules.forEach((schedule: any) => this.schedules.set(schedule.id, schedule));
			}

			const scheduleWorkersData = localStorage.getItem('remit_planner_schedule_workers');
			if (scheduleWorkersData) {
				const scheduleWorkers = JSON.parse(scheduleWorkersData);
				scheduleWorkers.forEach((sw: any) => this.scheduleWorkers.set(sw.id, sw));
			}

			const workPeriodsData = localStorage.getItem('remit_planner_work_periods');
			if (workPeriodsData) {
				const workPeriods = JSON.parse(workPeriodsData);
				workPeriods.forEach((wp: any) => this.workPeriods.set(wp.id, wp));
			}
		} catch (error) {
			console.warn('Failed to load from localStorage:', error);
		}
	}

	private saveToLocalStorage(): void {
		try {
			localStorage.setItem('remit_planner_workers', JSON.stringify(Array.from(this.workers.values())));
			localStorage.setItem('remit_planner_schedules', JSON.stringify(Array.from(this.schedules.values())));
			localStorage.setItem('remit_planner_schedule_workers', JSON.stringify(Array.from(this.scheduleWorkers.values())));
			localStorage.setItem('remit_planner_work_periods', JSON.stringify(Array.from(this.workPeriods.values())));
		} catch (error) {
			console.warn('Failed to save to localStorage:', error);
		}
	}

	// Worker operations
	async createWorker(worker: any): Promise<string> {
		this.workers.set(worker.id, worker);
		this.saveToLocalStorage();
		return worker.id;
	}

	async getWorker(id: string): Promise<any> {
		return this.workers.get(id) || null;
	}

	async getAllWorkers(): Promise<any[]> {
		return Array.from(this.workers.values());
	}

	async updateWorker(id: string, worker: any): Promise<void> {
		const existing = this.workers.get(id);
		if (existing) {
			const updated = { ...existing, ...worker };
			this.workers.set(id, updated);
			this.saveToLocalStorage();
		}
	}

	async deleteWorker(id: string): Promise<void> {
		this.workers.delete(id);
		this.saveToLocalStorage();
	}

	// Schedule operations
	async createSchedule(schedule: any): Promise<string> {
		this.schedules.set(schedule.id, schedule);
		this.saveToLocalStorage();
		return schedule.id;
	}

	async getSchedule(id: string): Promise<any> {
		const schedule = this.schedules.get(id);
		if (!schedule) return null;

		const workers = await this.getScheduleWorkers(id);
		return {
			...schedule,
			workers
		};
	}

	async getSchedulesByDate(date: string): Promise<any[]> {
		const schedules = Array.from(this.schedules.values()).filter(s => s.date === date);
		const result: any[] = [];

		for (const schedule of schedules) {
			const workers = await this.getScheduleWorkers(schedule.id);
			result.push({
				...schedule,
				workers
			});
		}

		return result;
	}

	async getSchedulesByDateRange(startDate: string, endDate: string): Promise<any[]> {
		const schedules = Array.from(this.schedules.values()).filter(s => s.date >= startDate && s.date <= endDate);
		const result: any[] = [];

		for (const schedule of schedules) {
			const workers = await this.getScheduleWorkers(schedule.id);
			result.push({
				...schedule,
				workers
			});
		}

		return result;
	}

	async updateSchedule(id: string, schedule: any): Promise<void> {
		const existing = this.schedules.get(id);
		if (existing) {
			const updated = { ...existing, ...schedule };
			this.schedules.set(id, updated);
			this.saveToLocalStorage();
		}
	}

	async deleteSchedule(id: string): Promise<void> {
		this.schedules.delete(id);
		this.saveToLocalStorage();
	}

	// Schedule-Worker relationships
	async addWorkerToSchedule(scheduleId: string, workerId: string, periods: any[], paid: boolean = false, workHours?: number): Promise<string> {
		const scheduleWorkerId = `sw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		this.scheduleWorkers.set(scheduleWorkerId, {
			id: scheduleWorkerId,
			scheduleId,
			workerId,
			paid,
			workHours
		});

		for (const period of periods) {
			const periodId = period.id || `wp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			this.workPeriods.set(periodId, {
				id: periodId,
				scheduleWorkerId,
				startTime: period.start,
				endTime: period.end
			});
		}

		this.saveToLocalStorage();
		return scheduleWorkerId;
	}

	async getScheduleWorkers(scheduleId: string): Promise<any[]> {
		const scheduleWorkers = Array.from(this.scheduleWorkers.values()).filter(sw => sw.scheduleId === scheduleId);
		const result: any[] = [];

		for (const sw of scheduleWorkers) {
			const worker = this.workers.get(sw.workerId);
			if (!worker) continue;

			const periods = Array.from(this.workPeriods.values()).filter(p => p.scheduleWorkerId === sw.id);

			result.push({
				worker,
				periods: periods.map(p => ({
					id: p.id,
					start: p.startTime,
					end: p.endTime
				})),
				paid: sw.paid
			});
		}

		return result;
	}

	async updateScheduleWorkerPaidStatus(scheduleId: string, workerId: string, paid: boolean): Promise<void> {
		const scheduleWorker = Array.from(this.scheduleWorkers.values())
			.find(sw => sw.scheduleId === scheduleId && sw.workerId === workerId);

		if (scheduleWorker) {
			scheduleWorker.paid = paid;
			this.scheduleWorkers.set(scheduleWorker.id, scheduleWorker);
			this.saveToLocalStorage();
		}
	}

	async updateScheduleWorkerHours(scheduleId: string, workerId: string, hours: number): Promise<void> {
		const scheduleWorker = Array.from(this.scheduleWorkers.values())
			.find(sw => sw.scheduleId === scheduleId && sw.workerId === workerId);

		if (scheduleWorker) {
			scheduleWorker.workHours = hours;
			this.scheduleWorkers.set(scheduleWorker.id, scheduleWorker);
			this.saveToLocalStorage();
		}
	}

	async removeWorkerFromSchedule(scheduleId: string, workerId: string): Promise<void> {
		const scheduleWorker = Array.from(this.scheduleWorkers.values())
			.find(sw => sw.scheduleId === scheduleId && sw.workerId === workerId);

		if (scheduleWorker) {
			const periods = Array.from(this.workPeriods.values())
				.filter(p => p.scheduleWorkerId === scheduleWorker.id);

			for (const period of periods) {
				this.workPeriods.delete(period.id);
			}

			this.scheduleWorkers.delete(scheduleWorker.id);
			this.saveToLocalStorage();
		}
	}

	async updateWorkerTaxWithheld(workerId: string, taxWithheld: boolean): Promise<void> {
		await this.updateWorker(workerId, { taxWithheld });
	}

	async clearAllData(): Promise<void> {
		this.workers.clear();
		this.schedules.clear();
		this.scheduleWorkers.clear();
		this.workPeriods.clear();
		this.saveToLocalStorage();
	}

	// Activity operations
	async createActivity(activity: {
		id: string;
		type: string;
		title: string;
		description?: string;
		related_id?: string;
		icon?: string;
		color?: string;
	}): Promise<string> {
		// For web, we'll store activities in localStorage
		try {
			const activitiesData = localStorage.getItem('remit_planner_activities');
			const activities = activitiesData ? JSON.parse(activitiesData) : [];

			activities.push({
				...activity,
				timestamp: new Date().toISOString(),
				created_at: new Date().toISOString()
			});

			localStorage.setItem('remit_planner_activities', JSON.stringify(activities));
			return activity.id;
		} catch (error) {
			console.warn('Failed to create activity:', error);
			return activity.id;
		}
	}

	async getRecentActivities(limit: number = 10): Promise<Array<{
		id: string;
		type: string;
		title: string;
		description?: string;
		related_id?: string;
		icon?: string;
		color?: string;
		timestamp: string;
		created_at: string;
	}>> {
		try {
			const activitiesData = localStorage.getItem('remit_planner_activities');
			if (!activitiesData) return [];

			const activities = JSON.parse(activitiesData);
			return activities
				.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
				.slice(0, limit);
		} catch (error) {
			console.warn('Failed to get activities:', error);
			return [];
		}
	}

	async clearOldActivities(daysToKeep: number = 30): Promise<void> {
		try {
			const activitiesData = localStorage.getItem('remit_planner_activities');
			if (!activitiesData) return;

			const activities = JSON.parse(activitiesData);
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

			const filteredActivities = activities.filter((activity: any) =>
				new Date(activity.created_at) > cutoffDate
			);

			localStorage.setItem('remit_planner_activities', JSON.stringify(filteredActivities));
		} catch (error) {
			console.warn('Failed to clear old activities:', error);
		}
	}
}

// Create platform-specific database
let database: IDatabase;

// 환경 변수 확인
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
	// Supabase 설정이 완료된 경우
	console.log('🗄️ Using Supabase database');
	database = new SupabaseRepository();
} else {
	// Supabase 설정이 안된 경우 로컬 데이터베이스 사용
	console.log('💾 Using local database (Supabase not configured)');
	database = new WebDatabase();
}

// Export the database instance
export { database };

// Export a function to get the database instance
export const getDatabase = (): IDatabase => {
	return database;
};
