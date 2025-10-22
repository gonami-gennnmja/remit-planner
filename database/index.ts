// Main database export - uses Supabase
export type { IDatabase, ScheduleWorkerInfo, WorkPeriod } from './interface';
export { database } from './supabaseRepository';

// To switch to simple database for testing, just change the import:
// export { database } from './simpleDatabase';

