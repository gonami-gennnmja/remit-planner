// Database interface - allows easy switching between SQLite and Supabase
import { Schedule, Worker, ScheduleCategory } from '@/models/types';

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
    date: string;
    category: ScheduleCategory;
  }): Promise<string>;
  getSchedule(id: string): Promise<Schedule | null>;
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
  
  // Utility
  clearAllData(): Promise<void>;
}

