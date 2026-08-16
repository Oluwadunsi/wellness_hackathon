export type TaskEffort = 'low' | 'medium' | 'high'
export type TaskStatus = 'pending' | 'scheduled' | 'completed'
export type PreferredPeriod = 'morning' | 'afternoon' | 'evening' | 'flexible'

export type TaskInterpretation = {
  title: string
  deadlineDate: string | null
  plannedDate: string
  deadlineLabel: string
  durationMinutes: number
  effort: TaskEffort
  preferredPeriod: PreferredPeriod
  splittable: boolean
  wellbeingPriority: string | null
  explanation: string
}

export type DesireInterpretation = {
  items: TaskInterpretation[]
  explanation: string
}

export type TaskInput = {
  rawInput: string
  title: string
  durationMinutes: number
  deadline: string | null
  effort: TaskEffort
  preferredPeriod: PreferredPeriod
  splittable: boolean
  wellbeingPriority: string | null
  labels: string[]
  plannedDate: string
}

export type Task = TaskInput & {
  id: string
  userId: string
  status: TaskStatus
  createdAt: string
  updatedAt: string
}
