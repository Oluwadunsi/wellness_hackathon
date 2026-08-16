import { supabase } from '../../lib/supabase'
import type { CalendarEvent, CalendarEventInput } from '../../lib/types/calendar'

type CalendarEventRow = {
  id: string
  user_id: string
  external_event_id: string | null
  source: CalendarEvent['source']
  title: string
  starts_at: string
  ends_at: string
  is_all_day: boolean
  calendar_name: string | null
  created_at: string
  updated_at: string
}

function fromRow(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    userId: row.user_id,
    externalEventId: row.external_event_id,
    source: row.source,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isAllDay: row.is_all_day,
    calendarName: row.calendar_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRow(event: CalendarEventInput, userId: string) {
  return {
    user_id: userId,
    external_event_id: event.externalEventId,
    source: event.source,
    title: event.title.trim(),
    starts_at: event.startsAt,
    ends_at: event.endsAt,
    is_all_day: event.isAllDay,
    calendar_name: event.calendarName,
  }
}

export async function listCalendarEvents(from: string, to: string) {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .gte('starts_at', from)
    .lt('starts_at', to)
    .order('starts_at')

  if (error) throw error
  return (data as CalendarEventRow[]).map(fromRow)
}

export async function listSavedCalendarEvents() {
  const { data, error } = await supabase.from('calendar_events').select('*').order('starts_at').limit(500)
  if (error) throw error
  return (data as CalendarEventRow[]).map(fromRow)
}

export async function saveCalendarEvents(events: CalendarEventInput[], userId: string) {
  const rows = events.map((event) => toRow(event, userId))
  const { data, error } = await supabase
    .from('calendar_events')
    .upsert(rows, { onConflict: 'user_id,source,external_event_id' })
    .select()

  if (error) throw error
  return (data as CalendarEventRow[]).map(fromRow)
}

export async function deleteCalendarEvent(eventId: string) {
  const { error } = await supabase.from('calendar_events').delete().eq('id', eventId)
  if (error) throw error
}
