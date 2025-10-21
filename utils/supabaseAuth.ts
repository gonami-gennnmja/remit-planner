import { supabase } from '@/lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'

// 사용자 인터페이스 (Supabase Auth와 호환)
export interface SupabaseUser {
	id: string
	email: string
	name?: string
	nickname?: string
	businessInfo?: {
		businessName: string
		businessNumber: string
		businessAddress: string
		businessPhone: string
		businessEmail: string
	}
	settings?: {
		notifications: boolean
		theme: 'light' | 'dark' | 'auto'
		language: 'ko' | 'en'
	}
}

const CURRENT_USER_KEY = '@remit-planner:current_user'

// Supabase 에러 메시지 한국어 번역
function translateAuthError(errorMessage: string, errorCode?: string): string {
	// 에러 코드별 번역
	const errorTranslations: { [key: string]: string } = {
		'Invalid login credentials': '아이디 또는 비밀번호가 올바르지 않습니다.',
		'Email not confirmed': '이메일 인증이 필요합니다.',
		'User already registered': '이미 등록된 이메일입니다.',
		'already registered': '이미 등록된 이메일입니다.',
		'already been registered': '이미 등록된 이메일입니다.',
		'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.',
		'Email address is invalid': '유효하지 않은 이메일 주소입니다.',
		'User not found': '사용자를 찾을 수 없습니다.',
		'Signup requires a valid password': '올바른 비밀번호를 입력해주세요.',
		'Email rate limit exceeded': '이메일 전송 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
		'Invalid email or password': '이메일 또는 비밀번호가 올바르지 않습니다.',
		'Email link is invalid or has expired': '이메일 링크가 만료되었거나 유효하지 않습니다.',
		'Token has expired or is invalid': '토큰이 만료되었거나 유효하지 않습니다.',
		'New password should be different from the old password': '새 비밀번호는 기존 비밀번호와 달라야 합니다.',
		'Password is too weak': '비밀번호가 너무 약합니다.',
		'Network request failed': '네트워크 연결을 확인해주세요.',
	}

	// 에러 코드별 번역
	const codeTranslations: { [key: string]: string } = {
		'invalid_credentials': '아이디 또는 비밀번호가 올바르지 않습니다.',
		'email_not_confirmed': '이메일 인증이 필요합니다.',
		'user_already_exists': '이미 등록된 이메일입니다.',
		'email_exists': '이미 등록된 이메일입니다.',
		'weak_password': '비밀번호가 너무 약합니다. 영문과 숫자를 포함하여 6자 이상 입력해주세요.',
		'email_address_invalid': '유효하지 않은 이메일 주소입니다.',
		'user_not_found': '사용자를 찾을 수 없습니다.',
		'over_email_send_rate_limit': '이메일 전송 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.',
		'validation_failed': '입력 정보를 확인해주세요.',
	}

	// 먼저 에러 코드로 번역 시도
	if (errorCode && codeTranslations[errorCode]) {
		return codeTranslations[errorCode]
	}

	// 에러 메시지로 번역 시도
	for (const [key, value] of Object.entries(errorTranslations)) {
		if (errorMessage.includes(key)) {
			return value
		}
	}

	// 번역이 없으면 기본 메시지 반환
	return '로그인 중 오류가 발생했습니다. 다시 시도해주세요.'
}

// Supabase Auth를 사용한 로그인
export async function loginWithSupabase(
	email: string,
	password: string
): Promise<{ success: boolean; user?: SupabaseUser; message?: string }> {
	try {
		console.log('🔐 Supabase 로그인 시도:', { email })

		// Supabase Auth로 로그인
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		})

		if (error) {
			console.log('❌ Supabase 로그인 실패:', error.message)
			const translatedMessage = translateAuthError(error.message, error.code)
			return { success: false, message: translatedMessage }
		}

		if (!data.user) {
			return { success: false, message: '사용자 정보를 찾을 수 없습니다.' }
		}

		// 사용자 정보를 SupabaseUser 형태로 변환
		const user: SupabaseUser = {
			id: data.user.id,
			email: data.user.email || email,
			name: data.user.user_metadata?.name || '사용자',
			nickname: data.user.user_metadata?.nickname,
			businessInfo: data.user.user_metadata?.businessInfo,
			settings: data.user.user_metadata?.settings || {
				notifications: true,
				theme: 'light',
				language: 'ko',
			},
		}

		// 현재 사용자 저장 (로컬 캐시용)
		await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
		console.log('✅ Supabase 로그인 성공:', user.name)

		return { success: true, user }
	} catch (error) {
		console.error('❌ Supabase 로그인 실패:', error)
		return { success: false, message: '로그인 중 오류가 발생했습니다.' }
	}
}

// Supabase Auth를 사용한 회원가입
export async function registerWithSupabase(
	email: string,
	password: string,
	name: string,
	nickname?: string
): Promise<{ success: boolean; message?: string }> {
	try {
		console.log('📝 Supabase 회원가입 시도:', { email, name })

		// Supabase Auth로 회원가입
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					name,
					nickname: nickname || name,
				},
			},
		})

		if (error) {
			console.log('❌ Supabase 회원가입 실패:', error.message)
			const translatedMessage = translateAuthError(error.message, error.code)
			return { success: false, message: translatedMessage }
		}

		if (!data.user) {
			return { success: false, message: '회원가입에 실패했습니다.' }
		}

		console.log('✅ Supabase 회원가입 성공:', name)
		return { success: true, message: '회원가입이 완료되었습니다.' }
	} catch (error) {
		console.error('❌ Supabase 회원가입 실패:', error)
		return { success: false, message: '회원가입 중 오류가 발생했습니다.' }
	}
}

// Supabase Auth 로그아웃
export async function logoutFromSupabase(): Promise<{ success: boolean; message?: string }> {
	try {
		// Supabase Auth 로그아웃
		const { error } = await supabase.auth.signOut()
		if (error) {
			console.error('❌ Supabase 로그아웃 실패:', error)
			const translatedMessage = translateAuthError(error.message, error.code)
			return { success: false, message: translatedMessage }
		}

		// 로컬 캐시 삭제
		await AsyncStorage.removeItem(CURRENT_USER_KEY)
		console.log('✅ Supabase 로그아웃 완료')
		return { success: true }
	} catch (error) {
		console.error('❌ Supabase 로그아웃 실패:', error)
		return { success: false, message: '로그아웃 중 오류가 발생했습니다.' }
	}
}

// 현재 로그인된 사용자 가져오기 (Supabase Auth + 로컬 캐시)
export async function getCurrentSupabaseUser(): Promise<SupabaseUser | null> {
	try {
		// 먼저 로컬 캐시에서 확인
		const cachedUser = await AsyncStorage.getItem(CURRENT_USER_KEY)
		if (cachedUser) {
			const user = JSON.parse(cachedUser)

			// Supabase Auth 세션 확인
			const { data: { session } } = await supabase.auth.getSession()
			if (session && session.user.id === user.id) {
				return user
			}
		}

		// 로컬 캐시가 없거나 세션이 만료된 경우, Supabase에서 확인
		const { data: { session } } = await supabase.auth.getSession()
		if (session?.user) {
			const user: SupabaseUser = {
				id: session.user.id,
				email: session.user.email || '',
				name: session.user.user_metadata?.name || '사용자',
				nickname: session.user.user_metadata?.nickname,
				businessInfo: session.user.user_metadata?.businessInfo,
				settings: session.user.user_metadata?.settings || {
					notifications: true,
					theme: 'light',
					language: 'ko',
				},
			}

			// 로컬 캐시 업데이트
			await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
			return user
		}

		return null
	} catch (error) {
		console.error('❌ 현재 사용자 조회 실패:', error)
		return null
	}
}

// 로그인 상태 확인 (Supabase Auth)
export async function isSupabaseLoggedIn(): Promise<boolean> {
	try {
		const { data: { session } } = await supabase.auth.getSession()
		return !!session?.user
	} catch (error) {
		console.error('❌ 로그인 상태 확인 실패:', error)
		return false
	}
}

// 사용자 정보 업데이트 (Supabase Auth)
export async function updateSupabaseUser(updatedUser: SupabaseUser): Promise<{ success: boolean; message?: string }> {
	try {
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			return { success: false, message: '로그인이 필요합니다.' }
		}

		// Supabase Auth 사용자 메타데이터 업데이트
		const { error } = await supabase.auth.updateUser({
			data: {
				name: updatedUser.name,
				nickname: updatedUser.nickname,
				businessInfo: updatedUser.businessInfo,
				settings: updatedUser.settings,
			},
		})

		if (error) {
			console.error('❌ Supabase 사용자 업데이트 실패:', error)
			const translatedMessage = translateAuthError(error.message, error.code)
			return { success: false, message: translatedMessage }
		}

		// 로컬 캐시 업데이트
		await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser))
		console.log('✅ Supabase 사용자 업데이트 성공')

		return { success: true, message: '사용자 정보가 업데이트되었습니다.' }
	} catch (error) {
		console.error('❌ Supabase 사용자 업데이트 실패:', error)
		return { success: false, message: '사용자 정보 업데이트 중 오류가 발생했습니다.' }
	}
}

// 기존 admin 계정을 Supabase에 등록하는 함수
export async function createAdminAccount(): Promise<{ success: boolean; message?: string }> {
	try {
		console.log('👑 Admin 계정 생성 시도...')

		const result = await registerWithSupabase(
			'admin@remit-planner.com',
			'123456',
			'관리자',
			'관리자'
		)

		if (result.success) {
			console.log('✅ Admin 계정 생성 완료')
			return { success: true, message: 'Admin 계정이 생성되었습니다.' }
		} else {
			console.log('❌ Admin 계정 생성 실패:', result.message)
			return result
		}
	} catch (error) {
		console.error('❌ Admin 계정 생성 실패:', error)
		return { success: false, message: 'Admin 계정 생성 중 오류가 발생했습니다.' }
	}
}

// Auth 상태 변경 리스너
export function onAuthStateChange(callback: (user: SupabaseUser | null) => void) {
	return supabase.auth.onAuthStateChange(async (event, session) => {
		console.log('🔄 Auth 상태 변경:', event, session?.user?.id)

		if (session?.user) {
			const user: SupabaseUser = {
				id: session.user.id,
				email: session.user.email || '',
				name: session.user.user_metadata?.name || '사용자',
				nickname: session.user.user_metadata?.nickname,
				businessInfo: session.user.user_metadata?.businessInfo,
				settings: session.user.user_metadata?.settings || {
					notifications: true,
					theme: 'light',
					language: 'ko',
				},
			}

			// 로컬 캐시 업데이트
			await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
			callback(user)
		} else {
			// 로컬 캐시 삭제
			await AsyncStorage.removeItem(CURRENT_USER_KEY)
			callback(null)
		}
	})
}
