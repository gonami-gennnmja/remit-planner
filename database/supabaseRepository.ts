import { supabase } from '@/lib/supabase'
import { IDatabase } from './interface'

export class SupabaseRepository implements IDatabase {
	async init(): Promise<void> {
		console.log('🗄️ Using Supabase database')
		// Supabase 연결 테스트
		const { data, error } = await supabase.from('workers').select('count').limit(1)
		if (error) {
			console.error('Supabase connection error:', error)
			throw new Error('Failed to connect to Supabase')
		}
		console.log('✅ Supabase connected successfully')
	}

	// 사용자 인증 헬퍼 함수
	private async getCurrentUser() {
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
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
				start_date: schedule.startDate,
				end_date: schedule.endDate,
				description: schedule.description,
				category: schedule.category,
				address: schedule.address,
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
		const scheduleWorkerId = `sw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

		const { error: scheduleWorkerError } = await supabase
			.from('schedule_workers')
			.insert([{
				id: scheduleWorkerId,
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
		const { data: scheduleWorkers, error } = await supabase
			.from('schedule_workers')
			.select(`
        *,
        workers (*)
      `)
			.eq('schedule_id', scheduleId)

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
					start: p.start_time,
					end: p.end_time
				})) || [],
				paid: sw.paid
			})
		}

		return result
	}

	async updateScheduleWorkerPaidStatus(scheduleId: string, workerId: string, paid: boolean): Promise<void> {
		const { error } = await supabase
			.from('schedule_workers')
			.update({ paid })
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

	async getRecentActivities(limit: number = 10): Promise<Array<{
		id: string;
		type: string;
		title: string;
		description?: string;
		related_id?: string;
		icon?: string;
		color?: string;
		timestamp: string;
		created_at: string;
	}>> {
		const user = await this.getCurrentUser()

		const { data, error } = await supabase
			.from('activities')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(limit)

		if (error) {
			console.error('Error getting activities:', error)
			return []
		}

		return data.map(activity => ({
			...activity,
			timestamp: activity.created_at
		}))
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
			await supabase.from('client_contacts').delete().eq('client_id', id)

			if (client.contacts.length > 0) {
				const contactsToInsert = client.contacts.map((contact: any) => ({
					id: contact.id,
					client_id: id,
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
		const { data, error } = await supabase
			.from('categories')
			.insert([{
				id: category.id,
				name: category.name,
				color: category.color,
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
		const { data, error } = await supabase
			.from('categories')
			.select('*')
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
			name: dbWorker.name,
			phone: dbWorker.phone,
			bankAccount: dbWorker.bank_account,
			hourlyWage: dbWorker.hourly_wage,
			taxWithheld: dbWorker.tax_withheld,
			memo: dbWorker.memo,
			workStartDate: dbWorker.work_start_date,
			workEndDate: dbWorker.work_end_date,
			workHours: dbWorker.work_hours,
			workMinutes: dbWorker.work_minutes,
			isFullPeriodWork: dbWorker.is_full_period_work,
			isSameWorkHoursDaily: dbWorker.is_same_work_hours_daily,
			dailyWorkTimes: dbWorker.daily_work_times,
			defaultStartTime: dbWorker.default_start_time,
			defaultEndTime: dbWorker.default_end_time,
		}
	}

	private transformScheduleFromDB(dbSchedule: any): any {
		return {
			id: dbSchedule.id,
			title: dbSchedule.title,
			startDate: dbSchedule.start_date,
			endDate: dbSchedule.end_date,
			description: dbSchedule.description,
			category: dbSchedule.category,
			address: dbSchedule.address,
			memo: dbSchedule.memo,
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
}
