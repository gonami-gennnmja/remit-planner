import { Schedule } from './types';

class InMemoryStore {
  private schedules: Record<string, Schedule> = {};

  listByDate(date: string): Schedule[] {
    return Object.values(this.schedules).filter((s) => s.date === date);
  }

  get(id: string): Schedule | undefined {
    return this.schedules[id];
  }

  upsert(schedule: Schedule): void {
    this.schedules[schedule.id] = schedule;
  }

  remove(id: string): void {
    delete this.schedules[id];
  }

  seed(initial: Schedule[]): void {
    for (const s of initial) this.upsert(s);
  }
}

export const store = new InMemoryStore();


