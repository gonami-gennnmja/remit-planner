import AsyncStorage from '@react-native-async-storage/async-storage';

// 사용자 인터페이스
export interface User {
  id: string;
  password: string;
  name: string;
  email?: string;
  nickname?: string;
  businessInfo?: {
    businessName: string;
    businessNumber: string;
    businessAddress: string;
    businessPhone: string;
    businessEmail: string;
  };
  settings?: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: 'ko' | 'en';
  };
}

// 기본 관리자 계정
const DEFAULT_ADMIN: User = {
  id: 'admin',
  password: '1234',
  name: '관리자',
  email: 'admin@remit-planner.com',
  nickname: '관리자',
  businessInfo: {
    businessName: '리밋 플래너',
    businessNumber: '123-45-67890',
    businessAddress: '서울시 강남구 테헤란로 123',
    businessPhone: '02-1234-5678',
    businessEmail: 'business@remit-planner.com',
  },
  settings: {
    notifications: true,
    theme: 'light',
    language: 'ko',
  },
};

const USERS_STORAGE_KEY = '@remit-planner:users';
const CURRENT_USER_KEY = '@remit-planner:current_user';

// 사용자 데이터베이스 초기화
export async function initializeAuthDB(): Promise<void> {
  try {
    const usersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    if (!usersData) {
      // 관리자 계정 생성
      await AsyncStorage.setItem(
        USERS_STORAGE_KEY,
        JSON.stringify([DEFAULT_ADMIN])
      );
      console.log('✅ 관리자 계정 생성 완료');
    }
  } catch (error) {
    console.error('❌ Auth DB 초기화 실패:', error);
  }
}

// 로그인 함수
export async function login(
  id: string,
  password: string
): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    console.log('🔐 로그인 시도:', { id, passwordLength: password.length });

    // 입력값 검증
    if (!id || !password) {
      return { success: false, message: '아이디와 비밀번호를 입력해주세요.' };
    }

    const usersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    console.log('📦 사용자 데이터 조회:', usersData ? '존재' : '없음');

    if (!usersData) {
      return { success: false, message: '사용자 데이터를 찾을 수 없습니다.' };
    }

    const users: User[] = JSON.parse(usersData);
    console.log('👥 등록된 사용자 수:', users.length);

    const user = users.find((u) => u.id === id && u.password === password);
    console.log('🔍 사용자 검색 결과:', user ? '찾음' : '없음');

    if (user) {
      // 현재 사용자 저장
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      console.log('✅ 로그인 성공:', user.name);
      return { success: true, user };
    } else {
      console.log('❌ 로그인 실패: 잘못된 인증 정보');
      return { success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' };
    }
  } catch (error) {
    console.error('❌ 로그인 실패:', error);
    return { success: false, message: '로그인 중 오류가 발생했습니다.' };
  }
}

// 로그아웃 함수
export async function logout(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    console.log('✅ 로그아웃 완료');
  } catch (error) {
    console.error('❌ 로그아웃 실패:', error);
  }
}

// 현재 로그인된 사용자 가져오기
export async function getCurrentUser(): Promise<User | null> {
  try {
    const userData = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error('❌ 현재 사용자 조회 실패:', error);
    return null;
  }
}

// 로그인 상태 확인
export async function isLoggedIn(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

// 사용자 등록
export async function registerUser(
  id: string,
  password: string,
  name: string,
  email?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const usersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    const users: User[] = usersData ? JSON.parse(usersData) : [];

    // 중복 아이디 체크
    if (users.some((u) => u.id === id)) {
      return { success: false, message: '이미 존재하는 아이디입니다.' };
    }

    // 새 사용자 추가
    const newUser: User = { id, password, name, email };
    users.push(newUser);
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    return { success: true, message: '회원가입이 완료되었습니다.' };
  } catch (error) {
    console.error('❌ 회원가입 실패:', error);
    return { success: false, message: '회원가입 중 오류가 발생했습니다.' };
  }
}

// 사용자 정보 업데이트
export async function updateUser(updatedUser: User): Promise<{ success: boolean; message?: string }> {
  try {
    const usersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    if (!usersData) {
      return { success: false, message: '사용자 데이터를 찾을 수 없습니다.' };
    }

    const users: User[] = JSON.parse(usersData);
    const userIndex = users.findIndex((u) => u.id === updatedUser.id);

    if (userIndex === -1) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }

    // 사용자 정보 업데이트
    users[userIndex] = updatedUser;
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // 현재 사용자 정보도 업데이트
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));

    return { success: true, message: '사용자 정보가 업데이트되었습니다.' };
  } catch (error) {
    console.error('❌ 사용자 정보 업데이트 실패:', error);
    return { success: false, message: '사용자 정보 업데이트 중 오류가 발생했습니다.' };
  }
}

