// Main database export - uses simple in-memory database
export type { IDatabase, ScheduleWorkerInfo, WorkPeriod } from './interface';
export { database } from './simpleDatabase';

// To switch to Supabase later, just change the import:
// export { database } from './supabaseRepository';

