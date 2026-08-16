import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { CalendarEventInput, CalendarConnectionStatus } from '../../lib/types/calendar'
import { parseCalendarFile, savePendingCalendarImport } from './calendar-import.service'
import { listSavedCalendarEvents } from './calendar.service'

export default function useCalendarConnection() {
  const [status, setStatus] = useState<CalendarConnectionStatus>('idle')
  const [events, setEvents] = useState<CalendarEventInput[]>([])
  const [error, setError] = useState<string | null>(null)

  async function loadSavedEvents() {
    setStatus('connecting'); setError(null)
    try {
      setEvents(await listSavedCalendarEvents())
      setStatus('connected')
    } catch (loadError) {
      console.error('Could not load saved calendar events', loadError)
      setStatus('idle'); setError('We could not load your saved events. Please try again.')
    }
  }

  async function importFile(file: File) {
    setStatus('connecting'); setError(null)
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) throw new Error('Sign in before importing a calendar.')
      const parsed = await parseCalendarFile(file)
      savePendingCalendarImport(parsed)
      setEvents(parsed)
      setStatus('connected')
    } catch (importError) {
      console.error('Could not import calendar', importError)
      setStatus('idle')
      setError(importError instanceof Error ? importError.message : 'We could not import this calendar file.')
    }
  }

  function disconnectPreview() { setEvents([]); setError(null); setStatus('idle') }
  return { disconnectPreview, error, events, importFile, loadSavedEvents, status }
}
