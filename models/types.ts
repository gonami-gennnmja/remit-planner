export type Worker = {
  id: string;
  userId: string;
  name: string;
  phone: string; // in E.164 or local format
  residentNumber?: string; // 주민등록번호 (급여 지급 시에만 필수)
  bankAccount?: string; // 계좌번호 (급여 지급 시에만 필수)
  hourlyWage: number; // 기본 시급
  fuelAllowance: number; // 유류비 (월 고정)
  otherAllowance: number; // 기타비용
  // 파일 관련
  idCardImageUrl?: string; // 신분증 사진 URL
  idCardImagePath?: string; // 신분증 사진 경로
  memo?: string; // 메모
  createdAt?: string;
  updatedAt?: string;
};

export type WorkPeriod = {
  id?: string; // Optional ID for database
  scheduleWorkerId: string;
  workDate: string; // ISO date (YYYY-MM-DD)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  breakDuration: number; // 휴게시간 (분)
  overtimeHours: number; // 연장근무 시간
  dailyWage?: number; // 해당일 급여
  memo?: string; // 특이사항
  createdAt?: string;
  updatedAt?: string;
};

export type WorkerTime = {
  id: string;
  scheduleWorkerId: string;
  workDate: string; // ISO date (YYYY-MM-DD)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  breakDuration: number; // 휴게시간 (분)
  overtimeHours: number; // 연장근무 시간
  memo?: string; // 특이사항
  createdAt?: string;
  updatedAt?: string;
};

export type ScheduleTime = {
  id: string;
  scheduleId: string;
  workDate: string; // ISO date (YYYY-MM-DD)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  breakDuration: number; // 휴게시간 (분)
  createdAt?: string;
  updatedAt?: string;
};

export type ScheduleWorker = {
  id: string;
  scheduleId: string;
  workerId: string;
  workStartDate: string; // ISO date (YYYY-MM-DD)
  workEndDate: string; // ISO date (YYYY-MM-DD)
  uniformTime: boolean; // 근무 시간이 동일한지 여부
  hourlyWage?: number; // 이 스케줄에서의 시급
  fuelAllowance: number; // 이 스케줄에서의 유류비
  otherAllowance: number; // 이 스케줄에서의 기타비용
  // 급여 계산 옵션들
  overtimeEnabled: boolean; // 연장근무 수당 적용 여부
  nightShiftEnabled: boolean; // 야간수당 적용 여부
  taxWithheld: boolean; // 3.3% 세금 공제 여부
  // 지급 여부 체크
  wagePaid: boolean; // 급여 지급 여부
  fuelPaid: boolean; // 유류비 지급 여부
  otherPaid: boolean; // 기타비용 지급 여부
  createdAt?: string;
  updatedAt?: string;
};

export type PayrollCalculation = {
  id: string;
  scheduleWorkerId: string;
  totalHours: number; // 총 근무시간
  regularHours: number; // 일반 근무시간
  overtimeHours: number; // 연장근무 시간
  nightHours: number; // 야간근무 시간 (22시~06시)
  regularPay: number; // 일반 급여
  overtimePay: number; // 연장근무 수당
  nightShiftPay: number; // 야간수당
  fuelAllowance: number; // 유류비
  otherAllowance: number; // 기타비용
  totalGrossPay: number; // 총 지급액
  taxAmount: number; // 세금 (3.3%)
  netPay: number; // 실지급액
  calculatedAt?: string;
};

export type ScheduleCategory = string;

export type Category = {
  id: string;
  name: string;
  color: string;
  userId?: string | null; // NULL이면 시스템 기본 카테고리
  isSystem?: boolean; // 시스템 기본 카테고리 여부
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
  userId: string;
  name: string; // 거래처명
  contactPerson?: string; // 담당자명
  phone: string; // 대표 연락처
  email?: string; // 이메일
  address?: string; // 주소
  businessNumber?: string; // 사업자등록번호
  documentsFolderPath?: string; // 문서 폴더 경로
  memo?: string; // 메모
  createdAt?: string;
  updatedAt?: string;
  totalRevenue?: number; // 총 매출
  unpaidAmount?: number; // 미수금
  contacts?: ClientContact[]; // 담당자 목록 (배열) - 기존 호환성
};

export type ClientDocument = {
  id: string;
  clientId: string;
  fileName: string; // 원본 파일명
  fileUrl: string; // 파일 URL
  filePath: string; // 파일 경로
  fileType: string; // 파일 타입
  fileSize?: number; // 파일 크기
  description?: string; // 파일 설명
  uploadedAt?: string;
};

export type Schedule = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startDate: string; // ISO date (YYYY-MM-DD) - 시작 날짜
  endDate: string; // ISO date (YYYY-MM-DD) - 종료 날짜
  category: ScheduleCategory;
  location?: string; // 위치 정보
  address?: string; // 상세 주소
  uniformTime: boolean; // 일정 시간이 동일한지 여부
  documentsFolderPath?: string; // 문서 폴더 경로
  hasAttachments: boolean; // 첨부파일 여부
  // 거래처 관련 필드
  clientId?: string; // 연결된 거래처 ID
  // 수급 관련 필드들
  allWagesPaid: boolean; // 모든 근로자 임금 지급 완료 여부
  revenueStatus: 'received' | 'pending' | 'overdue'; // 수급 상태
  revenueDueDate?: string; // 수급 마감일 (endDate + 14일)
  memo?: string; // 메모
  createdAt?: string;
  updatedAt?: string;
  // 기존 호환성을 위한 필드들
  workers?: Array<{
    worker: Worker;
    periods: WorkPeriod[]; // one or more days/hours
    paid: boolean;
    taxWithheld?: boolean;
    wagePaid?: boolean;
  }>;
};

export type ScheduleDocument = {
  id: string;
  scheduleId: string;
  fileName: string; // 원본 파일명
  fileUrl: string; // 파일 URL
  filePath: string; // 파일 경로
  fileType: string; // 파일 타입
  fileSize?: number; // 파일 크기
  documentType: string; // 문서 타입 (manual, guide, photo, report 등)
  description?: string; // 파일 설명
  uploadedAt?: string;
};

export type Notification = {
  id: string;
  userId: string;
  type: 'wage_overdue' | 'revenue_overdue' | 'schedule_reminder';
  title: string;
  message: string;
  isRead: boolean;
  priority: 1 | 2 | 3; // 1: 높음, 2: 보통, 3: 낮음
  relatedId?: string; // 관련 스케줄/근로자 ID
  scheduledAt?: string; // 예약된 알림 시간
  createdAt?: string;
  updatedAt?: string;
};

export type NotificationSettings = {
  id: string;
  userId: string;
  wageOverdueEnabled: boolean;
  revenueOverdueEnabled: boolean;
  scheduleReminderEnabled: boolean;
  scheduleReminderUnit: 'hours' | 'days';
  scheduleReminderValue: number; // 1일 전, 2일 전 등
  createdAt?: string;
  updatedAt?: string;
};

export type UserProfile = {
  id: string; // auth.users.id와 동일
  businessName?: string; // 사업체명
  businessNumber?: string; // 사업자등록번호
  businessAddress?: string; // 사업장 주소
  businessPhone?: string; // 사업장 전화번호
  businessEmail?: string; // 사업장 이메일
  // 파일 관련
  businessCardImageUrl?: string; // 명함 사진 URL
  businessCardImagePath?: string; // 명함 사진 경로
  businessLicenseImageUrl?: string; // 사업자등록증 사진 URL
  businessLicenseImagePath?: string; // 사업자등록증 사진 경로
  createdAt?: string;
  updatedAt?: string;
};

export type PaymentInstruction = {
  account: string;
  amount: number; // KRW
};

export function calculatePayForWorker(
  hourlyWage: number,
  periods: WorkPeriod[],
  taxWithheld: boolean,
  taxRate: number = 0.033
): number {
  const totalHours = periods.reduce((sum, p) => {
    const start = new Date(`${p.workDate}T${p.startTime}`).getTime();
    const end = new Date(`${p.workDate}T${p.endTime}`).getTime();
    const hours = Math.max(0, (end - start) / (1000 * 60 * 60)) - (p.breakDuration / 60);
    return sum + hours;
  }, 0);
  const gross = hourlyWage * totalHours;
  if (!taxWithheld) return Math.round(gross);
  const net = gross * (1 - taxRate);
  return Math.round(net);
}

export function calculateDetailedPay(
  scheduleWorker: ScheduleWorker,
  workPeriods: WorkPeriod[]
): PayrollCalculation {
  let totalHours = 0;
  let regularHours = 0;
  let overtimeHours = 0;
  let nightHours = 0;

  workPeriods.forEach(period => {
    const start = new Date(`${period.workDate}T${period.startTime}`);
    const end = new Date(`${period.workDate}T${period.endTime}`);
    const workMinutes = (end.getTime() - start.getTime()) / (1000 * 60) - period.breakDuration;
    const workHours = workMinutes / 60;

    totalHours += workHours;

    // 연장근무 계산 (8시간 초과)
    if (workHours > 8) {
      regularHours += 8;
      overtimeHours += workHours - 8;
    } else {
      regularHours += workHours;
    }

    // 야간근무 계산 (22시~06시)
    const startHour = start.getHours();
    const endHour = end.getHours();
    if (startHour >= 22 || endHour <= 6) {
      nightHours += workHours;
    }
  });

  const regularPay = regularHours * scheduleWorker.hourlyWage!;
  const overtimePay = scheduleWorker.overtimeEnabled ? overtimeHours * scheduleWorker.hourlyWage! * 1.5 : 0;
  const nightShiftPay = scheduleWorker.nightShiftEnabled ? nightHours * scheduleWorker.hourlyWage! * 1.5 : 0;
  const fuelAllowance = scheduleWorker.fuelAllowance;
  const otherAllowance = scheduleWorker.otherAllowance;

  const totalGrossPay = regularPay + overtimePay + nightShiftPay + fuelAllowance + otherAllowance;
  const taxAmount = scheduleWorker.taxWithheld ? Math.round((totalGrossPay - fuelAllowance - otherAllowance) * 0.033) : 0;
  const netPay = totalGrossPay - taxAmount;

  return {
    id: '',
    scheduleWorkerId: scheduleWorker.id,
    totalHours,
    regularHours,
    overtimeHours,
    nightHours,
    regularPay: Math.round(regularPay),
    overtimePay: Math.round(overtimePay),
    nightShiftPay: Math.round(nightShiftPay),
    fuelAllowance,
    otherAllowance,
    totalGrossPay: Math.round(totalGrossPay),
    taxAmount,
    netPay: Math.round(netPay),
    calculatedAt: new Date().toISOString()
  };
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


