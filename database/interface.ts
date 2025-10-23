// Database interface - allows easy switching between SQLite and Supabase
import {
  Category,
  Client,
  PayrollCalculation,
  Schedule,
  ScheduleTime,
  ScheduleWorker,
  UserProfile,
  Worker,
  WorkPeriod
} from '@/models/types';

export interface ScheduleWorkerInfo {
  worker: Worker;
  periods: WorkPeriod[];
  paid: boolean;
  taxWithheld?: boolean;
  wagePaid?: boolean;
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
  createSchedule(schedule: Schedule): Promise<string>;
  getSchedule(id: string): Promise<Schedule | null>;
  getAllSchedules(): Promise<Schedule[]>;
  getSchedulesByDate(date: string): Promise<Schedule[]>;
  getSchedulesByDateRange(startDate: string, endDate: string): Promise<Schedule[]>;
  updateSchedule(id: string, schedule: Partial<Schedule>): Promise<void>;
  deleteSchedule(id: string): Promise<void>;

  // Schedule times operations
  createScheduleTime(scheduleTime: ScheduleTime): Promise<string>;
  getScheduleTimes(scheduleId: string): Promise<ScheduleTime[]>;
  updateScheduleTime(id: string, scheduleTime: Partial<ScheduleTime>): Promise<void>;
  deleteScheduleTime(id: string): Promise<void>;

  // Schedule-Worker relationship operations
  createScheduleWorker(scheduleWorker: ScheduleWorker): Promise<string>;
  getScheduleWorkers(scheduleId: string): Promise<ScheduleWorker[]>;
  updateScheduleWorker(id: string, scheduleWorker: Partial<ScheduleWorker>): Promise<void>;
  deleteScheduleWorker(id: string): Promise<void>;

  // Work periods operations
  createWorkPeriod(workPeriod: WorkPeriod): Promise<string>;
  getWorkPeriods(scheduleWorkerId: string): Promise<WorkPeriod[]>;
  updateWorkPeriod(id: string, workPeriod: Partial<WorkPeriod>): Promise<void>;
  deleteWorkPeriod(id: string): Promise<void>;

  // Payroll operations
  createPayrollCalculation(payroll: PayrollCalculation): Promise<string>;
  getPayrollCalculations(scheduleWorkerId: string): Promise<PayrollCalculation[]>;
  updatePayrollCalculation(id: string, payroll: Partial<PayrollCalculation>): Promise<void>;
  deletePayrollCalculation(id: string): Promise<void>;

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
  createClient(client: Client): Promise<string>;
  getClient(id: string): Promise<Client | null>;
  getAllClients(): Promise<Client[]>;
  updateClient(id: string, client: Partial<Client>): Promise<void>;
  deleteClient(id: string): Promise<void>;

  // User profile operations
  createUserProfile(profile: UserProfile): Promise<string>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
  updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void>;
  deleteUserProfile(userId: string): Promise<void>;

  // Activity operations
  createActivity(activity: {
    id: string;
    type: string;
    title: string;
    description?: string;
    relatedId?: string;
    icon?: string;
    color?: string;
    isRead?: boolean;
    isDeleted?: boolean;
  }): Promise<string>;
  getRecentActivities(limit?: number, offset?: number): Promise<Array<{
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
  }>>;
  markActivityAsRead(activityId: string): Promise<void>;
  markActivityAsDeleted(activityId: string): Promise<void>;
  clearOldActivities(daysToKeep?: number): Promise<void>;

  // Notification operations
  createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  getNotification(id: string): Promise<Notification | null>;
  getAllNotifications(): Promise<Notification[]>;
  getRecentNotifications(limit: number): Promise<Notification[]>;
  updateNotification(id: string, notification: Partial<Notification>): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  markAllNotificationsAsRead(): Promise<void>;
  getUnreadNotificationCount(): Promise<number>;
  getNotificationByRelatedId(relatedId: string, type: string): Promise<Notification | null>;

  // NotificationSettings operations
  getNotificationSettings(): Promise<NotificationSettings | null>;
  updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void>;

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

  // Client document operations
  createClientDocument(document: {
    id: string;
    clientId: string;
    fileName: string;
    fileUrl: string;
    filePath: string;
    fileType: string;
    fileSize?: number;
  }): Promise<string>;
  getClientDocuments(clientId: string): Promise<Array<{
    id: string;
    clientId: string;
    fileName: string;
    fileUrl: string;
    filePath: string;
    fileType: string;
    fileSize?: number;
    uploadedAt: string;
  }>>;
  deleteClientDocument(documentId: string): Promise<void>;

  // Schedule document operations
  createScheduleDocument(document: {
    id: string;
    scheduleId: string;
    fileName: string;
    fileUrl: string;
    filePath: string;
    fileType: string;
    fileSize?: number;
  }): Promise<string>;
  getScheduleDocuments(scheduleId: string): Promise<Array<{
    id: string;
    scheduleId: string;
    fileName: string;
    fileUrl: string;
    filePath: string;
    fileType: string;
    fileSize?: number;
    uploadedAt: string;
  }>>;
  deleteScheduleDocument(documentId: string): Promise<void>;

  // Utility
  clearAllData(): Promise<void>;
}

