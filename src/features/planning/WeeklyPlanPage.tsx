import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Brand from '../../components/ui/Brand'
import Button from '../../components/ui/Button'
import type { GeneratedSchedule } from '../../lib/types/planning'
import type { WeeklyInsight } from '../../lib/types/weeklyInsight'
import {
  generateAndSaveWeek,
  getSchedulesForRange,
  saveSchedules,
} from './planning.service'
import { getWeeklyInsight } from './weekly-insight.service'

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function fromKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function mondayFor(value: string) {
  const date = fromKey(value)
  const offset = date.getDay() === 0 ? -6 : 1 - date.getDay()
  date.setDate(date.getDate() + offset)
  return dateKey(date)
}

function addDays(value: string, amount: number) {
  const date = fromKey(value)
  date.setDate(date.getDate() + amount)
  return dateKey(date)
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Stockholm' }).format(new Date(value))
}

export default function WeeklyPlanPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const requestedDate = searchParams.get('date') || new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const weekStart = mondayFor(requestedDate)
  const weekEnd = addDays(weekStart, 6)
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart])
  const [schedules, setSchedules] = useState<GeneratedSchedule[]>([])
  const [insight, setInsight] = useState<WeeklyInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMobileDay, setSelectedMobileDay] = useState(requestedDate)
  const [generationNotice, setGenerationNotice] = useState('')
  const hasWeekContent = schedules.some((schedule) => schedule.blocks.length > 0)
  const allBlocks = schedules.flatMap((schedule) => schedule.blocks)
  const fixedCount = allBlocks.filter((block) => block.isFixed).length
  const focusCount = allBlocks.filter((block) => block.isProtected).length
  const openDayCount = weekDays.filter((day) => !schedules.find((schedule) => schedule.planDate === day)?.blocks.some((block) => block.isFixed)).length
  const lastRebuilt = schedules.length
    ? schedules.reduce((latest, schedule) => schedule.updatedAt > latest ? schedule.updatedAt : latest, schedules[0].updatedAt)
    : null

  useEffect(() => {
    void getSchedulesForRange(weekStart, weekEnd)
      .then(setSchedules)
      .catch((loadError) => {
        console.error('Could not load weekly plan', loadError)
        setError('We could not load this week. Please try again.')
      })
      .finally(() => setLoading(false))
  }, [weekEnd, weekStart])

  useEffect(() => {
    if (!hasWeekContent) return
    void getWeeklyInsight(schedules)
      .then(setInsight)
      .catch((analysisError) => console.error('Could not analyze week', analysisError))
  }, [hasWeekContent, schedules])

  async function generateWeek() {
    setGenerating(true)
    setError(null)
    setInsight(null)
    setGenerationNotice('')
    try {
      await generateAndSaveWeek(weekStart)
      setSchedules(await getSchedulesForRange(weekStart, weekEnd))
      setGenerationNotice('Week rebuilt from the latest calendar, desires and focus areas.')
    } catch (generationError) {
      console.error('Could not generate week', generationError)
      setError('We could not generate this week. Confirm the required migrations are installed and try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function saveWeek() {
    setSaving(true)
    setError(null)
    try {
      await saveSchedules(schedules.map((schedule) => schedule.id))
      setSchedules(schedules.map((schedule) => ({ ...schedule, status: 'saved' })))
    } catch (saveError) {
      console.error('Could not save week', saveError)
      setError('We could not save this week. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-7 sm:px-7">
      <header className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4">
        <Brand />
        <nav className="flex items-center gap-5" aria-label="Plan navigation">
          <Link className="text-sm text-[var(--color-text-muted)]" to="/dashboard">Dashboard</Link>
          <Link className="text-sm font-semibold text-[var(--color-primary-dark)]" to={`/weekly-plan?date=${weekStart}`} aria-current="page">Weekly plan</Link>
        </nav>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" type="button" onClick={() => void generateWeek()} disabled={!hasWeekContent || generating}>
            {generating ? 'Rebuilding week…' : schedules.length ? 'Rebuild from latest changes' : 'Generate week'}
          </Button>
          <Button type="button" onClick={() => void saveWeek()} disabled={!hasWeekContent || saving || schedules.every((schedule) => schedule.status === 'saved')}>
            {saving ? 'Saving…' : hasWeekContent && schedules.every((schedule) => schedule.status === 'saved') ? 'Changes saved' : 'Save changes'}
          </Button>
        </div>
      </header>

      <section className="mx-auto mt-9 max-w-[1500px]" aria-labelledby="weekly-plan-title">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary-dark)]">Seven-day plan</p>
            <h1 id="weekly-plan-title" className="mb-2 text-3xl font-semibold tracking-[-0.04em]">Your balanced week</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Fixed commitments stay in place. JoyFlow fits priorities into genuine open time. “Today” follows Stockholm time.</p>
            {lastRebuilt && hasWeekContent && <p className="mt-2 text-xs text-[var(--color-text-soft)]">Last rebuilt {new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Stockholm' }).format(new Date(lastRebuilt))}</p>}
          </div>
          <label className="text-xs font-medium text-[var(--color-text-muted)]" htmlFor="week-date">
            <span className="mb-1 block">Choose a date in the week</span>
            <input
              id="week-date"
              className="min-h-10 rounded-[var(--radius-small)] border border-[var(--color-border)] bg-white px-3 focus-visible:outline-3 focus-visible:outline-[var(--color-focus)]"
              type="date"
              value={requestedDate}
              onChange={(event) => { setSelectedMobileDay(event.target.value); navigate(`/weekly-plan?date=${event.target.value}`) }}
            />
          </label>
        </div>

        {loading && <p className="mt-8 text-sm text-[var(--color-text-muted)]" role="status">Loading the week…</p>}
        {error && <p className="mt-6 rounded-[var(--radius-small)] bg-[#f8ece8] px-4 py-3 text-sm text-[#8a4e3d]" role="alert">{error}</p>}
        {generationNotice && hasWeekContent && <p className="mt-5 rounded-[var(--radius-small)] bg-[var(--color-primary-soft)] px-4 py-3 text-sm text-[var(--color-primary-dark)]" role="status">✓ {generationNotice}</p>}

        {hasWeekContent && (
          <aside className="mt-6" aria-labelledby="weekly-insight-title">
            <h2 id="weekly-insight-title" className="sr-only">Week at a glance</h2>
            <dl className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="rounded-[var(--radius-small)] border border-[var(--color-border)] bg-white p-3 sm:p-4"><dt className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Commitments</dt><dd className="mt-1 text-xl font-semibold">{fixedCount}</dd></div>
              <div className="rounded-[var(--radius-small)] border border-[var(--color-border)] bg-white p-3 sm:p-4"><dt className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Personal activities</dt><dd className="mt-1 text-xl font-semibold">{focusCount}</dd></div>
              <div className="rounded-[var(--radius-small)] border border-[var(--color-border)] bg-white p-3 sm:p-4"><dt className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">Open days</dt><dd className="mt-1 text-xl font-semibold">{openDayCount}</dd></div>
            </dl>
          </aside>
        )}

        {insight && hasWeekContent && (
          <aside className="mt-3 flex items-start gap-3 rounded-[var(--radius-small)] bg-[var(--color-primary-soft)] px-4 py-3" aria-labelledby="weekly-recommendation-title">
            <span className="mt-0.5 text-[var(--color-primary-dark)]" aria-hidden="true">✦</span>
            <div>
              <h2 id="weekly-recommendation-title" className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary-dark)]">Weekly insight</h2>
              <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="font-semibold text-[var(--color-text)]">Why</dt><dd className="mt-0.5 text-[var(--color-text-muted)]">{insight.decisionReason}</dd></div>
                <div><dt className="font-semibold text-[var(--color-text)]">Suggestion</dt><dd className="mt-0.5 text-[var(--color-text-muted)]">{insight.suggestion}</dd></div>
              </dl>
            </div>
          </aside>
        )}

        {!loading && !hasWeekContent && (
          <div className="mt-8 rounded-[var(--radius-medium)] border border-dashed border-[var(--color-border)] bg-white px-6 py-12 text-center">
            <h2 className="mb-2 text-lg font-semibold">This week is empty</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Import a calendar or add a desire before generating this week.</p>
            <Link className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-small)] bg-[var(--color-action)] px-5 py-2.5 font-semibold text-[var(--color-on-primary)] no-underline transition-colors hover:bg-[var(--color-action-hover)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-focus)]" to="/connect">Import calendar</Link>
          </div>
        )}

        {!loading && hasWeekContent && (
          <>
          <nav className="mt-6 grid grid-cols-7 gap-1 sm:hidden" aria-label="Choose day">
            {weekDays.map((day) => (
              <button
                key={day}
                type="button"
                aria-pressed={selectedMobileDay === day}
                onClick={() => setSelectedMobileDay(day)}
                className={`min-h-12 rounded-lg text-center text-xs font-semibold focus-visible:outline-3 focus-visible:outline-[var(--color-focus)] ${selectedMobileDay === day ? 'bg-[var(--color-primary)] text-white' : 'border border-[var(--color-border)] bg-white text-[var(--color-text-muted)]'}`}
              >
                <span className="block">{new Intl.DateTimeFormat('en', { weekday: 'short' }).format(fromKey(day))}</span>
                <span className="block text-[0.65rem]">{fromKey(day).getDate()}</span>
              </button>
            ))}
          </nav>
          <div className="mt-4 grid gap-4 sm:mt-7 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
            {weekDays.map((day) => {
              const schedule = schedules.find((item) => item.planDate === day)
              const date = fromKey(day)
              return (
                <section className={`${selectedMobileDay === day ? 'block' : 'hidden'} min-w-0 rounded-[var(--radius-medium)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] sm:block`} key={day} aria-labelledby={`day-${day}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary-dark)]">{new Intl.DateTimeFormat('en', { weekday: 'long' }).format(date)}</p>
                  <h2 id={`day-${day}`} className="mt-1 text-lg font-semibold">{new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)}</h2>
                  {schedule ? (
                    <>
                      <div className="mt-4 space-y-3">
                        {schedule.blocks.map((block) => (
                          <article className={`rounded-lg border-l-4 bg-[#fafbf9] p-3 ${block.isFixed ? 'border-l-[#8caebe]' : 'border-l-[var(--color-primary)]'}`} key={block.id}>
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-soft)]">{block.isFixed ? 'Fixed' : 'Proposed'}</p>
                            <h3 className="mt-1 text-sm font-semibold leading-snug">{block.title}</h3>
                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{timeLabel(block.startsAt)}–{timeLabel(block.endsAt)}</p>
                          </article>
                        ))}
                      </div>
                    </>
                  ) : <p className="mt-4 text-xs text-[var(--color-text-muted)]">No plan generated.</p>}
                </section>
              )
            })}
          </div>
          </>
        )}
      </section>
    </main>
  )
}
