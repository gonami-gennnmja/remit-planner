// Simple in-memory database for both web and native
import { IDatabase } from './interface';

class SimpleDatabase implements IDatabase {
	private workers: Map<string, any> = new Map();
	private schedules: Map<string, any> = new Map();
	private scheduleWorkers: Map<string, any> = new Map();
	private workPeriods: Map<string, any> = new Map();
	private initialized = false;

	async init(): Promise<void> {
		if (this.initialized) return;

		console.log('🗄️ Using simple in-memory database');
		this.initialized = true;
	}

	// Worker operations
	async createWorker(worker: any): Promise<string> {
		this.workers.set(worker.id, worker);
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
		}
	}

	async deleteWorker(id: string): Promise<void> {
		this.workers.delete(id);
	}

	// Schedule operations
	async createSchedule(schedule: any): Promise<string> {
		this.schedules.set(schedule.id, schedule);
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
		}
	}

	async deleteSchedule(id: string): Promise<void> {
		this.schedules.delete(id);
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
		}
	}

	async updateScheduleWorkerHours(scheduleId: string, workerId: string, hours: number): Promise<void> {
		const scheduleWorker = Array.from(this.scheduleWorkers.values())
			.find(sw => sw.scheduleId === scheduleId && sw.workerId === workerId);

		if (scheduleWorker) {
			scheduleWorker.workHours = hours;
			this.scheduleWorkers.set(scheduleWorker.id, scheduleWorker);
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
	}
}

export const database = new SimpleDatabase();
