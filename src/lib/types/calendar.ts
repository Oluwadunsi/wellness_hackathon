export type CalendarEventSource = 'google' | 'manual' | 'auraplan'

export type CalendarEvent = {
  id: string
  userId: string
  externalEventId: string | null
  source: CalendarEventSource
  title: string
  startsAt: string
  endsAt: string
  isAllDay: boolean
  calendarName: string | null
  createdAt: string
  updatedAt: string
}

export type CalendarEventInput = Omit<
  CalendarEvent,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>

export type CalendarConnectionStatus = 'idle' | 'connecting' | 'connected'
