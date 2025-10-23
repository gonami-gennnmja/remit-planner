// Main database export - uses Supabase
export type { WorkPeriod } from '../models/types';
export type { IDatabase, ScheduleWorkerInfo } from './interface';
export { database } from './supabaseRepository';

// To switch to simple database for testing, just change the import:
// export { database } from './simpleDatabase';

// Export getDatabase function
import { database } from './supabaseRepository';
export const getDatabase = () => database;

