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
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        category: schedule.category
      });
    } else {
      // Create new schedule
      await database.createSchedule({
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
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

    // 날짜 계산 헬퍼 함수
    const getDate = (daysFromToday: number) => {
      const date = new Date();
      date.setDate(date.getDate() + daysFromToday);
      return date.toISOString().slice(0, 10);
    };

    const initialSchedules: Schedule[] = [
      // 1. 수학 과외 (오늘)
      {
        id: "schedule-001",
        title: "수학 과외",
        startDate: getDate(0),
        endDate: getDate(0),
        description: "고등학교 2학년 수학 과외",
        location: "강남구 학원",
        category: "education",
        workers: [
          {
            worker: {
              id: "worker-001",
              name: "김선생",
              phone: "010-1234-5678",
              bankAccount: "110234567890",
              hourlyWage: 50000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "period-001",
                start: `${getDate(0)}T14:00:00+09:00`,
                end: `${getDate(0)}T16:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      // 2. 음악 페스티벌 (3일 연속: 오늘 ~ 모레)
      {
        id: "schedule-002",
        title: "음악 페스티벌",
        startDate: getDate(0),
        endDate: getDate(2),
        description: "시청 광장 야외 음악 페스티벌 운영",
        location: "시청 광장",
        category: "event",
        workers: [
          {
            worker: {
              id: "worker-002",
              name: "박이벤트",
              phone: "010-2345-6789",
              bankAccount: "020345678901",
              hourlyWage: 35000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "period-002-1",
                start: `${getDate(0)}T10:00:00+09:00`,
                end: `${getDate(0)}T18:00:00+09:00`,
              },
              {
                id: "period-002-2",
                start: `${getDate(1)}T10:00:00+09:00`,
                end: `${getDate(1)}T18:00:00+09:00`,
              },
              {
                id: "period-002-3",
                start: `${getDate(2)}T10:00:00+09:00`,
                end: `${getDate(2)}T18:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      // 3. 영어 회화 (내일)
      {
        id: "schedule-003",
        title: "영어 회화",
        startDate: getDate(1),
        endDate: getDate(1),
        description: "성인 비즈니스 영어 회화 수업",
        location: "강남 어학원",
        category: "education",
        workers: [
          {
            worker: {
              id: "worker-003",
              name: "Sarah Johnson",
              phone: "010-3456-7890",
              bankAccount: "088456789012",
              hourlyWage: 80000,
              taxWithheld: false,
            },
            periods: [
              {
                id: "period-003",
                start: `${getDate(1)}T19:00:00+09:00`,
                end: `${getDate(1)}T21:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      // 4. 프로젝트 회의 (모레)
      {
        id: "schedule-004",
        title: "프로젝트 회의",
        startDate: getDate(2),
        endDate: getDate(2),
        description: "웹 개발 프로젝트 진행 상황 회의",
        location: "본사 회의실",
        category: "meeting",
        workers: [
          {
            worker: {
              id: "worker-004",
              name: "이개발",
              phone: "010-4567-8901",
              bankAccount: "004567890123",
              hourlyWage: 100000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "period-004",
                start: `${getDate(2)}T10:00:00+09:00`,
                end: `${getDate(2)}T12:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      // 5. 제품 박람회 (4일 연속: 3일 후 ~ 6일 후)
      {
        id: "schedule-005",
        title: "제품 박람회",
        startDate: getDate(3),
        endDate: getDate(6),
        description: "코엑스 IT 제품 박람회 부스 운영",
        location: "코엑스 홀 A",
        category: "event",
        workers: [
          {
            worker: {
              id: "worker-005",
              name: "정마케팅",
              phone: "010-5678-9012",
              bankAccount: "020678901234",
              hourlyWage: 40000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "period-005-1",
                start: `${getDate(3)}T09:00:00+09:00`,
                end: `${getDate(3)}T17:00:00+09:00`,
              },
              {
                id: "period-005-2",
                start: `${getDate(4)}T09:00:00+09:00`,
                end: `${getDate(4)}T17:00:00+09:00`,
              },
              {
                id: "period-005-3",
                start: `${getDate(5)}T09:00:00+09:00`,
                end: `${getDate(5)}T17:00:00+09:00`,
              },
              {
                id: "period-005-4",
                start: `${getDate(6)}T09:00:00+09:00`,
                end: `${getDate(6)}T17:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      // 6. 피아노 레슨 (4일 후)
      {
        id: "schedule-006",
        title: "피아노 레슨",
        startDate: getDate(4),
        endDate: getDate(4),
        description: "초등학생 피아노 개인 레슨",
        location: "음악학원",
        category: "education",
        workers: [
          {
            worker: {
              id: "worker-006",
              name: "최음악",
              phone: "010-6789-0123",
              bankAccount: "088789012345",
              hourlyWage: 45000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "period-006",
                start: `${getDate(4)}T16:00:00+09:00`,
                end: `${getDate(4)}T17:00:00+09:00`,
              },
            ],
            paid: true,
          },
        ],
      },
      // 7. 디자인 워크숍 (2일 연속: 7일 후 ~ 8일 후)
      {
        id: "schedule-007",
        title: "디자인 워크숍",
        startDate: getDate(7),
        endDate: getDate(8),
        description: "UI/UX 디자인 실무 워크숍",
        location: "강남 교육센터",
        category: "education",
        workers: [
          {
            worker: {
              id: "worker-007",
              name: "한디자인",
              phone: "010-7890-1234",
              bankAccount: "088890123456",
              hourlyWage: 70000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "period-007-1",
                start: `${getDate(7)}T10:00:00+09:00`,
                end: `${getDate(7)}T18:00:00+09:00`,
              },
              {
                id: "period-007-2",
                start: `${getDate(8)}T10:00:00+09:00`,
                end: `${getDate(8)}T18:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      // 8. 월간 전략 회의 (10일 후)
      {
        id: "schedule-008",
        title: "월간 전략 회의",
        startDate: getDate(10),
        endDate: getDate(10),
        description: "다음 달 사업 전략 수립 회의",
        location: "본사 대회의실",
        category: "meeting",
        workers: [
          {
            worker: {
              id: "worker-008",
              name: "강전략",
              phone: "010-8901-2345",
              bankAccount: "004901234567",
              hourlyWage: 120000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "period-008",
                start: `${getDate(10)}T14:00:00+09:00`,
                end: `${getDate(10)}T17:00:00+09:00`,
              },
            ],
            paid: false,
          },
        ],
      },
      // 9. 일본어 회화 (12일 후)
      {
        id: "schedule-009",
        title: "일본어 회화",
        startDate: getDate(12),
        endDate: getDate(12),
        description: "비즈니스 일본어 회화 수업",
        location: "외국어학원",
        category: "education",
        workers: [
          {
            worker: {
              id: "worker-009",
              name: "山田太郎",
              phone: "010-9012-3456",
              bankAccount: "088012345678",
              hourlyWage: 75000,
              taxWithheld: false,
            },
            periods: [
              {
                id: "period-009",
                start: `${getDate(12)}T18:00:00+09:00`,
                end: `${getDate(12)}T20:00:00+09:00`,
              },
            ],
            paid: true,
          },
        ],
      },
      // 10. 팀 빌딩 이벤트 (14일~15일, 2일)
      {
        id: "schedule-010",
        title: "팀 빌딩 이벤트",
        startDate: getDate(14),
        endDate: getDate(15),
        description: "회사 전체 팀 빌딩 워크숍 및 야유회",
        location: "경기도 연수원",
        category: "event",
        workers: [
          {
            worker: {
              id: "worker-010",
              name: "송기획",
              phone: "010-0123-4567",
              bankAccount: "020123456789",
              hourlyWage: 50000,
              taxWithheld: true,
            },
            periods: [
              {
                id: "period-010-1",
                start: `${getDate(14)}T09:00:00+09:00`,
                end: `${getDate(14)}T18:00:00+09:00`,
              },
              {
                id: "period-010-2",
                start: `${getDate(15)}T09:00:00+09:00`,
                end: `${getDate(15)}T15:00:00+09:00`,
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

    console.log('✅ Initial data seeded: 10 schedules created');
  }
}

export const store = new ScheduleStore();
