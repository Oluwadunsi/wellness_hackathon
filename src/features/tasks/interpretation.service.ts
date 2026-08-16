import { supabase } from '../../lib/supabase'
import type { DesireInterpretation } from '../../lib/types/task'
import { getPendingCalendarImport } from '../calendar/calendar-import.service'

function localDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export async function interpretTask(intention: string) {
  const importedEvents = getPendingCalendarImport()
  const importedDates = importedEvents.map((event) => event.startsAt.slice(0, 10)).sort()
  const { data, error } = await supabase.functions.invoke<DesireInterpretation>('interpret-task', {
    body: {
      intention,
      currentDate: localDateKey(),
      timeZone: 'Europe/Stockholm',
      planningRange: importedDates.length ? { from: importedDates[0], to: importedDates.at(-1) } : null,
    },
  })

  if (error) throw error
  if (!data) throw new Error('No task interpretation was returned')
  return data
}
