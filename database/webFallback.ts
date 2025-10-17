// Web fallback database - simple in-memory storage
import { Category, Schedule, ScheduleCategory, Worker } from '@/models/types';
import { IDatabase, ScheduleWorkerInfo, WorkPeriod } from './interface';

class WebFallbackRepository implements IDatabase {
  private workers: Map<string, Worker> = new Map();
  private schedules: Map<string, any> = new Map();
  private scheduleWorkers: Map<string, any> = new Map();
  private workPeriods: Map<string, any> = new Map();
  private clients: Map<string, any> = new Map();
  private categories: Map<string, Category> = new Map();

  async init(): Promise<void> {
    console.log('🌐 Using web fallback database (in-memory)');
    // Load from localStorage if available
    this.loadFromLocalStorage();
    // Seed default categories if empty
    if (this.categories.size === 0) {
      await this.seedDefaultCategories();
    }
  }

  private async seedDefaultCategories(): Promise<void> {
    const defaultCategories: Category[] = [
      { id: 'cat-education', name: '교육', color: '#8b5cf6' },
      { id: 'cat-work', name: '업무', color: '#06b6d4' },
      { id: 'cat-event', name: '이벤트', color: '#f59e0b' },
      { id: 'cat-personal', name: '개인', color: '#ec4899' },
      { id: 'cat-other', name: '기타', color: '#6b7280' },
    ];

    for (const category of defaultCategories) {
      this.categories.set(category.id, {
        ...category,
        createdAt: new Date().toISOString(),
      });
    }

    this.saveToLocalStorage();
  }

  private loadFromLocalStorage(): void {
    try {
      const workersData = localStorage.getItem('remit_planner_workers');
      if (workersData) {
        const workers = JSON.parse(workersData);
        workers.forEach((worker: Worker) => this.workers.set(worker.id, worker));
      }

      const schedulesData = localStorage.getItem('remit_planner_schedules');
      if (schedulesData) {
        const schedules = JSON.parse(schedulesData);
        schedules.forEach((schedule: any) => this.schedules.set(schedule.id, schedule));
      }

      const clientsData = localStorage.getItem('remit_planner_clients');
      if (clientsData) {
        const clients = JSON.parse(clientsData);
        clients.forEach((client: any) => this.clients.set(client.id, client));
      }

      const categoriesData = localStorage.getItem('remit_planner_categories');
      if (categoriesData) {
        const categories = JSON.parse(categoriesData);
        categories.forEach((category: Category) => this.categories.set(category.id, category));
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('remit_planner_workers', JSON.stringify(Array.from(this.workers.values())));
      localStorage.setItem('remit_planner_schedules', JSON.stringify(Array.from(this.schedules.values())));
      localStorage.setItem('remit_planner_clients', JSON.stringify(Array.from(this.clients.values())));
      localStorage.setItem('remit_planner_categories', JSON.stringify(Array.from(this.categories.values())));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  // ==================== Worker Operations ====================

  async createWorker(worker: Worker): Promise<string> {
    this.workers.set(worker.id, worker);
    this.saveToLocalStorage();
    return worker.id;
  }

  async getWorker(id: string): Promise<Worker | null> {
    return this.workers.get(id) || null;
  }

  async getAllWorkers(): Promise<Worker[]> {
    return Array.from(this.workers.values());
  }

  async updateWorker(id: string, worker: Partial<Worker>): Promise<void> {
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

  // ==================== Schedule Operations ====================

  async createSchedule(schedule: {
    id: string;
    title: string;
    description?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    category: ScheduleCategory;
  }): Promise<string> {
    const scheduleData = {
      ...schedule,
      startDate: schedule.startDate || schedule.date,
      endDate: schedule.endDate || schedule.date,
    };
    this.schedules.set(schedule.id, scheduleData);
    this.saveToLocalStorage();
    return schedule.id;
  }

  async getSchedule(id: string): Promise<Schedule | null> {
    const schedule = this.schedules.get(id);
    if (!schedule) return null;

    const workers = await this.getScheduleWorkers(id);
    return {
      id: schedule.id,
      title: schedule.title,
      description: schedule.description,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      category: schedule.category,
      workers
    };
  }

  async getAllSchedules(): Promise<Schedule[]> {
    const schedules = Array.from(this.schedules.values());
    const result: Schedule[] = [];

    for (const schedule of schedules) {
      const workers = await this.getScheduleWorkers(schedule.id);
      result.push({
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        category: schedule.category,
        workers
      });
    }

    return result;
  }

  async getSchedulesByDate(date: string): Promise<Schedule[]> {
    const schedules = Array.from(this.schedules.values()).filter(
      s => s.startDate === date || (s.startDate <= date && s.endDate >= date)
    );
    const result: Schedule[] = [];

    for (const schedule of schedules) {
      const workers = await this.getScheduleWorkers(schedule.id);
      result.push({
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        category: schedule.category,
        workers
      });
    }

    return result;
  }

  async getSchedulesByDateRange(startDate: string, endDate: string): Promise<Schedule[]> {
    const schedules = Array.from(this.schedules.values()).filter(
      s => s.startDate <= endDate && s.endDate >= startDate
    );
    const result: Schedule[] = [];

    for (const schedule of schedules) {
      const workers = await this.getScheduleWorkers(schedule.id);
      result.push({
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        category: schedule.category,
        workers
      });
    }

    return result;
  }

  async updateSchedule(id: string, schedule: Partial<Schedule>): Promise<void> {
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

  // ==================== Schedule-Worker Relationships ====================

  async addWorkerToSchedule(
    scheduleId: string,
    workerId: string,
    periods: WorkPeriod[],
    paid: boolean = false,
    workHours?: number
  ): Promise<string> {
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

  async getScheduleWorkers(scheduleId: string): Promise<ScheduleWorkerInfo[]> {
    const scheduleWorkers = Array.from(this.scheduleWorkers.values()).filter(sw => sw.scheduleId === scheduleId);
    const result: ScheduleWorkerInfo[] = [];

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

  async updateScheduleWorkerPaidStatus(
    scheduleId: string,
    workerId: string,
    paid: boolean
  ): Promise<void> {
    const scheduleWorker = Array.from(this.scheduleWorkers.values())
      .find(sw => sw.scheduleId === scheduleId && sw.workerId === workerId);

    if (scheduleWorker) {
      scheduleWorker.paid = paid;
      this.scheduleWorkers.set(scheduleWorker.id, scheduleWorker);
      this.saveToLocalStorage();
    }
  }

  async updateScheduleWorkerHours(
    scheduleId: string,
    workerId: string,
    hours: number
  ): Promise<void> {
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
      // Remove work periods
      const periods = Array.from(this.workPeriods.values())
        .filter(p => p.scheduleWorkerId === scheduleWorker.id);

      for (const period of periods) {
        this.workPeriods.delete(period.id);
      }

      // Remove schedule worker
      this.scheduleWorkers.delete(scheduleWorker.id);
      this.saveToLocalStorage();
    }
  }

  async updateWorkerTaxWithheld(workerId: string, taxWithheld: boolean): Promise<void> {
    await this.updateWorker(workerId, { taxWithheld });
  }

  // ==================== Utility ====================

  // ==================== Activity Operations ====================

  private activities: Map<string, any> = new Map();

  async createActivity(activity: {
    id: string;
    type: 'schedule' | 'worker' | 'payment';
    title: string;
    description?: string;
    relatedId?: string;
    icon?: string;
    color?: string;
  }): Promise<string> {
    this.activities.set(activity.id, {
      ...activity,
      timestamp: new Date().toISOString(),
    });
    this.saveToLocalStorage();
    return activity.id;
  }

  async getRecentActivities(limit: number = 10): Promise<Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    relatedId?: string;
    icon?: string;
    color?: string;
    timestamp: string;
  }>> {
    const activities = Array.from(this.activities.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    return activities;
  }

  async clearOldActivities(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    Array.from(this.activities.entries()).forEach(([id, activity]) => {
      if (new Date(activity.timestamp) < cutoffDate) {
        this.activities.delete(id);
      }
    });
    this.saveToLocalStorage();
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

  // ==================== Category Operations ====================

  async createCategory(category: { id: string; name: string; color: string }): Promise<string> {
    const newCategory: Category = {
      ...category,
      createdAt: new Date().toISOString(),
    };
    this.categories.set(category.id, newCategory);
    this.saveToLocalStorage();
    return category.id;
  }

  async getCategory(id: string): Promise<Category | null> {
    return this.categories.get(id) || null;
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<void> {
    const existing = this.categories.get(id);
    if (existing) {
      this.categories.set(id, { ...existing, ...category });
      this.saveToLocalStorage();
    }
  }

  async deleteCategory(id: string): Promise<void> {
    this.categories.delete(id);
    this.saveToLocalStorage();
  }

  async clearAllData(): Promise<void> {
    this.workers.clear();
    this.schedules.clear();
    this.scheduleWorkers.clear();
    this.workPeriods.clear();
    this.activities.clear();
    this.clients.clear();
    this.categories.clear();
    this.saveToLocalStorage();
  }
}

export const database = new WebFallbackRepository();
