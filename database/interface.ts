// Database interface - allows easy switching between SQLite and Supabase
import { Category, Schedule, ScheduleCategory, Worker } from '@/models/types';

export interface WorkPeriod {
  id: string;
  start: string;
  end: string;
}

export interface ScheduleWorkerInfo {
  worker: Worker;
  periods: WorkPeriod[];
  paid: boolean;
}

export interface IDatabase {
  // Initialize database
  init(): Promise<void>;

  // Worker operations
  createWorker(worker: Worker): Promise<string>;
  getWorker(id: string): Promise<Worker | null>;
  getAllWorkers(): Promise<Worker[]>;
  updateWorker(id: string, worker: Partial<Worker>): Promise<void>;
  deleteWorker(id: string): Promise<void>;

  // Schedule operations
  createSchedule(schedule: {
    id: string;
    title: string;
    description?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    category: ScheduleCategory;
  }): Promise<string>;
  getSchedule(id: string): Promise<Schedule | null>;
  getAllSchedules(): Promise<Schedule[]>;
  getSchedulesByDate(date: string): Promise<Schedule[]>;
  getSchedulesByDateRange(startDate: string, endDate: string): Promise<Schedule[]>;
  updateSchedule(id: string, schedule: Partial<Schedule>): Promise<void>;
  deleteSchedule(id: string): Promise<void>;

  // Schedule-Worker relationship operations
  addWorkerToSchedule(
    scheduleId: string,
    workerId: string,
    periods: WorkPeriod[],
    paid?: boolean,
    workHours?: number
  ): Promise<string>;
  getScheduleWorkers(scheduleId: string): Promise<ScheduleWorkerInfo[]>;
  updateScheduleWorkerPaidStatus(scheduleId: string, workerId: string, paid: boolean): Promise<void>;
  updateScheduleWorkerHours(scheduleId: string, workerId: string, hours: number): Promise<void>;
  removeWorkerFromSchedule(scheduleId: string, workerId: string): Promise<void>;

  // Worker tax settings
  updateWorkerTaxWithheld(workerId: string, taxWithheld: boolean): Promise<void>;

  // Activity operations
  createActivity(activity: {
    id: string;
    type: 'schedule' | 'worker' | 'payment';
    title: string;
    description?: string;
    relatedId?: string;
    icon?: string;
    color?: string;
  }): Promise<string>;
  getRecentActivities(limit?: number): Promise<Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    relatedId?: string;
    icon?: string;
    color?: string;
    timestamp: string;
  }>>;
  clearOldActivities(daysToKeep?: number): Promise<void>;

  // Client operations
  createClient(client: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    businessNumber?: string;
    memo?: string;
    contacts: Array<{
      id: string;
      name: string;
      position?: string;
      phone: string;
      memo?: string;
      isPrimary?: boolean;
    }>;
  }): Promise<string>;
  getClient(id: string): Promise<any>;
  getAllClients(): Promise<any[]>;
  updateClient(id: string, client: any): Promise<void>;
  deleteClient(id: string): Promise<void>;

  // Category operations
  createCategory(category: {
    id: string;
    name: string;
    color: string;
  }): Promise<string>;
  getCategory(id: string): Promise<Category | null>;
  getAllCategories(): Promise<Category[]>;
  updateCategory(id: string, category: Partial<Category>): Promise<void>;
  deleteCategory(id: string): Promise<void>;

  // User settings operations
  getUserSettings(): Promise<{
    themeMode: 'light' | 'dark' | 'auto';
    accentColor: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red' | 'teal' | 'indigo' | 'black';
    language: 'ko' | 'en';
    notificationsEnabled: boolean;
  } | null>;
  updateUserSettings(settings: {
    themeMode?: 'light' | 'dark' | 'auto';
    accentColor?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red' | 'teal' | 'indigo' | 'black';
    language?: 'ko' | 'en';
    notificationsEnabled?: boolean;
  }): Promise<void>;

  // Utility
  clearAllData(): Promise<void>;
}

