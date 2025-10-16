import { Platform } from 'react-native';
import { CREATE_TABLES } from './schema';

// Only import SQLite on native platforms
let SQLite: any = null;
if (Platform.OS !== 'web') {
  try {
    SQLite = require('expo-sqlite');
  } catch (error) {
    console.warn('expo-sqlite not available:', error);
  }
}

class SQLiteDatabase {
  private db: any = null;

  async init() {
    if (Platform.OS === 'web') {
      throw new Error('SQLite is not available on web platform');
    }
    if (!SQLite) {
      throw new Error('expo-sqlite is not available');
    }

    try {
      this.db = await SQLite.openDatabaseAsync('remit_planner.db');
      await this.createTables();
      console.log('✅ SQLite database initialized');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Split the CREATE_TABLES string by semicolons and execute each statement
    const statements = CREATE_TABLES.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        await this.db.execAsync(statement + ';');
      }
    }
  }

  async executeQuery<T = any>(
    query: string,
    params: any[] = []
  ): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync<T>(query, params);
      return result;
    } catch (error) {
      console.error('Query error:', error, { query, params });
      throw error;
    }
  }

  async executeUpdate(
    query: string,
    params: any[] = []
  ): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.runAsync(query, params);
      return result;
    } catch (error) {
      console.error('Update error:', error, { query, params });
      throw error;
    }
  }

  async transaction(callback: () => Promise<void>) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.execAsync('BEGIN TRANSACTION;');
      await callback();
      await this.db.execAsync('COMMIT;');
    } catch (error) {
      await this.db.execAsync('ROLLBACK;');
      throw error;
    }
  }

  async close() {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  async clearAllData() {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      DELETE FROM work_periods;
      DELETE FROM schedule_workers;
      DELETE FROM schedules;
      DELETE FROM workers;
    `);
  }
}

export const sqliteDb = new SQLiteDatabase();

