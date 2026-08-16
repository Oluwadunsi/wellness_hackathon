import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Brand from '../../components/ui/Brand'
import Button from '../../components/ui/Button'
import type { GeneratedSchedule } from '../../lib/types/planning'
import { signOut } from '../auth/auth.service'
import { getSchedulesForRange } from '../planning/planning.service'

const steps = [
  { title: 'Import your calendar', description: 'Bring in the commitments already shaping your week.', to: '/connect', label: 'Import calendar' },
  { title: 'Shape your week', description: 'Share what you want to make room for—or skip straight to generation.', to: '/new-task', label: 'Share your desire' },
  { title: 'Review your plan', description: 'See the week JoyFlow built around your commitments and priorities.', to: '/weekly-plan', label: 'Open weekly plan' },
]

function dateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

function weekRange() {
  const today = new Date(); const day = today.getDay(); const offset = day === 0 ? -6 : 1 - day
  const monday = new Date(today); monday.setDate(today.getDate() + offset)
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  return { from: dateKey(monday), to: dateKey(sunday) }
}

export default function DashboardPage({ displayName, email }: { displayName?: string; email?: string }) {
  const [week, setWeek] = useState<GeneratedSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const today = dateKey(new Date())
  const todaySchedule = week.find((schedule) => schedule.planDate === today)
  const preparedDays = week.filter((schedule) => schedule.blocks.length > 0).length
  const optimized = Math.round((preparedDays / 7) * 100)

  useEffect(() => {
    const range = weekRange()
    void getSchedulesForRange(range.from, range.to).then(setWeek).catch((error) => console.error('Could not load dashboard plan', error)).finally(() => setLoading(false))
  }, [])

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-5 py-8 sm:px-8 lg:px-12">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-5">
        <Brand />
        <div className="flex items-center gap-3"><span className="hidden max-w-48 truncate text-xs text-[var(--color-text-muted)] sm:block">{email}</span><Button className="text-xs" variant="text" type="button" onClick={() => void signOut()}>Sign out</Button></div>
      </header>

      <section className="mx-auto mt-12 max-w-6xl" aria-labelledby="dashboard-title">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary-dark)]">Your week at a glance</p>
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <h1 id="dashboard-title" className="max-w-2xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{displayName ? `${displayName}, make room for what matters.` : 'Make room for what matters.'}</h1>
          <Link
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[var(--radius-small)] bg-[var(--color-action)] px-5 py-2.5 font-semibold text-[var(--color-on-primary)] no-underline transition-colors hover:bg-[var(--color-action-hover)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-focus)]"
            to="/connect"
          >
            Import calendar
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <article className="rounded-[var(--radius-medium)] bg-[var(--color-action)] p-6 text-[var(--color-on-primary)] shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] opacity-75">Current week prepared</p>
            <p className="mt-2 text-5xl font-semibold">{loading ? '—' : `${optimized}%`}</p>
            <p className="mt-3 text-sm leading-relaxed opacity-80">{optimized === 100 ? 'All seven days in the current week have a generated plan.' : `${preparedDays} of 7 days in the current week have a generated plan.`}</p>
          </article>
          <article className="rounded-[var(--radius-medium)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-primary-dark)]">Today</p><h2 className="mt-1 text-xl font-semibold">{todaySchedule ? `${todaySchedule.blocks.length} planned blocks` : 'No plan yet'}</h2></div><Link className="text-sm font-semibold text-[var(--color-primary-dark)] underline underline-offset-4" to={`/weekly-plan?date=${today}`}>Open day</Link></div>
            <div className="mt-4 flex flex-wrap gap-2">
              {todaySchedule?.blocks.slice(0, 4).map((block) => <span className="rounded-full bg-[var(--color-primary-soft)] px-3 py-1.5 text-xs text-[var(--color-primary-dark)]" key={block.id}>{block.title}</span>)}
              {!todaySchedule && <p className="text-sm text-[var(--color-text-muted)]">Import a calendar or generate a plan to begin.</p>}
            </div>
          </article>
        </div>

        <section className="relative mt-10" aria-labelledby="journey-title">
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-primary-dark)]">How JoyFlow works</p><h2 id="journey-title" className="mt-1 text-2xl font-semibold">Your planning journey</h2></div>
          <div className="relative grid items-center gap-4 lg:grid-cols-[1fr_72px_1fr_72px_1fr]">
            {steps.map((step, index) => (
              <div className="contents" key={step.to}>
              <article className="flex min-h-56 flex-col rounded-[var(--radius-medium)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
                <span className="mb-7 grid size-9 place-items-center rounded-full bg-[var(--color-primary-soft)] text-xs font-bold text-[var(--color-primary-dark)]">0{index + 1}</span>
                <h3 className="text-lg font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{step.description}</p><span className="mt-auto pt-5 text-sm font-semibold text-[var(--color-primary-dark)]">Step {index + 1}</span>
              </article>
              {index < steps.length - 1 && (
                <div className="flex items-center justify-center text-[var(--color-primary-dark)]" aria-hidden="true">
                  <span className="text-3xl lg:hidden">↓</span>
                  <svg className="hidden h-14 w-[72px] lg:block" viewBox="0 0 72 56" fill="none">
                    <path d="M3 38C20 8 44 8 65 27" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    <path d="m54 25 12 3-4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
