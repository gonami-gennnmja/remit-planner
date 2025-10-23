import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// Supabase 설정
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey || 'YOUR_SUPABASE_ANON_KEY'

// 디버깅용 로그
console.log('🔧 Supabase 설정 확인:')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT_SET')

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 타입 정의
export interface Worker {
	id: string
	name: string
	phone: string
	bank_account: string
	hourly_wage: number
	tax_withheld: boolean
	memo?: string
	work_start_date?: string
	work_end_date?: string
	work_hours?: number
	work_minutes?: number
	is_full_period_work?: boolean
	is_same_work_hours_daily?: boolean
	daily_work_times?: any[]
	default_start_time?: string
	default_end_time?: string
	created_at?: string
	updated_at?: string
}

export interface Schedule {
	id: string
	title: string
	start_date: string
	end_date: string
	description?: string
	category?: string
	address?: string
	memo?: string
	created_at?: string
	updated_at?: string
}

export interface ScheduleWorker {
	id: string
	schedule_id: string
	worker_id: string
	paid: boolean
	work_hours?: number
	created_at?: string
	updated_at?: string
}

export interface WorkPeriod {
	id: string
	schedule_worker_id: string
	start_time: string
	end_time: string
	created_at?: string
	updated_at?: string
}

export interface Activity {
	id: string
	type: string
	title: string
	description?: string
	related_id?: string
	icon?: string
	color?: string
	created_at?: string
}
