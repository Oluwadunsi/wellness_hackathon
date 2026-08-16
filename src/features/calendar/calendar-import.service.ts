import type { CalendarEventInput } from '../../lib/types/calendar'

const pendingImportKey = 'auraplan.pending-calendar-import'

export function savePendingCalendarImport(events: CalendarEventInput[]) {
  window.sessionStorage.setItem(pendingImportKey, JSON.stringify(events))
}

export function getPendingCalendarImport(): CalendarEventInput[] {
  const value = window.sessionStorage.getItem(pendingImportKey)
  if (!value) return []
  try {
    return JSON.parse(value) as CalendarEventInput[]
  } catch {
    window.sessionStorage.removeItem(pendingImportKey)
    return []
  }
}

export function clearPendingCalendarImport() {
  window.sessionStorage.removeItem(pendingImportKey)
}

function parseIcsDate(value: string) {
  if (/^\d{8}$/.test(value)) {
    return new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00`)
  }
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/)
  if (!match) return new Date(value)
  const [, year, month, day, hour, minute, second, utc] = match
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}${utc}`)
}

function parseIcs(text: string, fileName: string): CalendarEventInput[] {
  const unfolded = text.replace(/\r?\n[ \t]/g, '')
  return unfolded.split('BEGIN:VEVENT').slice(1).flatMap((chunk, index) => {
    const body = chunk.split('END:VEVENT')[0] ?? ''
    const lines = body.split(/\r?\n/)
    const read = (name: string) => lines.find((line) => line.split(':')[0]?.split(';')[0] === name)?.slice(lines.find((line) => line.split(':')[0]?.split(';')[0] === name)!.indexOf(':') + 1)
    const title = read('SUMMARY')?.replace(/\\,/g, ',').replace(/\\n/g, ' ').trim()
    const startRaw = read('DTSTART')
    const endRaw = read('DTEND')
    if (!title || !startRaw || !endRaw) return []
    const start = parseIcsDate(startRaw)
    const end = parseIcsDate(endRaw)
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) return []
    return [{
      externalEventId: read('UID') ?? `ics-${fileName}-${index}-${start.getTime()}`,
      source: 'manual', title, startsAt: start.toISOString(), endsAt: end.toISOString(),
      isAllDay: /^\d{8}$/.test(startRaw), calendarName: fileName.slice(0, 100),
    }]
  })
}

function csvRows(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"' && text[index + 1] === '"' && quoted) { value += '"'; index += 1 }
    else if (character === '"') quoted = !quoted
    else if (character === ',' && !quoted) { row.push(value.trim()); value = '' }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(value.trim()); value = ''
      if (row.some(Boolean)) rows.push(row)
      row = []
    } else value += character
  }
  row.push(value.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

function parseCsv(text: string, fileName: string): CalendarEventInput[] {
  const rows = csvRows(text)
  const headers = (rows.shift() ?? []).map((header) => header.toLowerCase().replace(/\s+/g, '_'))
  const column = (...names: string[]) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1
  const titleIndex = column('title', 'summary', 'subject', 'event')
  const startIndex = column('start', 'starts_at')
  const endIndex = column('end', 'ends_at')
  const startDateIndex = column('start_date')
  const startClockIndex = column('start_time')
  const endDateIndex = column('end_date')
  const endClockIndex = column('end_time')
  const hasCombinedColumns = startIndex >= 0 && endIndex >= 0
  const hasSplitColumns = startDateIndex >= 0 && startClockIndex >= 0 && endDateIndex >= 0 && endClockIndex >= 0
  if (titleIndex < 0 || (!hasCombinedColumns && !hasSplitColumns)) throw new Error('CSV needs a title plus start and end date/time columns.')
  return rows.flatMap((row, index) => {
    const start = new Date(hasCombinedColumns ? row[startIndex] : `${row[startDateIndex]} ${row[startClockIndex]}`)
    const end = new Date(hasCombinedColumns ? row[endIndex] : `${row[endDateIndex]} ${row[endClockIndex]}`)
    const title = row[titleIndex]?.trim()
    if (!title || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) return []
    return [{
      externalEventId: `csv-${fileName}-${index}-${start.getTime()}`,
      source: 'manual', title, startsAt: start.toISOString(), endsAt: end.toISOString(),
      isAllDay: false, calendarName: fileName.slice(0, 100),
    }]
  })
}

export async function parseCalendarFile(file: File) {
  if (file.size > 2 * 1024 * 1024) throw new Error('Calendar files must be 2 MB or smaller.')
  const text = await file.text()
  const name = file.name.toLowerCase()
  const events = name.endsWith('.ics') ? parseIcs(text, file.name) : name.endsWith('.csv') ? parseCsv(text, file.name) : []
  if (!events.length) throw new Error('No valid events were found in this file.')
  if (events.length > 2000) throw new Error('A calendar file can contain up to 2,000 events.')
  return events
}
