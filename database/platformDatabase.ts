// Platform-specific database factory
import { Category, PayrollCalculation, ScheduleTime, ScheduleWorker, UserProfile, WorkPeriod } from '@/models/types';
import Constants from 'expo-constants';
import { IDatabase } from './interface';
import { SupabaseRepository } from './supabaseRepository';

// Web fallback database
class WebDatabase implements IDatabase {
	createClientDocument(document: { id: string; clientId: string; fileName: string; fileUrl: string; filePath: string; fileType: string; fileSize?: number; }): Promise<string> {
		throw new Error('Method not implemented.');
	}
	getClientDocuments(clientId: string): Promise<Array<{ id: string; clientId: string; fileName: string; fileUrl: string; filePath: string; fileType: string; fileSize?: number; uploadedAt: string; }>> {
		throw new Error('Method not implemented.');
	}
	deleteClientDocument(documentId: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	createScheduleDocument(document: { id: string; scheduleId: string; fileName: string; fileUrl: string; filePath: string; fileType: string; fileSize?: number; }): Promise<string> {
		throw new Error('Method not implemented.');
	}
	getScheduleDocuments(scheduleId: string): Promise<Array<{ id: string; scheduleId: string; fileName: string; fileUrl: string; filePath: string; fileType: string; fileSize?: number; uploadedAt: string; }>> {
		throw new Error('Method not implemented.');
	}
	deleteScheduleDocument(documentId: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	createScheduleTime(scheduleTime: ScheduleTime): Promise<string> {
		throw new Error('Method not implemented.');
	}
	getScheduleTimes(scheduleId: string): Promise<ScheduleTime[]> {
		throw new Error('Method not implemented.');
	}
	updateScheduleTime(id: string, scheduleTime: Partial<ScheduleTime>): Promise<void> {
		throw new Error('Method not implemented.');
	}
	deleteScheduleTime(id: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	createScheduleWorker(scheduleWorker: ScheduleWorker): Promise<string> {
		throw new Error('Method not implemented.');
	}
	updateScheduleWorker(id: string, scheduleWorker: Partial<ScheduleWorker>): Promise<void> {
		throw new Error('Method not implemented.');
	}
	deleteScheduleWorker(id: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	createWorkPeriod(workPeriod: WorkPeriod): Promise<string> {
		throw new Error('Method not implemented.');
	}
	getWorkPeriods(scheduleWorkerId: string): Promise<WorkPeriod[]> {
		throw new Error('Method not implemented.');
	}
	updateWorkPeriod(id: string, workPeriod: Partial<WorkPeriod>): Promise<void> {
		throw new Error('Method not implemented.');
	}
	deleteWorkPeriod(id: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	createPayrollCalculation(payroll: PayrollCalculation): Promise<string> {
		throw new Error('Method not implemented.');
	}
	getPayrollCalculations(scheduleWorkerId: string): Promise<PayrollCalculation[]> {
		throw new Error('Method not implemented.');
	}
	updatePayrollCalculation(id: string, payroll: Partial<PayrollCalculation>): Promise<void> {
		throw new Error('Method not implemented.');
	}
	deletePayrollCalculation(id: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	createUserProfile(profile: UserProfile): Promise<string> {
		throw new Error('Method not implemented.');
	}
	getUserProfile(userId: string): Promise<UserProfile | null> {
		throw new Error('Method not implemented.');
	}
	updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
		throw new Error('Method not implemented.');
	}
	deleteUserProfile(userId: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
		throw new Error('Method not implemented.');
	}
	getNotification(id: string): Promise<Notification | null> {
		throw new Error('Method not implemented.');
	}
	getAllNotifications(): Promise<Notification[]> {
		throw new Error('Method not implemented.');
	}
	getRecentNotifications(limit: number): Promise<Notification[]> {
		throw new Error('Method not implemented.');
	}
	updateNotification(id: string, notification: Partial<Notification>): Promise<void> {
		throw new Error('Method not implemented.');
	}
	deleteNotification(id: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	markAllNotificationsAsRead(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	getUnreadNotificationCount(): Promise<number> {
		throw new Error('Method not implemented.');
	}
	getNotificationByRelatedId(relatedId: string, type: string): Promise<Notification | null> {
		throw new Error('Method not implemented.');
	}
	getNotificationSettings(): Promise<NotificationSettings | null> {
		throw new Error('Method not implemented.');
	}
	updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
		throw new Error('Method not implemented.');
	}
	createCategory(category: { id: string; name: string; color: string; }): Promise<string> {
		throw new Error('Method not implemented.');
	}
	getCategory(id: string): Promise<Category | null> {
		throw new Error('Method not implemented.');
	}
	getAllCategories(): Promise<Category[]> {
		throw new Error('Method not implemented.');
	}
	updateCategory(id: string, category: Partial<Category>): Promise<void> {
		throw new Error('Method not implemented.');
	}
	deleteCategory(id: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	private workers: Map<string, any> = new Map();
	private schedules: Map<string, any> = new Map();
	private scheduleWorkers: Map<string, any> = new Map();
	private workPeriods: Map<string, any> = new Map();
	private clients: Map<string, any> = new Map();
	private categories: Map<string, any> = new Map();

	async init(): Promise<void> {
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

			const clientsData = localStorage.getItem('remit_planner_clients');
			if (clientsData) {
				const clients = JSON.parse(clientsData);
				clients.forEach((client: any) => this.clients.set(client.id, client));
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
			localStorage.setItem('remit_planner_clients', JSON.stringify(Array.from(this.clients.values())));
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
		relatedId?: string;
		icon?: string;
		color?: string;
		isRead?: boolean;
		isDeleted?: boolean;
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

	async getRecentActivities(limit: number = 10, offset: number = 0): Promise<Array<{
		id: string;
		type: string;
		title: string;
		description?: string;
		relatedId?: string;
		icon?: string;
		color?: string;
		isRead: boolean;
		isDeleted: boolean;
		timestamp: string;
	}>> {
		try {
			const activitiesData = localStorage.getItem('remit_planner_activities');
			if (!activitiesData) return [];

			const activities = JSON.parse(activitiesData);
			return activities
				.filter((activity: any) => !activity.isDeleted && !activity.isRead)
				.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
				.slice(offset, offset + limit)
				.map((activity: any) => ({
					id: activity.id,
					type: activity.type,
					title: activity.title,
					description: activity.description,
					relatedId: activity.relatedId || activity.related_id,
					icon: activity.icon,
					color: activity.color,
					isRead: Boolean(activity.isRead),
					isDeleted: Boolean(activity.isDeleted),
					timestamp: activity.timestamp || activity.created_at,
				}));
		} catch (error) {
			console.warn('Failed to get activities:', error);
			return [];
		}
	}

	async markActivityAsRead(activityId: string): Promise<void> {
		try {
			const activitiesData = localStorage.getItem('remit_planner_activities');
			if (!activitiesData) return;

			const activities = JSON.parse(activitiesData);
			const activityIndex = activities.findIndex((a: any) => a.id === activityId);
			if (activityIndex !== -1) {
				activities[activityIndex].isRead = true;
				localStorage.setItem('remit_planner_activities', JSON.stringify(activities));
			}
		} catch (error) {
			console.warn('Failed to mark activity as read:', error);
		}
	}

	async markActivityAsDeleted(activityId: string): Promise<void> {
		try {
			const activitiesData = localStorage.getItem('remit_planner_activities');
			if (!activitiesData) return;

			const activities = JSON.parse(activitiesData);
			const activityIndex = activities.findIndex((a: any) => a.id === activityId);
			if (activityIndex !== -1) {
				activities[activityIndex].isDeleted = true;
				localStorage.setItem('remit_planner_activities', JSON.stringify(activities));
			}
		} catch (error) {
			console.warn('Failed to mark activity as deleted:', error);
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

	// ==================== Client Operations ====================

	async createClient(client: any): Promise<string> {
		this.clients.set(client.id, client);
		this.saveToLocalStorage();
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
			this.saveToLocalStorage();
		}
	}

	async deleteClient(id: string): Promise<void> {
		this.clients.delete(id);
		this.saveToLocalStorage();
	}

	// User settings operations
	async getUserSettings(): Promise<{
		themeMode: 'light' | 'dark' | 'auto';
		accentColor: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red' | 'teal' | 'indigo' | 'black';
		language: 'ko' | 'en';
		notificationsEnabled: boolean;
	} | null> {
		try {
			const settingsData = localStorage.getItem('remit_planner_user_settings')
			if (settingsData) {
				return JSON.parse(settingsData)
			}
			return null
		} catch (error) {
			console.error('Error loading user settings:', error)
			return null
		}
	}

	async updateUserSettings(settings: {
		themeMode?: 'light' | 'dark' | 'auto';
		accentColor?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red' | 'teal' | 'indigo' | 'black';
		language?: 'ko' | 'en';
		notificationsEnabled?: boolean;
	}): Promise<void> {
		try {
			const currentSettings = await this.getUserSettings() || {
				themeMode: 'light' as const,
				accentColor: 'indigo' as const,
				language: 'ko' as const,
				notificationsEnabled: true,
			}

			const updatedSettings = { ...currentSettings, ...settings }
			localStorage.setItem('remit_planner_user_settings', JSON.stringify(updatedSettings))
		} catch (error) {
			console.error('Error saving user settings:', error)
			throw error
		}
	}
}

// Create platform-specific database
let database: IDatabase;

// 환경 변수 확인
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey;

if (supabaseUrl && supabaseKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
	// Supabase 설정이 완료된 경우
	database = new SupabaseRepository();
} else {
	// Supabase 설정이 안된 경우 로컬 데이터베이스 사용
	database = new WebDatabase();
}

// Export the database instance
export { database };

// Export a function to get the database instance
export const getDatabase = (): IDatabase => {
	return database;
};
