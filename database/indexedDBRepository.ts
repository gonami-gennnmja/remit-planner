// IndexedDB implementation for web platform
import {
  Schedule,
  ScheduleCategory,
  Worker,
  WorkPeriod
} from '@/models/types';
import { IDatabase, ScheduleWorkerInfo } from './interface';

class IndexedDBRepository implements IDatabase {
  private db: IDBDatabase | null = null;
  private dbName = 'RemitPlannerDB';
  private version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Workers store
        if (!db.objectStoreNames.contains('workers')) {
          const workerStore = db.createObjectStore('workers', { keyPath: 'id' });
          workerStore.createIndex('userId', 'userId', { unique: false });
          workerStore.createIndex('name', 'name', { unique: false });
        }

        // Schedules store
        if (!db.objectStoreNames.contains('schedules')) {
          const scheduleStore = db.createObjectStore('schedules', { keyPath: 'id' });
          scheduleStore.createIndex('userId', 'userId', { unique: false });
          scheduleStore.createIndex('startDate', 'startDate', { unique: false });
          scheduleStore.createIndex('endDate', 'endDate', { unique: false });
        }

        // Schedule times store
        if (!db.objectStoreNames.contains('scheduleTimes')) {
          const scheduleTimeStore = db.createObjectStore('scheduleTimes', { keyPath: 'id' });
          scheduleTimeStore.createIndex('scheduleId', 'scheduleId', { unique: false });
          scheduleTimeStore.createIndex('workDate', 'workDate', { unique: false });
        }

        // Schedule workers store
        if (!db.objectStoreNames.contains('scheduleWorkers')) {
          const scheduleWorkerStore = db.createObjectStore('scheduleWorkers', { keyPath: 'id' });
          scheduleWorkerStore.createIndex('userId', 'userId', { unique: false });
          scheduleWorkerStore.createIndex('scheduleId', 'scheduleId', { unique: false });
          scheduleWorkerStore.createIndex('workerId', 'workerId', { unique: false });
        }

        // Worker times store
        if (!db.objectStoreNames.contains('workerTimes')) {
          const workerTimeStore = db.createObjectStore('workerTimes', { keyPath: 'id' });
          workerTimeStore.createIndex('scheduleWorkerId', 'scheduleWorkerId', { unique: false });
          workerTimeStore.createIndex('workDate', 'workDate', { unique: false });
        }

        // Work periods store
        if (!db.objectStoreNames.contains('workPeriods')) {
          const workPeriodStore = db.createObjectStore('workPeriods', { keyPath: 'id' });
          workPeriodStore.createIndex('scheduleWorkerId', 'scheduleWorkerId', { unique: false });
        }

        // Payroll calculations store
        if (!db.objectStoreNames.contains('payrollCalculations')) {
          const payrollStore = db.createObjectStore('payrollCalculations', { keyPath: 'id' });
          payrollStore.createIndex('scheduleWorkerId', 'scheduleWorkerId', { unique: false });
        }

        // Clients store
        if (!db.objectStoreNames.contains('clients')) {
          const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
          clientStore.createIndex('userId', 'userId', { unique: false });
          clientStore.createIndex('name', 'name', { unique: false });
        }

        // User profiles store
        if (!db.objectStoreNames.contains('userProfiles')) {
          const userProfileStore = db.createObjectStore('userProfiles', { keyPath: 'id' });
          userProfileStore.createIndex('userId', 'userId', { unique: true });
        }

        // Activities store
        if (!db.objectStoreNames.contains('activities')) {
          const activityStore = db.createObjectStore('activities', { keyPath: 'id' });
          activityStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
          categoryStore.createIndex('name', 'name', { unique: true });
        }
      };
    });
  }

  private async executeRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ==================== Worker Operations ====================

  async createWorker(worker: Worker): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['workers'], 'readwrite');
    const store = transaction.objectStore('workers');
    await this.executeRequest(store.add(worker));
    return worker.id;
  }

  async getWorker(id: string): Promise<Worker | null> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['workers'], 'readonly');
    const store = transaction.objectStore('workers');
    const result = await this.executeRequest<Worker>(store.get(id));
    return result || null;
  }

  async getAllWorkers(): Promise<Worker[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['workers'], 'readonly');
    const store = transaction.objectStore('workers');
    const result = await this.executeRequest<Worker[]>(store.getAll());
    return result;
  }

  async updateWorker(id: string, worker: Partial<Worker>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const existing = await this.getWorker(id);
    if (!existing) throw new Error('Worker not found');

    const updated = { ...existing, ...worker };
    const transaction = this.db.transaction(['workers'], 'readwrite');
    const store = transaction.objectStore('workers');
    await this.executeRequest(store.put(updated));
  }

  async deleteWorker(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['workers'], 'readwrite');
    const store = transaction.objectStore('workers');
    await this.executeRequest(store.delete(id));
  }

  // ==================== Schedule Operations ====================

  async createSchedule(schedule: {
    id: string;
    title: string;
    description?: string;
    date: string;
    category: ScheduleCategory;
  }): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['schedules'], 'readwrite');
    const store = transaction.objectStore('schedules');
    await this.executeRequest(store.add(schedule));
    return schedule.id;
  }

  async getSchedule(id: string): Promise<Schedule | null> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['schedules'], 'readonly');
    const store = transaction.objectStore('schedules');
    const schedule = await this.executeRequest<any>(store.get(id));

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
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['schedules'], 'readonly');
    const store = transaction.objectStore('schedules');
    const index = store.index('date');
    const schedules = await this.executeRequest<any[]>(index.getAll(date));

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

  async getAllSchedules(): Promise<Schedule[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['schedules'], 'readonly');
    const store = transaction.objectStore('schedules');
    const allSchedules = await this.executeRequest<any[]>(store.getAll());

    const result: Schedule[] = [];
    for (const schedule of allSchedules) {
      const workers = await this.getScheduleWorkers(schedule.id);
      result.push({
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        startDate: schedule.date || schedule.startDate,
        endDate: schedule.date || schedule.endDate,
        category: schedule.category,
        workers
      });
    }

    return result;
  }

  async getSchedulesByDateRange(startDate: string, endDate: string): Promise<Schedule[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['schedules'], 'readonly');
    const store = transaction.objectStore('schedules');
    const allSchedules = await this.executeRequest<any[]>(store.getAll());

    const filtered = allSchedules.filter(s => {
      const sStart = s.startDate || s.date;
      const sEnd = s.endDate || s.date;
      return sStart <= endDate && sEnd >= startDate;
    });

    const result: Schedule[] = [];
    for (const schedule of filtered) {
      const workers = await this.getScheduleWorkers(schedule.id);
      result.push({
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        startDate: schedule.startDate || schedule.date,
        endDate: schedule.endDate || schedule.date,
        category: schedule.category,
        workers
      });
    }

    return result;
  }

  async updateSchedule(id: string, schedule: Partial<Schedule>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const existing = await this.getSchedule(id);
    if (!existing) throw new Error('Schedule not found');

    const updated = { ...existing, ...schedule };
    const transaction = this.db.transaction(['schedules'], 'readwrite');
    const store = transaction.objectStore('schedules');
    await this.executeRequest(store.put(updated));
  }

  async deleteSchedule(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['schedules'], 'readwrite');
    const store = transaction.objectStore('schedules');
    await this.executeRequest(store.delete(id));
  }

  // ==================== Schedule-Worker Relationships ====================

  async addWorkerToSchedule(
    scheduleId: string,
    workerId: string,
    periods: WorkPeriod[],
    paid: boolean = false,
    workHours?: number
  ): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const scheduleWorkerId = `sw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const transaction = this.db.transaction(['scheduleWorkers', 'workPeriods'], 'readwrite');
    const scheduleWorkerStore = transaction.objectStore('scheduleWorkers');
    const workPeriodStore = transaction.objectStore('workPeriods');

    await this.executeRequest(scheduleWorkerStore.add({
      id: scheduleWorkerId,
      scheduleId,
      workerId,
      paid,
      workHours
    }));

    for (const period of periods) {
      const periodId = period.id || `wp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await this.executeRequest(workPeriodStore.add({
        id: periodId,
        scheduleWorkerId,
        startTime: period.start,
        endTime: period.end
      }));
    }

    return scheduleWorkerId;
  }

  async getScheduleWorkers(scheduleId: string): Promise<ScheduleWorkerInfo[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['scheduleWorkers', 'workers', 'workPeriods'], 'readonly');
    const scheduleWorkerStore = transaction.objectStore('scheduleWorkers');
    const workerStore = transaction.objectStore('workers');
    const workPeriodStore = transaction.objectStore('workPeriods');

    const scheduleWorkerIndex = scheduleWorkerStore.index('scheduleId');
    const scheduleWorkers = await this.executeRequest<any[]>(scheduleWorkerIndex.getAll(scheduleId));

    const result: ScheduleWorkerInfo[] = [];

    for (const sw of scheduleWorkers) {
      const worker = await this.executeRequest<Worker>(workerStore.get(sw.workerId));
      if (!worker) continue;

      const workPeriodIndex = workPeriodStore.index('scheduleWorkerId');
      const periods = await this.executeRequest<any[]>(workPeriodIndex.getAll(sw.id));

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
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['scheduleWorkers'], 'readwrite');
    const store = transaction.objectStore('scheduleWorkers');
    const index = store.index('scheduleId');
    const scheduleWorkers = await this.executeRequest<any[]>(index.getAll(scheduleId));

    const target = scheduleWorkers.find(sw => sw.workerId === workerId);
    if (target) {
      target.paid = paid;
      await this.executeRequest(store.put(target));
    }
  }

  async updateScheduleWorkerHours(
    scheduleId: string,
    workerId: string,
    hours: number
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['scheduleWorkers'], 'readwrite');
    const store = transaction.objectStore('scheduleWorkers');
    const index = store.index('scheduleId');
    const scheduleWorkers = await this.executeRequest<any[]>(index.getAll(scheduleId));

    const target = scheduleWorkers.find(sw => sw.workerId === workerId);
    if (target) {
      target.workHours = hours;
      await this.executeRequest(store.put(target));
    }
  }

  async removeWorkerFromSchedule(scheduleId: string, workerId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['scheduleWorkers', 'workPeriods'], 'readwrite');
    const scheduleWorkerStore = transaction.objectStore('scheduleWorkers');
    const workPeriodStore = transaction.objectStore('workPeriods');

    const index = scheduleWorkerStore.index('scheduleId');
    const scheduleWorkers = await this.executeRequest<any[]>(index.getAll(scheduleId));

    const target = scheduleWorkers.find(sw => sw.workerId === workerId);
    if (target) {
      // Delete work periods first
      const workPeriodIndex = workPeriodStore.index('scheduleWorkerId');
      const periods = await this.executeRequest<any[]>(workPeriodIndex.getAll(target.id));

      for (const period of periods) {
        await this.executeRequest(workPeriodStore.delete(period.id));
      }

      // Delete schedule worker
      await this.executeRequest(scheduleWorkerStore.delete(target.id));
    }
  }

  async updateWorkerTaxWithheld(workerId: string, taxWithheld: boolean): Promise<void> {
    await this.updateWorker(workerId, { taxWithheld });
  }

  // ==================== Utility ====================

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['workPeriods', 'scheduleWorkers', 'schedules', 'workers'], 'readwrite');

    await this.executeRequest(transaction.objectStore('workPeriods').clear());
    await this.executeRequest(transaction.objectStore('scheduleWorkers').clear());
    await this.executeRequest(transaction.objectStore('schedules').clear());
    await this.executeRequest(transaction.objectStore('workers').clear());
  }
}

export const database = new IndexedDBRepository();
