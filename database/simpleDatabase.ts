// Simple in-memory database for both web and native
import { IDatabase } from './interface';

class SimpleDatabase implements IDatabase {
	private workers: Map<string, any> = new Map();
	private schedules: Map<string, any> = new Map();
	private scheduleWorkers: Map<string, any> = new Map();
	private workPeriods: Map<string, any> = new Map();
	private clients: Map<string, any> = new Map();
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

	async getAllSchedules(): Promise<any[]> {
		const schedules = Array.from(this.schedules.values());
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
		const scheduleWorkers = Array.from(this.scheduleWorkers.values()).filter(sw => sw.schedule_id === scheduleId);
		const result: any[] = [];

		for (const sw of scheduleWorkers) {
			const worker = this.workers.get(sw.worker_id);
			if (!worker) continue;

			const periods = Array.from(this.workPeriods.values()).filter(p => p.schedule_worker_id === sw.id);

			result.push({
				worker,
				periods: periods.map(p => ({
					id: p.id,
					start: `${p.work_date}T${p.start_time}+09:00`,
					end: `${p.work_date}T${p.end_time}+09:00`
				})),
				paid: sw.wage_paid || false
			});
		}

		return result;
	}

	async updateScheduleWorkerPaidStatus(scheduleId: string, workerId: string, paid: boolean): Promise<void> {
		const scheduleWorker = Array.from(this.scheduleWorkers.values())
			.find(sw => sw.schedule_id === scheduleId && sw.worker_id === workerId);

		if (scheduleWorker) {
			scheduleWorker.paid = paid;
			this.scheduleWorkers.set(scheduleWorker.id, scheduleWorker);
		}
	}

	async updateScheduleWorkerHours(scheduleId: string, workerId: string, hours: number): Promise<void> {
		const scheduleWorker = Array.from(this.scheduleWorkers.values())
			.find(sw => sw.schedule_id === scheduleId && sw.worker_id === workerId);

		if (scheduleWorker) {
			scheduleWorker.workHours = hours;
			this.scheduleWorkers.set(scheduleWorker.id, scheduleWorker);
		}
	}

	async removeWorkerFromSchedule(scheduleId: string, workerId: string): Promise<void> {
		const scheduleWorker = Array.from(this.scheduleWorkers.values())
			.find(sw => sw.schedule_id === scheduleId && sw.worker_id === workerId);

		if (scheduleWorker) {
			const periods = Array.from(this.workPeriods.values())
				.filter(p => p.schedule_worker_id === scheduleWorker.id);

			for (const period of periods) {
				this.workPeriods.delete(period.id);
			}

			this.scheduleWorkers.delete(scheduleWorker.id);
		}
	}

	async updateWorkerTaxWithheld(workerId: string, taxWithheld: boolean): Promise<void> {
		await this.updateWorker(workerId, { taxWithheld });
	}

	// Schedule Worker operations
	async createScheduleWorker(scheduleWorker: any): Promise<string> {
		this.scheduleWorkers.set(scheduleWorker.id, scheduleWorker);
		return scheduleWorker.id;
	}

	async updateScheduleWorker(id: string, scheduleWorker: any): Promise<void> {
		const existing = this.scheduleWorkers.get(id);
		if (existing) {
			const updated = { ...existing, ...scheduleWorker };
			this.scheduleWorkers.set(id, updated);
		}
	}

	async deleteScheduleWorker(id: string): Promise<void> {
		this.scheduleWorkers.delete(id);
	}

	// Work Period operations
	async createWorkPeriod(workPeriod: any): Promise<string> {
		this.workPeriods.set(workPeriod.id, workPeriod);
		return workPeriod.id;
	}

	async getWorkPeriods(scheduleWorkerId: string): Promise<any[]> {
		return Array.from(this.workPeriods.values()).filter(p => p.schedule_worker_id === scheduleWorkerId);
	}

	async updateWorkPeriod(id: string, workPeriod: any): Promise<void> {
		const existing = this.workPeriods.get(id);
		if (existing) {
			const updated = { ...existing, ...workPeriod };
			this.workPeriods.set(id, updated);
		}
	}

	async deleteWorkPeriod(id: string): Promise<void> {
		this.workPeriods.delete(id);
	}

	// Payroll Calculation operations
	async createPayrollCalculation(payroll: any): Promise<string> {
		// Simple implementation - just return the ID
		return payroll.id || `payroll_${Date.now()}`;
	}

	async getPayrollCalculations(scheduleWorkerId: string): Promise<any[]> {
		// Simple implementation - return empty array for now
		return [];
	}

	async updatePayrollCalculation(id: string, payroll: any): Promise<void> {
		// Simple implementation - do nothing for now
	}

	async deletePayrollCalculation(id: string): Promise<void> {
		// Simple implementation - do nothing for now
	}

	// Schedule Time operations
	async createScheduleTime(scheduleTime: any): Promise<string> {
		// Simple implementation - just return the ID
		return scheduleTime.id || `schedule_time_${Date.now()}`;
	}

	async getScheduleTimes(scheduleId: string): Promise<any[]> {
		// Simple implementation - return empty array for now
		return [];
	}

	async updateScheduleTime(id: string, scheduleTime: any): Promise<void> {
		// Simple implementation - do nothing for now
	}

	async deleteScheduleTime(id: string): Promise<void> {
		// Simple implementation - do nothing for now
	}

	// Client operations
	async createClient(client: any): Promise<string> {
		this.clients.set(client.id, client);
		return client.id;
	}

	async getClient(id: string): Promise<any> {
		return this.clients.get(id) || null;
	}

	async getAllClients(): Promise<any[]> {
		return Array.from(this.clients.values());
	}

	async updateClient(id: string, client: any): Promise<void> {
		const existing = this.clients.get(id);
		if (existing) {
			const updated = { ...existing, ...client };
			this.clients.set(id, updated);
		}
	}

	async deleteClient(id: string): Promise<void> {
		this.clients.delete(id);
	}

	// User profile operations
	async createUserProfile(profile: any): Promise<string> {
		// Simple implementation - just return the ID
		return profile.id || 'user_profile_1';
	}

	async getUserProfile(userId: string): Promise<any> {
		// Simple implementation - return null for now
		return null;
	}

	async updateUserProfile(userId: string, profile: any): Promise<void> {
		// Simple implementation - do nothing for now
	}

	async deleteUserProfile(userId: string): Promise<void> {
		// Simple implementation - do nothing for now
	}

	// Activity operations
	async createActivity(activity: any): Promise<string> {
		// Simple implementation - just return the ID
		return activity.id || `activity_${Date.now()}`;
	}

	async getRecentActivities(limit?: number): Promise<any[]> {
		// Simple implementation - return empty array for now
		return [];
	}

	async clearOldActivities(daysToKeep?: number): Promise<void> {
		// Simple implementation - do nothing for now
	}

	// Category operations
	async createCategory(category: any): Promise<string> {
		// Simple implementation - just return the ID
		return category.id || `category_${Date.now()}`;
	}

	async getCategory(id: string): Promise<any> {
		// Simple implementation - return null for now
		return null;
	}

	async getAllCategories(): Promise<any[]> {
		// Simple implementation - return empty array for now
		return [];
	}

	async updateCategory(id: string, category: any): Promise<void> {
		// Simple implementation - do nothing for now
	}

	async deleteCategory(id: string): Promise<void> {
		// Simple implementation - do nothing for now
	}

	// User settings operations
	async getUserSettings(): Promise<any> {
		// Simple implementation - return default settings
		return {
			themeMode: 'light',
			accentColor: 'blue',
			language: 'ko',
			notificationsEnabled: true
		};
	}

	async updateUserSettings(settings: any): Promise<void> {
		// Simple implementation - do nothing for now
	}

	async clearAllData(): Promise<void> {
		this.workers.clear();
		this.schedules.clear();
		this.scheduleWorkers.clear();
		this.workPeriods.clear();
		this.clients.clear();
	}
}

export const database = new SimpleDatabase();
