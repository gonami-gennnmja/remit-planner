export type Worker = {
  id: string;
  name: string;
  phone: string; // in E.164 or local format
  kakaoRoomUrl?: string; // deep link or web link
  bankCode?: string; // 은행 코드
  bankAccount: string; // masked or raw account identifier
  hourlyWage: number; // KRW per hour
  taxWithheld: boolean;
  taxRate?: number; // 0..1 (optional, default 3.3% for taxWithheld)
  memo?: string; // 메모
};

export type WorkPeriod = {
  id?: string; // Optional ID for database
  start: string; // ISO date-time
  end: string; // ISO date-time
};

export type ScheduleCategory = string;

export type Category = {
  id: string;
  name: string;
  color: string;
  createdAt?: string;
};

export type ClientContact = {
  id: string;
  name: string; // 담당자명
  position?: string; // 직급/직책
  phone: string; // 연락처
  memo?: string; // 간단한 메모
  isPrimary?: boolean; // 대표 담당자 여부
};

export type Client = {
  id: string;
  name: string; // 거래처명
  contacts: ClientContact[]; // 담당자 목록 (배열)
  phone: string; // 대표 연락처
  email?: string; // 이메일
  address?: string; // 주소
  businessNumber?: string; // 사업자등록번호
  memo?: string; // 메모
  createdAt?: string;
  totalRevenue?: number; // 총 매출
  unpaidAmount?: number; // 미수금
};

export type Schedule = {
  id: string;
  title: string;
  startDate: string; // ISO date (YYYY-MM-DD) - 시작 날짜
  endDate: string; // ISO date (YYYY-MM-DD) - 종료 날짜
  description?: string;
  location?: string; // 위치 정보
  address?: string; // 상세 주소
  memo?: string; // 메모
  category: ScheduleCategory;
  workers: Array<{
    worker: Worker;
    periods: WorkPeriod[]; // one or more days/hours
    paid: boolean;
  }>;
};

export type PaymentInstruction = {
  account: string;
  amount: number; // KRW
};

export function calculatePayForWorker(
  hourlyWage: number,
  periods: WorkPeriod[],
  taxWithheld: boolean,
  taxRate: number
): number {
  const totalHours = periods.reduce((sum, p) => {
    const start = new Date(p.start).getTime();
    const end = new Date(p.end).getTime();
    const hours = Math.max(0, (end - start) / (1000 * 60 * 60));
    return sum + hours;
  }, 0);
  const gross = hourlyWage * totalHours;
  if (!taxWithheld) return Math.round(gross);
  const net = gross * (1 - taxRate);
  return Math.round(net);
}

export function getCategoryColor(category: ScheduleCategory): string {
  switch (category) {
    case 'education':
      return '#f8b4c2'; // light pink
    case 'event':
      return '#ffcc99'; // light orange
    case 'meeting':
      return '#a5b4fc'; // indigo light
    default:
      return '#93c5fd'; // blue light
  }
}


