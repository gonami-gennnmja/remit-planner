// Web fallback database - simple in-memory storage
import { Schedule, Worker, ScheduleCategory } from '@/models/types';
import { IDatabase, WorkPeriod, ScheduleWorkerInfo } from './interface';

class WebFallbackRepository implements IDatabase {
  private workers: Map<string, Worker> = new Map();
  private schedules: Map<string, any> = new Map();
  private scheduleWorkers: Map<string, any> = new Map();
  private workPeriods: Map<string, any> = new Map();

  async init(): Promise<void> {
    console.log('🌐 Using web fallback database (in-memory)');
    // Load from localStorage if available
    this.loadFromLocalStorage();
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
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('remit_planner_workers', JSON.stringify(Array.from(this.workers.values())));
      localStorage.setItem('remit_planner_schedules', JSON.stringify(Array.from(this.schedules.values())));
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
    date: string;
    category: ScheduleCategory;
  }): Promise<string> {
    this.schedules.set(schedule.id, schedule);
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
      date: schedule.date,
      category: schedule.category,
      workers
    };
  }

  async getSchedulesByDate(date: string): Promise<Schedule[]> {
    const schedules = Array.from(this.schedules.values()).filter(s => s.date === date);
    const result: Schedule[] = [];
    
    for (const schedule of schedules) {
      const workers = await this.getScheduleWorkers(schedule.id);
      result.push({
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        date: schedule.date,
        category: schedule.category,
        workers
      });
    }
    
    return result;
  }

  async getSchedulesByDateRange(startDate: string, endDate: string): Promise<Schedule[]> {
    const schedules = Array.from(this.schedules.values()).filter(s => s.date >= startDate && s.date <= endDate);
    const result: Schedule[] = [];
    
    for (const schedule of schedules) {
      const workers = await this.getScheduleWorkers(schedule.id);
      result.push({
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        date: schedule.date,
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
  
  async clearAllData(): Promise<void> {
    this.workers.clear();
    this.schedules.clear();
    this.scheduleWorkers.clear();
    this.workPeriods.clear();
    this.saveToLocalStorage();
  }
}

export const database = new WebFallbackRepository();
