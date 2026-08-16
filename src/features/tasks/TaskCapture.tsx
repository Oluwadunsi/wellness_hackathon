import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import useTaskCapture from './useTaskCapture'
import { getPendingCalendarImport } from '../calendar/calendar-import.service'
import { focusAspects } from '../../lib/data/focusAspects'

type TaskCaptureProps = {
  onBack: () => void
  onIntegrated: (planDate?: string) => void
}

export default function TaskCapture({ onBack, onIntegrated }: TaskCaptureProps) {
  const importedDates = getPendingCalendarImport().map((event) => event.startsAt.slice(0, 10)).sort()
  const importedRange = importedDates.length
    ? `${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'Europe/Stockholm' }).format(new Date(`${importedDates[0]}T12:00:00Z`))}–${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Europe/Stockholm' }).format(new Date(`${importedDates.at(-1)}T12:00:00Z`))}`
    : null
  const {
    date,
    editInterpretation,
    error,
    integrated,
    integrate,
    interpretation,
    intention,
    interpret,
    isInterpreting,
    isSaving,
    selectedLabels,
    setIntention,
    showPreview,
    toggleLabel,
  } = useTaskCapture()

  return (
    <Card className="w-full max-w-[760px] overflow-hidden rounded-[var(--radius-large)]" aria-labelledby="task-title">
      <header className="flex items-start justify-between gap-5 border-b border-[var(--color-border-subtle)] px-5 py-6 sm:px-8">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-primary-dark)]">Your desire</p>
          <h1 id="task-title" className="m-0 text-2xl font-semibold tracking-[-0.035em]">What would you like to make room for?</h1>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Tell JoyFlow naturally. We’ll find a suitable place in your week.</p>
          {importedRange && <p className="mt-3 inline-flex rounded-full bg-[var(--color-primary-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-dark)]">Mapping into imported week · {importedRange}</p>}
        </div>
        <button
          className="grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-xl text-[var(--color-text-muted)] hover:bg-[var(--color-primary-soft)] focus-visible:outline-3 focus-visible:outline-[var(--color-focus)]"
          type="button"
          onClick={onBack}
          aria-label="Go back"
        >
          ×
        </button>
      </header>

      <div className="px-5 py-7 sm:px-8">
        <label className="mb-2 block text-xs text-[var(--color-text-muted)]" htmlFor="intention">
          What do you want this week to include?
        </label>
        <div className="relative">
          <textarea
            className="min-h-32 w-full resize-y rounded-[var(--radius-medium)] border border-[var(--color-border)] bg-white px-4 pt-4 pb-10 text-sm leading-relaxed text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-3 focus:outline-[var(--color-focus)]"
            id="intention"
            aria-describedby="intention-status"
            rows={4}
            placeholder="For example: I want to finish my report by Thursday and make room for a walk one evening."
            value={intention}
            onChange={(event) => {
              setIntention(event.target.value)
              editInterpretation()
            }}
          />
          <span
            className="absolute right-4 bottom-3 flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-soft)]"
            id="intention-status"
            aria-live="polite"
          >
            {isInterpreting ? 'Interpreting…' : showPreview ? 'Interpretation ready' : 'Ready to review'}
            <span className="size-1.5 rounded-full bg-[var(--color-primary)]" aria-hidden="true" />
          </span>
        </div>

        {!showPreview && (
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={interpret} disabled={!intention.trim() || isInterpreting}>
              {isInterpreting ? 'Understanding…' : 'Map my desire'}
            </Button>
          </div>
        )}

        {showPreview && (
          <section className="mt-6 rounded-[var(--radius-medium)] border border-[var(--color-border-subtle)] bg-[#fafbf9] p-5" aria-label="JoyFlow interpretation preview">
            <p className="mb-5 text-[0.67rem] font-bold uppercase tracking-[0.09em] text-[var(--color-primary-dark)]">
              <span className="mr-1" aria-hidden="true">✦</span> JoyFlow preview
            </p>

            <div className="divide-y divide-[var(--color-border-subtle)] rounded-xl border border-[var(--color-border-subtle)] bg-white">
              {interpretation.items.map((item, index) => (
                <article className="flex flex-col gap-1 border-l-4 border-l-[var(--color-primary)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between" key={`${item.title}-${item.plannedDate}-${index}`}>
                  <div><p className="text-sm font-semibold">{item.title}</p><p className="text-xs text-[var(--color-text-soft)]">{item.explanation}</p></div>
                  <p className="shrink-0 text-xs font-medium text-[var(--color-text-muted)]">{index === 0 && date ? date : item.plannedDate} · {item.durationMinutes} min · {item.preferredPeriod}</p>
                </article>
              ))}
            </div>

            <div className="mt-5 flex flex-col items-start gap-3 border-t border-[var(--color-border-subtle)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <q className="text-xs italic text-[var(--color-text-muted)]">{interpretation.explanation}</q>
              <Button className="shrink-0 text-xs" variant="text" type="button" onClick={editInterpretation}>
                Edit interpretation
              </Button>
            </div>
          </section>
        )}

        <fieldset className="mt-5">
          <legend className="text-xs font-semibold text-[var(--color-text-muted)]">Which area does this desire support?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {focusAspects.map((label) => (
              <button
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs ${
                  selectedLabels.includes(label)
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]'
                    : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)]'
                }`}
                type="button"
                aria-pressed={selectedLabels.includes(label)}
                onClick={() => toggleLabel(label)}
                key={label}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {integrated && (
          <p className="mt-4 rounded-[var(--radius-small)] bg-[var(--color-primary-soft)] px-3 py-3 text-xs text-[var(--color-primary-dark)]" role="status">
            <span className="mr-1.5" aria-hidden="true">✓</span> Your desire was mapped into the week.
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-[var(--radius-small)] bg-[#f8ece8] px-3 py-3 text-xs text-[#8a4e3d]" role="alert">
            {error}
          </p>
        )}
      </div>

      <footer className="flex flex-col items-stretch gap-5 border-t border-[var(--color-border-subtle)] px-5 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-7">
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <Button
            type="button"
            onClick={async () => {
              const saved = await integrate()
              if (saved) onIntegrated(saved)
            }}
            disabled={!showPreview || integrated || isSaving}
          >
            {isSaving ? 'Adding…' : integrated ? 'Added to week' : 'Add to my week'}
          </Button>
        </div>
      </footer>
    </Card>
  )
}
