import { database } from '../database';
import { Schedule } from '../models/types';

class ScheduleStore {
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    await database.init();
    await this.seedInitialData();
    this.initialized = true;
  }

  async listByDate(date: string): Promise<Schedule[]> {
    await this.ensureInitialized();
    return await database.getSchedulesByDate(date);
  }

  async listByDateRange(startDate: string, endDate: string): Promise<Schedule[]> {
    await this.ensureInitialized();
    return await database.getSchedulesByDateRange(startDate, endDate);
  }

  async get(id: string): Promise<Schedule | null> {
    await this.ensureInitialized();
    return await database.getSchedule(id);
  }

  async upsert(schedule: Schedule): Promise<void> {
    await this.ensureInitialized();

    const existing = await database.getSchedule(schedule.id);

    if (existing) {
      // Update schedule
      await database.updateSchedule(schedule.id, {
        title: schedule.title,
        description: schedule.description,
        date: schedule.date,
        category: schedule.category
      });
    } else {
      // Create new schedule
      await database.createSchedule({
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        date: schedule.date,
        category: schedule.category
      });
    }

    // Update workers
    for (const workerInfo of schedule.workers) {
      // Check if worker exists, if not create
      const existingWorker = await database.getWorker(workerInfo.worker.id);
      if (!existingWorker) {
        await database.createWorker(workerInfo.worker);
      } else {
        // Update worker info
        await database.updateWorker(workerInfo.worker.id, workerInfo.worker);
      }

      // Add worker to schedule with periods
      await database.addWorkerToSchedule(
        schedule.id,
        workerInfo.worker.id,
        workerInfo.periods.map(p => ({ id: '', start: p.start, end: p.end })),
        workerInfo.paid
      );
    }
  }

  async remove(id: string): Promise<void> {
    await this.ensureInitialized();
    await database.deleteSchedule(id);
  }

  async updateWorkerPaidStatus(scheduleId: string, workerId: string, paid: boolean): Promise<void> {
    await this.ensureInitialized();
    await database.updateScheduleWorkerPaidStatus(scheduleId, workerId, paid);
  }

  async updateWorkerTaxWithheld(workerId: string, taxWithheld: boolean): Promise<void> {
    await this.ensureInitialized();
    await database.updateWorkerTaxWithheld(workerId, taxWithheld);
  }

  async updateWorkerHours(scheduleId: string, workerId: string, hours: number): Promise<void> {
    await this.ensureInitialized();
    await database.updateScheduleWorkerHours(scheduleId, workerId, hours);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  private async seedInitialData(): Promise<void> {
    // Check if data already exists
    const today = new Date().toISOString().slice(0, 10);
    const existingSchedules = await database.getSchedulesByDate(today);

    if (existingSchedules.length > 0) {
      console.log('📋 Database already has data, skipping seed');
      return;
    }

    console.log('🌱 Seeding initial data...');

    // Seed initial schedules (we'll add them below)
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const initialSchedules: Schedule[] = [
      {
        id: "1",
        title: "수학 과외",
        date: today,
        description: "고등학교 2학년 수학 과외",
        category: "education",
        workers: [
          {
            worker: {
              id: "w1",
              name: "김선생",
              phone: "010-1234-5678",
              bankAccount: "123-456-789",
              hourlyWage: 50000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "p1",
                start: `${today}T14:00:00+09:00`,
                end: `${today}T16:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      {
        id: "2",
        title: "영어 회화",
        date: today,
        description: "성인 영어 회화 수업",
        category: "education",
        workers: [
          {
            worker: {
              id: "w2",
              name: "Sarah Johnson",
              phone: "010-9876-5432",
              bankAccount: "987-654-321",
              hourlyWage: 80000,
              taxWithheld: false,
            },
            periods: [
              {
                id: "p2",
                start: `${today}T19:00:00+09:00`,
                end: `${today}T21:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      {
        id: "3",
        title: "프로젝트 회의",
        date: tomorrow,
        description: "웹 개발 프로젝트 진행 회의",
        category: "meeting",
        workers: [
          {
            worker: {
              id: "w3",
              name: "이개발",
              phone: "010-5555-1234",
              bankAccount: "555-123-456",
              hourlyWage: 100000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "p3",
                start: `${tomorrow}T10:00:00+09:00`,
                end: `${tomorrow}T12:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      {
        id: "4",
        title: "이벤트 준비",
        date: today,
        description: "회사 이벤트 준비 작업",
        category: "event",
        workers: [
          {
            worker: {
              id: "w4",
              name: "최이벤트",
              phone: "010-7777-8888",
              bankAccount: "777-888-999",
              hourlyWage: 30000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "p4",
                start: `${today}T09:00:00+09:00`,
                end: `${today}T11:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
    ];

    for (const schedule of initialSchedules) {
      await this.upsert(schedule);
    }

    console.log('✅ Initial data seeded');
  }
}

export const store = new ScheduleStore();
