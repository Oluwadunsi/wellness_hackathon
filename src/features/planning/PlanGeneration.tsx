import { useEffect } from 'react'
import usePlanGeneration from './usePlanGeneration'

type PlanGenerationProps = {
  onBack: () => void
  onComplete: () => void
  planDate?: string
}

const statusLabels = {
  queued: 'Queued',
  processing: 'Processing…',
  complete: 'Complete',
}

export default function PlanGeneration({ onBack, onComplete, planDate }: PlanGenerationProps) {
  const { complete, error, steps } = usePlanGeneration(planDate)

  useEffect(() => {
    if (!complete) return
    onComplete()
  }, [complete, onComplete])

  return (
    <div className="flex w-full max-w-[600px] flex-col items-center">
      <section className="w-full px-2 text-center sm:px-6" aria-labelledby="generation-title">
        <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-[var(--color-primary-soft)] text-2xl text-[var(--color-primary)]" aria-hidden="true">
          ✦
        </span>
        <h1 id="generation-title" className="mb-2 text-2xl font-semibold tracking-[-0.035em]">
          Shaping a calmer week
        </h1>
        <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
          JoyFlow is arranging your desires around fixed commitments while keeping breathing room.
        </p>

        <ol
          className="mx-auto grid max-w-[470px] list-none gap-3 p-0 text-left"
          aria-label="Plan generation progress"
          aria-live="polite"
        >
          {steps.map((step) => (
            <li
              className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                step.status === 'complete'
                  ? 'border-[var(--color-primary)] bg-white'
                  : step.status === 'processing'
                    ? 'border-[var(--color-border)] bg-white'
                    : 'border-[var(--color-border-subtle)] bg-transparent opacity-55'
              }`}
              key={step.id}
            >
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full text-[0.65rem] ${
                  step.status === 'complete'
                    ? 'bg-[var(--color-primary)] text-white'
                    : step.status === 'processing'
                      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] motion-safe:animate-pulse'
                      : 'bg-[var(--color-border-subtle)] text-[var(--color-text-soft)]'
                }`}
                aria-hidden="true"
              >
                {step.status === 'complete' ? '✓' : '•'}
              </span>
              <span className="flex-1 text-sm font-medium">{step.label}</span>
              <span
                className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-soft)]"
                aria-label={`${step.label}: ${statusLabels[step.status]}`}
              >
                {statusLabels[step.status]}
              </span>
            </li>
          ))}
        </ol>

        {error && (
          <p className="mx-auto mt-5 max-w-[470px] rounded-[var(--radius-small)] bg-[#f8ece8] px-4 py-3 text-left text-sm text-[#8a4e3d]" role="alert">
            {error}
          </p>
        )}

        <div className="mx-auto mt-8 max-w-[470px] border-t border-[var(--color-border-subtle)] pt-6">
          {complete ? (
            <p className="m-0 text-sm font-medium text-[var(--color-primary-dark)]" role="status">Your plan is ready. Opening it now.</p>
          ) : (
            <p className="m-0 text-xs italic leading-relaxed text-[var(--color-text-muted)]">
              “A sustainable plan leaves room for the parts of life that never make it onto a calendar.”
            </p>
          )}
          <button className="mt-5 cursor-pointer border-0 bg-transparent text-xs font-semibold text-[var(--color-primary-dark)] underline underline-offset-4 focus-visible:outline-3 focus-visible:outline-[var(--color-focus)]" type="button" onClick={onBack}>
            Back to task
          </button>
        </div>
      </section>
    </div>
  )
}
