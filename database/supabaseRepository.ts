import { supabase } from '@/lib/supabase'
import { PayrollCalculation, ScheduleTime, WorkPeriod } from '@/models/types'
import { IDatabase } from './interface'

// React Native용 UUID 생성 함수
function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = Math.random() * 16 | 0
		const v = c === 'x' ? r : (r & 0x3 | 0x8)
		return v.toString(16)
	})
}

export class SupabaseRepository implements IDatabase {
	createScheduleTime(scheduleTime: ScheduleTime): Promise<string> {
		throw new Error('Method not implemented.')
	}
	getScheduleTimes(scheduleId: string): Promise<ScheduleTime[]> {
		throw new Error('Method not implemented.')
	}
	updateScheduleTime(id: string, scheduleTime: Partial<ScheduleTime>): Promise<void> {
		throw new Error('Method not implemented.')
	}
	deleteScheduleTime(id: string): Promise<void> {
		throw new Error('Method not implemented.')
	}
	updateWorkPeriod(id: string, workPeriod: Partial<WorkPeriod>): Promise<void> {
		throw new Error('Method not implemented.')
	}
	deleteWorkPeriod(id: string): Promise<void> {
		throw new Error('Method not implemented.')
	}
	createPayrollCalculation(payroll: PayrollCalculation): Promise<string> {
		throw new Error('Method not implemented.')
	}
	getPayrollCalculations(scheduleWorkerId: string): Promise<PayrollCalculation[]> {
		throw new Error('Method not implemented.')
	}
	updatePayrollCalculation(id: string, payroll: Partial<PayrollCalculation>): Promise<void> {
		throw new Error('Method not implemented.')
	}
	deletePayrollCalculation(id: string): Promise<void> {
		throw new Error('Method not implemented.')
	}
	deleteUserProfile(userId: string): Promise<void> {
		throw new Error('Method not implemented.')
	}
	async init(): Promise<void> {
		// Supabase 연결 테스트
		const { data, error } = await supabase.from('workers').select('count').limit(1)
		if (error) {
			console.error('Supabase connection error:', error)
			throw new Error('Failed to connect to Supabase')
		}
	}

	// 사용자 인증 헬퍼 함수
	private async getCurrentUser() {
		const { data: { user }, error } = await supabase.auth.getUser()
		if (!user) {
			console.error('❌ User not authenticated')
			throw new Error('User not authenticated')
		}
		return user
	}

	// Worker operations
	async createWorker(worker: any): Promise<string> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('workers')
			.insert([{
				id: worker.id,
				user_id: user.id,
				name: worker.name,
				phone: worker.phone,
				resident_number: worker.residentNumber,
				bank_account: worker.bankAccount,
				hourly_wage: worker.hourlyWage,
				fuel_allowance: worker.fuelAllowance || 0,
				other_allowance: worker.otherAllowance || 0,
				id_card_image_url: worker.idCardImageUrl,
				id_card_image_path: worker.idCardImagePath,
				memo: worker.memo,
			}])
			.select()

		if (error) {
			console.error('Error creating worker:', error)
			throw error
		}

		return data[0].id
	}

	async getWorker(id: string): Promise<any> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('workers')
			.select('*')
			.eq('id', id)
			.eq('user_id', user.id)
			.single()

		if (error) {
			console.error('Error getting worker:', error)
			return null
		}

		return this.transformWorkerFromDB(data)
	}

	async getAllWorkers(): Promise<any[]> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('workers')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Error getting workers:', error)
			return []
		}

		return data.map(worker => this.transformWorkerFromDB(worker))
	}

	async updateWorker(id: string, worker: any): Promise<void> {
		const user = await this.getCurrentUser()

		const { error } = await supabase
			.from('workers')
			.update({
				name: worker.name,
				phone: worker.phone,
				bank_account: worker.bankAccount,
				hourly_wage: worker.hourlyWage,
				tax_withheld: worker.taxWithheld,
				memo: worker.memo,
				work_start_date: worker.workStartDate,
				work_end_date: worker.workEndDate,
				work_hours: worker.workHours,
				work_minutes: worker.workMinutes,
				is_full_period_work: worker.isFullPeriodWork,
				is_same_work_hours_daily: worker.isSameWorkHoursDaily,
				daily_work_times: worker.dailyWorkTimes,
				default_start_time: worker.defaultStartTime,
				default_end_time: worker.defaultEndTime,
			})
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error updating worker:', error)
			throw error
		}
	}

	async deleteWorker(id: string): Promise<void> {
		const user = await this.getCurrentUser()

		const { error } = await supabase
			.from('workers')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error deleting worker:', error)
			throw error
		}
	}

	// Schedule operations
	async createSchedule(schedule: any): Promise<string> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('schedules')
			.insert([{
				id: schedule.id,
				user_id: user.id,
				title: schedule.title,
				description: schedule.description,
				start_date: schedule.startDate,
				end_date: schedule.endDate,
				category: schedule.category,
				location: schedule.location,
				address: schedule.address,
				uniform_time: schedule.uniformTime !== undefined ? schedule.uniformTime : true,
				documents_folder_path: schedule.documentsFolderPath,
				has_attachments: schedule.hasAttachments || false,
				memo: schedule.memo,
			}])
			.select()

		if (error) {
			console.error('Error creating schedule:', error)
			throw error
		}

		return data[0].id
	}

	async getSchedule(id: string): Promise<any> {
		const user = await this.getCurrentUser()

		const { data: schedule, error: scheduleError } = await supabase
			.from('schedules')
			.select('*')
			.eq('id', id)
			.eq('user_id', user.id)
			.single()

		if (scheduleError) {
			console.error('Error getting schedule:', scheduleError)
			return null
		}

		const workers = await this.getScheduleWorkers(id)
		return {
			...this.transformScheduleFromDB(schedule),
			workers
		}
	}

	async getAllSchedules(): Promise<any[]> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('schedules')
			.select('*')
			.eq('user_id', user.id)
			.order('start_date', { ascending: false })

		if (error) {
			console.error('Error getting all schedules:', error)
			return []
		}

		const result = []
		for (const schedule of data) {
			const workers = await this.getScheduleWorkers(schedule.id)
			result.push({
				...this.transformScheduleFromDB(schedule),
				workers
			})
		}

		return result
	}

	async getSchedulesByDate(date: string): Promise<any[]> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('schedules')
			.select('*')
			.eq('start_date', date)
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Error getting schedules by date:', error)
			return []
		}

		const result = []
		for (const schedule of data) {
			const workers = await this.getScheduleWorkers(schedule.id)
			result.push({
				...this.transformScheduleFromDB(schedule),
				workers
			})
		}

		return result
	}

	async getSchedulesByDateRange(startDate: string, endDate: string): Promise<any[]> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('schedules')
			.select('*')
			.gte('start_date', startDate)
			.lte('end_date', endDate)
			.eq('user_id', user.id)
			.order('start_date', { ascending: true })

		if (error) {
			console.error('Error getting schedules by date range:', error)
			return []
		}

		const result = []
		for (const schedule of data) {
			const workers = await this.getScheduleWorkers(schedule.id)
			result.push({
				...this.transformScheduleFromDB(schedule),
				workers
			})
		}

		return result
	}

	async updateSchedule(id: string, schedule: any): Promise<void> {
		const user = await this.getCurrentUser()

		const { error } = await supabase
			.from('schedules')
			.update({
				title: schedule.title,
				start_date: schedule.startDate,
				end_date: schedule.endDate,
				description: schedule.description,
				category: schedule.category,
				address: schedule.address,
				memo: schedule.memo,
			})
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error updating schedule:', error)
			throw error
		}
	}

	async deleteSchedule(id: string): Promise<void> {
		const user = await this.getCurrentUser()

		const { error } = await supabase
			.from('schedules')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error deleting schedule:', error)
			throw error
		}
	}

	// Schedule-Worker relationships
	async addWorkerToSchedule(scheduleId: string, workerId: string, periods: any[], paid: boolean = false, workHours?: number): Promise<string> {
		const user = await this.getCurrentUser()
		const scheduleWorkerId = `sw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

		const { error: scheduleWorkerError } = await supabase
			.from('schedule_workers')
			.insert([{
				id: scheduleWorkerId,
				user_id: user.id,
				schedule_id: scheduleId,
				worker_id: workerId,
				paid,
				work_hours: workHours
			}])

		if (scheduleWorkerError) {
			console.error('Error adding worker to schedule:', scheduleWorkerError)
			throw scheduleWorkerError
		}

		// 근무 기간 추가
		if (periods && periods.length > 0) {
			const workPeriods = periods.map(period => ({
				id: period.id || `wp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				user_id: user.id,
				schedule_worker_id: scheduleWorkerId,
				start_time: period.start,
				end_time: period.end
			}))

			const { error: periodsError } = await supabase
				.from('work_periods')
				.insert(workPeriods)

			if (periodsError) {
				console.error('Error adding work periods:', periodsError)
				throw periodsError
			}
		}

		return scheduleWorkerId
	}

	async getScheduleWorkers(scheduleId: string): Promise<any[]> {
		const user = await this.getCurrentUser()

		const { data: scheduleWorkers, error } = await supabase
			.from('schedule_workers')
			.select(`
        *,
        workers (*)
      `)
			.eq('schedule_id', scheduleId)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error getting schedule workers:', error)
			return []
		}

		const result = []
		for (const sw of scheduleWorkers) {
			const { data: periods } = await supabase
				.from('work_periods')
				.select('*')
				.eq('schedule_worker_id', sw.id)

			result.push({
				worker: this.transformWorkerFromDB(sw.workers),
				periods: periods?.map(p => ({
					id: p.id,
					start: `${p.work_date}T${p.start_time}+09:00`,
					end: `${p.work_date}T${p.end_time}+09:00`
				})) || [],
				paid: sw.wage_paid || false
			})
		}

		return result
	}

	async updateScheduleWorkerPaidStatus(scheduleId: string, workerId: string, paid: boolean): Promise<void> {
		const { error } = await supabase
			.from('schedule_workers')
			.update({ wage_paid: paid })
			.eq('schedule_id', scheduleId)
			.eq('worker_id', workerId)

		if (error) {
			console.error('Error updating paid status:', error)
			throw error
		}
	}

	async updateScheduleWorkerHours(scheduleId: string, workerId: string, hours: number): Promise<void> {
		const { error } = await supabase
			.from('schedule_workers')
			.update({ work_hours: hours })
			.eq('schedule_id', scheduleId)
			.eq('worker_id', workerId)

		if (error) {
			console.error('Error updating work hours:', error)
			throw error
		}
	}

	async removeWorkerFromSchedule(scheduleId: string, workerId: string): Promise<void> {
		// 먼저 관련된 work_periods 삭제
		const { data: scheduleWorkers } = await supabase
			.from('schedule_workers')
			.select('id')
			.eq('schedule_id', scheduleId)
			.eq('worker_id', workerId)

		if (scheduleWorkers && scheduleWorkers.length > 0) {
			await supabase
				.from('work_periods')
				.delete()
				.eq('schedule_worker_id', scheduleWorkers[0].id)
		}

		// schedule_workers 삭제
		const { error } = await supabase
			.from('schedule_workers')
			.delete()
			.eq('schedule_id', scheduleId)
			.eq('worker_id', workerId)

		if (error) {
			console.error('Error removing worker from schedule:', error)
			throw error
		}
	}

	async updateWorkerTaxWithheld(workerId: string, taxWithheld: boolean): Promise<void> {
		await this.updateWorker(workerId, { taxWithheld })
	}

	async clearAllData(): Promise<void> {
		// 모든 테이블 데이터 삭제 (외래키 제약조건으로 인해 순서 중요)
		await supabase.from('work_periods').delete().neq('id', '')
		await supabase.from('schedule_workers').delete().neq('id', '')
		await supabase.from('schedules').delete().neq('id', '')
		await supabase.from('workers').delete().neq('id', '')
		await supabase.from('activities').delete().neq('id', '')
	}

	// Activity operations
	async createActivity(activity: {
		id: string;
		type: string;
		title: string;
		description?: string;
		related_id?: string;
		icon?: string;
		color?: string;
	}): Promise<string> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('activities')
			.insert([{
				id: activity.id,
				user_id: user.id,
				type: activity.type,
				title: activity.title,
				description: activity.description,
				related_id: activity.related_id,
				icon: activity.icon,
				color: activity.color,
			}])
			.select()

		if (error) {
			console.error('Error creating activity:', error)
			throw error
		}

		return data[0].id
	}


	async clearOldActivities(daysToKeep: number = 30): Promise<void> {
		const cutoffDate = new Date()
		cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

		const { error } = await supabase
			.from('activities')
			.delete()
			.lt('created_at', cutoffDate.toISOString())

		if (error) {
			console.error('Error clearing old activities:', error)
			throw error
		}
	}

	// ==================== Client Operations ====================

	async createClient(client: any): Promise<string> {
		const user = await this.getCurrentUser()

		// 1. 거래처 생성
		const { data: clientData, error: clientError } = await supabase
			.from('clients')
			.insert([{
				id: client.id,
				user_id: user.id,
				name: client.name,
				phone: client.phone,
				email: client.email,
				address: client.address,
				business_number: client.businessNumber,
				memo: client.memo,
				total_revenue: client.totalRevenue || 0,
				unpaid_amount: client.unpaidAmount || 0,
			}])
			.select()

		if (clientError) {
			console.error('Error creating client:', clientError)
			throw clientError
		}

		// 2. 담당자들 생성
		if (client.contacts && client.contacts.length > 0) {
			const contactsToInsert = client.contacts.map((contact: any) => ({
				id: contact.id,
				client_id: client.id,
				name: contact.name,
				position: contact.position,
				phone: contact.phone,
				memo: contact.memo,
				is_primary: contact.isPrimary ? 1 : 0,
			}))

			const { error: contactsError } = await supabase
				.from('client_contacts')
				.insert(contactsToInsert)

			if (contactsError) {
				console.error('Error creating client contacts:', contactsError)
				throw contactsError
			}
		}

		return client.id
	}

	async getClient(id: string): Promise<any> {
		const user = await this.getCurrentUser()

		const { data: client, error: clientError } = await supabase
			.from('clients')
			.select('*')
			.eq('id', id)
			.eq('user_id', user.id)
			.single()

		if (clientError) {
			console.error('Error getting client:', clientError)
			return null
		}

		// 담당자 정보 가져오기
		const { data: contacts, error: contactsError } = await supabase
			.from('client_contacts')
			.select('*')
			.eq('client_id', id)
			.eq('user_id', user.id)
			.order('is_primary', { ascending: false })

		if (contactsError) {
			console.error('Error getting client contacts:', contactsError)
		}

		return {
			id: client.id,
			name: client.name,
			phone: client.phone,
			email: client.email,
			address: client.address,
			businessNumber: client.business_number,
			memo: client.memo,
			totalRevenue: client.total_revenue,
			unpaidAmount: client.unpaid_amount,
			createdAt: client.created_at,
			contacts: (contacts || []).map((c: any) => ({
				id: c.id,
				name: c.name,
				position: c.position,
				phone: c.phone,
				memo: c.memo,
				isPrimary: c.is_primary === 1,
			})),
		}
	}

	async getAllClients(): Promise<any[]> {
		const user = await this.getCurrentUser()

		const { data: clients, error: clientsError } = await supabase
			.from('clients')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })

		if (clientsError) {
			console.error('Error getting clients:', clientsError)
			// 테이블이 존재하지 않는 경우 빈 배열 반환
			if (clientsError.code === 'PGRST205') {
				console.warn('Clients table does not exist in Supabase. Using empty array.');
				return []
			}
			throw clientsError
		}

		const result = []
		for (const client of clients) {
			const clientWithContacts = await this.getClient(client.id)
			result.push(clientWithContacts)
		}

		return result
	}

	async updateClient(id: string, client: any): Promise<void> {
		const user = await this.getCurrentUser()

		// 1. 거래처 정보 업데이트
		const { error: clientError } = await supabase
			.from('clients')
			.update({
				name: client.name,
				phone: client.phone,
				email: client.email,
				address: client.address,
				business_number: client.businessNumber,
				memo: client.memo,
				total_revenue: client.totalRevenue,
				unpaid_amount: client.unpaidAmount,
			})
			.eq('id', id)
			.eq('user_id', user.id)

		if (clientError) {
			console.error('Error updating client:', clientError)
			throw clientError
		}

		// 2. 담당자 정보 업데이트 (기존 삭제 후 재생성)
		if (client.contacts) {
			await supabase.from('client_contacts').delete().eq('client_id', id).eq('user_id', user.id)

			if (client.contacts.length > 0) {
				const contactsToInsert = client.contacts.map((contact: any) => ({
					id: contact.id,
					client_id: id,
					user_id: user.id,
					name: contact.name,
					position: contact.position,
					phone: contact.phone,
					memo: contact.memo,
					is_primary: contact.isPrimary ? 1 : 0,
				}))

				const { error: contactsError } = await supabase
					.from('client_contacts')
					.insert(contactsToInsert)

				if (contactsError) {
					console.error('Error updating client contacts:', contactsError)
					throw contactsError
				}
			}
		}
	}

	async deleteClient(id: string): Promise<void> {
		const user = await this.getCurrentUser()

		const { error } = await supabase
			.from('clients')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error deleting client:', error)
			throw error
		}
	}

	// Category operations
	async createCategory(category: { id: string; name: string; color: string }): Promise<string> {
		// 현재 로그인한 사용자 ID 가져오기
		const { data: { user } } = await supabase.auth.getUser()

		if (!user) {
			throw new Error('User not authenticated')
		}

		const { data, error } = await supabase
			.from('categories')
			.insert([{
				id: category.id,
				name: category.name,
				color: category.color,
				user_id: user.id,
				is_system: false,
			}])
			.select()

		if (error) {
			console.error('Error creating category:', error)
			throw error
		}

		return data[0].id
	}

	async getCategory(id: string): Promise<any> {
		const { data, error } = await supabase
			.from('categories')
			.select('*')
			.eq('id', id)
			.single()

		if (error) {
			console.error('Error getting category:', error)
			return null
		}

		return data
	}

	async getAllCategories(): Promise<any[]> {
		// RLS 정책에 의해 시스템 카테고리 + 현재 사용자의 카테고리만 조회됨
		const { data, error } = await supabase
			.from('categories')
			.select('*')
			.order('is_system', { ascending: false }) // 시스템 카테고리가 먼저
			.order('name')

		if (error) {
			console.error('Error getting categories:', error)
			throw error
		}

		return data || []
	}

	async updateCategory(id: string, category: any): Promise<void> {
		const { error } = await supabase
			.from('categories')
			.update(category)
			.eq('id', id)

		if (error) {
			console.error('Error updating category:', error)
			throw error
		}
	}

	async deleteCategory(id: string): Promise<void> {
		const { error } = await supabase
			.from('categories')
			.delete()
			.eq('id', id)

		if (error) {
			console.error('Error deleting category:', error)
			throw error
		}
	}

	// 데이터 변환 헬퍼 함수들
	private transformWorkerFromDB(dbWorker: any): any {
		return {
			id: dbWorker.id,
			userId: dbWorker.user_id,
			name: dbWorker.name,
			phone: dbWorker.phone,
			residentNumber: dbWorker.resident_number,
			bankAccount: dbWorker.bank_account,
			hourlyWage: dbWorker.hourly_wage,
			fuelAllowance: dbWorker.fuel_allowance || 0,
			otherAllowance: dbWorker.other_allowance || 0,
			idCardImageUrl: dbWorker.id_card_image_url,
			idCardImagePath: dbWorker.id_card_image_path,
			memo: dbWorker.memo,
			createdAt: dbWorker.created_at,
			updatedAt: dbWorker.updated_at,
		}
	}

	private transformScheduleFromDB(dbSchedule: any): any {
		return {
			id: dbSchedule.id,
			userId: dbSchedule.user_id,
			title: dbSchedule.title,
			description: dbSchedule.description,
			startDate: dbSchedule.start_date,
			endDate: dbSchedule.end_date,
			category: dbSchedule.category,
			location: dbSchedule.location,
			address: dbSchedule.address,
			uniformTime: dbSchedule.uniform_time,
			documentsFolderPath: dbSchedule.documents_folder_path,
			hasAttachments: dbSchedule.has_attachments,
			allWagesPaid: dbSchedule.all_wages_paid,
			revenueStatus: dbSchedule.revenue_status,
			revenueDueDate: dbSchedule.revenue_due_date,
			memo: dbSchedule.memo,
			createdAt: dbSchedule.created_at,
			updatedAt: dbSchedule.updated_at,
		}
	}

	// User settings operations
	async getUserSettings(): Promise<{
		themeMode: 'light' | 'dark' | 'auto';
		accentColor: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red' | 'teal' | 'indigo' | 'black';
		language: 'ko' | 'en';
		notificationsEnabled: boolean;
	} | null> {
		// 인증된 사용자 확인
		const { data: { user }, error: authError } = await supabase.auth.getUser()

		if (authError || !user) {
			console.warn('No authenticated user found, returning null settings')
			return null
		}

		const { data, error } = await supabase
			.from('user_settings')
			.select('*')
			.eq('user_id', user.id)
			.single()

		if (error) {
			if (error.code === 'PGRST116') {
				// No settings found, return default values
				return null
			}
			console.error('Error getting user settings:', error)
			throw error
		}

		return {
			themeMode: data.theme_mode,
			accentColor: data.accent_color,
			language: data.language,
			notificationsEnabled: data.notifications_enabled,
		}
	}

	async updateUserSettings(settings: {
		themeMode?: 'light' | 'dark' | 'auto';
		accentColor?: 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'red' | 'teal' | 'indigo' | 'black';
		language?: 'ko' | 'en';
		notificationsEnabled?: boolean;
	}): Promise<void> {
		// 인증된 사용자 확인
		const { data: { user }, error: authError } = await supabase.auth.getUser()

		if (authError || !user) {
			console.warn('No authenticated user found, skipping database save')
			return
		}

		const updateData: any = {
			user_id: user.id
		}

		if (settings.themeMode !== undefined) updateData.theme_mode = settings.themeMode
		if (settings.accentColor !== undefined) updateData.accent_color = settings.accentColor
		if (settings.language !== undefined) updateData.language = settings.language
		if (settings.notificationsEnabled !== undefined) updateData.notifications_enabled = settings.notificationsEnabled

		// 먼저 기존 설정이 있는지 확인
		const { data: existingSettings } = await supabase
			.from('user_settings')
			.select('id')
			.eq('user_id', user.id)
			.single()

		if (existingSettings) {
			// 기존 설정 업데이트
			const { error } = await supabase
				.from('user_settings')
				.update(updateData)
				.eq('user_id', user.id)

			if (error) {
				console.error('Error updating user settings:', error)
				throw error
			}
		} else {
			// 새 설정 생성
			const { error } = await supabase
				.from('user_settings')
				.insert([updateData])

			if (error) {
				console.error('Error creating user settings:', error)
				throw error
			}
		}
	}

	// ==================== Schedule Worker Operations ====================

	async createScheduleWorker(scheduleWorker: any): Promise<string> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('schedule_workers')
			.insert([{
				id: scheduleWorker.id,
				user_id: user.id,
				schedule_id: scheduleWorker.scheduleId,
				worker_id: scheduleWorker.workerId,
				work_start_date: scheduleWorker.workStartDate,
				work_end_date: scheduleWorker.workEndDate,
				uniform_time: scheduleWorker.uniformTime !== undefined ? scheduleWorker.uniformTime : true,
				hourly_wage: scheduleWorker.hourlyWage,
				fuel_allowance: scheduleWorker.fuelAllowance || 0,
				other_allowance: scheduleWorker.otherAllowance || 0,
				overtime_enabled: scheduleWorker.overtimeEnabled !== undefined ? scheduleWorker.overtimeEnabled : true,
				night_shift_enabled: scheduleWorker.nightShiftEnabled !== undefined ? scheduleWorker.nightShiftEnabled : true,
				tax_withheld: scheduleWorker.taxWithheld !== undefined ? scheduleWorker.taxWithheld : true,
				wage_paid: scheduleWorker.wagePaid || false,
				fuel_paid: scheduleWorker.fuelPaid || false,
				other_paid: scheduleWorker.otherPaid || false,
			}])
			.select()

		if (error) {
			console.error('Error creating schedule worker:', error)
			throw error
		}

		return data[0].id
	}


	async updateScheduleWorker(id: string, scheduleWorker: any): Promise<void> {
		const user = await this.getCurrentUser()

		const { error } = await supabase
			.from('schedule_workers')
			.update({
				work_start_date: scheduleWorker.workStartDate,
				work_end_date: scheduleWorker.workEndDate,
				uniform_time: scheduleWorker.uniformTime,
				hourly_wage: scheduleWorker.hourlyWage,
				fuel_allowance: scheduleWorker.fuelAllowance,
				other_allowance: scheduleWorker.otherAllowance,
				overtime_enabled: scheduleWorker.overtimeEnabled,
				night_shift_enabled: scheduleWorker.nightShiftEnabled,
				tax_withheld: scheduleWorker.taxWithheld,
				wage_paid: scheduleWorker.wagePaid,
				fuel_paid: scheduleWorker.fuelPaid,
				other_paid: scheduleWorker.otherPaid,
			})
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error updating schedule worker:', error)
			throw error
		}
	}

	async deleteScheduleWorker(id: string): Promise<void> {
		const user = await this.getCurrentUser()

		const { error } = await supabase
			.from('schedule_workers')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error deleting schedule worker:', error)
			throw error
		}
	}

	// ==================== Work Period Operations ====================

	async createWorkPeriod(workPeriod: any): Promise<string> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('work_periods')
			.insert([{
				id: workPeriod.id,
				user_id: user.id,
				schedule_worker_id: workPeriod.scheduleWorkerId,
				work_date: workPeriod.workDate,
				start_time: workPeriod.startTime,
				end_time: workPeriod.endTime,
				break_duration: workPeriod.breakDuration || 0,
				overtime_hours: workPeriod.overtimeHours || 0,
				daily_wage: workPeriod.dailyWage,
				memo: workPeriod.memo,
			}])
			.select()

		if (error) {
			console.error('Error creating work period:', error)
			throw error
		}

		return data[0].id
	}

	async getWorkPeriods(scheduleWorkerId: string): Promise<any[]> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('work_periods')
			.select('*')
			.eq('schedule_worker_id', scheduleWorkerId)
			.eq('user_id', user.id)
			.order('work_date', { ascending: true })

		if (error) {
			console.error('Error getting work periods:', error)
			return []
		}

		return data.map(wp => this.transformWorkPeriodFromDB(wp))
	}

	// ==================== User Profile Operations ====================

	async createUserProfile(profile: any): Promise<string> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('user_profiles')
			.insert([{
				id: user.id,
				business_name: profile.businessName,
				business_number: profile.businessNumber,
				business_address: profile.businessAddress,
				business_phone: profile.businessPhone,
				business_email: profile.businessEmail,
				business_card_image_url: profile.businessCardImageUrl,
				business_card_image_path: profile.businessCardImagePath,
				business_license_image_url: profile.businessLicenseImageUrl,
				business_license_image_path: profile.businessLicenseImagePath,
			}])
			.select()

		if (error) {
			console.error('Error creating user profile:', error)
			throw error
		}

		return data[0].id
	}

	async getUserProfile(): Promise<any> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('user_profiles')
			.select('*')
			.eq('id', user.id)
			.single()

		if (error) {
			console.error('Error getting user profile:', error)
			return null
		}

		return this.transformUserProfileFromDB(data)
	}

	async updateUserProfile(profile: any): Promise<void> {
		const user = await this.getCurrentUser()

		const { error } = await supabase
			.from('user_profiles')
			.update({
				business_name: profile.businessName,
				business_number: profile.businessNumber,
				business_address: profile.businessAddress,
				business_phone: profile.businessPhone,
				business_email: profile.businessEmail,
				business_card_image_url: profile.businessCardImageUrl,
				business_card_image_path: profile.businessCardImagePath,
				business_license_image_url: profile.businessLicenseImageUrl,
				business_license_image_path: profile.businessLicenseImagePath,
			})
			.eq('id', user.id)

		if (error) {
			console.error('Error updating user profile:', error)
			throw error
		}
	}

	// ==================== Data Transform Helpers ====================

	private transformScheduleWorkerFromDB(dbScheduleWorker: any): any {
		return {
			id: dbScheduleWorker.id,
			scheduleId: dbScheduleWorker.schedule_id,
			workerId: dbScheduleWorker.worker_id,
			workStartDate: dbScheduleWorker.work_start_date,
			workEndDate: dbScheduleWorker.work_end_date,
			uniformTime: dbScheduleWorker.uniform_time,
			hourlyWage: dbScheduleWorker.hourly_wage,
			fuelAllowance: dbScheduleWorker.fuel_allowance,
			otherAllowance: dbScheduleWorker.other_allowance,
			overtimeEnabled: dbScheduleWorker.overtime_enabled,
			nightShiftEnabled: dbScheduleWorker.night_shift_enabled,
			taxWithheld: dbScheduleWorker.tax_withheld,
			wagePaid: dbScheduleWorker.wage_paid,
			fuelPaid: dbScheduleWorker.fuel_paid,
			otherPaid: dbScheduleWorker.other_paid,
			createdAt: dbScheduleWorker.created_at,
			updatedAt: dbScheduleWorker.updated_at,
		}
	}

	private transformWorkPeriodFromDB(dbWorkPeriod: any): any {
		return {
			id: dbWorkPeriod.id,
			scheduleWorkerId: dbWorkPeriod.schedule_worker_id,
			workDate: dbWorkPeriod.work_date,
			startTime: dbWorkPeriod.start_time,
			endTime: dbWorkPeriod.end_time,
			breakDuration: dbWorkPeriod.break_duration,
			overtimeHours: dbWorkPeriod.overtime_hours,
			dailyWage: dbWorkPeriod.daily_wage,
			memo: dbWorkPeriod.memo,
			createdAt: dbWorkPeriod.created_at,
			updatedAt: dbWorkPeriod.updated_at,
		}
	}

	private transformUserProfileFromDB(dbProfile: any): any {
		return {
			id: dbProfile.id,
			businessName: dbProfile.business_name,
			businessNumber: dbProfile.business_number,
			businessAddress: dbProfile.business_address,
			businessPhone: dbProfile.business_phone,
			businessEmail: dbProfile.business_email,
			businessCardImageUrl: dbProfile.business_card_image_url,
			businessCardImagePath: dbProfile.business_card_image_path,
			businessLicenseImageUrl: dbProfile.business_license_image_url,
			businessLicenseImagePath: dbProfile.business_license_image_path,
			createdAt: dbProfile.created_at,
			updatedAt: dbProfile.updated_at,
		}
	}

	// Notification operations
	async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
		const user = await this.getCurrentUser()

		// 클라이언트에서 UUID 생성
		const notificationId = generateUUID()

		const { data, error } = await supabase
			.from('notifications')
			.insert({
				id: notificationId,
				user_id: user.id,
				type: notification.type,
				title: notification.title,
				message: notification.message,
				is_read: notification.isRead,
				priority: notification.priority,
				related_id: notification.relatedId,
				scheduled_at: notification.scheduledAt,
			})
			.select()
			.single()

		if (error) {
			console.error('Error creating notification:', error)
			throw new Error('Failed to create notification')
		}

		return data.id
	}

	async getNotification(id: string): Promise<Notification | null> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('notifications')
			.select('*')
			.eq('id', id)
			.eq('user_id', user.id)
			.single()

		if (error) {
			console.error('Error getting notification:', error)
			return null
		}

		return this.transformNotificationFromDB(data)
	}

	async getAllNotifications(): Promise<Notification[]> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('notifications')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })

		if (error) {
			console.error('Error getting notifications:', error)
			return []
		}

		return data.map(notification => this.transformNotificationFromDB(notification))
	}

	async getRecentNotifications(limit: number): Promise<Notification[]> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('notifications')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(limit)

		if (error) {
			console.error('Error getting recent notifications:', error)
			return []
		}

		return data.map(notification => this.transformNotificationFromDB(notification))
	}

	async updateNotification(id: string, notification: Partial<Notification>): Promise<void> {
		const user = await this.getCurrentUser()

		const { error } = await supabase
			.from('notifications')
			.update({
				title: notification.title,
				message: notification.message,
				is_read: notification.isRead,
				priority: notification.priority,
				related_id: notification.relatedId,
				scheduled_at: notification.scheduledAt,
				updated_at: new Date().toISOString(),
			})
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error updating notification:', error)
			throw new Error('Failed to update notification')
		}
	}

	async deleteNotification(id: string): Promise<void> {
		const user = await this.getCurrentUser()

		const { error } = await supabase
			.from('notifications')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error deleting notification:', error)
			throw new Error('Failed to delete notification')
		}
	}

	async markAllNotificationsAsRead(): Promise<void> {
		const user = await this.getCurrentUser()

		const { error } = await supabase
			.from('notifications')
			.update({ is_read: true, updated_at: new Date().toISOString() })
			.eq('user_id', user.id)
			.eq('is_read', false)

		if (error) {
			console.error('Error marking notifications as read:', error)
			throw new Error('Failed to mark notifications as read')
		}
	}

	async getUnreadNotificationCount(): Promise<number> {
		const user = await this.getCurrentUser()

		const { count, error } = await supabase
			.from('notifications')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', user.id)
			.eq('is_read', false)

		if (error) {
			console.error('Error getting unread count:', error)
			return 0
		}

		return count || 0
	}

	async getNotificationByRelatedId(relatedId: string, type: string): Promise<Notification | null> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('notifications')
			.select('*')
			.eq('user_id', user.id)
			.eq('related_id', relatedId)
			.eq('type', type)
			.single()

		if (error) {
			return null
		}

		return this.transformNotificationFromDB(data)
	}

	// NotificationSettings operations
	async getNotificationSettings(): Promise<NotificationSettings | null> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('notification_settings')
			.select('*')
			.eq('user_id', user.id)
			.single()

		if (error) {
			console.error('Error getting notification settings:', error)
			return null
		}

		return this.transformNotificationSettingsFromDB(data)
	}

	async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
		const user = await this.getCurrentUser()

		// 클라이언트에서 UUID 생성
		const settingsId = generateUUID()

		const { error } = await supabase
			.from('notification_settings')
			.upsert({
				id: settingsId,
				user_id: user.id,
				wage_overdue_enabled: settings.wageOverdueEnabled,
				revenue_overdue_enabled: settings.revenueOverdueEnabled,
				schedule_reminder_enabled: settings.scheduleReminderEnabled,
				schedule_reminder_unit: settings.scheduleReminderUnit,
				schedule_reminder_value: settings.scheduleReminderValue,
				updated_at: new Date().toISOString(),
			})

		if (error) {
			console.error('Error updating notification settings:', error)
			throw new Error('Failed to update notification settings')
		}
	}

	private transformNotificationFromDB(dbNotification: any): Notification {
		return {
			id: dbNotification.id,
			userId: dbNotification.user_id,
			type: dbNotification.type,
			title: dbNotification.title,
			message: dbNotification.message,
			isRead: dbNotification.is_read,
			priority: dbNotification.priority,
			relatedId: dbNotification.related_id,
			scheduledAt: dbNotification.scheduled_at,
			createdAt: dbNotification.created_at,
			updatedAt: dbNotification.updated_at,
		}
	}

	private transformNotificationSettingsFromDB(dbSettings: any): NotificationSettings {
		return {
			id: dbSettings.id,
			userId: dbSettings.user_id,
			wageOverdueEnabled: dbSettings.wage_overdue_enabled,
			revenueOverdueEnabled: dbSettings.revenue_overdue_enabled,
			scheduleReminderEnabled: dbSettings.schedule_reminder_enabled,
			scheduleReminderUnit: dbSettings.schedule_reminder_unit,
			scheduleReminderValue: dbSettings.schedule_reminder_value,
			createdAt: dbSettings.created_at,
			updatedAt: dbSettings.updated_at,
		}
	}

	// ==================== Activity Operations ====================

	async createActivity(activity: {
		id: string;
		type: string;
		title: string;
		description?: string;
		relatedId?: string;
		icon?: string;
		color?: string;
		isRead?: boolean;
		isDeleted?: boolean;
	}): Promise<string> {
		// Get current user ID
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			throw new Error('User not authenticated')
		}

		const { data, error } = await supabase
			.from('activities')
			.insert({
				id: activity.id,
				user_id: user.id,
				type: activity.type,
				title: activity.title,
				description: activity.description || null,
				related_id: activity.relatedId || null,
				icon: activity.icon || null,
				color: activity.color || null,
				is_read: activity.isRead || false,
				is_deleted: activity.isDeleted || false,
			})
			.select()
			.single()

		if (error) {
			console.error('Error creating activity:', error)
			throw error
		}

		return data.id
	}

	async getRecentActivities(limit: number = 10, offset: number = 0): Promise<Array<{
		id: string;
		type: string;
		title: string;
		description?: string;
		relatedId?: string;
		icon?: string;
		color?: string;
		isRead: boolean;
		isDeleted: boolean;
		timestamp: string;
	}>> {
		// Get current user ID
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			throw new Error('User not authenticated')
		}

		console.log('📋 Loading recent activities for user:', user.id);

		const { data, error } = await supabase
			.from('activities')
			.select('*')
			.eq('user_id', user.id)
			.eq('is_deleted', false)
			.eq('is_read', false)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1)

		if (error) {
			console.error('❌ Error fetching activities:', error)
			throw error
		}

		console.log('📋 Raw activities from Supabase:', data);
		console.log('📋 Activities count:', data.length);

		const result = data.map(activity => ({
			id: activity.id,
			type: activity.type,
			title: activity.title,
			description: activity.description,
			relatedId: activity.related_id,
			icon: activity.icon,
			color: activity.color,
			isRead: activity.is_read,
			isDeleted: activity.is_deleted,
			timestamp: activity.created_at,
		}));

		console.log('📋 Processed activities:', result);
		return result;
	}

	async markActivityAsRead(activityId: string): Promise<void> {
		// Get current user ID
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			throw new Error('User not authenticated')
		}

		console.log('👁️ Marking activity as read:', activityId, 'for user:', user.id);

		const { data, error } = await supabase
			.from('activities')
			.update({ is_read: true })
			.eq('id', activityId)
			.eq('user_id', user.id)
			.select()

		if (error) {
			console.error('❌ Error marking activity as read:', error)
			throw error
		}

		console.log('✅ Activity marked as read successfully:', data);
	}

	async markActivityAsDeleted(activityId: string): Promise<void> {
		// Get current user ID
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			throw new Error('User not authenticated')
		}

		console.log('🗑️ Marking activity as deleted:', activityId, 'for user:', user.id);

		const { data, error } = await supabase
			.from('activities')
			.update({ is_deleted: true })
			.eq('id', activityId)
			.eq('user_id', user.id)
			.select()

		if (error) {
			console.error('❌ Error marking activity as deleted:', error)
			throw error
		}

		console.log('✅ Activity marked as deleted successfully:', data);
	}

	async clearOldActivities(daysToKeep: number = 30): Promise<void> {
		// Get current user ID
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			throw new Error('User not authenticated')
		}

		const cutoffDate = new Date()
		cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

		const { error } = await supabase
			.from('activities')
			.delete()
			.eq('user_id', user.id)
			.lt('created_at', cutoffDate.toISOString())

		if (error) {
			console.error('Error clearing old activities:', error)
			throw error
		}
	}

	// Client document operations
	async createClientDocument(document: {
		id: string;
		clientId: string;
		fileName: string;
		fileUrl: string;
		filePath: string;
		fileType: string;
		fileSize?: number;
	}): Promise<string> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('client_documents')
			.insert({
				id: document.id,
				client_id: document.clientId,
				user_id: user.id,
				file_name: document.fileName,
				file_url: document.fileUrl,
				file_path: document.filePath,
				file_type: document.fileType,
				file_size: document.fileSize,
			})
			.select()
			.single()

		if (error) {
			console.error('Error creating client document:', error)
			throw error
		}

		return data.id
	}

	async getClientDocuments(clientId: string): Promise<Array<{
		id: string;
		clientId: string;
		fileName: string;
		fileUrl: string;
		filePath: string;
		fileType: string;
		fileSize?: number;
		uploadedAt: string;
	}>> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('client_documents')
			.select('*')
			.eq('client_id', clientId)
			.eq('user_id', user.id)
			.order('uploaded_at', { ascending: false })

		if (error) {
			console.error('Error getting client documents:', error)
			return []
		}

		return (data || []).map((doc: any) => ({
			id: doc.id,
			clientId: doc.client_id,
			fileName: doc.file_name,
			fileUrl: doc.file_url,
			filePath: doc.file_path,
			fileType: doc.file_type,
			fileSize: doc.file_size,
			uploadedAt: doc.uploaded_at,
		}))
	}

	async deleteClientDocument(documentId: string): Promise<void> {
		const user = await this.getCurrentUser()

		const { error } = await supabase
			.from('client_documents')
			.delete()
			.eq('id', documentId)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error deleting client document:', error)
			throw error
		}
	}

	// Schedule document operations
	async createScheduleDocument(document: {
		id: string;
		scheduleId: string;
		fileName: string;
		fileUrl: string;
		filePath: string;
		fileType: string;
		fileSize?: number;
	}): Promise<string> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('schedule_documents')
			.insert({
				id: document.id,
				schedule_id: document.scheduleId,
				user_id: user.id,
				file_name: document.fileName,
				file_url: document.fileUrl,
				file_path: document.filePath,
				file_type: document.fileType,
				file_size: document.fileSize,
			})
			.select()
			.single()

		if (error) {
			console.error('Error creating schedule document:', error)
			throw error
		}

		return data.id
	}

	async getScheduleDocuments(scheduleId: string): Promise<Array<{
		id: string;
		scheduleId: string;
		fileName: string;
		fileUrl: string;
		filePath: string;
		fileType: string;
		fileSize?: number;
		uploadedAt: string;
	}>> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('schedule_documents')
			.select('*')
			.eq('schedule_id', scheduleId)
			.eq('user_id', user.id)
			.order('uploaded_at', { ascending: false })

		if (error) {
			console.error('Error getting schedule documents:', error)
			return []
		}

		return (data || []).map((doc: any) => ({
			id: doc.id,
			scheduleId: doc.schedule_id,
			fileName: doc.file_name,
			fileUrl: doc.file_url,
			filePath: doc.file_path,
			fileType: doc.file_type,
			fileSize: doc.file_size,
			uploadedAt: doc.uploaded_at,
		}))
	}

	async deleteScheduleDocument(documentId: string): Promise<void> {
		const user = await this.getCurrentUser()

		const { error } = await supabase
			.from('schedule_documents')
			.delete()
			.eq('id', documentId)
			.eq('user_id', user.id)

		if (error) {
			console.error('Error deleting schedule document:', error)
			throw error
		}
	}
}

export const database = new SupabaseRepository()
