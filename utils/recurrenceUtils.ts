import { Schedule } from '@/models/types'
import dayjs from 'dayjs'

export interface ScheduleOccurrence {
	occurrenceStartDate: string
	occurrenceEndDate: string
	occurrenceIndex: number
}

const DATE_FORMAT = 'YYYY-MM-DD'

function parseExceptions(schedule: Schedule): Set<string> {
	if (!schedule.recurrenceExceptions || schedule.recurrenceExceptions.length === 0) {
		return new Set<string>()
	}
	return new Set(schedule.recurrenceExceptions)
}

function getDurationDays(schedule: Schedule): number {
	const start = dayjs(schedule.startDate)
	const end = dayjs(schedule.endDate)
	const diff = end.diff(start, 'day')
	return diff >= 0 ? diff : 0
}

function isAfterEnd(schedule: Schedule, target: dayjs.Dayjs): boolean {
	if (schedule.recurrenceEndType === 'date' && schedule.recurrenceEndDate) {
		const endDate = dayjs(schedule.recurrenceEndDate)
		if (target.isAfter(endDate, 'day')) {
			return true
		}
	}

	return false
}

function exceedsCount(limit: number | undefined, occurrenceIndex: number): boolean {
	if (!limit || limit <= 0) {
		return false
	}

	return occurrenceIndex >= limit
}

function buildOccurrenceResult(occurrenceStart: dayjs.Dayjs, durationDays: number, occurrenceIndex: number): ScheduleOccurrence {
	const occurrenceEnd = occurrenceStart.add(durationDays, 'day')
	return {
		occurrenceStartDate: occurrenceStart.format(DATE_FORMAT),
		occurrenceEndDate: occurrenceEnd.format(DATE_FORMAT),
		occurrenceIndex,
	}
}

function occursDaily(schedule: Schedule, target: dayjs.Dayjs, durationDays: number): ScheduleOccurrence | null {
	const baseStart = dayjs(schedule.startDate)
	if (target.isBefore(baseStart, 'day')) {
		return null
	}

	const interval = schedule.recurrenceInterval ?? 1
	const diffDays = target.diff(baseStart, 'day')
	const occurrenceIndex = Math.floor(diffDays / interval)
	const occurrenceStart = baseStart.add(occurrenceIndex * interval, 'day')
	const occurrenceEnd = occurrenceStart.add(durationDays, 'day')

	if (target.isBefore(occurrenceStart, 'day') || target.isAfter(occurrenceEnd, 'day')) {
		return null
	}

	if (schedule.recurrenceEndType === 'count' && exceedsCount(schedule.recurrenceCount, occurrenceIndex)) {
		return null
	}

	return buildOccurrenceResult(occurrenceStart, durationDays, occurrenceIndex)
}

function occursWeekly(schedule: Schedule, target: dayjs.Dayjs, durationDays: number): ScheduleOccurrence | null {
	const baseStart = dayjs(schedule.startDate)
	if (target.isBefore(baseStart, 'day')) {
		return null
	}

	const interval = schedule.recurrenceInterval ?? 1
	const targetWeekStart = target.startOf('week')
	const baseWeekStart = baseStart.startOf('week')
	const diffWeeks = targetWeekStart.diff(baseWeekStart, 'week')
	if (diffWeeks < 0) {
		return null
	}

	if (diffWeeks % interval !== 0) {
		return null
	}

	const allowedDays = new Set<number>(
		(schedule.recurrenceDaysOfWeek && schedule.recurrenceDaysOfWeek.length > 0
			? schedule.recurrenceDaysOfWeek
			: [baseStart.day()])
	)

	allowedDays.add(baseStart.day())

	const targetDay = target.day()
	if (!allowedDays.has(targetDay)) {
		return null
	}

	if (diffWeeks === 0 && targetDay < baseStart.day()) {
		return null
	}

	const occurrenceWeekNumber = Math.floor(diffWeeks / interval)
	const sortedDays = Array.from(allowedDays.values()).sort((a, b) => a - b)
	const firstWeekDays = sortedDays.filter(day => day >= baseStart.day())

	let occurrenceIndex = 0
	if (occurrenceWeekNumber === 0) {
		occurrenceIndex = firstWeekDays.filter(day => day < targetDay).length
	} else {
		occurrenceIndex = firstWeekDays.length
		if (occurrenceWeekNumber > 1) {
			occurrenceIndex += (occurrenceWeekNumber - 1) * sortedDays.length
		}
		occurrenceIndex += sortedDays.filter(day => day < targetDay).length
	}

	const weekStart = baseWeekStart.add(diffWeeks, 'week')
	const occurrenceStart = weekStart.add(targetDay, 'day')

	if (occurrenceStart.isBefore(baseStart, 'day')) {
		return null
	}

	const occurrenceEnd = occurrenceStart.add(durationDays, 'day')
	if (target.isAfter(occurrenceEnd, 'day')) {
		return null
	}

	if (schedule.recurrenceEndType === 'count' && exceedsCount(schedule.recurrenceCount, occurrenceIndex)) {
		return null
	}

	return buildOccurrenceResult(occurrenceStart, durationDays, occurrenceIndex)
}

function occursMonthly(schedule: Schedule, target: dayjs.Dayjs, durationDays: number): ScheduleOccurrence | null {
	const baseStart = dayjs(schedule.startDate)
	if (target.isBefore(baseStart, 'day')) {
		return null
	}

	const interval = schedule.recurrenceInterval ?? 1
	const diffMonths = target.year() * 12 + target.month() - (baseStart.year() * 12 + baseStart.month())
	if (diffMonths < 0 || diffMonths % interval !== 0) {
		return null
	}

	const dayOfMonth = schedule.recurrenceDayOfMonth ?? baseStart.date()
	const occurrenceMonth = baseStart.startOf('month').add(diffMonths, 'month')
	const daysInMonth = occurrenceMonth.daysInMonth()
	const targetDayOfMonth = Math.min(dayOfMonth, daysInMonth)

	const occurrenceStart = occurrenceMonth.date(targetDayOfMonth)
	if (occurrenceStart.isBefore(baseStart, 'day')) {
		return null
	}

	const occurrenceEnd = occurrenceStart.add(durationDays, 'day')
	if (target.isBefore(occurrenceStart, 'day') || target.isAfter(occurrenceEnd, 'day')) {
		return null
	}

	const occurrenceIndex = diffMonths / interval
	if (schedule.recurrenceEndType === 'count' && exceedsCount(schedule.recurrenceCount, occurrenceIndex)) {
		return null
	}

	return buildOccurrenceResult(occurrenceStart, durationDays, occurrenceIndex)
}

function occursYearly(schedule: Schedule, target: dayjs.Dayjs, durationDays: number): ScheduleOccurrence | null {
	const baseStart = dayjs(schedule.startDate)
	if (target.isBefore(baseStart, 'day')) {
		return null
	}

	const interval = schedule.recurrenceInterval ?? 1
	const diffYears = target.year() - baseStart.year()
	if (diffYears < 0 || diffYears % interval !== 0) {
		return null
	}

	const month = (schedule.recurrenceMonthOfYear ?? baseStart.month() + 1) - 1
	const dayOfMonth = schedule.recurrenceDayOfMonth ?? baseStart.date()

	const yearAdjusted = baseStart.add(diffYears, 'year')
	const monthAdjusted = yearAdjusted.month(month)
	const daysInMonth = monthAdjusted.daysInMonth()
	const occurrenceDay = Math.min(dayOfMonth, daysInMonth)
	const occurrenceStart = monthAdjusted.startOf('day').date(occurrenceDay)

	if (occurrenceStart.isBefore(baseStart, 'day')) {
		return null
	}

	const occurrenceEnd = occurrenceStart.add(durationDays, 'day')
	if (target.isBefore(occurrenceStart, 'day') || target.isAfter(occurrenceEnd, 'day')) {
		return null
	}

	const occurrenceIndex = diffYears / interval
	if (schedule.recurrenceEndType === 'count' && exceedsCount(schedule.recurrenceCount, occurrenceIndex)) {
		return null
	}

	return buildOccurrenceResult(occurrenceStart, durationDays, occurrenceIndex)
}

export function getOccurrenceForDate(schedule: Schedule, targetDate: string): ScheduleOccurrence | null {
	const target = dayjs(targetDate)
	const durationDays = getDurationDays(schedule)

	if (!schedule.isRecurring) {
		const start = dayjs(schedule.startDate)
		const end = dayjs(schedule.endDate)
		if (target.isBefore(start, 'day') || target.isAfter(end, 'day')) {
			return null
		}
		return {
			occurrenceStartDate: schedule.startDate,
			occurrenceEndDate: schedule.endDate,
			occurrenceIndex: 0,
		}
	}

	const exceptions = parseExceptions(schedule)
	if (exceptions.has(target.format(DATE_FORMAT))) {
		return null
	}

	if (isAfterEnd(schedule, target)) {
		return null
	}

	switch (schedule.recurrenceType) {
		case 'daily':
			return occursDaily(schedule, target, durationDays)
		case 'weekly':
			return occursWeekly(schedule, target, durationDays)
		case 'monthly':
			return occursMonthly(schedule, target, durationDays)
		case 'yearly':
			return occursYearly(schedule, target, durationDays)
		default:
			return null
	}
}

export function isScheduleOccurringOnDate(schedule: Schedule, targetDate: string): boolean {
	return getOccurrenceForDate(schedule, targetDate) !== null
}

export function getOccurrencesInRange(
	schedule: Schedule,
	rangeStart: string,
	rangeEnd: string,
	maxOccurrences: number = 366
): ScheduleOccurrence[] {
	const start = dayjs(rangeStart)
	const end = dayjs(rangeEnd)

	if (end.isBefore(start, 'day')) {
		return []
	}

	if (!schedule.isRecurring) {
		const scheduleStart = dayjs(schedule.startDate)
		const scheduleEnd = dayjs(schedule.endDate)
		if (scheduleEnd.isBefore(start, 'day') || scheduleStart.isAfter(end, 'day')) {
			return []
		}
		return [{
			occurrenceStartDate: schedule.startDate,
			occurrenceEndDate: schedule.endDate,
			occurrenceIndex: 0,
		}]
	}

	const seenStarts = new Set<string>()
	const occurrences: ScheduleOccurrence[] = []
	let cursor = start.startOf('day')

	while (!cursor.isAfter(end, 'day') && occurrences.length < maxOccurrences) {
		const occurrence = getOccurrenceForDate(schedule, cursor.format(DATE_FORMAT))
		if (occurrence && !seenStarts.has(occurrence.occurrenceStartDate)) {
			seenStarts.add(occurrence.occurrenceStartDate)
			occurrences.push(occurrence)
		}
		cursor = cursor.add(1, 'day')
	}

	return occurrences
}
