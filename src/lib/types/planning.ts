export type GenerationStepStatus = 'queued' | 'processing' | 'complete'
export type ScheduleStatus = 'draft' | 'saved'
export type ScheduleBlockSource =
  | 'calendar'
  | 'task'
  | 'meal'
  | 'break'
  | 'wellness'
  | 'personal'
export type EnergyImpact = 'low' | 'medium' | 'high' | 'restorative'
export type ScheduleBlockStatus = 'proposed' | 'accepted' | 'completed'

export type GenerationStep = {
  id: string
  label: string
  status: GenerationStepStatus
}

export type ScheduleBlockInput = {
  sourceType: ScheduleBlockSource
  sourceId: string | null
  title: string
  startsAt: string
  endsAt: string
  isFixed: boolean
  isProtected: boolean
  energyImpact: EnergyImpact
  status: ScheduleBlockStatus
}

export type ScheduleBlock = ScheduleBlockInput & {
  id: string
  scheduleId: string
  createdAt: string
  updatedAt: string
}

export type GeneratedSchedule = {
  id: string
  userId: string
  planDate: string
  status: ScheduleStatus
  explanation: string | null
  createdAt: string
  updatedAt: string
  blocks: ScheduleBlock[]
}

export type GeneratedScheduleInput = {
  planDate: string
  explanation: string | null
  blocks: ScheduleBlockInput[]
}
