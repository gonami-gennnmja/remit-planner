// 한국 은행별 계좌번호 형식 및 감지
export interface BankInfo {
  code: string;
  name: string;
  shortName: string;
  accountPattern: RegExp;
  example: string;
  format: string;
}

// 출처: https://tech-journal.tistory.com/entry/%EC%96%B4%EB%8A%90-%EC%9D%80%ED%96%89%EC%9D%B4%EC%95%BC-%EC%9D%80%ED%96%89%EB%B3%84-%EA%B3%84%EC%A2%8C%EB%B2%88%ED%98%B8-%EC%BD%94%EB%93%9C
export const KOREAN_BANKS: BankInfo[] = [
  {
    code: "004",
    name: "KB국민은행",
    shortName: "KB국민",
    accountPattern: /^(110|920)/,
    example: "110-1234-5678",
    format: "XXX-XXXX-XXXX"
  },
  {
    code: "088",
    name: "신한은행",
    shortName: "신한",
    accountPattern: /^(110|140)/,
    example: "110-123-456789",
    format: "XXX-XXX-XXXXXX"
  },
  {
    code: "081",
    name: "하나은행",
    shortName: "하나",
    accountPattern: /^(620|910)/,
    example: "620-123456-789",
    format: "XXX-XXXXXX-XXX"
  },
  {
    code: "020",
    name: "우리은행",
    shortName: "우리",
    accountPattern: /^1002/,
    example: "1002-123-456789",
    format: "XXXX-XXX-XXXXXX"
  },
  {
    code: "011",
    name: "NH농협은행",
    shortName: "농협",
    accountPattern: /^(301|302|303|351|352|353)/,
    example: "301-1234-567890",
    format: "XXX-XXXX-XXXXXX"
  },
  {
    code: "003",
    name: "IBK기업은행",
    shortName: "IBK기업",
    accountPattern: /^(031|041|051|061)/,
    example: "031-1234-567890",
    format: "XXX-XXXX-XXXXXX"
  },
  {
    code: "023",
    name: "SC제일은행",
    shortName: "SC제일",
    accountPattern: /^(333|355)/,
    example: "333-12345678",
    format: "XXX-XXXXXXXX"
  },
  {
    code: "089",
    name: "케이뱅크",
    shortName: "케이뱅크",
    accountPattern: /^100/,
    example: "100-1234-567890",
    format: "XXX-XXXX-XXXXXX"
  },
  {
    code: "090",
    name: "카카오뱅크",
    shortName: "카카오뱅크",
    accountPattern: /^(3333|7979)/,
    example: "3333-12-3456789",
    format: "XXXX-XX-XXXXXXX"
  },
  {
    code: "027",
    name: "한국씨티은행",
    shortName: "씨티",
    accountPattern: /^(032|362)/,
    example: "032-1234-5678",
    format: "XXX-XXXX-XXXX"
  },
  {
    code: "032",
    name: "부산은행",
    shortName: "부산",
    accountPattern: /^(101|121|131)/,
    example: "101-1234-567890",
    format: "XXX-XXXX-XXXXXX"
  },
  {
    code: "031",
    name: "대구은행",
    shortName: "대구",
    accountPattern: /^(505|506)/,
    example: "505-12-345678",
    format: "XXX-XX-XXXXXX"
  },
  {
    code: "034",
    name: "광주은행",
    shortName: "광주",
    accountPattern: /^(600|601)/,
    example: "600-123-456789",
    format: "XXX-XXX-XXXXXX"
  },
  {
    code: "037",
    name: "전북은행",
    shortName: "전북",
    accountPattern: /^(123|126)/,
    example: "123-1234-567890",
    format: "XXX-XXXX-XXXXXX"
  },
  {
    code: "039",
    name: "경남은행",
    shortName: "경남",
    accountPattern: /^(507|508)/,
    example: "507-12-345678",
    format: "XXX-XX-XXXXXX"
  },
  {
    code: "035",
    name: "제주은행",
    shortName: "제주",
    accountPattern: /^(401|402)/,
    example: "401-12-345678",
    format: "XXX-XX-XXXXXX"
  },
  {
    code: "071",
    name: "우체국",
    shortName: "우체국",
    accountPattern: /^(01|12)/,
    example: "012345-01-123456",
    format: "XXXXXX-XX-XXXXXX"
  },
  {
    code: "002",
    name: "산업은행",
    shortName: "산업",
    accountPattern: /^(01|02)/,
    example: "01-1234-5678",
    format: "XX-XXXX-XXXX"
  },
  {
    code: "007",
    name: "수협은행",
    shortName: "수협",
    accountPattern: /^(001|002)/,
    example: "001-12-123456",
    format: "XXX-XX-XXXXXX"
  },
  {
    code: "045",
    name: "새마을금고",
    shortName: "새마을금고",
    accountPattern: /^(9002|9003)/,
    example: "9002-1234-567890",
    format: "XXXX-XXXX-XXXXXX"
  },
  {
    code: "048",
    name: "신협",
    shortName: "신협",
    accountPattern: /^(131|132)/,
    example: "131-123-456789",
    format: "XXX-XXX-XXXXXX"
  },
  {
    code: "092",
    name: "토스뱅크",
    shortName: "토스뱅크",
    accountPattern: /^(1000|2000)/,
    example: "1000-1234-5678",
    format: "XXXX-XXXX-XXXX"
  }
];

// 계좌번호로 은행 감지 (3-4자리로 판단)
export function detectBankFromAccount(accountNumber: string | null | undefined): BankInfo | null {
  // null이나 undefined 체크
  if (!accountNumber) {
    return null;
  }

  // 하이픈 제거하고 숫자만 추출
  const cleaned = accountNumber.replace(/[^0-9]/g, '');

  // 숫자가 없으면 null 반환
  if (!cleaned) {
    return null;
  }

  for (const bank of KOREAN_BANKS) {
    if (bank.accountPattern.test(cleaned)) {
      return bank;
    }
  }

  return null;
}

// 은행 선택을 위한 옵션 생성
export function getBankOptions(): Array<{ label: string; value: string; bank: BankInfo }> {
  return KOREAN_BANKS.map(bank => ({
    label: `${bank.name} (${bank.shortName})`,
    value: bank.code,
    bank: bank
  }));
}

// 계좌번호 포맷팅 (은행별 형식 적용)
export function formatAccountNumber(accountNumber: string | null | undefined, bankCode?: string): string {
  // null이나 undefined 체크
  if (!accountNumber) {
    return '';
  }

  // 숫자만 추출
  const numbers = accountNumber.replace(/[^0-9]/g, '');

  // 은행 코드가 있으면 해당 은행의 포맷 사용
  if (bankCode) {
    const bank = KOREAN_BANKS.find(b => b.code === bankCode);
    if (bank && bank.format) {
      return formatByPattern(numbers, bank.format);
    }
  }

  // 은행 감지
  const bank = detectBankFromAccount(numbers);
  if (bank && bank.format) {
    return formatByPattern(numbers, bank.format);
  }

  // 기본 포맷팅 (3-4-4)
  if (numbers.length >= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  } else if (numbers.length >= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}`;
  } else if (numbers.length >= 3) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  }

  return numbers;
}

// 패턴에 따라 포맷팅
function formatByPattern(numbers: string, pattern: string): string {
  let result = '';
  let numberIndex = 0;

  for (let i = 0; i < pattern.length && numberIndex < numbers.length; i++) {
    if (pattern[i] === 'X') {
      result += numbers[numberIndex];
      numberIndex++;
    } else {
      result += pattern[i];
    }
  }

  return result;
}

// 전화번호 포맷팅 함수 (자릿수별 자동 - 추가)
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");

  if (cleaned.length === 11) {
    // 010-1234-5678
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 7)}-${cleaned.substring(7)}`;
  } else if (cleaned.length === 10) {
    // 02-123-4567
    return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 5)}-${cleaned.substring(5)}`;
  } else if (cleaned.length === 9) {
    // 031-123-456
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }

  return cleaned;
}

// 전화번호 입력 시 - 무관하게 처리
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

// 숫자 포맷팅 함수 (콤마 추가)
export function formatNumber(num: number): string {
  return num.toLocaleString("ko-KR");
}
