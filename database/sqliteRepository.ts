// SQLite implementation of database interface
import { Schedule, ScheduleCategory, Worker } from '@/models/types';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'react-native-uuid';
import { IDatabase, ScheduleWorkerInfo, WorkPeriod } from './interface';

// Only import SQLite on native platforms
let sqliteDb: any = null;
if (Platform.OS !== 'web') {
  try {
    const { sqliteDb: db } = require('./sqlite');
    sqliteDb = db;
  } catch (error) {
    console.warn('SQLite not available:', error);
  }
}

export class SQLiteRepository implements IDatabase {
  private checkPlatform(): void {
    if (Platform.OS === 'web') {
      throw new Error('SQLite is not available on web platform. Use IndexedDB instead.');
    }
    if (!sqliteDb) {
      throw new Error('SQLite database not initialized');
    }
  }

  async init(): Promise<void> {
    this.checkPlatform();
    await sqliteDb.init();
  }

  // ==================== Worker Operations ====================

  async createWorker(worker: Worker): Promise<string> {
    this.checkPlatform();
    const id = worker.id || uuidv4().toString();
    await sqliteDb.executeUpdate(
      `INSERT INTO workers (id, name, phone, bank_account, hourly_wage, tax_withheld, memo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        worker.name,
        worker.phone,
        worker.bankAccount,
        worker.hourlyWage,
        worker.taxWithheld ? 1 : 0,
        worker.memo || null
      ]
    );
    return id;
  }

  async getWorker(id: string): Promise<Worker | null> {
    const results = await sqliteDb.executeQuery<any>(
      'SELECT * FROM workers WHERE id = ?',
      [id]
    );

    if (results.length === 0) return null;

    const row = results[0];
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      bankAccount: row.bank_account,
      hourlyWage: row.hourly_wage,
      taxWithheld: row.tax_withheld === 1,
      memo: row.memo
    };
  }

  async getAllWorkers(): Promise<Worker[]> {
    const results = await sqliteDb.executeQuery<any>(
      'SELECT * FROM workers ORDER BY name'
    );

    return results.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      bankAccount: row.bank_account,
      hourlyWage: row.hourly_wage,
      taxWithheld: row.tax_withheld === 1,
      memo: row.memo
    }));
  }

  async updateWorker(id: string, worker: Partial<Worker>): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (worker.name !== undefined) {
      updates.push('name = ?');
      params.push(worker.name);
    }
    if (worker.phone !== undefined) {
      updates.push('phone = ?');
      params.push(worker.phone);
    }
    if (worker.bankAccount !== undefined) {
      updates.push('bank_account = ?');
      params.push(worker.bankAccount);
    }
    if (worker.hourlyWage !== undefined) {
      updates.push('hourly_wage = ?');
      params.push(worker.hourlyWage);
    }
    if (worker.taxWithheld !== undefined) {
      updates.push('tax_withheld = ?');
      params.push(worker.taxWithheld ? 1 : 0);
    }
    if (worker.memo !== undefined) {
      updates.push('memo = ?');
      params.push(worker.memo);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      await sqliteDb.executeUpdate(
        `UPDATE workers SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }
  }

  async deleteWorker(id: string): Promise<void> {
    await sqliteDb.executeUpdate('DELETE FROM workers WHERE id = ?', [id]);
  }

  // ==================== Schedule Operations ====================

  async createSchedule(schedule: {
    id: string;
    title: string;
    description?: string;
    date: string;
    category: ScheduleCategory;
  }): Promise<string> {
    const id = schedule.id || uuidv4().toString();
    await sqliteDb.executeUpdate(
      `INSERT INTO schedules (id, title, description, date, category)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        schedule.title,
        schedule.description || '',
        schedule.date,
        schedule.category
      ]
    );
    return id;
  }

  async getSchedule(id: string): Promise<Schedule | null> {
    const results = await sqliteDb.executeQuery<any>(
      'SELECT * FROM schedules WHERE id = ?',
      [id]
    );

    if (results.length === 0) return null;

    const row = results[0];
    const workers = await this.getScheduleWorkers(id);

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      date: row.date,
      category: row.category as ScheduleCategory,
      workers
    };
  }

  async getSchedulesByDate(date: string): Promise<Schedule[]> {
    const results = await sqliteDb.executeQuery<any>(
      'SELECT * FROM schedules WHERE date = ? ORDER BY title',
      [date]
    );

    const schedules: Schedule[] = [];
    for (const row of results) {
      const workers = await this.getScheduleWorkers(row.id);
      schedules.push({
        id: row.id,
        title: row.title,
        description: row.description,
        date: row.date,
        category: row.category as ScheduleCategory,
        workers
      });
    }

    return schedules;
  }

  async getSchedulesByDateRange(startDate: string, endDate: string): Promise<Schedule[]> {
    const results = await sqliteDb.executeQuery<any>(
      'SELECT * FROM schedules WHERE date >= ? AND date <= ? ORDER BY date, title',
      [startDate, endDate]
    );

    const schedules: Schedule[] = [];
    for (const row of results) {
      const workers = await this.getScheduleWorkers(row.id);
      schedules.push({
        id: row.id,
        title: row.title,
        description: row.description,
        date: row.date,
        category: row.category as ScheduleCategory,
        workers
      });
    }

    return schedules;
  }

  async updateSchedule(id: string, schedule: Partial<Schedule>): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (schedule.title !== undefined) {
      updates.push('title = ?');
      params.push(schedule.title);
    }
    if (schedule.description !== undefined) {
      updates.push('description = ?');
      params.push(schedule.description);
    }
    if (schedule.date !== undefined) {
      updates.push('date = ?');
      params.push(schedule.date);
    }
    if (schedule.category !== undefined) {
      updates.push('category = ?');
      params.push(schedule.category);
    }
    if (schedule.location !== undefined) {
      updates.push('location = ?');
      params.push(schedule.location);
    }
    if (schedule.address !== undefined) {
      updates.push('address = ?');
      params.push(schedule.address);
    }
    if (schedule.memo !== undefined) {
      updates.push('memo = ?');
      params.push(schedule.memo);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);
      await sqliteDb.executeUpdate(
        `UPDATE schedules SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }
  }

  async deleteSchedule(id: string): Promise<void> {
    await sqliteDb.executeUpdate('DELETE FROM schedules WHERE id = ?', [id]);
  }

  // ==================== Schedule-Worker Relationships ====================

  async addWorkerToSchedule(
    scheduleId: string,
    workerId: string,
    periods: WorkPeriod[],
    paid: boolean = false,
    workHours?: number
  ): Promise<string> {
    const scheduleWorkerId = uuidv4().toString();

    await sqliteDb.executeUpdate(
      `INSERT INTO schedule_workers (id, schedule_id, worker_id, paid, work_hours)
       VALUES (?, ?, ?, ?, ?)`,
      [scheduleWorkerId, scheduleId, workerId, paid ? 1 : 0, workHours || null]
    );

    // Add work periods
    for (const period of periods) {
      const periodId = period.id || uuidv4().toString();
      await sqliteDb.executeUpdate(
        `INSERT INTO work_periods (id, schedule_worker_id, start_time, end_time)
         VALUES (?, ?, ?, ?)`,
        [periodId, scheduleWorkerId, period.start, period.end]
      );
    }

    return scheduleWorkerId;
  }

  async getScheduleWorkers(scheduleId: string): Promise<ScheduleWorkerInfo[]> {
    const scheduleWorkers = await sqliteDb.executeQuery<any>(
      `SELECT sw.*, w.*
       FROM schedule_workers sw
       JOIN workers w ON sw.worker_id = w.id
       WHERE sw.schedule_id = ?`,
      [scheduleId]
    );

    const result: ScheduleWorkerInfo[] = [];

    for (const row of scheduleWorkers) {
      const periods = await sqliteDb.executeQuery<any>(
        'SELECT * FROM work_periods WHERE schedule_worker_id = ?',
        [row.id]
      );

      result.push({
        worker: {
          id: row.worker_id,
          name: row.name,
          phone: row.phone,
          bankAccount: row.bank_account,
          hourlyWage: row.hourly_wage,
          taxWithheld: row.tax_withheld === 1
        },
        periods: periods.map(p => ({
          id: p.id,
          start: p.start_time,
          end: p.end_time
        })),
        paid: row.paid === 1
      });
    }

    return result;
  }

  async updateScheduleWorkerPaidStatus(
    scheduleId: string,
    workerId: string,
    paid: boolean
  ): Promise<void> {
    await sqliteDb.executeUpdate(
      `UPDATE schedule_workers 
       SET paid = ?, updated_at = CURRENT_TIMESTAMP
       WHERE schedule_id = ? AND worker_id = ?`,
      [paid ? 1 : 0, scheduleId, workerId]
    );
  }

  async updateScheduleWorkerHours(
    scheduleId: string,
    workerId: string,
    hours: number
  ): Promise<void> {
    await sqliteDb.executeUpdate(
      `UPDATE schedule_workers 
       SET work_hours = ?, updated_at = CURRENT_TIMESTAMP
       WHERE schedule_id = ? AND worker_id = ?`,
      [hours, scheduleId, workerId]
    );
  }

  async removeWorkerFromSchedule(scheduleId: string, workerId: string): Promise<void> {
    await sqliteDb.executeUpdate(
      'DELETE FROM schedule_workers WHERE schedule_id = ? AND worker_id = ?',
      [scheduleId, workerId]
    );
  }

  async updateWorkerTaxWithheld(workerId: string, taxWithheld: boolean): Promise<void> {
    await sqliteDb.executeUpdate(
      `UPDATE workers 
       SET tax_withheld = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [taxWithheld ? 1 : 0, workerId]
    );
  }

  // ==================== Utility ====================

  async clearAllData(): Promise<void> {
    await sqliteDb.clearAllData();
  }
}

export const database = new SQLiteRepository();

