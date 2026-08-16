import { supabase } from '../../lib/supabase'
import type { Task, TaskInput, TaskStatus } from '../../lib/types/task'

type TaskRow = {
  id: string
  user_id: string
  raw_input: string
  title: string
  duration_minutes: number
  deadline: string | null
  effort: Task['effort']
  preferred_period: Task['preferredPeriod']
  splittable: boolean
  wellbeing_priority: string | null
  labels: string[]
  planned_date: string | null
  status: TaskStatus
  created_at: string
  updated_at: string
}

function fromRow(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    rawInput: row.raw_input,
    title: row.title,
    durationMinutes: row.duration_minutes,
    deadline: row.deadline,
    effort: row.effort,
    preferredPeriod: row.preferred_period,
    splittable: row.splittable,
    wellbeingPriority: row.wellbeing_priority,
    labels: row.labels,
    plannedDate: row.planned_date ?? new Intl.DateTimeFormat('en-CA').format(new Date(row.created_at)),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createTask(input: TaskInput, userId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      raw_input: input.rawInput.trim(),
      title: input.title.trim(),
      duration_minutes: input.durationMinutes,
      deadline: input.deadline,
      effort: input.effort,
      preferred_period: input.preferredPeriod,
      splittable: input.splittable,
      wellbeing_priority: input.wellbeingPriority,
      labels: input.labels,
      planned_date: input.plannedDate,
    })
    .select()
    .single()

  if (error) throw error
  return fromRow(data as TaskRow)
}

export async function listTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as TaskRow[]).map(fromRow)
}

export async function markTasksScheduled(taskIds: string[]) {
  if (!taskIds.length) return
  const { error } = await supabase.from('tasks').update({ status: 'scheduled' }).in('id', taskIds)
  if (error) throw error
}
