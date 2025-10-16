// 한국 은행별 계좌번호 형식 및 감지
export interface BankInfo {
  code: string;
  name: string;
  shortName: string;
  accountPattern: RegExp;
  example: string;
}

// 출처: https://tech-journal.tistory.com/entry/%EC%96%B4%EB%8A%90-%EC%9D%80%ED%96%89%EC%9D%B4%EC%95%BC-%EC%9D%80%ED%96%89%EB%B3%84-%EA%B3%84%EC%A2%8C%EB%B2%88%ED%98%B8-%EC%BD%94%EB%93%9C
export const KOREAN_BANKS: BankInfo[] = [
  {
    code: "004",
    name: "KB국민은행",
    shortName: "KB국민",
    accountPattern: /^(110|920)-/,
    example: "110-1234-5678"
  },
  {
    code: "088",
    name: "신한은행",
    shortName: "신한",
    accountPattern: /^(110|140)-/,
    example: "110-123-456789"
  },
  {
    code: "081",
    name: "하나은행",
    shortName: "하나",
    accountPattern: /^(620|910)-/,
    example: "620-123456-789"
  },
  {
    code: "020",
    name: "우리은행",
    shortName: "우리",
    accountPattern: /^1002-/,
    example: "1002-123-456789"
  },
  {
    code: "011",
    name: "NH농협은행",
    shortName: "농협",
    accountPattern: /^(301|302|303|351|352|353)-/,
    example: "301-1234-567890"
  },
  {
    code: "003",
    name: "IBK기업은행",
    shortName: "IBK기업",
    accountPattern: /^(031|041|051|061)-/,
    example: "031-1234-567890"
  },
  {
    code: "023",
    name: "SC제일은행",
    shortName: "SC제일",
    accountPattern: /^(333|355)-/,
    example: "333-12345678"
  },
  {
    code: "089",
    name: "케이뱅크",
    shortName: "케이뱅크",
    accountPattern: /^100-/,
    example: "100-1234-567890"
  },
  {
    code: "090",
    name: "카카오뱅크",
    shortName: "카카오뱅크",
    accountPattern: /^(3333|7979)-/,
    example: "3333-12-3456789"
  },
  {
    code: "027",
    name: "한국씨티은행",
    shortName: "씨티",
    accountPattern: /^(032|362)-/,
    example: "032-1234-5678"
  },
  {
    code: "032",
    name: "부산은행",
    shortName: "부산",
    accountPattern: /^(101|121|131)-/,
    example: "101-1234-567890"
  },
  {
    code: "031",
    name: "대구은행",
    shortName: "대구",
    accountPattern: /^(505|506)-/,
    example: "505-12-345678"
  },
  {
    code: "034",
    name: "광주은행",
    shortName: "광주",
    accountPattern: /^(600|601)-/,
    example: "600-123-456789"
  },
  {
    code: "037",
    name: "전북은행",
    shortName: "전북",
    accountPattern: /^(123|126)-/,
    example: "123-1234-567890"
  },
  {
    code: "039",
    name: "경남은행",
    shortName: "경남",
    accountPattern: /^(507|508)-/,
    example: "507-12-345678"
  },
  {
    code: "035",
    name: "제주은행",
    shortName: "제주",
    accountPattern: /^(401|402)-/,
    example: "401-12-345678"
  },
  {
    code: "071",
    name: "우체국",
    shortName: "우체국",
    accountPattern: /^(01|12)-/,
    example: "012345-01-123456"
  },
  {
    code: "002",
    name: "산업은행",
    shortName: "산업",
    accountPattern: /^(01|02)-/,
    example: "01-1234-5678"
  },
  {
    code: "007",
    name: "수협은행",
    shortName: "수협",
    accountPattern: /^(001|002)-/,
    example: "001-12-123456"
  },
  {
    code: "045",
    name: "새마을금고",
    shortName: "새마을금고",
    accountPattern: /^(9002|9003)-/,
    example: "9002-1234-567890"
  },
  {
    code: "048",
    name: "신협",
    shortName: "신협",
    accountPattern: /^(131|132)-/,
    example: "131-123-456789"
  },
  {
    code: "092",
    name: "토스뱅크",
    shortName: "토스뱅크",
    accountPattern: /^(1000|2000)-/,
    example: "1000-1234-5678"
  }
];

// 계좌번호로 은행 감지
export function detectBankFromAccount(accountNumber: string): BankInfo | null {
  console.log('🔍 은행 감지 시도:', accountNumber);

  // 각 은행의 패턴으로 확인
  for (const bank of KOREAN_BANKS) {
    const isMatch = bank.accountPattern.test(accountNumber);
    console.log(`  ${bank.shortName}: ${isMatch ? '✅' : '❌'}`);

    if (isMatch) {
      console.log('✅ 은행 감지 성공:', bank.name);
      return bank;
    }
  }

  console.log('❌ 은행 감지 실패');
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

// 계좌번호 포맷팅
export function formatAccountNumber(accountNumber: string): string {
  // 하이픈이 이미 있으면 그대로 반환
  if (accountNumber.includes('-')) {
    return accountNumber;
  }

  // 숫자만 추출
  const numbers = accountNumber.replace(/[^0-9]/g, '');

  // 3-2-6-2 형식으로 포맷팅
  if (numbers.length >= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 11)}-${numbers.slice(11, 13)}`;
  } else if (numbers.length >= 9) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 9)}`;
  } else if (numbers.length >= 6) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}`;
  }

  return accountNumber;
}
