import { supabase } from '../../lib/supabase'
import { listCalendarEvents } from '../calendar/calendar.service'
import { saveCalendarEvents } from '../calendar/calendar.service'
import { clearPendingCalendarImport, getPendingCalendarImport } from '../calendar/calendar-import.service'
import type { CalendarEventInput } from '../../lib/types/calendar'
import { focusActivities, type FocusPeriod } from '../../lib/data/focusAspects'
import { listTasks, markTasksScheduled } from '../tasks/task.service'
import type {
  GeneratedSchedule,
  GeneratedScheduleInput,
  ScheduleBlock,
} from '../../lib/types/planning'

type ScheduleBlockRow = {
  id: string
  schedule_id: string
  source_type: ScheduleBlock['sourceType']
  source_id: string | null
  title: string
  starts_at: string
  ends_at: string
  is_fixed: boolean
  is_protected: boolean
  energy_impact: ScheduleBlock['energyImpact']
  status: ScheduleBlock['status']
  created_at: string
  updated_at: string
}

type GeneratedScheduleRow = {
  id: string
  user_id: string
  plan_date: string
  status: GeneratedSchedule['status']
  explanation: string | null
  created_at: string
  updated_at: string
  schedule_blocks: ScheduleBlockRow[] | null
}

function blockFromRow(row: ScheduleBlockRow): ScheduleBlock {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isFixed: row.is_fixed,
    isProtected: row.is_protected,
    energyImpact: row.energy_impact,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function scheduleFromRow(row: GeneratedScheduleRow): GeneratedSchedule {
  return {
    id: row.id,
    userId: row.user_id,
    planDate: row.plan_date,
    status: row.status,
    explanation: row.explanation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    blocks: (row.schedule_blocks ?? []).map(blockFromRow),
  }
}

export async function getScheduleForDate(planDate: string) {
  const { data, error } = await supabase
    .from('generated_schedules')
    .select('*, schedule_blocks(*)')
    .eq('plan_date', planDate)
    .order('starts_at', { referencedTable: 'schedule_blocks' })
    .maybeSingle()

  if (error) throw error
  return data ? scheduleFromRow(data as GeneratedScheduleRow) : null
}

export async function getSchedulesForRange(fromDate: string, toDate: string) {
  const { data, error } = await supabase
    .from('generated_schedules')
    .select('*, schedule_blocks(*)')
    .gte('plan_date', fromDate)
    .lte('plan_date', toDate)
    .order('plan_date')
    .order('starts_at', { referencedTable: 'schedule_blocks' })

  if (error) throw error
  return (data as GeneratedScheduleRow[]).map(scheduleFromRow)
}

export async function saveGeneratedSchedule(input: GeneratedScheduleInput) {
  const { data, error } = await supabase.rpc('save_generated_schedule', {
    p_plan_date: input.planDate,
    p_explanation: input.explanation,
    p_blocks: input.blocks,
  })

  if (error) throw error
  return data as string
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function atLocalTime(date: Date, hours: number, minutes = 0) {
  const value = new Date(date)
  value.setHours(hours, minutes, 0, 0)
  return value
}

function overlapsWithBuffer(
  start: Date,
  end: Date,
  occupied: { start: Date; end: Date },
  bufferMinutes: number,
) {
  const buffer = bufferMinutes * 60_000
  return start.getTime() < occupied.end.getTime() + buffer
    && end.getTime() > occupied.start.getTime() - buffer
}

function findComfortableFocusSlot(
  planDay: Date,
  occupied: { start: Date; end: Date }[],
  durationMinutes: number,
  bufferMinutes: number,
) {
  const periods: { name: FocusPeriod; hours: number[]; endHour: number }[] = [
    { name: 'morning', hours: [7, 8, 9, 10], endHour: 12 },
    { name: 'afternoon', hours: [12, 14, 16], endHour: 17 },
    { name: 'evening', hours: [17, 18, 19], endHour: 20 },
  ]
  const rotationStart = (planDay.getDay() + 2) % periods.length
  const rankedPeriods = periods
    .map((period, index) => {
      const periodStart = atLocalTime(planDay, period.hours[0])
      const periodEnd = atLocalTime(planDay, period.endHour)
      const load = occupied.filter((block) => block.start < periodEnd && block.end > periodStart).length
      return { ...period, load, rotationRank: (index - rotationStart + periods.length) % periods.length }
    })
    .sort((a, b) => a.load - b.load || a.rotationRank - b.rotationRank)

  for (const period of rankedPeriods) {
    for (const hour of period.hours) {
      const start = atLocalTime(planDay, hour)
      const end = new Date(start.getTime() + durationMinutes * 60_000)
      if (end > atLocalTime(planDay, period.endHour)) continue
      if (!occupied.some((block) => overlapsWithBuffer(start, end, block, bufferMinutes))) {
        return { start, end, period: period.name }
      }
    }
  }

  // Use a later slot only when the normal 07:00–20:00 day has no comfortable opening.
  for (const hour of [20, 21]) {
    const start = atLocalTime(planDay, hour)
    const end = new Date(start.getTime() + durationMinutes * 60_000)
    if (!occupied.some((block) => overlapsWithBuffer(start, end, block, bufferMinutes))) {
      return { start, end, period: 'evening' as const }
    }
  }
  return null
}

async function persistPendingCalendarImport(events: CalendarEventInput[]) {
  if (!events.length) return
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Authentication required')
  await saveCalendarEvents(events, data.user.id)
  clearPendingCalendarImport()
}

export async function generateAndSaveTodaySchedule(
  planDate?: string,
  pendingEvents = getPendingCalendarImport(),
  persistImportAfterGeneration = true,
) {
  const planDay = planDate
    ? (() => {
        const [year, month, day] = planDate.split('-').map(Number)
        return new Date(year, month - 1, day)
      })()
    : new Date()
  const dayStart = atLocalTime(planDay, 0)
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)
  const selectedDate = localDateKey(planDay)

  const [savedEvents, tasks, profileResult] = await Promise.all([
    listCalendarEvents(dayStart.toISOString(), dayEnd.toISOString()),
    listTasks(),
    supabase.from('user_profiles').select('focus_aspects').maybeSingle(),
  ])
  if (profileResult.error) throw profileResult.error
  const focusAspects = (profileResult.data?.focus_aspects as string[] | undefined) ?? []
  const events = [
    ...savedEvents,
    ...pendingEvents
      .filter((event) => new Date(event.startsAt) >= dayStart && new Date(event.startsAt) < dayEnd)
      .filter((pending) => !savedEvents.some((saved) => saved.source === pending.source && saved.externalEventId === pending.externalEventId)),
  ]

  const blocks: GeneratedScheduleInput['blocks'] = events.map((event) => {
    const sourceId = 'id' in event && typeof event.id === 'string' ? event.id : null
    return {
      sourceType: 'calendar', sourceId, title: event.title,
      startsAt: event.startsAt, endsAt: event.endsAt,
      isFixed: true, isProtected: false, energyImpact: 'medium', status: 'accepted',
    }
  })

  const occupied = events
    .map((event) => ({ start: new Date(event.startsAt), end: new Date(event.endsAt) }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  const periodWindows = {
    morning: [7, 12],
    afternoon: [12, 17],
    evening: [17, 22],
    flexible: [7, 20],
  } as const
  const scheduledTaskIds: string[] = []
  const seenTasks = new Set<string>()
  const rules = { maximumMinutes: 300, bufferMinutes: 20 }
  const effortOrder = { high: 0, medium: 1, low: 2 }
  const pendingTasks = tasks
    .filter((item) => item.status !== 'completed' && item.plannedDate === selectedDate)
    .sort((a, b) => {
      if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      if (a.deadline) return -1
      if (b.deadline) return 1
      return effortOrder[a.effort] - effortOrder[b.effort]
    })
  let scheduledMinutes = 0

  for (const task of pendingTasks) {
    const duplicateKey = task.title.trim().toLocaleLowerCase()
    if (seenTasks.has(duplicateKey)) continue
    seenTasks.add(duplicateKey)

    const [startHour, endHour] = periodWindows[task.preferredPeriod]
    let cursor = atLocalTime(planDay, startHour)
    const windowEnd = atLocalTime(planDay, endHour)
    if (scheduledMinutes + task.durationMinutes > rules.maximumMinutes) continue

    const duration = Math.max(15, task.durationMinutes) * 60_000
    let end = new Date(cursor.getTime() + duration)

    let moved = true
    while (moved) {
      moved = false
      for (const commitment of occupied) {
        if (overlapsWithBuffer(cursor, end, commitment, rules.bufferMinutes)) {
          cursor = new Date(commitment.end.getTime() + rules.bufferMinutes * 60_000)
          end = new Date(cursor.getTime() + duration)
          moved = true
        }
      }
    }

    if (end > windowEnd) continue

    blocks.push({
      sourceType: 'task',
      sourceId: task.id,
      title: task.title,
      startsAt: cursor.toISOString(),
      endsAt: end.toISOString(),
      isFixed: false,
      isProtected: false,
      energyImpact: task.effort === 'high' ? 'high' : task.effort === 'low' ? 'low' : 'medium',
      status: 'proposed',
    })
    occupied.push({ start: new Date(cursor), end: new Date(end) })
    occupied.sort((a, b) => a.start.getTime() - b.start.getTime())
    scheduledTaskIds.push(task.id)
    scheduledMinutes += task.durationMinutes
  }

  if (focusAspects.length) {
    const aspect = focusAspects[(planDay.getDay() + 6) % focusAspects.length]
    const weekend = planDay.getDay() === 0 || planDay.getDay() === 6
    const focusMinutes = weekend || blocks.length === 0 ? 60 : 45
    const slot = findComfortableFocusSlot(planDay, occupied, focusMinutes, rules.bufferMinutes)
    if (slot) {
      const activities = focusActivities[aspect]?.[slot.period] ?? [`Make time for ${aspect.toLocaleLowerCase()}`]
      const activity = activities[Math.floor(planDay.getDate() / 7) % activities.length]
      blocks.push({
        sourceType: ['Rest', 'Health', 'Fitness'].includes(aspect) ? 'wellness' : 'personal',
        sourceId: null,
        title: activity,
        startsAt: slot.start.toISOString(),
        endsAt: slot.end.toISOString(),
        isFixed: false,
        isProtected: true,
        energyImpact: 'restorative',
        status: 'proposed',
      })
    }
  }

  await saveGeneratedSchedule({
    planDate: selectedDate,
    explanation: `Fixed commitments stay in place, desires are limited to five focused hours, and ${rules.bufferMinutes}-minute breathing gaps are kept around commitments.${focusAspects.length ? ' Personal focus time is protected across the week.' : ''}`,
    blocks,
  })
  await markTasksScheduled(scheduledTaskIds)
  if (persistImportAfterGeneration) await persistPendingCalendarImport(pendingEvents)
}

export async function generateAndSaveWeek(weekStart: string) {
  const [year, month, day] = weekStart.split('-').map(Number)
  const start = new Date(year, month - 1, day)
  const pendingEvents = getPendingCalendarImport()
  for (let offset = 0; offset < 7; offset += 1) {
    const target = new Date(start)
    target.setDate(start.getDate() + offset)
    await generateAndSaveTodaySchedule(localDateKey(target), pendingEvents, false)
  }
  await persistPendingCalendarImport(pendingEvents)
}

export async function saveSchedules(scheduleIds: string[]) {
  if (!scheduleIds.length) return
  const { error } = await supabase
    .from('generated_schedules')
    .update({ status: 'saved' })
    .in('id', scheduleIds)
  if (error) throw error
}

export async function updateScheduleStatus(
  scheduleId: string,
  status: GeneratedSchedule['status'],
) {
  const { error } = await supabase
    .from('generated_schedules')
    .update({ status })
    .eq('id', scheduleId)

  if (error) throw error
}
