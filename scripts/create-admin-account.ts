#!/usr/bin/env ts-node

/**
 * Admin 계정을 Supabase에 생성하는 스크립트
 * 
 * 사용법:
 * 1. .env 파일에 Supabase URL과 ANON KEY를 설정
 * 2. npm run create-admin-account
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// .env 파일 로드
dotenv.config()

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
	console.error('❌ 환경 변수가 설정되지 않았습니다.')
	console.error('다음 환경 변수를 설정해주세요:')
	console.error('- EXPO_PUBLIC_SUPABASE_URL')
	console.error('- EXPO_PUBLIC_SUPABASE_ANON_KEY')
	process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAdminAccount() {
	try {
		console.log('👑 Admin 계정 생성 중...')

		const { data, error } = await supabase.auth.signUp({
			email: 'admin@banban-halfhalf.com',
			password: '123456',
			options: {
				data: {
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
				},
			},
		})

		if (error) {
			if (error.message.includes('User already registered')) {
				console.log('ℹ️ Admin 계정이 이미 존재합니다.')
				console.log('이메일: admin@banban-halfhalf.com')
				console.log('비밀번호: 123456')
				return
			}
			throw error
		}

		if (data.user) {
			console.log('✅ Admin 계정이 성공적으로 생성되었습니다!')
			console.log('이메일: admin@banban-halfhalf.com')
			console.log('비밀번호: 123456')
			console.log('사용자 ID:', data.user.id)

			if (data.user.email_confirmed_at === null) {
				console.log('⚠️ 이메일 확인이 필요할 수 있습니다.')
			}
		} else {
			console.log('❌ Admin 계정 생성에 실패했습니다.')
		}
	} catch (error) {
		console.error('❌ Admin 계정 생성 중 오류 발생:', error)
	}
}

// 스크립트 실행
createAdminAccount()
	.then(() => {
		console.log('🏁 스크립트 완료')
		process.exit(0)
	})
	.catch((error) => {
		console.error('💥 스크립트 실패:', error)
		process.exit(1)
	})
