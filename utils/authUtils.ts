import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCurrentSupabaseUser,
  isSupabaseLoggedIn,
  loginWithSupabase,
  logoutFromSupabase,
  onAuthStateChange as onSupabaseAuthStateChange,
  registerWithSupabase,
  SupabaseUser,
  updateSupabaseUser
} from './supabaseAuth';

// 기존 User 인터페이스는 SupabaseUser로 대체
export type User = SupabaseUser;

// 기본 관리자 계정 (호환성을 위해 유지)
const DEFAULT_ADMIN: User = {
  id: 'admin',
  email: 'admin@banban-halfhalf.com',
  name: '관리자',
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

// 사용자 데이터베이스 초기화 (Supabase Auth로 마이그레이션)
export async function initializeAuthDB(): Promise<void> {
  try {
    // 기존 AsyncStorage 데이터가 있으면 백업
    const usersData = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    if (usersData) {
      await AsyncStorage.setItem(
        '@remit-planner:users_backup',
        usersData
      );
    }
  } catch (error) {
    console.error('❌ Auth DB 초기화 실패:', error);
  }
}

// 로그인 함수 (Supabase Auth로 마이그레이션)
export async function login(
  id: string,
  password: string
): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    // 입력값 검증
    if (!id || !password) {
      return { success: false, message: '아이디와 비밀번호를 입력해주세요.' };
    }

    // id가 이메일 형태인지 확인하고, 아니면 이메일로 변환
    const email = id.includes('@') ? id : `${id}@remit-planner.com`;

    // Supabase Auth로 로그인 시도
    const result = await loginWithSupabase(email, password);

    if (result.success && result.user) {
      return { success: true, user: result.user };
    } else {
      return { success: false, message: result.message || '아이디 또는 비밀번호가 올바르지 않습니다.' };
    }
  } catch (error) {
    console.error('❌ 로그인 실패:', error);
    return { success: false, message: '로그인 중 오류가 발생했습니다.' };
  }
}

// 로그아웃 함수 (Supabase Auth로 마이그레이션)
export async function logout(): Promise<void> {
  try {
    await logoutFromSupabase();
  } catch (error) {
    console.error('❌ 로그아웃 실패:', error);
  }
}

// 현재 로그인된 사용자 가져오기 (Supabase Auth로 마이그레이션)
export async function getCurrentUser(): Promise<User | null> {
  try {
    return await getCurrentSupabaseUser();
  } catch (error) {
    console.error('❌ 현재 사용자 조회 실패:', error);
    return null;
  }
}

// 로그인 상태 확인 (Supabase Auth로 마이그레이션)
export async function isLoggedIn(): Promise<boolean> {
  try {
    return await isSupabaseLoggedIn();
  } catch (error) {
    console.error('❌ 로그인 상태 확인 실패:', error);
    return false;
  }
}

// 사용자 등록 (Supabase Auth로 마이그레이션)
export async function registerUser(
  id: string,
  password: string,
  name: string,
  email?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    // id가 이메일 형태인지 확인하고, 아니면 이메일로 변환
    const userEmail = email || (id.includes('@') ? id : `${id}@remit-planner.com`);

    // Supabase Auth로 회원가입 시도
    const result = await registerWithSupabase(userEmail, password, name, name);

    if (result.success) {
      return { success: true, message: result.message || '회원가입이 완료되었습니다.' };
    } else {
      return { success: false, message: result.message || '회원가입 중 오류가 발생했습니다.' };
    }
  } catch (error) {
    console.error('❌ 회원가입 실패:', error);
    return { success: false, message: '회원가입 중 오류가 발생했습니다.' };
  }
}

// 사용자 정보 업데이트 (Supabase Auth로 마이그레이션)
export async function updateUser(updatedUser: User): Promise<{ success: boolean; message?: string }> {
  try {
    // Supabase Auth로 사용자 정보 업데이트
    const result = await updateSupabaseUser(updatedUser);

    if (result.success) {
      return { success: true, message: result.message || '사용자 정보가 업데이트되었습니다.' };
    } else {
      return { success: false, message: result.message || '사용자 정보 업데이트 중 오류가 발생했습니다.' };
    }
  } catch (error) {
    console.error('❌ 사용자 정보 업데이트 실패:', error);
    return { success: false, message: '사용자 정보 업데이트 중 오류가 발생했습니다.' };
  }
}

// Auth 상태 변경 리스너 (Supabase Auth)
export function onAuthStateChange(callback: (user: User | null) => void) {
  return onSupabaseAuthStateChange(callback);
}

