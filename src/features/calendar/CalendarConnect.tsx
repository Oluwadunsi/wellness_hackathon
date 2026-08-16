import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import useCalendarConnection from './useCalendarConnection'

type CalendarConnectProps = { onCustomize: () => void; onGenerate: () => void }

function eventTime(value: string) {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Stockholm' }).format(new Date(value))
}

const assurances = [
  { title: 'Your original stays unchanged', copy: 'JoyFlow copies events from the file. It does not modify the calendar you exported.' },
  { title: 'Safe database updates', copy: 'Matching imported events are updated instead of being added again.' },
  { title: 'Review before planning', copy: 'You can check imported events before JoyFlow uses them as fixed commitments.' },
]

export default function CalendarConnect({ onCustomize, onGenerate }: CalendarConnectProps) {
  const { disconnectPreview, error, events, importFile, loadSavedEvents, status } = useCalendarConnection()

  return (
    <Card className="w-full max-w-[820px] rounded-[var(--radius-large)] px-5 py-7 sm:px-8 sm:py-9 lg:px-12" aria-labelledby="connect-title">
      <header className="mb-8">
        <h1 id="connect-title" className="mb-1 text-2xl font-semibold tracking-[-0.035em]">Import your calendar</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Bring in existing commitments so JoyFlow can plan around them. Dates and times are shown in Stockholm time.</p>
      </header>

      <ol className="mb-8 grid list-none grid-cols-3 gap-2 p-0" aria-label="Planning progress">
        {['Import', 'Choose', 'Generate'].map((step, index) => (
          <li className={`relative border-t-2 pt-3 text-center text-xs font-semibold ${index === 0 || (index === 1 && status === 'connected') ? 'border-[var(--color-primary)] text-[var(--color-primary-dark)]' : 'border-[var(--color-border)] text-[var(--color-text-soft)]'}`} key={step}>
            <span className="mr-1" aria-hidden="true">{index + 1}.</span>{step}
          </li>
        ))}
      </ol>

      {status === 'connected' ? (
        <section aria-live="polite">
          <div className="mb-5">
            <h2 className="font-semibold">Calendar preview ready</h2>
            <p className="text-sm text-[var(--color-text-muted)]">{events.length ? `${events.length} fixed ${events.length === 1 ? 'commitment is' : 'commitments are'} ready.` : 'No saved commitments were found.'}</p>
            <p className="mt-1 text-xs text-[var(--color-text-soft)]">A new file remains a temporary preview until plan generation succeeds.</p>
          </div>
          <ol className="max-h-[430px] list-none overflow-y-auto border-t border-[var(--color-border-subtle)] p-0">
            {events.map((event) => (
              <li className="grid grid-cols-[90px_1fr] gap-4 border-b border-[var(--color-border-subtle)] py-4" key={event.externalEventId ?? `${event.title}-${event.startsAt}`}>
                <time className="text-sm font-semibold text-[var(--color-primary-dark)]" dateTime={event.startsAt}>
                  {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'Europe/Stockholm' }).format(new Date(event.startsAt))}
                </time>
                <div>
                  <strong className="block text-sm">{event.title}</strong>
                  <span className="text-xs text-[var(--color-text-soft)]">{eventTime(event.startsAt)}–{eventTime(event.endsAt)}</span>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 rounded-[var(--radius-medium)] bg-[var(--color-primary-soft)] p-5">
            <h2 className="text-base font-semibold">Would you like to shape this week?</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">Share what you want to make room for, or let JoyFlow generate from the imported commitments now.</p>
            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="text" type="button" onClick={disconnectPreview}>Import a different file</Button>
            <Button variant="secondary" type="button" onClick={onGenerate}>Generate weekly plan</Button>
            <Button type="button" onClick={onCustomize}>Share your desire</Button>
            </div>
          </div>
        </section>
      ) : (
        <>
          <div className="grid gap-7 md:grid-cols-2">
            <ul className="grid list-none gap-5 p-0">
              {assurances.map((item) => (
                <li key={item.title}>
                  <h2 className="mb-1 text-sm font-semibold">{item.title}</h2>
                  <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">{item.copy}</p>
                </li>
              ))}
            </ul>
            <div className="flex min-h-[245px] flex-col justify-center rounded-[var(--radius-medium)] border border-[var(--color-border)] p-5">
              <h2 className="mb-2 text-base font-semibold">Choose a calendar file</h2>
              <p className="mb-5 text-xs leading-relaxed text-[var(--color-text-muted)]">Use an .ics export, or a .csv file with title, start and end columns. Files may cover any date range, up to 2 MB or 2,000 events.</p>
              <label className="min-h-11 cursor-pointer rounded-[var(--radius-small)] bg-[var(--color-action)] px-5 py-3 text-center font-semibold text-[var(--color-on-primary)] focus-within:outline-3 focus-within:outline-[var(--color-focus)]">
                <span>{status === 'connecting' ? 'Importing…' : 'Choose .ics or .csv file'}</span>
                <input className="sr-only" type="file" accept=".ics,.csv,text/calendar,text/csv" disabled={status === 'connecting'} onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file) }} />
              </label>
              <Button className="mt-4" variant="secondary" type="button" onClick={() => void loadSavedEvents()} disabled={status === 'connecting'}>View previously imported events</Button>
            </div>
          </div>
        </>
      )}

      {error && <p className="mt-4 rounded-[var(--radius-small)] bg-[#f8ece8] px-3 py-3 text-xs text-[#8a4e3d]" role="alert">{error}</p>}
    </Card>
  )
}
