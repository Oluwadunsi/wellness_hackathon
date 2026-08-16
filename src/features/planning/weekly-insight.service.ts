import { supabase } from '../../lib/supabase'
import type { GeneratedSchedule } from '../../lib/types/planning'
import type { WeeklyInsight } from '../../lib/types/weeklyInsight'
import { listTasks } from '../tasks/task.service'

export async function getWeeklyInsight(schedules: GeneratedSchedule[]) {
  const dates = schedules.map((schedule) => schedule.planDate).sort()
  const [tasks, profileResult] = await Promise.all([
    listTasks(),
    supabase.from('user_profiles').select('focus_aspects').maybeSingle(),
  ])
  if (profileResult.error) throw profileResult.error
  const week = schedules.map((schedule) => ({
    date: schedule.planDate,
    blocks: schedule.blocks.map((block) => ({
      title: block.title,
      startsAt: block.startsAt,
      endsAt: block.endsAt,
      fixed: block.isFixed,
      effort: block.energyImpact,
    })),
  }))
  const desires = tasks
    .filter((task) => task.plannedDate >= dates[0] && task.plannedDate <= dates.at(-1)!)
    .map((task) => ({
      title: task.title,
      requestedDate: task.plannedDate,
      preferredPeriod: task.preferredPeriod,
      durationMinutes: task.durationMinutes,
      status: task.status,
      labels: task.labels,
    }))

  const { data, error } = await supabase.functions.invoke<WeeklyInsight>('analyze-week', {
    body: { week, desires, focusAspects: profileResult.data?.focus_aspects ?? [] },
  })
  if (error) throw error
  if (!data) throw new Error('No weekly insight was returned')
  return data
}
